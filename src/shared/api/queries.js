// Server state hooks (TanStack Query). One hook per operation of contract v0.2 (docs/openapi.yaml).
import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useIsFetching, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mergeEffectiveRanges } from '../../domain/range';
import { comboKey } from '../../domain/selection';
import { api } from './index';
import { loadShowcase } from './showcase';

export const keys = {
  situations: ['situations'],
  defaultRanges: ['range', 'default'],
  userRanges: ['range', 'user'],
  attempts: ['attempts'],
  stats: ['stats'],
  handStats: filters => ['stats', 'hands', filters],
  progress: params => ['stats', 'progress', params]
};

/** Is it the range of this combination? (the stack may arrive as text from the URL). */
const isSpot = (situation, stack) => range => comboKey(range) === comboKey({ situation, stack: Number(stack) });

export function useSituations() {
  return useQuery({ queryKey: keys.situations, queryFn: api.listSituations, staleTime: Infinity });
}

/** All the reference ranges (they only change with a seed migration). */
export function useDefaultRanges() {
  return useQuery({ queryKey: keys.defaultRanges, queryFn: api.listDefaultRanges, staleTime: Infinity });
}

/** All the user's custom ranges. */
export function useUserRanges() {
  return useQuery({ queryKey: keys.userRanges, queryFn: api.listUserRanges });
}

// Only a list that could not be loaded is an error: if a background refetch fails, the loaded data stays on screen.
const loadError = query => (query.data === undefined ? query.error : null) ?? null;

/**
 * Range used for training (ADR-0012): the custom one if it exists; otherwise, the reference one (PDF).
 * Exposes both for whoever needs to tell them apart (badges and the Explorer's Reset).
 * It comes from the two lists, shared with the Quiz and "Any" mode: neither one request per combination nor a 404
 * when the combination has no range yet (the individual GETs of the contract remain in the adapters).
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
    error: loadError(defaults) ?? loadError(users),
    refetchUserRange: users.refetch,
    refetch: () => Promise.all([defaults.refetch(), users.refetch()])
  };
}

/**
 * Effective ranges of all combinations (ADR-0012), for "Any" mode and hard hands:
 * `ranges` is a Map `situation@stack` → Range (the custom one prevails).
 */
export function useEffectiveRanges() {
  const defaults = useDefaultRanges();
  const users = useUserRanges();
  const ranges = useMemo(() => mergeEffectiveRanges(defaults.data, users.data), [defaults.data, users.data]);
  return {
    ranges,
    isLoading: defaults.isLoading || users.isLoading,
    error: loadError(defaults) ?? loadError(users),
    refetch: () => Promise.all([defaults.refetch(), users.refetch()])
  };
}

/** PUT with required `version`: 0 creates, N replaces version N (409 if it changed). */
export function useSaveUserRange(situation, stack) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payload => api.putUserRange(situation, stack, payload),
    onSuccess: data => {
      // The PUT response is the saved range: the list is updated right away and then revalidated.
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

/** Records an answer ({ situation, stack, hand, given }); the server grades it and returns the attempt. */
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

/** Attempt history paginated by cursor (from most recent to oldest). */
export function useAttempts(filters = {}) {
  return useInfiniteQuery({
    queryKey: [...keys.attempts, filters],
    queryFn: ({ pageParam }) => api.listAttempts({ ...filters, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: page => page.nextCursor ?? undefined
  });
}

/** Rows aggregated by (situation, stack, hand) for the study policy of domain/stats.js. */
export function useHandStats(filters = {}) {
  return useQuery({ queryKey: keys.handStats(filters), queryFn: () => api.getHandStats(filters) });
}

/**
 * Attempts and correct answers per day (only days with activity), as `{ days, rows }`. When the period changes it keeps
 * the previous data (`isPlaceholderData`) so the chart does not flicker while reloading; `days` is the period of those
 * rows, not the one being loaded, so the chart keeps its own axis meanwhile.
 */
export function useProgress({ days = 30, tz = 'UTC' } = {}) {
  return useQuery({
    queryKey: keys.progress({ days, tz }),
    queryFn: async () => ({ days, rows: await api.getProgress({ days, tz }) }),
    placeholderData: keepPreviousData
  });
}

/**
 * True while some query has been loading for longer than `delayMs`: the free API instance is probably waking up
 * (ADR-0018), and the shell says so instead of leaving the page on a silent spinner.
 */
export function useSlowRequests(delayMs = 4000) {
  const fetching = useIsFetching() > 0;
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    if (!fetching) return undefined;
    const timer = setTimeout(() => setElapsed(true), delayMs);
    return () => {
      clearTimeout(timer);
      setElapsed(false);
    };
  }, [fetching, delayMs]);
  return fetching && elapsed;
}

/** The landing page's sample data: bundled with the web, so it needs neither an account nor the API (ADR-0022). */
export function useShowcase() {
  return useQuery({ queryKey: ['showcase'], queryFn: loadShowcase, staleTime: Infinity });
}
