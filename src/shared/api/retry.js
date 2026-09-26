// retry.js — which failed queries are retried, and how long to wait (ADR-0018).
// The API runs on a free instance that sleeps when idle and takes up to about a minute to wake: the first queries of a
// session may find no server, a gateway error or the host's waiting page. Only those are retried; a validation or
// not-found error is an answer and is shown at once. Writes are never retried (a POST is not idempotent).

export const MAX_RETRIES = 8;

export function shouldRetry(failureCount, error) {
  return failureCount < MAX_RETRIES && error?.isTransient === true;
}

/** 1, 2, 4, 8 s and then every 15 s: about 75 s in total, what a sleeping free instance needs to answer. */
export function retryDelay(attempt) {
  return Math.min(1000 * 2 ** attempt, 15_000);
}
