import { useEffect, useState } from 'react';

/**
 * Width of an element (ResizeObserver). Returns [width | null, callbackRef].
 * With a callback ref, an element that mounts later or is remounted is also observed
 * (an object ref with useEffect would only see the one from the first render).
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
