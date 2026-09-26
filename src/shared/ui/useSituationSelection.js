import { useSearchParams } from 'react-router';

const DEFAULT_SITUATION = 'btn_open';

/**
 * Selección de (situación, stack) guardada en la URL: `?s=<key>&stack=<bb>`.
 * Valores ausentes o inválidos caen al default; cambiar de situación resetea el stack.
 * No carga datos: recibe el catálogo ya resuelto (shared/ui no importa shared/api).
 */
export function useSituationSelection(situations = []) {
  const [params, setParams] = useSearchParams();

  const situation = situations.find(s => s.key === params.get('s'))
    ?? situations.find(s => s.key === DEFAULT_SITUATION)
    ?? situations[0]
    ?? null;
  const requestedStack = Number(params.get('stack'));
  const stack = situation?.stacks.includes(requestedStack) ? requestedStack : situation?.stacks[0] ?? null;

  const update = (key, st) => setParams(prev => {
    const next = new URLSearchParams(prev);
    next.set('s', key);
    if (st == null) next.delete('stack'); else next.set('stack', String(st));
    return next;
  }, { replace: true });

  return {
    situation,
    situationKey: situation?.key ?? null,
    stack,
    setSituation: key => update(key, null),
    setStack: st => update(situation.key, st)
  };
}
