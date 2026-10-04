import { useCallback, useEffect, useState } from 'react';

/**
 * Width of an element. Returns [width | null, callbackRef].
 * The first width is read as the element is attached, during React's commit, so the size it implies is applied before
 * the browser paints: an element that mounts again (the grid after "Loading…" when the chart changes) never shows a
 * frame at a default size. A ResizeObserver follows later changes. With a callback ref, an element that mounts later or
 * is remounted is also measured and observed (an object ref with useEffect would only see the one from the first render).
 * The element should have no padding or border: its box is its content width.
 */
export function useElementWidth(enabled = true) {
  const [node, setNode] = useState(null);
  const [width, setWidth] = useState(null);
  const ref = useCallback(element => {
    setNode(element);
    if (enabled && element) setWidth(element.getBoundingClientRect().width);
  }, [enabled]);
  useEffect(() => {
    if (!enabled || !node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, node]);
  return [width, ref];
}
