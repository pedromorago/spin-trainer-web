import { useState } from 'react';
import { useSituations } from '../api/queries';

/** Estado compartido de (situación, stack) con corrección automática del stack al cambiar de situación. */
export function useSituationSelection(initialKey = 'btn_open') {
  const { data: situations = [], isLoading, error } = useSituations();
  const [situationKey, setSituationKey] = useState(initialKey);
  const [stack, setStackState] = useState(null);

  const situation = situations.find(s => s.key === situationKey) ?? null;
  const effectiveStack = situation && situation.stacks.includes(stack) ? stack : situation?.stacks[0] ?? null;

  const setSituation = key => { setSituationKey(key); setStackState(null); };
  const setStack = s => setStackState(s);

  return { situations, situation, situationKey, stack: effectiveStack, setSituation, setStack, isLoading, error };
}
