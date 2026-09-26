import { theme } from './theme';

// Contraste WCAG 2.x: elige el color de texto legible sobre un fondo (celdas del grid, chips de acción).

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const LIGHT = theme.colors.text;
const DARK = theme.colors.bg;

/** Texto claro u oscuro, el que más contraste tenga con el fondo dado (#rrggbb). */
export function readableText(background) {
  return contrastRatio(LIGHT, background) >= contrastRatio(DARK, background) ? LIGHT : DARK;
}
