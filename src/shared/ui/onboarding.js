// Whether this browser has already seen the tour (ADR-0022). Per device on purpose: the demo has no account, and with
// accounts a new device is where a refresher helps.

export const TOUR_KEY = 'spin-trainer.tour';

/** Seen (finished or skipped)? If storage is blocked it cannot be remembered: then it counts as seen, never a nag. */
export function tourSeen(storage = globalThis.localStorage) {
  try {
    return storage ? storage.getItem(TOUR_KEY) !== null : false;
  } catch {
    return true;
  }
}

/** Remembers how it ended: 'done' (all the steps) or 'skipped'. */
export function markTourSeen(outcome, storage = globalThis.localStorage) {
  try {
    storage?.setItem(TOUR_KEY, outcome);
  } catch {
    // Storage blocked (private mode, quota): nothing to remember.
  }
}
