import { SymbolView } from 'expo-symbols';
import { useSession } from '@/auth/session';
import { Button, Center, Screen, Text } from '@/components/ui';
import { useColors } from '@/theme';

/** No purchase, prices or payment links in the app — only this message. */
export default function Inactive() {
  const c = useColors();
  const { signOut, reload } = useSession();
  return (
    <Screen>
      <Center>
        <SymbolView name="lock.shield" size={64} tintColor={c.mutedForeground} />
        <Text weight="bold" size={20} style={{ textAlign: 'center' }}>هذا الحساب غير مفعّل، تواصل مع مسؤول شركتك</Text>
        <Button title="تحديث" variant="secondary" onPress={() => void reload().catch(() => undefined)} style={{ alignSelf: 'stretch' }} />
        <Button title="تسجيل الخروج" variant="ghost" onPress={() => void signOut()} style={{ alignSelf: 'stretch' }} />
      </Center>
    </Screen>
  );
}
