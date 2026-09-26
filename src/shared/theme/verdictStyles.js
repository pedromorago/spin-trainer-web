import { theme } from './theme';

// Presentación de los veredictos del Builder (domain/range#VERDICT_KINDS). Contorno + glifo: no depende solo del color.
export const VERDICT_STYLES = {
  correct: { label: 'Correcta', color: theme.colors.success, line: 'solid', glyph: null },
  wrong: { label: 'Acción equivocada', color: theme.colors.danger, line: 'solid', glyph: '✕' },
  extra: { label: 'De más', color: '#f5a524', line: 'dashed', glyph: '+' },
  missing: { label: 'Faltó', color: '#38bdf8', line: 'dashed', glyph: '−' }
};
