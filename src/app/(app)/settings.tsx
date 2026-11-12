import { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, View } from 'react-native';
import { useSession } from '@/auth/session';
import { Button, Card, Screen, Text } from '@/components/ui';
import { biometricsAvailable } from '@/lib/biometrics';
import { APP_ROLE_LABEL } from '@/lib/roles';
import { useColors } from '@/theme';

export default function Settings() {
  const c = useColors();
  const s = useSession();
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    void biometricsAvailable().then(setAvailable);
  }, []);

  const toggleFaceId = async (on: boolean) => {
    const ok = await s.setBiometrics(on);
    if (!ok && on) Alert.alert('Face ID', available ? 'لم يتم التحقق.' : 'Face ID غير مفعّل على هذا الجوال.');
  };

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text weight="bold" size={26}>الإعدادات</Text>
        <Card>
          <Text weight="semibold">{s.userName}</Text>
          <Text muted size={14} style={{ writingDirection: 'ltr' }}>{s.email}</Text>
          <Text muted size={14}>{s.org?.name} · {s.org ? APP_ROLE_LABEL[s.org.appRole] : ''}</Text>
        </Card>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="semibold">الدخول بـ Face ID</Text>
              <Text muted size={13}>يُطلب عند فتح التطبيق وبعد 5 دقائق في الخلفية.</Text>
            </View>
            <Switch value={s.biometrics === 'on'} onValueChange={(v) => void toggleFaceId(v)} trackColor={{ true: c.primary }} disabled={!available && s.biometrics !== 'on'} />
          </View>
        </Card>
        <Card>
          <Text weight="semibold">الإشعارات</Text>
          <Text muted size={13}>تُضاف في المرحلة الثالثة.</Text>
        </Card>
        <Button title="تسجيل الخروج" variant="destructive" onPress={() => Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج من هذا الجهاز؟', [{ text: 'إلغاء', style: 'cancel' }, { text: 'خروج', style: 'destructive', onPress: () => void s.signOut() }])} />
      </ScrollView>
    </Screen>
  );
}
