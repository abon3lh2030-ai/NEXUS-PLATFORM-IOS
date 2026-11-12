import * as SecureStore from 'expo-secure-store';

const opts: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

const KEYS = {
  refreshToken: 'nexus.refresh_token',
  biometrics: 'nexus.biometrics',
  orgId: 'nexus.org_id',
} as const;

async function get(key: string) {
  try {
    return await SecureStore.getItemAsync(key, opts);
  } catch {
    return null;
  }
}

async function set(key: string, value: string | null) {
  if (value === null) await SecureStore.deleteItemAsync(key, opts).catch(() => undefined);
  else await SecureStore.setItemAsync(key, value, opts);
}

/** Keychain-backed values (this device only, readable only while the phone is unlocked). */
export const secure = {
  getRefreshToken: () => get(KEYS.refreshToken),
  setRefreshToken: (v: string | null) => set(KEYS.refreshToken, v),
  /** 'on' | 'off' | null (not decided yet). */
  getBiometrics: () => get(KEYS.biometrics),
  setBiometrics: (v: 'on' | 'off' | null) => set(KEYS.biometrics, v),
  getOrgId: () => get(KEYS.orgId),
  setOrgId: (v: string | null) => set(KEYS.orgId, v),
  async clearAll() {
    await Promise.all(Object.values(KEYS).map((k) => set(k, null)));
  },
};
