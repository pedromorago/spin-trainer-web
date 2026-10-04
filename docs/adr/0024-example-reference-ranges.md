# ADR-0024: Example reference ranges instead of a school's charts

Status: Accepted · Date: 2026-10-04 · Amends ADR-0006 and ADR-0012 (what the reference ranges are)

## Context
The reference ranges (ADR-0006) and the situation notes were transcribed from a Spin & Go school's charts, a document
that is not ours to publish. Since the app opened to other players (ADR-0019) and got a public landing page (ADR-0022),
anyone could read them: on the landing without an account, in the JavaScript bundled with the web, through the API with
any Google account, and in the three public repositories (the seed migrations, `reference-ranges.json` and its copies).
That exposes the school's work, and it rules out offering the trainer to any school, including that one.

Options considered:
- **Keep the charts behind sign-in**: anyone can sign in with Google, and the repositories would still publish them.
- **Nash push/fold ranges computed from scratch**: a real strategy that nobody owns, but a project of its own (an
  equilibrium solver for 3-max and HU), and push/fold does not cover the raise and limp spots.
- **Example ranges built by a public rule**: chosen.

## Decision
- **The reference ranges are examples.** The 169 hands are ranked by their all-in equity against a random hand (Monte
  Carlo with a fixed seed, so the ranking is always the same). Each spot lists bands of actions with their share of the
  1326 combos (`reference-ranges-recipe.json` in spin-trainer-api), filled in ranking order. Simple, reproducible and
  nobody's strategy. The app says so: the "Example" badge and its explanation, the landing and the tour. Any player can
  turn an example into their own range (ADR-0012).
- **No situation has notes**: they were the school's advice. The field stays in the contract.
- **Out of the repositories.** Migrations V2, V5, V7 and V8 are rewritten without the charts and notes. V9 loads the
  examples and replaces what a database already had, with version 2 for every reference range, so attempts graded
  against the first contents keep version 1. A database migrated with the first contents (production) has their
  checksums in Flyway's history. The API recognises them and repairs that history once before migrating
  (`RewrittenMigrations`); any other mismatch still stops the start.
- **A player's own charts stay theirs**, as custom ranges that only their account reads. The owner's charts were
  loaded once into the owner's account with an administrative SQL script kept outside the repositories: a one-off data
  load, like a migration. The app's data path is still the API (ADR-0003).

## Consequences
- The trainer is generic: a school's charts can become the reference ranges through a new migration (with the school's
  consent), or reach its players as custom ranges.
- Everything that checks the reference ranges follows the recipe:
  - `ExampleRangesTest`: the file matches the recipe.
  - `ReferenceSeedIT`: the database matches the file.
  - The web's `ranges:check` and spin-trainer-qa's oracles: the copies match.
- What players see changes: the landing's chart, the "Try a hand" answers, and the Quiz's expected actions for players
  without custom ranges. The owner keeps training against those charts.
- E2E (spin-trainer-qa): the hands the specs rely on come from the new ranges, and a test checks that the Explorer marks
  an example range as one and explains it.
