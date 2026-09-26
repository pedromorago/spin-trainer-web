import { describe, expect, it } from 'vitest';
import { VERDICT_KINDS } from '../../../domain/range';
import { VERDICT_STYLES } from '../verdictStyles';

describe('VERDICT_STYLES', () => {
  it('cubre todos los tipos de veredicto del dominio', () => {
    expect(Object.keys(VERDICT_STYLES).sort()).toEqual([...VERDICT_KINDS].sort());
  });

  it('cada tipo se distingue por color y, los fallos, también por glifo (no solo por color)', () => {
    const styles = VERDICT_KINDS.map(k => VERDICT_STYLES[k]);
    expect(new Set(styles.map(s => s.color)).size).toBe(VERDICT_KINDS.length);
    const glyphs = VERDICT_KINDS.filter(k => k !== 'correct').map(k => VERDICT_STYLES[k].glyph);
    expect(glyphs.every(Boolean)).toBe(true);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });
});
