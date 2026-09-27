import { theme } from './theme';

// Presentation of the Builder verdicts (domain/range#VERDICT_KINDS). Outline + glyph: does not rely on color alone.
export const VERDICT_STYLES = {
  correct: { label: 'Correct', color: theme.colors.success, line: 'solid', glyph: null },
  wrong: { label: 'Wrong action', color: theme.colors.danger, line: 'solid', glyph: '✕' },
  extra: { label: 'Extra', color: '#f5a524', line: 'dashed', glyph: '+' },
  missing: { label: 'Missing', color: '#38bdf8', line: 'dashed', glyph: '−' }
};
