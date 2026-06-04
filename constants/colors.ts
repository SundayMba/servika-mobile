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
} as const;
