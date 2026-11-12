import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useSession } from '@/auth/session';
import { Button, Center, Screen, Text } from '@/components/ui';
import { useColors } from '@/theme';

export default function EnableFaceId() {
  const c = useColors();
  const { setBiometrics, dismissBiometricsPrompt } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Center>
        <SymbolView name="faceid" size={72} tintColor={c.primary} />
        <Text weight="bold" size={22} style={{ textAlign: 'center' }}>ادخل أسرع بـ Face ID</Text>
        <Text muted style={{ textAlign: 'center' }}>نحفظ بيانات الدخول مشفّرة في جوالك، ونطلب Face ID عند فتح التطبيق وبعد 5 دقائق من الخروج منه.</Text>
        <Button title="تفعيل Face ID" loading={busy} style={{ alignSelf: 'stretch' }} onPress={async () => { setBusy(true); await setBiometrics(true); setBusy(false); }} />
        <Button title="ليس الآن" variant="ghost" style={{ alignSelf: 'stretch' }} onPress={dismissBiometricsPrompt} />
      </Center>
    </Screen>
  );
}
