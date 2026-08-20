/**
 * Servika brand colors.
 *
 * Use Tailwind utilities (`bg-primary`, `text-primary`, …) in JSX wherever
 * possible. These tokens exist for the places Tailwind can't reach — e.g.
 * native StyleSheet styles, animated values, and gradient color stops.
 */
export const colors = {
  primary: '#F97316',
  primaryDark: '#EA6A0C',
  primaryLight: '#FB923C',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  border: '#E5E7EB',
  white: '#FFFFFF',

  /** Soothing off-white page canvas — cards sit on top of this. */
  background: '#F2F4F8',

  /**
   * Onboarding v2, from the "Servika Onboarding" design canvas. Deliberately
   * scoped to that flow rather than folded into the brand tokens above: it runs
   * a warmer ground and a deeper orange than the rest of the app, and changing
   * `primary` globally would repaint every screen.
   */
  sand: '#F4F3F0',
  ink: '#14171B',
  inkMuted: '#5B6472',
  inkSubtle: '#6E7681',
  accentDeep: '#E4620A',
  /** Hairline that replaces the old stacked drop-shadows on v2 surfaces. */
  hairline: 'rgba(20,23,27,0.07)',
  /** Slightly stronger, for a control that needs to read as pressable. */
  hairlineStrong: 'rgba(20,23,27,0.12)',
  online: '#22C55E',
  onlineInk: '#0E9E70',
} as const;

/** Instrument Sans, the onboarding typeface. Loaded in app/_layout.tsx. */
export const fonts = {
  regular: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semibold: 'InstrumentSans_600SemiBold',
} as const;
