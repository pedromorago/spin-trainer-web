import { theme } from '../theme/theme';

/** The Spin Trainer mark (the favicon's design): "ST" in a gold ring. Decorative: the name goes next to it as text. */
export function BrandMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <circle cx="50" cy="50" r="46" fill={theme.colors.bg} />
      <circle cx="50" cy="50" r="42" fill="none" stroke={theme.colors.accent} strokeWidth="5" />
      <text x="50" y="69" textAnchor="middle" fontFamily={theme.font.display} fontSize="54" letterSpacing="1"
        fill={theme.colors.accentStrong}>ST</text>
    </svg>
  );
}
