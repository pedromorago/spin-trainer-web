# ADR-0001: Three repositories: web, api and qa

Status: Accepted · Date: 2026-09-26

## Context
The project is both a product and a QA portfolio. A credible testing portfolio needs a suite that is independent of the code it tests, as in professional teams.

## Decision
Separate repos: spin-trainer-web, spin-trainer-api and spin-trainer-qa. The OpenAPI spec is published from the api repo as a versioned artifact.

## Consequences
More CI overhead and contract versioning. In return, the QA suite demonstrates genuine black-box testing, and each repo has its own pipeline and its own quality gate in SonarCloud.
