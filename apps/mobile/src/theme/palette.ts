/**
 * deep-teal palette (copied from the shared palette library; only the values this app needs).
 * This file is the ONLY place hex colors live. Screens use tailwind tokens (bg-background, text-fg, ...)
 * or `useTheme().colors` for props that need a raw color (tab bar, Switch, placeholder).
 */
export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  accent: string;
  danger: string;
  warning: string;
  success: string;
}

export const deepTeal: Record<ColorScheme, ThemeColors> = {
  dark: {
    background: '#071C27',
    surface: '#123747',
    surfaceRaised: '#1B4658',
    border: '#245568',
    text: '#DCE9E8',
    textMuted: '#91B3B9',
    primary: '#91B3B9',
    onPrimary: '#071C27',
    accent: '#477C8B',
    danger: '#F2A5A5',
    warning: '#F0CF8E',
    success: '#9FD8B5',
  },
  light: {
    background: '#DCE9E8',
    surface: '#F1F6F6',
    surfaceRaised: '#FFFFFF',
    border: '#91B3B9',
    text: '#071C27',
    textMuted: '#245568',
    primary: '#245568',
    onPrimary: '#DCE9E8',
    accent: '#477C8B',
    danger: '#B42318',
    warning: '#8A5A00',
    success: '#1E6B43',
  },
};
