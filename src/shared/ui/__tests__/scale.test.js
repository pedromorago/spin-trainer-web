import { describe, expect, it } from 'vitest';
import { labelIndices, linearScale, niceMax } from '../chart/scale';

describe('linearScale', () => {
  it('mapea el dominio al rango, también invertido (eje Y en SVG)', () => {
    const y = linearScale([0, 1], [100, 0]);
    expect([y(0), y(0.5), y(1)]).toEqual([100, 50, 0]);
  });

  it('dominio degenerado → centro del rango', () => {
    expect(linearScale([3, 3], [0, 10])(3)).toBe(5);
  });
});

describe('niceMax', () => {
  it.each([[0, 1], [1, 1], [3, 5], [7, 10], [12, 20], [48, 50], [51, 100], [230, 500]])('niceMax(%i) = %i', (n, expected) => {
    expect(niceMax(n)).toBe(expected);
  });
});

describe('labelIndices', () => {
  it('todas si caben; si no, paso uniforme con primera y última', () => {
    expect(labelIndices(3, 5)).toEqual([0, 1, 2]);
    expect(labelIndices(30, 4)).toEqual([0, 10, 20, 29]);
    expect(labelIndices(0, 4)).toEqual([]);
  });

  it('nunca pone dos etiquetas contiguas ni supera el máximo', () => {
    for (const [count, max] of [[30, 16], [90, 16], [7, 16], [90, 4], [31, 5]]) {
      const idx = labelIndices(count, max);
      expect(idx[0]).toBe(0);
      expect(idx.at(-1)).toBe(count - 1);
      expect(idx.length).toBeLessThanOrEqual(Math.max(max, 2));
      if (count > max) for (let i = 1; i < idx.length; i++) expect(idx[i] - idx[i - 1]).toBeGreaterThan(1);
    }
  });
});
