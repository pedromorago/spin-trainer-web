import { useEffect, useState } from 'react';

/**
 * Ancho de un elemento (ResizeObserver). Devuelve [ancho | null, callbackRef].
 * Con callback ref se observa también un elemento que se monta más tarde o se vuelve a montar
 * (un ref de objeto con useEffect solo vería el del primer render).
 */
export function useElementWidth(enabled = true) {
  const [node, setNode] = useState(null);
  const [width, setWidth] = useState(null);
  useEffect(() => {
    if (!enabled || !node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, node]);
  return [width, setNode];
}
