# Modderhouse — version map

This repository intentionally preserves two different stages of the same project.

## 2023 historical version

Canonical historical reference:

`d6a38f5795569131ff4cd0db63640aff8dc09007`

Repository snapshot:

`https://github.com/Enzopinotti/Web-de-profesores/tree/d6a38f5795569131ff4cd0db63640aff8dc09007`

Exact current-tree archive:

`historical/2023/`

The archive is recreated from the baseline with `git archive` and the permanent quality contract verifies the Git blob SHA-1 of all 14 files against the original commit. It is preserved as learning evidence, including the old browser-only credential simulation and its limitations.

It must not be described as secure authentication or silently rewritten to match 2026 practices.

## 2026 maintained version

Current source authority:

`modern/`

The maintained application keeps the original teaching-workspace idea but matures the implementation around explicit domain rules, local-data recovery, backup/restore, editing, reversible operations, accessibility, testing and reproducible delivery.

The 2026 version deliberately remains local-only while that remains the actual product requirement.

## Repository root after Pages cutover

The repository root is no longer a product-source authority. The following files are a generated compatibility mirror of `modern/dist`:

- `index.html`;
- `robots.txt`;
- `sitemap.xml`;
- `.nojekyll`;
- `assets/index-*.js`;
- `assets/index-*.css`.

This mirror exists because GitHub still has a legacy branch-based Pages publication path in addition to the custom workflow. `pnpm pages:mirror:check` requires the mirror to match a fresh Vite build byte-for-byte.

This distinction matters: editing the root mirror directly is not a product change. Product work belongs in `modern/`, then the mirror is regenerated.

## Why both versions remain

Keeping both stages makes the repository useful as a progression artifact:

- 2023 shows what was built while learning JavaScript, DOM, storage and `fetch`;
- 2026 shows how the same problem is approached after gaining engineering experience;
- the diff between them is part of the value of the repository;
- the production compatibility mirror does not erase or reinterpret either source authority.

The modernization program therefore treats historical preservation and current product maturity as complementary goals rather than mutually exclusive choices.

## Deployment note

Source preservation and public deployment are separate concerns.

The maintained Pages workflow publishes `modern/dist`. The legacy branch publisher sees the generated root mirror. Because both entry artifacts are tested for parity, deployment order no longer decides which product version appears at the public URL.

A future administrative switch to **Pages → Source → GitHub Actions** can remove the legacy publisher; until then, the parity contract remains intentional.
