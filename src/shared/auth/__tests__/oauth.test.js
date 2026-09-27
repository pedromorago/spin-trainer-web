import { describe, expect, it } from 'vitest';
import {
  authErrorMessage, forgetReturnPath, OAUTH_ERRORS, parseOAuthCallback, readReturnPath, rememberReturnPath, safeReturnPath
} from '../oauth';

const memoryStorage = () => {
  const data = new Map();
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
};

describe('safeReturnPath', () => {
  it('keeps the paths of this app, with their query', () => {
    expect(safeReturnPath('/quiz?s=btn_open&stack=25')).toBe('/quiz?s=btn_open&stack=25');
    expect(safeReturnPath('/')).toBe('/');
  });

  it.each([
    ['protocol-relative', '//evil.example/quiz'],
    ['backslash host', '/\\evil.example'],
    ['absolute URL', 'https://evil.example'],
    ['script', 'javascript:alert(1)'],
    ['relative', 'quiz'],
    ['empty', ''],
    ['missing', null]
  ])('sends anything else (%s) to the start: no open redirect', (_name, value) => {
    expect(safeReturnPath(value)).toBe('/');
  });
});

describe('return path across the redirect', () => {
  it('can be read again until it is forgotten', () => {
    const storage = memoryStorage();
    rememberReturnPath('/stats', storage);

    expect(readReturnPath(storage)).toBe('/stats');
    expect(readReturnPath(storage)).toBe('/stats');
    forgetReturnPath(storage);
    expect(readReturnPath(storage)).toBe('/');
  });

  it('is sanitized when saved and when read', () => {
    const storage = memoryStorage();
    rememberReturnPath('//evil.example', storage);
    expect(readReturnPath(storage)).toBe('/');

    storage.setItem('spin-trainer.returnTo', 'https://evil.example');
    expect(readReturnPath(storage)).toBe('/');
  });

  it('falls back to the start when storage is blocked', () => {
    const denied = () => { throw new Error('denied'); };
    const blocked = { getItem: denied, setItem: denied, removeItem: denied };

    expect(() => rememberReturnPath('/quiz', blocked)).not.toThrow();
    expect(() => forgetReturnPath(blocked)).not.toThrow();
    expect(readReturnPath(blocked)).toBe('/');
  });
});

describe('parseOAuthCallback', () => {
  it('returns the PKCE code', () => {
    expect(parseOAuthCallback('?code=abc-123')).toEqual({ code: 'abc-123' });
  });

  it('tells a cancellation from a failure, in Spanish', () => {
    expect(parseOAuthCallback('?error=access_denied&error_description=The+user+denied')).toEqual({ error: OAUTH_ERRORS.cancelled });
    expect(parseOAuthCallback('?error=server_error&error_description=Unable+to+exchange')).toEqual({ error: OAUTH_ERRORS.failed });
  });

  it('an error wins over a code', () => {
    expect(parseOAuthCallback('?code=abc&error=server_error')).toEqual({ error: OAUTH_ERRORS.failed });
  });

  it('rejects a callback without code or error', () => {
    expect(parseOAuthCallback('')).toEqual({ error: OAUTH_ERRORS.invalid });
    expect(parseOAuthCallback('?code=')).toEqual({ error: OAUTH_ERRORS.invalid });
  });
});

describe('authErrorMessage', () => {
  it.each([
    ['Request rate limit reached', 'Demasiados intentos. Espera un momento y vuelve a probar.'],
    ['Failed to fetch', 'No hay conexión con el servidor de acceso. Vuelve a intentarlo.'],
    ['Something unexpected', 'No se ha podido entrar. Vuelve a intentarlo.']
  ])('"%s" reads "%s"', (message, expected) => {
    expect(authErrorMessage({ message })).toBe(expected);
  });

  it('no error, no message', () => {
    expect(authErrorMessage(null)).toBeNull();
  });
});
