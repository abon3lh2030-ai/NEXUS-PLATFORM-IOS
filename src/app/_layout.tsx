import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '@/auth/session';
import { Text } from '@/components/ui';
import { useColors } from '@/theme';

function RootNavigator() {
  const s = useSession();
  const c = useColors();
  if (s.status === 'loading') {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}><ActivityIndicator color={c.primary} /></View>;
  }
  const ready = s.status === 'ready';
  const blocked = ready && (s.noOrg || !s.org?.active);
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
        <Stack.Protected guard={s.status === 'signed_out'}>
          <Stack.Screen name="(auth)/login" />
        </Stack.Protected>
        <Stack.Protected guard={s.status === 'locked'}>
          <Stack.Screen name="lock" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={ready && s.askBiometrics}>
          <Stack.Screen name="enable-face-id" />
        </Stack.Protected>
        <Stack.Protected guard={blocked && !s.askBiometrics}>
          <Stack.Screen name="inactive" />
        </Stack.Protected>
        <Stack.Protected guard={ready && !blocked && !s.askBiometrics}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
      {s.privacyCover && s.status !== 'signed_out' && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }]}>
          <Text weight="bold" size={32} style={{ color: c.primary, letterSpacing: 4 }}>NEXUS</Text>
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
