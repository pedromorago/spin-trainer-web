# ADR-0021: English everywhere

Status: Accepted · Date: 2026-09-27 · Replaces the workspace rule that put the UI, the API's error messages and the
test report in Spanish

## Context
The project started with a split: code, comments and documentation in English, and everything a person reads while
using or testing the app in Spanish (UI text, the API's error messages, test titles, Allure names and the Gherkin
features). Since ADR-0019 the app is open to any player who signs in with Google, and it is also a public portfolio.
Spanish now narrows both audiences, and the split meant two vocabularies for the same thing (range/rango,
hand/mano) across code, UI and tests.

## Decision
Everything is in English: the web's UI (including the privacy notice, now at `/privacy`; `/privacidad` redirects to
it), the data it shows (the situation notes, translated by migration V8, since applied migrations are never edited),
the API's error messages (Problem Details and validation), and the test report (test titles, Allure names, assertion
descriptions and the Gherkin features, `# language: en`). Poker terms stay as players write them (3-bet, iso, shove,
MR/F/F), and numbers use English conventions (`75%`, `27 Sep`).

It is rolled out in three reviewed steps: (A) the web and its data, (B) the API's messages, (C) the test report.

## Consequences
- One vocabulary from the database to the UI and the tests; the domain terms in code, UI and Gherkin are the same.
- Tests that locate elements by their accessible name or check a text change with the UI; the E2E page objects keep
  those names in one place.
- The web's HTML is `lang="en"`; the app no longer depends on the browser's language (the E2E suite still runs with a
  Spanish browser locale to prove it).
