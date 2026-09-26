// Cell size of the 13×13 grid from the available width.
export const CELL_MIN = 20;
export const CELL_MAX = 70;
export const CELL_GAP = 2;
// Padding (8 px per side) + border (1 px per side) of the grid container.
export const GRID_CHROME = 18;

/** Largest integer cell with which 13 columns fit in `width`, clamped to [CELL_MIN, CELL_MAX]. */
export function gridCellSize(width) {
  if (!Number.isFinite(width) || width <= 0) return CELL_MIN;
  const size = Math.floor((width - GRID_CHROME - CELL_GAP * 12) / 13);
  return Math.max(CELL_MIN, Math.min(CELL_MAX, size));
}

/** Font size of the cell label, proportional to the cell. */
export function cellFontSize(cellSize) {
  return Math.round(Math.max(9, Math.min(16, cellSize * 0.31)));
}
