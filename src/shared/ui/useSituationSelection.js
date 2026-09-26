import { useSearchParams } from 'react-router';
import { ANY, matchingCombos, resolveSelection, stackOptions } from '../../domain/selection';

/**
 * App-wide (situation, stack) selection. The URL is the only state: `?s=<key|any>&stack=<bb|any>`.
 * Missing or invalid values are normalized with domain/selection#resolveSelection.
 * When the situation changes, the stack is kept if the new one offers it.
 * Does not load data: receives the already resolved catalog (shared/ui does not import shared/api).
 */
export function useSituationSelection(situations = []) {
  const [params, setParams] = useSearchParams();
  const resolved = resolveSelection(situations, { situation: params.get('s'), stack: params.get('stack') });
  const situationKey = resolved?.situationKey ?? null;
  const stack = resolved?.stack ?? null;

  const update = (key, st) => setParams(prev => {
    const next = new URLSearchParams(prev);
    next.set('s', key);
    next.set('stack', String(st));
    return next;
  }, { replace: true });

  return {
    situationKey,
    stack,
    situation: situations.find(s => s.key === situationKey) ?? null,
    isAny: situationKey === ANY || stack === ANY,
    stacks: resolved ? stackOptions(situations, situationKey) : [],
    combos: resolved ? matchingCombos(situations, resolved) : [],
    setSituation: key => update(key, resolveSelection(situations, { situation: key, stack }).stack),
    setStack: st => update(situationKey, st)
  };
}
