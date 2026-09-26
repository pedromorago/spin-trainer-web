// Design tokens. Dark background with a radial gradient, gold as accent.
// Typefaces: Bebas Neue (display), DM Sans (text), JetBrains Mono (hands and numbers).
export const theme = {
  colors: {
    bg: '#0b0e13', bgElevated: '#151a22', bgSunken: '#0e1218', border: '#2a313d', borderSubtle: '#1f2530',
    text: '#ece8df', textMuted: '#9aa3b2',
    accent: '#d8b35a', accentStrong: '#f0cd7a', accentSoft: 'rgba(216, 179, 90, 0.14)', onAccent: '#1b1407',
    danger: '#e5484d', success: '#30a46c',
    actionOrange: '#f76b15', actionRed: '#e5484d', actionYellow: '#f5d90a', actionPink: '#d6409f',
    actionGreen: '#30a46c', actionBlue: '#3a55c9', actionPurple: '#7b44b5', actionCyan: '#00a2c7',
    actionBrown: '#ad7f58', actionGray: '#3a3f47',
    // Charts (validated with the dataviz validator over bgElevated): primary mark in the brand gold
    // one step darker (L 0.48–0.67, ≥ 3:1), context in de-emphasis gray, grid and axes in a recessive hairline.
    chartAccent: '#ad8838', chartContext: '#6b7280', chartGrid: '#262d38', chartAxis: '#3a4250'
  },
  gradients: {
    page: 'radial-gradient(ellipse 120% 80% at 50% -10%, #1f2837 0%, #10151d 45%, #080a0e 100%)'
  },
  space: { xs: '4px', sm: '8px', md: '12px', lg: '20px', xl: '32px' },
  radius: { sm: '4px', md: '8px', lg: '12px', pill: '999px' },
  font: {
    display: '"Bebas Neue", Impact, sans-serif',
    family: '"DM Sans Variable", "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, Consolas, monospace',
    sizeXs: '11px', sizeSm: '13px', sizeMd: '15px', sizeLg: '20px', sizeXl: '28px'
  }
};
