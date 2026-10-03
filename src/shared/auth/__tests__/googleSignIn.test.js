import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  forgetPending, GOOGLE_ERRORS, GOOGLE_RETURN_PATH, readGoogleAnswer, readPending, safeReturnPath, savePending,
  startGoogleSignIn
} from '../googleSignIn';

const memoryStorage = () => {
  const data = new Map();
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
};
const start = (returnPath = '/quiz?s=btn_open&stack=25') =>
  startGoogleSignIn({ clientId: 'client-1.apps.googleusercontent.com', origin: 'https://spin.example', returnPath });

describe('startGoogleSignIn', () => {
  it('sends the browser to Google for an ID token that comes back to this site', async () => {
    const { url } = await start();
    const target = new URL(url);

    expect(`${target.origin}${target.pathname}`).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(target.searchParams)).toMatchObject({
      client_id: 'client-1.apps.googleusercontent.com',
      redirect_uri: `https://spin.example${GOOGLE_RETURN_PATH}`,
      response_type: 'id_token',
      scope: 'openid email profile',
      prompt: 'select_account'
    });
  });

  it('gives Google the SHA-256 of the nonce it keeps, and the same state', async () => {
    const { url, pending } = await start();
    const params = new URL(url).searchParams;

    expect(params.get('nonce')).toBe(createHash('sha256').update(pending.nonce).digest('hex'));
    expect(params.get('state')).toBe(pending.state);
  });

  it('a new state and nonce every time, 32 random bytes, URL-safe', async () => {
    const starts = await Promise.all(Array.from({ length: 20 }, () => start()));
    for (const { pending } of starts) {
      expect(pending.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(pending.nonce).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
    expect(new Set(starts.map(s => s.pending.state)).size).toBe(20);
    expect(new Set(starts.map(s => s.pending.nonce)).size).toBe(20);
  });

  it('keeps where the user was going, only if it is a path of this app', async () => {
    expect((await start('/stats')).pending.returnPath).toBe('/stats');
    expect((await start('//evil.example')).pending.returnPath).toBe('/');
  });
});

describe('readGoogleAnswer', () => {
  const pending = { state: 'state-1', nonce: 'nonce-1', returnPath: '/quiz?s=btn_open&stack=25' };

  it('returns the ID token, with the nonce and the route this tab kept', () => {
    expect(readGoogleAnswer('#id_token=eyJ.a.b&state=state-1&authuser=0', pending))
      .toEqual({ token: 'eyJ.a.b', nonce: 'nonce-1', returnPath: '/quiz?s=btn_open&stack=25' });
  });

  it('tells a cancellation from Google failing', () => {
    expect(readGoogleAnswer('#error=access_denied&state=state-1', pending)).toEqual({ error: GOOGLE_ERRORS.cancelled });
    expect(readGoogleAnswer('#error=server_error', pending)).toEqual({ error: GOOGLE_ERRORS.failed });
  });

  it.each([
    ['another sign-in\'s state', '#id_token=eyJ.a.b&state=state-2', pending],
    ['no state', '#id_token=eyJ.a.b', pending],
    ['no token', '#state=state-1', pending],
    ['nothing started in this tab', '#id_token=eyJ.a.b&state=state-1', null],
    ['an empty answer', '', pending]
  ])('refuses %s: no session from an answer this tab did not ask for', (_name, hash, kept) => {
    expect(readGoogleAnswer(hash, kept)).toEqual({ error: GOOGLE_ERRORS.invalid });
  });

  it('never returns a route outside the app', () => {
    expect(readGoogleAnswer('#id_token=t&state=s', { state: 's', nonce: 'n', returnPath: 'https://evil.example' }).returnPath)
      .toBe('/');
  });
});

describe('the sign-in kept in this tab', () => {
  it('can be read again until it is forgotten', () => {
    const storage = memoryStorage();
    expect(savePending({ state: 's', nonce: 'n', returnPath: '/stats' }, storage)).toBe(true);

    expect(readPending(storage)).toEqual({ state: 's', nonce: 'n', returnPath: '/stats' });
    expect(readPending(storage)).toEqual({ state: 's', nonce: 'n', returnPath: '/stats' });
    forgetPending(storage);
    expect(readPending(storage)).toBeNull();
  });

  it('ignores anything that is not a sign-in it saved', () => {
    const storage = memoryStorage();
    storage.setItem('spin-trainer.google-sign-in', 'not json');
    expect(readPending(storage)).toBeNull();
    storage.setItem('spin-trainer.google-sign-in', JSON.stringify({ state: 1 }));
    expect(readPending(storage)).toBeNull();
  });

  it('with storage blocked, saving says so and reading finds nothing', () => {
    const denied = () => { throw new Error('denied'); };
    const blocked = { getItem: denied, setItem: denied, removeItem: denied };

    expect(savePending({ state: 's', nonce: 'n', returnPath: '/' }, blocked)).toBe(false);
    expect(readPending(blocked)).toBeNull();
    expect(() => forgetPending(blocked)).not.toThrow();
  });
});

describe('safeReturnPath', () => {
  it('keeps the paths of this app, with their query', () => {
    expect(safeReturnPath('/quiz?s=btn_open&stack=25')).toBe('/quiz?s=btn_open&stack=25');
  });

  it.each([
    ['protocol-relative', '//evil.example/quiz'],
    ['backslash host', '/\\evil.example'],
    ['absolute URL', 'https://evil.example'],
    ['script', 'javascript:alert(1)'],
    ['relative', 'quiz'],
    ['missing', null]
  ])('sends anything else (%s) to the start: no open redirect', (_name, value) => {
    expect(safeReturnPath(value)).toBe('/');
  });
});
