import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { useSession } from '@/auth/session';
import { Button, Center, Screen, Text } from '@/components/ui';
import { useColors } from '@/theme';

export default function Lock() {
  const c = useColors();
  const { unlock, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const tryUnlock = async () => {
    setBusy(true);
    const ok = await unlock();
    setBusy(false);
    setFailed(!ok);
  };

  useEffect(() => {
    void tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <Center>
        <SymbolView name="faceid" size={64} tintColor={c.primary} />
        <Text weight="bold" size={22} style={{ textAlign: 'center' }}>نيكسوس مقفل</Text>
        <Text muted style={{ textAlign: 'center' }}>{failed ? 'لم يتم التحقق. حاول مرة أخرى أو سجّل الدخول بكلمة المرور.' : 'استخدم Face ID أو رمز الجوال للمتابعة.'}</Text>
        <Button title="فتح بـ Face ID" onPress={() => void tryUnlock()} loading={busy} style={{ alignSelf: 'stretch' }} />
        <Button title="الدخول بكلمة المرور" variant="ghost" onPress={() => void signOut()} style={{ alignSelf: 'stretch' }} />
      </Center>
    </Screen>
  );
}
