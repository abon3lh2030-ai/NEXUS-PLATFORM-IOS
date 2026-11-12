import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, useColorScheme, View, type StyleProp, type ViewStyle } from 'react-native';
import { useColors } from '@/theme';
import { Text } from './ui';

/** NEXUS brand gradient (same as the logo). */
export const BRAND = ['#5b4df0', '#2bb3d9'] as const;

/**
 * A Liquid Glass surface (iOS 26). Falls back to a regular view on older iOS, so it also gets a
 * translucent fill there.
 */
export function Glass({ children, style, interactive, tint }: { children: ReactNode; style?: StyleProp<ViewStyle>; interactive?: boolean; tint?: string }) {
  return (
    <GlassView glassEffectStyle="regular" isInteractive={interactive} {...(tint ? { tintColor: tint } : {})} style={[{ borderRadius: 26, padding: 16, overflow: 'hidden' }, style]}>
      {children}
    </GlassView>
  );
}

/** Colorful header area that the glass tiles sit on (Liquid Glass reads best over color). */
export function Hero({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const dark = useColorScheme() === 'dark';
  return (
    <View style={[{ borderRadius: 32, overflow: 'hidden' }, style]}>
      <LinearGradient colors={dark ? ['#2a2380', '#0f5d78'] : [...BRAND]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, { top: -40, left: -30, backgroundColor: 'rgba(255,255,255,0.18)' }]} />
      <View style={[styles.blob, { bottom: -60, right: -20, width: 220, height: 220, backgroundColor: 'rgba(255,255,255,0.12)' }]} />
      <View style={{ padding: 16, gap: 12 }}>{children}</View>
    </View>
  );
}

/** A big number on glass (inside Hero). */
export function StatTile({ label, value, icon, onPress }: { label: string; value: number | string; icon: SFSymbol; onPress?: () => void }) {
  const body = (
    <Glass interactive={Boolean(onPress)} style={{ flex: 1, minHeight: 104, justifyContent: 'space-between', padding: 14 }}>
      <SymbolView name={icon} size={20} tintColor="#ffffff" />
      <View>
        <Text weight="bold" size={30} style={{ color: '#fff' }}>{value}</Text>
        <Text size={13} style={{ color: 'rgba(255,255,255,0.88)' }}>{label}</Text>
      </View>
    </Glass>
  );
  return onPress ? <Pressable style={{ flex: 1 }} onPress={onPress}>{body}</Pressable> : <View style={{ flex: 1 }}>{body}</View>;
}

/** Inset-grouped section like Apple's own apps. */
export function Section({ title, action, children }: { title: string; action?: { label: string; onPress: () => void }; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 6 }}>
        <Text weight="bold" size={20}>{title}</Text>
        {action ? <Pressable onPress={action.onPress} hitSlop={8}><Text weight="medium" size={15} style={{ color: c.primary }}>{action.label}</Text></Pressable> : null}
      </View>
      <View style={{ backgroundColor: c.elevated, borderRadius: 22, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

export function Row({ icon, iconColor, title, subtitle, trailing, onPress, last }: { icon?: SFSymbol; iconColor?: string; title: string; subtitle?: string | null; trailing?: ReactNode; onPress?: () => void; last?: boolean }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => ({ backgroundColor: pressed ? c.muted : 'transparent' })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        {icon ? (
          <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: (iconColor ?? c.primary) + '22' }}>
            <SymbolView name={icon} size={18} tintColor={iconColor ?? c.primary} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="medium" numberOfLines={2}>{title}</Text>
          {subtitle ? <Text muted size={13} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        {trailing}
        {onPress ? <SymbolView name="chevron.left" size={13} tintColor={c.mutedForeground} /> : null}
      </View>
      {!last ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginStart: icon ? 62 : 16 }} /> : null}
    </Pressable>
  );
}

export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + '1f', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text weight="semibold" size={12} style={{ color }}>{label}</Text>
    </View>
  );
}

export function Empty({ icon, title, subtitle }: { icon: SFSymbol; title: string; subtitle?: string }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, gap: 6 }}>
      <SymbolView name={icon} size={30} tintColor={c.mutedForeground} />
      <Text weight="semibold" style={{ textAlign: 'center' }}>{title}</Text>
      {subtitle ? <Text muted size={13} style={{ textAlign: 'center' }}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', width: 180, height: 180, borderRadius: 999 },
});

/** Large Arabic title at the top of a tab's root screen (replaces UIKit's large title). */
export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ paddingHorizontal: 6, paddingTop: 8, gap: 2 }}>
      <Text weight="bold" size={32}>{title}</Text>
      {subtitle ? <Text muted size={14}>{subtitle}</Text> : null}
    </View>
  );
}
