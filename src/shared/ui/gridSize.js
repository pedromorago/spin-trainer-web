// Tamaño de celda del grid 13×13 a partir del ancho disponible.
export const CELL_MIN = 20;
export const CELL_MAX = 70;
export const CELL_GAP = 2;
// Relleno (8 px por lado) + borde (1 px por lado) del contenedor del grid.
export const GRID_CHROME = 18;

/** Mayor celda entera con la que 13 columnas caben en `width`, acotada a [CELL_MIN, CELL_MAX]. */
export function gridCellSize(width) {
  if (!Number.isFinite(width) || width <= 0) return CELL_MIN;
  const size = Math.floor((width - GRID_CHROME - CELL_GAP * 12) / 13);
  return Math.max(CELL_MIN, Math.min(CELL_MAX, size));
}

/** Tamaño de letra de la etiqueta de la celda, proporcional a la celda. */
export function cellFontSize(cellSize) {
  return Math.round(Math.max(9, Math.min(16, cellSize * 0.31)));
}
