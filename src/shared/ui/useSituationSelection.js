import { useSearchParams } from 'react-router';
import { ANY, matchingCombos, resolveSelection, stackOptions } from '../../domain/selection';

/**
 * Selección de (situación, stack) de toda la app. La URL es el único estado: `?s=<key|any>&stack=<bb|any>`.
 * Valores ausentes o inválidos se normalizan con domain/selection#resolveSelection.
 * Al cambiar de situación se conserva el stack si la nueva lo ofrece.
 * No carga datos: recibe el catálogo ya resuelto (shared/ui no importa shared/api).
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
