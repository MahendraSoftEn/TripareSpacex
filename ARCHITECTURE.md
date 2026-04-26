# SpaceX Mission Control Architecture

This project uses a feature-first `src` layout with shared horizontal layers for app-wide concerns.

## Principles

- Keep business logic close to the feature that owns it.
- Reserve top-level shared folders for cross-feature code only.
- Prefer typed boundaries between API, persistence, navigation, and UI.
- Compose screens from feature modules instead of placing logic directly in navigators.
- Keep global state minimal; server state belongs in React Query, local UI state belongs in Zustand or component state.

## Folder Guide

- `src/api`: shared HTTP client and API contracts.
- `src/db`: persistence abstractions and repositories.
- `src/store`: global app state with small focused stores.
- `src/hooks`: reusable cross-feature hooks.
- `src/screens`: route-level screen exports.
- `src/components`: shared presentational building blocks.
- `src/navigation`: navigator setup and route types.
- `src/utils`: framework-agnostic helpers and constants.
- `src/tests`: shared testing utilities and fixtures.
- `src/features`: vertical feature slices that own their UI, hooks, API orchestration, and models.

## Scale Rules

- Add new product work under `src/features/<feature-name>`.
- Promote code to a top-level shared folder only after at least two features need it.
- Keep files small and explicit; avoid giant `index.ts` barrels that hide ownership.
- Put side effects in hooks, services, or repositories instead of screen components.
