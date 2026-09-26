// Hooks de estado de servidor (TanStack Query). Un hook por operación del contrato v0.2 (docs/openapi.yaml).
import { useMemo } from 'react';
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mergeEffectiveRanges } from '../../domain/range';
import { comboKey } from '../../domain/selection';
import { api } from './index';

export const keys = {
  situations: ['situations'],
  defaultRanges: ['range', 'default'],
  userRanges: ['range', 'user'],
  attempts: ['attempts'],
  stats: ['stats'],
  handStats: filters => ['stats', 'hands', filters],
  progress: params => ['stats', 'progress', params]
};

/** ¿Es el rango de esta combinación? (el stack puede llegar como texto desde la URL). */
const isSpot = (situation, stack) => range => comboKey(range) === comboKey({ situation, stack: Number(stack) });

export function useSituations() {
  return useQuery({ queryKey: keys.situations, queryFn: api.listSituations, staleTime: Infinity });
}

/** Todos los rangos de referencia (cambian solo con una migración de seed). */
export function useDefaultRanges() {
  return useQuery({ queryKey: keys.defaultRanges, queryFn: api.listDefaultRanges, staleTime: Infinity });
}

/** Todos los rangos personalizados del usuario. */
export function useUserRanges() {
  return useQuery({ queryKey: keys.userRanges, queryFn: api.listUserRanges });
}

/**
 * Rango con el que se entrena (ADR-0012): el personalizado si existe; si no, el de referencia (PDF).
 * Expone ambos para quien necesite distinguirlos (badges y Reset del Explorer).
 * Sale de las dos listas, compartidas con el Quiz y el modo "Any": ni una petición por combinación ni un 404
 * cuando la combinación aún no tiene rango (los GET individuales del contrato siguen en los adaptadores).
 */
export function useEffectiveRange(situation, stack) {
  const defaults = useDefaultRanges();
  const users = useUserRanges();
  const defaultRange = defaults.data?.find(isSpot(situation, stack)) ?? null;
  const userRange = users.data?.find(isSpot(situation, stack)) ?? null;
  return {
    range: userRange ?? defaultRange,
    defaultRange,
    userRange,
    isLoading: defaults.isLoading || users.isLoading,
    error: defaults.error ?? users.error ?? null,
    refetchUserRange: users.refetch
  };
}

/**
 * Rangos efectivos de todas las combinaciones (ADR-0012), para el modo "Any" y las manos difíciles:
 * `ranges` es un Map `situación@stack` → Range (el personalizado prevalece).
 */
export function useEffectiveRanges() {
  const defaults = useDefaultRanges();
  const users = useUserRanges();
  const ranges = useMemo(() => mergeEffectiveRanges(defaults.data, users.data), [defaults.data, users.data]);
  return {
    ranges,
    isLoading: defaults.isLoading || users.isLoading,
    error: defaults.error ?? users.error ?? null
  };
}

/** PUT con `version` obligatoria: 0 crea, N reemplaza la versión N (409 si cambió). */
export function useSaveUserRange(situation, stack) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payload => api.putUserRange(situation, stack, payload),
    onSuccess: data => {
      // La respuesta del PUT es el rango guardado: la lista se actualiza ya y luego se revalida.
      qc.setQueryData(keys.userRanges, list => [...(list ?? []).filter(r => !isSpot(situation, stack)(r)), data]);
      qc.invalidateQueries({ queryKey: keys.userRanges, exact: true });
    }
  });
}

export function useDeleteUserRange(situation, stack) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteUserRange(situation, stack),
    onSuccess: () => {
      qc.setQueryData(keys.userRanges, list => (list ?? []).filter(r => !isSpot(situation, stack)(r)));
      qc.invalidateQueries({ queryKey: keys.userRanges, exact: true });
    }
  });
}

/** Registra una respuesta ({ situation, stack, hand, given }); el servidor corrige y devuelve el intento. */
export function useRecordAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.recordAttempt,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.attempts });
      qc.invalidateQueries({ queryKey: keys.stats });
    }
  });
}

/** Historial de intentos paginado por cursor (del más reciente al más antiguo). */
export function useAttempts(filters = {}) {
  return useInfiniteQuery({
    queryKey: [...keys.attempts, filters],
    queryFn: ({ pageParam }) => api.listAttempts({ ...filters, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: page => page.nextCursor ?? undefined
  });
}

/** Filas agregadas por (situación, stack, mano) para la política de estudio de domain/stats.js. */
export function useHandStats(filters = {}) {
  return useQuery({ queryKey: keys.handStats(filters), queryFn: () => api.getHandStats(filters) });
}

/**
 * Intentos y aciertos por día (solo días con actividad). Al cambiar el periodo conserva los datos anteriores
 * (`isPlaceholderData`) para que el gráfico no parpadee mientras recarga.
 */
export function useProgress({ days = 30, tz = 'UTC' } = {}) {
  return useQuery({ queryKey: keys.progress({ days, tz }), queryFn: () => api.getProgress({ days, tz }), placeholderData: keepPreviousData });
}
