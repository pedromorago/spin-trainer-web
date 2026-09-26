import { describe, expect, it } from 'vitest';
import { actionIndexForKey, isInteractive, isTextField, shortcutKey } from '../shortcuts';

const el = (tagName, { role, editable = false } = {}) => ({ tagName, isContentEditable: editable, getAttribute: n => (n === 'role' ? role ?? null : null) });

describe('atajos del Quiz', () => {
  it('las diez primeras acciones tienen tecla: 1..9 y 0 para la décima', () => {
    expect([0, 1, 8, 9].map(shortcutKey)).toEqual(['1', '2', '9', '0']);
    expect(shortcutKey(10)).toBeUndefined();
  });

  it('cada tecla responde con su acción y solo si la situación la tiene', () => {
    expect(actionIndexForKey('1', 3)).toBe(0);
    expect(actionIndexForKey('3', 3)).toBe(2);
    expect(actionIndexForKey('4', 3)).toBe(-1);
    expect(actionIndexForKey('0', 10)).toBe(9);
    expect(actionIndexForKey('0', 9)).toBe(-1);
    expect(actionIndexForKey('a', 10)).toBe(-1);
    expect(actionIndexForKey('10', 10)).toBe(-1);
  });

  it('los campos de texto se quedan sus teclas', () => {
    expect(['INPUT', 'SELECT', 'TEXTAREA'].every(t => isTextField(el(t)))).toBe(true);
    expect(isTextField(el('DIV', { editable: true }))).toBe(true);
    expect(isTextField(el('BUTTON'))).toBe(false);
    expect(isTextField(null)).toBe(false);
  });

  it('Enter no pasa de mano si el foco está en algo que ya lo usa', () => {
    expect(['A', 'BUTTON', 'SUMMARY', 'INPUT'].every(t => isInteractive(el(t)))).toBe(true);
    expect(isInteractive(el('DIV', { role: 'button' }))).toBe(true);
    expect(isInteractive(el('BODY'))).toBe(false);
    expect(isInteractive(el('DIV', { role: 'status' }))).toBe(false);
    expect(isInteractive(undefined)).toBe(false);
  });
});
