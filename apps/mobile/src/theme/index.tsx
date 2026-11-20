import { useColorScheme } from 'react-native';
import { vars } from 'nativewind';
import { deepTeal, type ColorScheme, type ThemeColors } from './palette';

export type { ColorScheme, ThemeColors };

/** CSS variables consumed by tailwind.config.js color tokens. */
export function themeVars(scheme: ColorScheme) {
  const c = deepTeal[scheme];
  return vars({
    '--color-background': c.background,
    '--color-surface': c.surface,
    '--color-surface-raised': c.surfaceRaised,
    '--color-line': c.border,
    '--color-fg': c.text,
    '--color-fg-muted': c.textMuted,
    '--color-primary': c.primary,
    '--color-on-primary': c.onPrimary,
    '--color-accent': c.accent,
    '--color-danger': c.danger,
    '--color-warning': c.warning,
    '--color-success': c.success,
  });
}

/** Follows the system color scheme. */
export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const scheme: ColorScheme = useColorScheme() === 'light' ? 'light' : 'dark';
  return { scheme, colors: deepTeal[scheme] };
}
