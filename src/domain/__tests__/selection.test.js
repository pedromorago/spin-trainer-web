import { describe, expect, it } from 'vitest';
import { ANY, comboKey, matchingCombos, pickCombo, resolveSelection, stackOptions } from '../selection';

const CATALOG = [
  { key: 'btn_open', stacks: [25, 20, 15] },
  { key: 'bb_vs_btn_mr_sb_3bet', stacks: [25, 12.5, 10] },
  { key: 'hu_bb_vs_os', stacks: [20, 8] }
];

describe('stackOptions', () => {
  it('devuelve los stacks de la situación', () => {
    expect(stackOptions(CATALOG, 'hu_bb_vs_os')).toEqual([20, 8]);
  });

  it('con ANY devuelve la unión sin duplicados, de mayor a menor', () => {
    expect(stackOptions(CATALOG, ANY)).toEqual([25, 20, 15, 12.5, 10, 8]);
  });

  it('situación desconocida no ofrece stacks', () => {
    expect(stackOptions(CATALOG, 'nope')).toEqual([]);
  });
});

describe('resolveSelection', () => {
  it('acepta una selección válida, con el stack como string de la URL', () => {
    expect(resolveSelection(CATALOG, { situation: 'bb_vs_btn_mr_sb_3bet', stack: '12.5' }))
      .toEqual({ situationKey: 'bb_vs_btn_mr_sb_3bet', stack: 12.5 });
  });

  it('sin parámetros usa la situación por defecto y su primer stack', () => {
    expect(resolveSelection(CATALOG, {})).toEqual({ situationKey: 'btn_open', stack: 25 });
  });

  it('sin la situación por defecto en el catálogo usa la primera', () => {
    expect(resolveSelection(CATALOG.slice(1), { situation: 'nope' }).situationKey).toBe('bb_vs_btn_mr_sb_3bet');
  });

  it('stack no ofrecido por la situación cae a su primer stack', () => {
    expect(resolveSelection(CATALOG, { situation: 'hu_bb_vs_os', stack: '25' })).toEqual({ situationKey: 'hu_bb_vs_os', stack: 20 });
  });

  it('admite ANY en situación y en stack', () => {
    expect(resolveSelection(CATALOG, { situation: ANY, stack: ANY })).toEqual({ situationKey: ANY, stack: ANY });
    expect(resolveSelection(CATALOG, { situation: 'btn_open', stack: ANY })).toEqual({ situationKey: 'btn_open', stack: ANY });
    expect(resolveSelection(CATALOG, { situation: ANY, stack: '12.5' })).toEqual({ situationKey: ANY, stack: 12.5 });
  });

  it('con situación ANY y stack inválido o ausente, el stack es ANY', () => {
    expect(resolveSelection(CATALOG, { situation: ANY })).toEqual({ situationKey: ANY, stack: ANY });
    expect(resolveSelection(CATALOG, { situation: ANY, stack: '7' })).toEqual({ situationKey: ANY, stack: ANY });
  });

  it('catálogo vacío → null', () => {
    expect(resolveSelection([], { situation: 'btn_open' })).toBeNull();
  });
});

describe('matchingCombos', () => {
  it('una selección concreta es una sola combinación', () => {
    expect(matchingCombos(CATALOG, { situationKey: 'btn_open', stack: 20 })).toEqual([{ situation: 'btn_open', stack: 20 }]);
  });

  it('stack ANY: todos los stacks de la situación', () => {
    expect(matchingCombos(CATALOG, { situationKey: 'hu_bb_vs_os', stack: ANY }).map(comboKey)).toEqual(['hu_bb_vs_os@20', 'hu_bb_vs_os@8']);
  });

  it('situación ANY y stack concreto: las situaciones que tienen ese stack', () => {
    expect(matchingCombos(CATALOG, { situationKey: ANY, stack: 25 }).map(comboKey)).toEqual(['btn_open@25', 'bb_vs_btn_mr_sb_3bet@25']);
  });

  it('ANY en ambos: todo el catálogo', () => {
    expect(matchingCombos(CATALOG, { situationKey: ANY, stack: ANY })).toHaveLength(8);
  });
});

describe('pickCombo', () => {
  const combos = matchingCombos(CATALOG, { situationKey: ANY, stack: 25 });

  it('es determinista con un rng fijo', () => {
    expect(pickCombo(combos, () => 0)).toEqual({ situation: 'btn_open', stack: 25 });
    expect(pickCombo(combos, () => 0.99)).toEqual({ situation: 'bb_vs_btn_mr_sb_3bet', stack: 25 });
  });

  it('evita repetir la combinación excluida si hay alternativa', () => {
    expect(pickCombo(combos, () => 0, { situation: 'btn_open', stack: 25 })).toEqual({ situation: 'bb_vs_btn_mr_sb_3bet', stack: 25 });
    expect(pickCombo([combos[0]], () => 0, combos[0])).toEqual(combos[0]);
  });

  it('sin combinaciones → null', () => {
    expect(pickCombo([], () => 0)).toBeNull();
  });
});
