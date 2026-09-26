import { describe, expect, it } from 'vitest';
import { ACTIONS, ACTION_LABELS, fallbackAction, isValidAction } from '../actions';

describe('fallbackAction', () => {
  it('es FOLD cuando la situación permite foldear', () => {
    expect(fallbackAction(['ALLIN', 'CALL', 'FOLD'])).toBe('FOLD');
  });

  it('es CHECK cuando FOLD no está entre las acciones (BB vs limp)', () => {
    expect(fallbackAction(['ALLIN', 'ISO_C', 'CHECK'])).toBe('CHECK');
  });
});

describe('isValidAction', () => {
  it('solo acepta acciones de la situación', () => {
    expect(isValidAction('ALLIN', ['ALLIN', 'FOLD'])).toBe(true);
    expect(isValidAction('LIMP', ['ALLIN', 'FOLD'])).toBe(false);
  });
});

describe('catálogo', () => {
  it('toda acción tiene etiqueta', () => {
    expect(ACTIONS).toHaveLength(19);
    for (const a of ACTIONS) expect(ACTION_LABELS[a]).toBeTruthy();
  });
});
