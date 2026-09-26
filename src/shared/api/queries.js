// Hooks de estado de servidor (TanStack Query). Un hook por operación del contrato v0.2 (docs/openapi-draft.yaml).
import { useMemo } from 'react';
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mergeEffectiveRanges } from '../../domain/range';
import { api, ApiError } from './index';

export const keys = {
  situations: ['situations'],
  defaultRanges: ['range', 'default'],
  defaultRange: (s, st) => ['range', 'default', s, st],
  userRanges: ['range', 'user'],
  userRange: (s, st) => ['range', 'user', s, st],
  attempts: ['attempts'],
  stats: ['stats'],
  handStats: filters => ['stats', 'hands', filters],
  progress: params => ['stats', 'progress', params]
};

/** 404 significa "no existe" (sin rango de referencia o personalizado): null, no error. */
const nullIfNotFound = e => (e instanceof ApiError && e.isNotFound ? null : Promise.reject(e));

export function useSituations() {
  return useQuery({ queryKey: keys.situations, queryFn: api.listSituations, staleTime: Infinity });
}

/** Todos los rangos de referencia (cambian solo con una migración de seed). */
export function useDefaultRanges() {
  return useQuery({ queryKey: keys.defaultRanges, queryFn: api.listDefaultRanges, staleTime: Infinity });
}

/** Rango de referencia; null si la combinación aún no tiene seed. */
export function useDefaultRange(situation, stack) {
  return useQuery({
    queryKey: keys.defaultRange(situation, stack),
    queryFn: () => api.getDefaultRange(situation, stack).catch(nullIfNotFound),
    enabled: !!situation && stack != null,
    staleTime: Infinity
  });
}

/** Todos los rangos personalizados del usuario. */
export function useUserRanges() {
  return useQuery({ queryKey: keys.userRanges, queryFn: api.listUserRanges });
}

/** Rango personalizado del usuario; null si no existe. */
export function useUserRange(situation, stack) {
  return useQuery({
    queryKey: keys.userRange(situation, stack),
    queryFn: () => api.getUserRange(situation, stack).catch(nullIfNotFound),
    enabled: !!situation && stack != null
  });
}

/**
 * Rango con el que se entrena (ADR-0012): el personalizado si existe; si no, el de referencia (PDF).
 * Expone ambos para quien necesite distinguirlos (badges y Reset del Explorer).
 */
export function useEffectiveRange(situation, stack) {
  const def = useDefaultRange(situation, stack);
  const user = useUserRange(situation, stack);
  return {
    range: user.data ?? def.data ?? null,
    defaultRange: def.data ?? null,
    userRange: user.data ?? null,
    isLoading: def.isLoading || user.isLoading,
    error: def.error ?? user.error ?? null,
    refetchUserRange: user.refetch
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
      qc.setQueryData(keys.userRange(situation, stack), data);
      qc.invalidateQueries({ queryKey: keys.userRanges, exact: true });
    }
  });
}

export function useDeleteUserRange(situation, stack) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteUserRange(situation, stack),
    onSuccess: () => {
      qc.setQueryData(keys.userRange(situation, stack), null);
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
