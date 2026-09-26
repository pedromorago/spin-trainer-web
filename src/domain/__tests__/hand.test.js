import { describe, expect, it } from 'vitest';
import { allHands, combos, compareHands, getCell, getHand, isValidHand, TOTAL_COMBOS } from '../hand';

describe('hand', () => {
  it('nombra celdas según la convención del grid', () => {
    expect(getHand(0, 0)).toBe('AA');
    expect(getHand(0, 1)).toBe('AKs');
    expect(getHand(1, 0)).toBe('AKo');
    expect(getHand(12, 11)).toBe('32o');
  });

  it('getCell es inverso de getHand para las 169 manos', () => {
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
      expect(getCell(getHand(r, c))).toEqual([r, c]);
    }
  });

  it('valida nombres de mano', () => {
    expect(isValidHand('AA')).toBe(true);
    expect(isValidHand('AKs')).toBe(true);
    expect(isValidHand('AAs')).toBe(false);
    expect(isValidHand('KAs')).toBe(false);
    expect(isValidHand('AK')).toBe(false);
    expect(isValidHand('A1s')).toBe(false);
  });

  it('suma 1326 combos', () => {
    expect(allHands()).toHaveLength(169);
    expect(allHands().reduce((n, h) => n + combos(h), 0)).toBe(TOTAL_COMBOS);
  });

  it('ordena parejas, suited y offsuit, de mayor a menor', () => {
    expect(['AKo', '72o', 'KQs', '22', 'AKs', 'AA'].sort(compareHands)).toEqual(['AA', '22', 'AKs', 'KQs', 'AKo', '72o']);
  });
});

describe('isValidHand y getCell: entradas fuera del formato', () => {
  it('exige la mano completa, sin prefijos ni sufijos', () => {
    expect(isValidHand('XAKs')).toBe(false);
    expect(isValidHand('AKsx')).toBe(false);
  });

  it('lo que no es texto no es una mano, y no lanza', () => {
    for (const value of [null, undefined, 42, {}, ['AK']]) expect(isValidHand(value)).toBe(false);
  });

  it('getCell lanza con la mano en el mensaje', () => {
    expect(() => getCell('ZZ')).toThrow('Invalid hand: ZZ');
  });
});

describe('compareHands: dentro de cada grupo manda la fila', () => {
  it('A2s va antes que KQs, y 32o la última', () => {
    expect(['KQs', '32o', 'A2s', 'AKo', 'AKs', '22', 'AA'].sort(compareHands))
      .toEqual(['AA', '22', 'AKs', 'A2s', 'KQs', 'AKo', '32o']);
  });
});
