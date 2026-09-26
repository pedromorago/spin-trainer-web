import { describe, expect, it } from 'vitest';
import { CELL_GAP, CELL_MAX, CELL_MIN, cellFontSize, GRID_CHROME, gridCellSize } from '../gridSize';

const widthFor = cell => cell * 13 + CELL_GAP * 12 + GRID_CHROME;

describe('gridCellSize', () => {
  it('ajusta las 13 columnas al ancho exacto', () => {
    expect(gridCellSize(widthFor(42))).toBe(42);
    expect(gridCellSize(widthFor(42) - 1)).toBe(41);
  });

  it('se acota a [20, 70] px', () => {
    expect(gridCellSize(100)).toBe(CELL_MIN);
    expect(gridCellSize(5000)).toBe(CELL_MAX);
  });

  it('ancho desconocido o no positivo → mínimo', () => {
    expect(gridCellSize(0)).toBe(CELL_MIN);
    expect(gridCellSize(NaN)).toBe(CELL_MIN);
  });
});

describe('cellFontSize', () => {
  it('escala con la celda dentro de [9, 16]', () => {
    expect(cellFontSize(20)).toBe(9);
    expect(cellFontSize(42)).toBe(13);
    expect(cellFontSize(70)).toBe(16);
  });
});
