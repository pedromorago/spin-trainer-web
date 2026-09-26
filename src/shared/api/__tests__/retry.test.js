import { describe, expect, it } from 'vitest';
import { ApiError } from '../errors';
import { MAX_RETRIES, retryDelay, shouldRetry } from '../retry';

describe('shouldRetry', () => {
  it('reintenta lo transitorio (sin conexión, 502, 503, 504) hasta el máximo', () => {
    for (const status of [0, 502, 503, 504]) expect(shouldRetry(0, new ApiError(null, status))).toBe(true);
    expect(shouldRetry(MAX_RETRIES - 1, new ApiError(null, 503))).toBe(true);
    expect(shouldRetry(MAX_RETRIES, new ApiError(null, 503))).toBe(false);
  });

  it('una respuesta de la API (400, 404, 409, 422, 500) no se reintenta', () => {
    for (const status of [400, 404, 409, 422, 500]) expect(shouldRetry(0, new ApiError(null, status))).toBe(false);
    expect(shouldRetry(0, new Error('boom'))).toBe(false);
  });
});

describe('retryDelay', () => {
  it('dobla desde 1 s y se queda en 15 s: unos 75 s en total, lo que tarda en despertar la instancia gratuita', () => {
    const delays = Array.from({ length: MAX_RETRIES }, (_, i) => retryDelay(i));
    expect(delays).toEqual([1000, 2000, 4000, 8000, 15000, 15000, 15000, 15000]);
    expect(delays.reduce((a, b) => a + b, 0)).toBe(75000);
  });
});
