import { useColorScheme } from 'react-native';
import { palette, type Colors } from './colors';

export { fonts, palette } from './colors';
export type { Colors } from './colors';

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}
