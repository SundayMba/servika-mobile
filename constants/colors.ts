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
  /** Quietest ink on sand — meta rows, idle tab labels. */
  inkFaint: '#7C8592',
  /** Recessed sand, for a neutral chip sitting on a white surface. */
  sandSunk: '#F1F1EE',
  /** The accent at 8% — icon tiles and the warm status chip. */
  accentTint: '#FFF1E4',

  /**
   * Auth v2 ("Ink, cream, and one orange thing to press", design 02 Sign-in v2):
   * warm near-black, cream type, the deep orange as the only saturated colour.
   * Shared grammar with Servika Pro's auth kit.
   */
  inkWarm: '#17140F',
  inkWarmRaised: '#26221C',
  onInk: '#F3EBDF',
  onInkBody: 'rgba(243,235,223,0.58)',
  onInkMeta: 'rgba(243,235,223,0.5)',
  onInkFaint: 'rgba(243,235,223,0.4)',
  onInkFill: 'rgba(243,235,223,0.1)',
  onInkFillStrong: 'rgba(243,235,223,0.16)',
  onInkRule: 'rgba(243,235,223,0.16)',
  onInkBorder: 'rgba(243,235,223,0.24)',
  /** The one orange thing to press (deep brand orange on ink). */
  orange: '#E4620A',
  /** Label on the orange bar. Cream, never white. */
  orangeLabel: '#FFF6EE',
  /** The bar while a request is in flight. */
  orangeBusy: '#B85E12',
  orangeOnDark: '#FF9A6B',
  dangerOnInk: '#FF9A9D',
  dangerRule: '#E5484D',
  amberOnInk: '#F0B27A',
  successOnInk: '#34D399',
  successOnInkText: '#6EE7B7',
} as const;

/** Instrument Sans, the onboarding typeface. Loaded in app/_layout.tsx. */
export const fonts = {
  regular: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semibold: 'InstrumentSans_600SemiBold',
} as const;
