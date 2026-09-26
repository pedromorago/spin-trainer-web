import { useCallback } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router';

/**
 * Protege cambios sin guardar: bloquea la navegación interna (incluido cambiar situación/stack, que vive en la URL)
 * y pide confirmación del navegador al cerrar o recargar la pestaña. Devuelve el blocker de React Router.
 */
export function useUnsavedChanges(dirty) {
  const blocker = useBlocker(({ currentLocation: a, nextLocation: b }) => dirty && (a.pathname !== b.pathname || a.search !== b.search));
  useBeforeUnload(useCallback(e => { if (dirty) e.preventDefault(); }, [dirty]));
  return blocker;
}
