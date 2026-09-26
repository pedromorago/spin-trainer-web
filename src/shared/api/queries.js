// Hooks de estado de servidor (TanStack Query). Un hook por operación del contrato.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './index';

export const keys = {
  situations: ['situations'],
  defaultRange: (s, st) => ['range', 'default', s, st],
  userRange: (s, st) => ['range', 'user', s, st],
  attempts: ['attempts']
};

export function useSituations() {
  return useQuery({ queryKey: keys.situations, queryFn: api.listSituations, staleTime: Infinity });
}

export function useDefaultRange(situation, stack) {
  return useQuery({
    queryKey: keys.defaultRange(situation, stack),
    queryFn: () => api.getDefaultRange(situation, stack),
    enabled: !!situation && stack != null,
    staleTime: Infinity
  });
}

/** Rango custom del usuario; null si no existe (404 no es error aquí). */
export function useUserRange(situation, stack) {
  return useQuery({
    queryKey: keys.userRange(situation, stack),
    queryFn: () => api.getUserRange(situation, stack).catch(e => (e instanceof ApiError && e.isNotFound ? null : Promise.reject(e))),
    enabled: !!situation && stack != null
  });
}

/**
 * Rango con el que se entrena (ADR-0012): el custom del usuario si existe; si no, el default del PDF.
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

export function useSaveUserRange(situation, stack) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payload => api.putUserRange(situation, stack, payload),
    onSuccess: data => qc.setQueryData(keys.userRange(situation, stack), data)
  });
}

export function useDeleteUserRange(situation, stack) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteUserRange(situation, stack),
    onSuccess: () => qc.setQueryData(keys.userRange(situation, stack), null)
  });
}

export function useRecordAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.recordAttempt,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.attempts })
  });
}

export function useAttempts() {
  return useQuery({ queryKey: keys.attempts, queryFn: api.listAttempts });
}
