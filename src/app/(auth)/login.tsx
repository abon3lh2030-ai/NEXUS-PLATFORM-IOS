import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, ScrollView, TextInput, View } from 'react-native';
import { useSession } from '@/auth/session';
import { Button, Card, Input, Screen, Text } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { isConfigured } from '@/lib/env';
import { useColors } from '@/theme';

const ERRORS: Record<string, string> = {
  invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  network_error: 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.',
};

export default function Login() {
  const c = useColors();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = async () => {
    if (!email.trim() || !password) return setError('أدخل البريد الإلكتروني وكلمة المرور.');
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError((err instanceof ApiError && ERRORS[err.code]) || 'تعذّر تسجيل الدخول. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 28 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text weight="bold" size={36} style={{ color: c.primary, letterSpacing: 6, textAlign: 'center' }}>NEXUS</Text>
            <Text muted style={{ textAlign: 'center' }}>تابع موظفيك واتخذ قراراتك من جوالك</Text>
          </View>
          {!isConfigured && (
            <Card style={{ borderColor: c.warning }}>
              <Text weight="semibold">إعدادات الاتصال ناقصة</Text>
              <Text muted size={14}>أضف قيم EXPO_PUBLIC_* في ملف ‎.env ثم أعد تشغيل التطبيق.</Text>
            </Card>
          )}
          <View style={{ gap: 16 }}>
            <Input label="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} style={{ textAlign: 'left', writingDirection: 'ltr' }} />
            <Input ref={passwordRef} label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" autoComplete="current-password" returnKeyType="go" onSubmitEditing={() => void submit()} />
            {error ? <Text size={14} style={{ color: c.destructive }}>{error}</Text> : null}
            <Button title="تسجيل الدخول" onPress={() => void submit()} loading={busy} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
