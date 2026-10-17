import { Platform } from 'react-native';
import { Colors as BrandColors } from './colors';

export const Colors = {
  ...BrandColors,
  light: {
    text: BrandColors.textPrimary,
    background: BrandColors.warmIvory,
    backgroundElement: BrandColors.leafGreen,
    backgroundSelected: BrandColors.sageLight,
    textSecondary: BrandColors.textSecondary,
    tint: BrandColors.forestGreen,
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212',
    backgroundElement: '#1E1E1E',
    backgroundSelected: '#2A2A2A',
    textSecondary: '#A0A0A0',
    tint: BrandColors.sageGreen,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Typography = {
  h1: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
    color: BrandColors.textBrand,
  },
  h2: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
    color: BrandColors.textPrimary,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400' as const,
    color: BrandColors.textSecondary,
  },
  bodyBold: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600' as const,
    color: BrandColors.textPrimary,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500' as const,
    color: BrandColors.textMuted,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
};

export const Radii = {
  input: 14,
  button: 24,
  card: 16,
  tag: 20,
  full: 9999,
};

export const Shadows = {
  button: Platform.select({
    web: {
      boxShadow: '0 4px 12px rgba(27, 67, 50, 0.15)',
    },
    default: {
      shadowColor: '#1B4332',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
  }),
  card: Platform.select({
    web: {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
  }),
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export default Colors;
