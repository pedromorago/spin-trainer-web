import { describe, expect, it } from 'vitest';
import { pickUniform, pickWeighted } from '../random';

describe('pickUniform', () => {
  it('es determinista con un rng fijo y null con lista vacía', () => {
    expect(pickUniform(['a', 'b', 'c'], () => 0)).toBe('a');
    expect(pickUniform(['a', 'b', 'c'], () => 0.99)).toBe('c');
    expect(pickUniform([], () => 0)).toBeNull();
  });
});

describe('pickWeighted', () => {
  const items = [{ id: 'a', w: 1 }, { id: 'b', w: 0 }, { id: 'c', w: 3 }];
  const pick = r => pickWeighted(items, i => i.w, () => r)?.id;

  it('reparte el intervalo [0,1) en proporción al peso', () => {
    expect(pick(0)).toBe('a');
    expect(pick(0.24)).toBe('a');
    expect(pick(0.25)).toBe('c');
    expect(pick(0.999)).toBe('c');
  });

  it('los pesos ≤ 0 nunca salen; sin pesos positivos → null', () => {
    for (let r = 0; r < 1; r += 0.01) expect(pick(r)).not.toBe('b');
    expect(pickWeighted([{ w: 0 }, { w: -2 }], i => i.w, () => 0)).toBeNull();
    expect(pickWeighted([], i => i.w)).toBeNull();
  });
});

describe('pickWeighted: pesos acumulados y extremos', () => {
  it('con tres pesos iguales, 0.5 cae en el del medio', () => {
    expect(pickWeighted(['a', 'b', 'c'], () => 1, () => 0.5)).toBe('b');
  });

  it('si el redondeo lleva el sorteo al final, sale el último con peso positivo, nunca uno con peso 0', () => {
    expect(pickWeighted(['a', 'b'], item => (item === 'a' ? 1 : 0), () => 1)).toBe('a');
  });
});
