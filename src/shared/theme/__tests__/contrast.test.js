import { describe, expect, it } from 'vitest';
import { ACTIONS } from '../../../domain/actions';
import { ACTION_COLORS } from '../actionColors';
import { contrastRatio, readableText } from '../contrast';
import { theme } from '../theme';

describe('contrastRatio', () => {
  it('blanco sobre negro es 21:1 y un color consigo mismo 1:1', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#3a55c9', '#3a55c9')).toBe(1);
  });
});

describe('readableText', () => {
  it('usa texto oscuro sobre amarillo y claro sobre gris', () => {
    expect(readableText(theme.colors.actionYellow)).toBe(theme.colors.bg);
    expect(readableText(theme.colors.actionGray)).toBe(theme.colors.text);
  });

  // WCAG AA for normal text: 4.5:1. The cell labels are small text.
  it.each(ACTIONS)('el texto sobre %s cumple WCAG AA (≥ 4.5:1)', action => {
    const bg = ACTION_COLORS[action];
    expect(contrastRatio(readableText(bg), bg)).toBeGreaterThanOrEqual(4.5);
  });
});
