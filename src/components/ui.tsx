import { forwardRef, type ComponentRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text as RNText, TextInput, View, type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts, useColors } from '@/theme';

type Weight = keyof typeof fonts;

export function Text({ weight = 'regular', muted, size = 15, style, ...props }: TextProps & { weight?: Weight; muted?: boolean; size?: number }) {
  const c = useColors();
  return <RNText {...props} style={[{ fontFamily: fonts[weight], fontSize: size, color: muted ? c.mutedForeground : c.foreground, textAlign: 'left', writingDirection: 'rtl' }, style]} />;
}

export function Screen({ children, style, edges = ['top', 'bottom'] }: { children: ReactNode; style?: StyleProp<ViewStyle>; edges?: Array<'top' | 'bottom' | 'left' | 'right'> }) {
  const c = useColors();
  return <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: c.background }, style]}>{children}</SafeAreaView>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[{ backgroundColor: c.card, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 16, gap: 8 }, style]}>{children}</View>;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style }: { title: string; onPress?: PressableProps['onPress']; variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'; loading?: boolean; disabled?: boolean; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const bg = variant === 'primary' ? c.primary : variant === 'secondary' ? c.secondary : variant === 'destructive' ? c.destructive : 'transparent';
  const fg = variant === 'primary' ? c.primaryForeground : variant === 'destructive' ? '#ffffff' : variant === 'ghost' ? c.primary : c.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [{ height: 50, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <>{icon}<Text weight="semibold" style={{ color: fg }}>{title}</Text></>}
    </Pressable>
  );
}

export const Input = forwardRef<ComponentRef<typeof TextInput>, TextInputProps & { label: string; error?: string | null }>(function Input({ label, error, style, ...props }, ref) {
  const c = useColors();
  const textStyle: TextStyle = { fontFamily: fonts.regular, fontSize: 16, color: c.foreground };
  return (
    <View style={{ gap: 6 }}>
      <Text weight="medium" size={14}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={c.mutedForeground}
        style={[{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: error ? c.destructive : c.input, backgroundColor: c.card, paddingHorizontal: 14 }, textStyle, style]}
        {...props}
      />
      {error ? <Text size={13} style={{ color: c.destructive }}>{error}</Text> : null}
    </View>
  );
});

export function Center({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>{children}</View>;
}
