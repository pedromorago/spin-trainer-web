/**
 * How this build runs (VITE_API_MODE, ADR-0022):
 *  - http: the real API, with sign-in (production).
 *  - mock: the in-browser adapter, signed in as a test player who can switch (development and the E2E suite).
 *  - demo: the in-browser adapter with no sign-in at all: a public demo whose data stays in each browser.
 */
export const API_MODE = import.meta.env.VITE_API_MODE ?? 'http';
export const USES_MOCK_DATA = API_MODE === 'mock' || API_MODE === 'demo';
export const IS_DEMO = API_MODE === 'demo';
