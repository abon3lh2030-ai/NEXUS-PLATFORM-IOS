/** NEXUS brand tokens, converted from the website's packages/config/theme.css (OKLCH → sRGB hex). */
export const palette = {
  light: {
    background: '#f9fafc', foreground: '#0f1624', card: '#ffffff', primary: '#3a45c8', primaryForeground: '#fcfcfc',
    secondary: '#edf0f9', muted: '#edf0f6', mutedForeground: '#60697b', accent: '#e8eeff', accentForeground: '#262f8a',
    destructive: '#d4212d', success: '#009956', warning: '#e38f00', info: '#008bc2', border: '#dee1e8', input: '#dadee6', ring: '#4d5fe4',
  },
  dark: {
    background: '#090c15', foreground: '#ebeef5', card: '#0f131e', primary: '#7584fe', primaryForeground: '#060911',
    secondary: '#1e2433', muted: '#1a1f2b', mutedForeground: '#979faf', accent: '#222741', accentForeground: '#c8d4ff',
    destructive: '#e64343', success: '#3bb974', warning: '#f5ae39', info: '#4cb0e5', border: '#272d3d', input: '#2c3242', ring: '#7584fe',
  },
} as const;

export type Colors = Record<keyof (typeof palette)['light'], string>;

/** IBM Plex Sans Arabic (embedded by the expo-font config plugin; iOS uses the PostScript names). */
export const fonts = {
  regular: 'IBMPlexSansArabic-Regular',
  medium: 'IBMPlexSansArabic-Medium',
  semibold: 'IBMPlexSansArabic-SemiBold',
  bold: 'IBMPlexSansArabic-Bold',
} as const;
