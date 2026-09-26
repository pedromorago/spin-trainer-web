import { describe, expect, it } from 'vitest';
import { ACTIONS } from '../../../domain/actions';
import { SITUATIONS } from '../../api/mock/situations';
import { ACTION_COLORS } from '../actionColors';

describe('ACTION_COLORS', () => {
  it('toda acción del catálogo tiene color', () => {
    for (const a of ACTIONS) expect(ACTION_COLORS[a], a).toBeTruthy();
  });

  it.each(SITUATIONS.map(s => [s.key, s.actions]))('%s: cada acción tiene un color distinto', (_key, actions) => {
    const colors = actions.map(a => ACTION_COLORS[a]);
    expect(new Set(colors).size).toBe(actions.length);
  });
});
