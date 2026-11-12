import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, View } from 'react-native';
import { useSession } from '@/auth/session';
import { Row, ScreenTitle } from '@/components/glass';
import { Text } from '@/components/ui';
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
  const group = { backgroundColor: c.elevated, borderRadius: 22, overflow: 'hidden' as const };
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 40 }}>
        <ScreenTitle title="الإعدادات" />
        <View style={group}>
          <Row icon="person.crop.circle.fill" title={s.userName} subtitle={`${s.org?.name ?? ''} · ${s.org ? APP_ROLE_LABEL[s.org.appRole] : ''}`} last />
        </View>
        <View style={group}>
          <Row icon="faceid" title="الدخول بـ Face ID" subtitle="يُطلب عند فتح التطبيق" trailing={<Switch value={s.biometrics === 'on'} onValueChange={(v) => void toggleFaceId(v)} disabled={!available && s.biometrics !== 'on'} />} />
          <Row icon="bell.badge" title="الإشعارات" subtitle="تُضاف في المرحلة الثالثة" last />
        </View>
        <View style={group}>
          <Row icon="rectangle.portrait.and.arrow.right" iconColor={c.destructive} title="تسجيل الخروج" onPress={() => Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج من هذا الجهاز؟', [{ text: 'إلغاء', style: 'cancel' }, { text: 'خروج', style: 'destructive', onPress: () => void s.signOut() }])} last />
        </View>
        <Text muted size={12} style={{ textAlign: 'center', writingDirection: 'ltr' }}>{s.email}</Text>
      </ScrollView>
    </>
  );
}
