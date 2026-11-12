import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { api, ApiError, setApiOrg } from '@/lib/api';
import { authenticate, biometricsAvailable } from '@/lib/biometrics';
import { appRoleFor, type AppRole, type HumanRole } from '@/lib/roles';
import { secure } from '@/lib/secure';
import { supabase } from '@/lib/supabase';

/** Lock the app after this long in the background. */
export const AUTO_LOCK_MS = 5 * 60_000;

type Status = 'loading' | 'signed_out' | 'locked' | 'ready';

export interface OrgContext {
  id: string;
  name: string;
  role: HumanRole;
  appRole: AppRole;
  permissions: string[];
  /** Subscription active and organization not suspended. Otherwise the app shows "account not activated". */
  active: boolean;
}

interface MeResponse {
  user_id: string;
  email: string | null;
  profile: { full_name: string } | null;
  organizations: Array<{ id: string; name: string; status: string; role: HumanRole }>;
}

interface OrgResponse {
  organization: { id: string; name: string; status: string };
  membership: { role: HumanRole; permissions: string[] };
  billing: { active: boolean };
}

interface SessionState {
  status: Status;
  userName: string;
  email: string | null;
  org: OrgContext | null;
  /** The person belongs to no organization (yet). */
  noOrg: boolean;
  biometrics: 'on' | 'off' | null;
  /** Show the "enable Face ID" step after the first password sign-in. */
  askBiometrics: boolean;
  /** Hide content in the app switcher. */
  privacyCover: boolean;
  signIn(email: string, password: string): Promise<void>;
  unlock(): Promise<boolean>;
  signOut(): Promise<void>;
  setBiometrics(on: boolean): Promise<boolean>;
  dismissBiometricsPrompt(): void;
  reload(): Promise<void>;
  can(permission: string): boolean;
}

const Ctx = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [org, setOrg] = useState<OrgContext | null>(null);
  const [noOrg, setNoOrg] = useState(false);
  const [biometrics, setBio] = useState<'on' | 'off' | null>(null);
  const [askBiometrics, setAskBiometrics] = useState(false);
  const [privacyCover, setPrivacyCover] = useState(false);
  const backgroundSince = useRef<number | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  // Keep the newest refresh token in the Keychain (supabase-js rotates it on every refresh).
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session: Session | null) => {
      if (session?.refresh_token) void secure.setRefreshToken(session.refresh_token);
      if (event === 'SIGNED_OUT') void secure.setRefreshToken(null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const loadContext = useCallback(async () => {
    const me = await api<MeResponse>('/me', { org: false });
    setUserName(me.profile?.full_name || me.email || '');
    setEmail(me.email);
    if (!me.organizations.length) {
      setOrg(null);
      setNoOrg(true);
      return;
    }
    setNoOrg(false);
    const saved = await secure.getOrgId();
    const pick = me.organizations.find((o) => o.id === saved) ?? me.organizations[0]!;
    setApiOrg(pick.id);
    await secure.setOrgId(pick.id);
    const o = await api<OrgResponse>('/org');
    setOrg({
      id: o.organization.id,
      name: o.organization.name,
      role: o.membership.role,
      appRole: appRoleFor(o.membership.role),
      permissions: o.membership.permissions,
      active: o.billing.active && o.organization.status === 'active',
    });
  }, []);

  const resetLocal = useCallback(async () => {
    setApiOrg(null);
    setOrg(null);
    setNoOrg(false);
    setUserName('');
    setEmail(null);
    await secure.setRefreshToken(null);
    await secure.setOrgId(null);
  }, []);

  /** Restores the session from the Keychain refresh token. */
  const restore = useCallback(async (): Promise<boolean> => {
    const token = await secure.getRefreshToken();
    if (!token) return false;
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: token });
    if (error || !data.session) {
      await resetLocal();
      return false;
    }
    try {
      await loadContext();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await resetLocal();
        return false;
      }
      throw err;
    }
    return true;
  }, [loadContext, resetLocal]);

  // Launch: signed out, locked behind Face ID, or straight in (if Face ID is off).
  useEffect(() => {
    void (async () => {
      const [token, bio] = await Promise.all([secure.getRefreshToken(), secure.getBiometrics()]);
      setBio(bio as 'on' | 'off' | null);
      if (!token) return setStatus('signed_out');
      if (bio === 'on') return setStatus('locked');
      try {
        setStatus((await restore()) ? 'ready' : 'signed_out');
      } catch {
        setStatus('signed_out');
      }
    })();
  }, [restore]);

  // Auto-lock after AUTO_LOCK_MS in the background; cover content in the app switcher.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setPrivacyCover(false);
        const since = backgroundSince.current;
        backgroundSince.current = null;
        if (since && Date.now() - since > AUTO_LOCK_MS && statusRef.current === 'ready') {
          void secure.getBiometrics().then((b) => {
            if (b === 'on') setStatus('locked');
          });
        }
      } else {
        setPrivacyCover(true);
        if (state === 'background' && backgroundSince.current === null) backgroundSince.current = Date.now();
      }
    });
    return () => sub.remove();
  }, []);

  const signIn = useCallback(
    async (mail: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email: mail.trim(), password });
      if (error) throw new ApiError(401, error.message.includes('Invalid login') ? 'invalid_credentials' : 'sign_in_failed');
      await loadContext();
      const bio = await secure.getBiometrics();
      if (bio === null && (await biometricsAvailable())) setAskBiometrics(true);
      setStatus('ready');
    },
    [loadContext],
  );

  const unlock = useCallback(async () => {
    if (!(await authenticate('افتح نيكسوس'))) return false;
    const { data } = await supabase.auth.getSession();
    // Unlocking after auto-lock keeps the in-memory session; on launch it is restored from the Keychain.
    if (data.session && org) {
      setStatus('ready');
      return true;
    }
    try {
      if (await restore()) {
        setStatus('ready');
        return true;
      }
    } catch {
      /* network error: stay locked so the user can retry */
      return false;
    }
    setStatus('signed_out');
    return false;
  }, [org, restore]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    await resetLocal();
    setStatus('signed_out');
  }, [resetLocal]);

  const setBiometrics = useCallback(async (on: boolean) => {
    if (on) {
      if (!(await biometricsAvailable())) return false;
      if (!(await authenticate('فعّل الدخول بـ Face ID'))) return false;
    }
    await secure.setBiometrics(on ? 'on' : 'off');
    setBio(on ? 'on' : 'off');
    setAskBiometrics(false);
    return true;
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      status,
      userName,
      email,
      org,
      noOrg,
      biometrics,
      askBiometrics,
      privacyCover,
      signIn,
      unlock,
      signOut,
      setBiometrics,
      dismissBiometricsPrompt: () => {
        setAskBiometrics(false);
        void secure.setBiometrics('off');
        setBio('off');
      },
      reload: loadContext,
      can: (p) => Boolean(org?.permissions.includes(p)),
    }),
    [status, userName, email, org, noOrg, biometrics, askBiometrics, privacyCover, signIn, unlock, signOut, setBiometrics, loadContext],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession outside SessionProvider');
  return v;
}
