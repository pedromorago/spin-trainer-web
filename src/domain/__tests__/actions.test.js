import { describe, expect, it } from 'vitest';
import { ACTIONS, ACTION_DESCRIPTIONS, ACTION_LABELS, GLOSSARY, fallbackAction, isValidAction } from '../actions';

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
    expect(ACTIONS).toHaveLength(18);
    for (const a of ACTIONS) expect(ACTION_LABELS[a]).toBeTruthy();
  });
});

describe('glossary', () => {
  it('explains every action, in a sentence of its own', () => {
    expect(Object.keys(ACTION_DESCRIPTIONS)).toEqual(ACTIONS);
    for (const action of ACTIONS) {
      expect(ACTION_DESCRIPTIONS[action], action).toMatch(/^[A-Z0-9].*\.$/);
      expect(ACTION_DESCRIPTIONS[action], action).not.toBe(ACTION_LABELS[action]);
    }
  });

  it('defines each abbreviation the labels use', () => {
    const terms = GLOSSARY.map(([term]) => term);
    expect(terms).toEqual(['MR', '3b / 4b', 'AI', 'Iso', 'L / C / F', 'BB']);
    for (const [, meaning] of GLOSSARY) expect(meaning.length).toBeGreaterThan(3);
  });
});

