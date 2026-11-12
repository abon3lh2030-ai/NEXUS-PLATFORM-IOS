import { Tabs } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';
import { fonts, useColors } from '@/theme';

const icon = (name: SFSymbol) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <SymbolView name={name} size={24} tintColor={color as string} />;
  };

export default function AppTabs() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.mutedForeground,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية', tabBarIcon: icon('house.fill') }} />
      <Tabs.Screen name="settings" options={{ title: 'الإعدادات', tabBarIcon: icon('gearshape.fill') }} />
    </Tabs>
  );
}
