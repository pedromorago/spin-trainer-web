// Utilidades puras de gráfico (presentación): escalas lineales y ticks "redondos".

/** Escala lineal del dominio [d0, d1] al rango [r0, r1]. Dominio degenerado → centro del rango. */
export function linearScale([d0, d1], [r0, r1]) {
  const span = d1 - d0;
  return v => (span === 0 ? (r0 + r1) / 2 : r0 + ((v - d0) / span) * (r1 - r0));
}

/** Máximo "redondo" (1, 2, 5 × 10^k) ≥ n, para el eje de valores. n ≤ 0 → 1. */
export function niceMax(n) {
  if (!(n > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 5, 10].find(m => m * pow >= n);
  return step * pow;
}

/**
 * Índices de etiquetas del eje X con paso entero uniforme (nunca dos etiquetas contiguas por redondeo),
 * como mucho `max`; la última siempre se etiqueta y sustituye a la anterior si quedaría a medio paso o menos.
 */
export function labelIndices(count, max) {
  if (count <= 0) return [];
  if (count <= max) return Array.from({ length: count }, (_, i) => i);
  const step = Math.ceil((count - 1) / (max - 1));
  const indices = [];
  for (let i = 0; i < count; i += step) indices.push(i);
  const last = count - 1;
  if (indices.at(-1) !== last) {
    if (last - indices.at(-1) <= step / 2) indices.pop();
    indices.push(last);
  }
  return indices;
}
