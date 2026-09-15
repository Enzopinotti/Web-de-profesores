# Modderhouse — version map

This repository intentionally preserves two different stages of the same project.

## 2023 historical version

Canonical historical reference:

`d6a38f5795569131ff4cd0db63640aff8dc09007`

Repository snapshot:

`https://github.com/Enzopinotti/Web-de-profesores/tree/d6a38f5795569131ff4cd0db63640aff8dc09007`

The original root implementation remains auditable in the current repository as well. It is preserved as learning evidence, including the old browser-only credential simulation and its limitations.

It must not be described as secure authentication or silently rewritten to match 2026 practices.

## 2026 maintained version

Current source authority:

`modern/`

The maintained application keeps the original teaching-workspace idea but matures the implementation around explicit domain rules, local-data recovery, backup/restore, editing, reversible operations, accessibility, testing and reproducible delivery.

The 2026 version deliberately remains local-only while that remains the actual product requirement.

## Why both remain

Keeping both stages makes the repository useful as a progression artifact:

- 2023 shows what was built while learning JavaScript, DOM, storage and `fetch`;
- 2026 shows how the same problem is approached after gaining engineering experience;
- the diff between them is part of the value of the repository.

The modernization program therefore treats historical preservation and current product maturity as complementary goals rather than mutually exclusive choices.

## Deployment note

Source preservation and public deployment are separate concerns.

The historical root must not be modified merely to satisfy a hosting provider. The maintained Pages workflow builds `modern/dist`; the remaining Pages-source authority question is tracked in issue #1 and `docs/deployment-cutover-2026.md`.
