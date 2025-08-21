import { ThemeColors, ThemeMode } from '@/types';

// Design system color palette
export const PALETTE: ThemeColors = {
  bg: "#FCFCFD",
  bgSoft: "#F8F7F4", 
  lilac: "#E2E0F4",
  sand: "#F2EFE6",
  sandDeep: "#EFE6D9",
  ice: "#F1F4FA",
  goldSoft: "#F1E08C",
  gold: "#E2BC1A",
  mint: "#D8E7C5",
  line: "#CEC7A7",
  ink: "#111214",
  forest: "#2F3A24",
};

// Generate semantic color tokens for light theme
export const generateLightTheme = (): Record<string, string> => ({
  background: PALETTE.bg,
  foreground: PALETTE.ink,
  surface: PALETTE.bgSoft,
  surfaceElevated: PALETTE.lilac,
  border: PALETTE.line,
  accent: PALETTE.gold,
  accentSoft: PALETTE.goldSoft,
  success: PALETTE.mint,
  muted: PALETTE.sand,
  mutedDeep: PALETTE.sandDeep,
});

// Generate semantic color tokens for dark theme
export const generateDarkTheme = (): Record<string, string> => ({
  background: PALETTE.ink,
  foreground: PALETTE.bg,
  surface: PALETTE.forest,
  surfaceElevated: PALETTE.line,
  border: PALETTE.sand,
  accent: PALETTE.goldSoft,
  accentSoft: PALETTE.gold,
  success: PALETTE.mint,
  muted: PALETTE.sandDeep,
  mutedDeep: PALETTE.sand,
});

// Get theme colors based on mode
export const getThemeColors = (mode: ThemeMode): Record<string, string> => {
  return mode === 'light' ? generateLightTheme() : generateDarkTheme();
};

// Detect system theme preference
export const getSystemTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Apply theme to document
export const applyTheme = (mode: ThemeMode): void => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const colors = getThemeColors(mode);
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  
  // Update meta theme-color for PWA
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', colors.background);
  }
};