import { Stack } from 'expo-router';
import type { ComponentProps } from 'react';
import { useColors } from '@/theme';

/** Native iOS stack with large titles; on iOS 26 the header is Liquid Glass. */
export function useStackOptions(): ComponentProps<typeof Stack>['screenOptions'] {
  const c = useColors();
  return {
    // UIKit's native titles don't shape our embedded Arabic font, so tab roots draw their own large
    // title (ScreenTitle) and detail screens use the system Arabic font for the small header title.
    headerTitleStyle: { color: c.foreground },
    headerBackButtonDisplayMode: 'minimal',
    headerTintColor: c.primary,
    contentStyle: { backgroundColor: c.screen },
  };
}
