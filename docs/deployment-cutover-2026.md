# GitHub Pages cutover — 2026

## Purpose

Make the 2026 Modderhouse workspace the stable public authority without deleting or rewriting the original 2023 project, even while GitHub keeps two Pages publication mechanisms active for this repository.

## Production authority

Public URL:

`https://enzopinotti.github.io/Web-de-profesores/`

Vite base path:

`/Web-de-profesores/`

Historical baseline:

`d6a38f5795569131ff4cd0db63640aff8dc09007`

Maintained product source:

`modern/`

Exact historical archive:

`historical/2023/`

## What production qualification discovered

The repository originally published the historical root through GitHub's dynamic `pages build and deployment` workflow. A custom Pages workflow was then added to publish `modern/dist`.

Both deployments could report success, but production smoke proved that this was not enough: the branch-based Pages deployment could finish after the custom deployment and replace the public endpoint with the historical root again.

This was observed after the maturity hotfix:

- custom Pages build/deploy succeeded;
- post-merge quality succeeded;
- the same production smoke waited 30 times against HTTP 200;
- it never detected the modern application bundle;
- therefore the public authority was still nondeterministic.

The fix is not to repeatedly redeploy until the desired workflow happens to finish last.

## Authority parity strategy

Until the repository Pages setting is administratively changed to a single custom-workflow source, **both publication mechanisms must resolve to equivalent 2026 entry content**.

The contract is now:

1. `modern/` remains the only maintained product source.
2. `pnpm build` generates `modern/dist`.
3. Repository-root deployment files are a generated mirror of that build:
   - `index.html`;
   - `robots.txt`;
   - `sitemap.xml`;
   - `.nojekyll`;
   - `assets/index-*.js`;
   - `assets/index-*.css`.
4. `pnpm pages:mirror:check` requires the root mirror to match `modern/dist` byte-for-byte.
5. The branch-source Pages mechanism can therefore publish the repository root without changing the public 2026 entrypoint.
6. The custom workflow still uploads `modern/dist` directly.

This removes deploy-order as a correctness condition.

## Historical preservation after root cutover

The original root can no longer remain the production entrypoint because branch-based Pages reads that same root.

Before replacing `index.html`, the entire 2023 baseline is recreated at:

`historical/2023/`

The archive is generated directly from:

`git archive d6a38f5795569131ff4cd0db63640aff8dc09007`

No historical file is redrawn, reformatted or recreated from memory.

A permanent quality check recalculates Git blob SHA-1 values for all 14 baseline files and compares them with the original blob IDs. This makes preservation testable rather than documentary only.

The commit itself remains the primary historical authority and rollback evidence.

## Security boundary for the archive

The 2023 archive intentionally preserves its original behavior, including the local DNI/email/password exercise. It is historical evidence, **not an authentication implementation**.

The maintained 2026 application:

- does not collect passwords;
- does not import historical `Usuarios` credentials;
- purges that legacy key when encountered;
- does not treat the archive as a current account system.

No user should enter real credentials into the historical version.

## Custom deployment workflow

`.github/workflows/pages-deploy.yml` builds the maintained application and uploads the production artifact.

Pinned actions:

- `actions/checkout` — `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09`;
- `pnpm/action-setup` — `0977fd99725f1db4007ccb2928dbb4e90d06cc86`;
- `actions/setup-node` — `a0853c24544627f65ddf259abe73b1d18a591444`;
- `actions/configure-pages` — `45bfe0192ca1faeb007ade9deae92b16b8254a0d`;
- `actions/upload-pages-artifact` — `fc324d3547104276b827a68afc52ff2a11cc49c9`;
- `actions/deploy-pages` — `368f82528645a54fb793d4d04e342629a3f51346`.

The workflow uses:

- `contents: read`;
- `pages: write`;
- `id-token: write`;
- locked Node/pnpm authority;
- frozen dependency installation;
- production Vite build;
- branch-source mirror verification;
- exact historical archive attachment;
- artifact assertions before upload;
- the `github-pages` deployment environment.

## Artifact contract

Before upload, the workflow requires:

- generated `index.html`;
- `robots.txt`;
- `sitemap.xml`;
- exact production canonical authority;
- exact sitemap authority;
- no historical JPG/JPEG/JFIF media in the maintained application surface;
- `historical/2023/index.html` present as preserved archive.

Historical media may exist only below the archived 2023 subtree and must not be requested by the current application.

## Permanent quality gate

`pnpm check` now ends with `pnpm pages:mirror:check` after a fresh production build.

That check proves:

- root `index.html` equals `modern/dist/index.html`;
- root `robots.txt` equals `modern/dist/robots.txt`;
- root `sitemap.xml` equals `modern/dist/sitemap.xml`;
- root generated JS/CSS filenames exactly match the fresh Vite build;
- generated asset bytes match;
- `.nojekyll` exists for direct branch publication;
- all 14 files under `historical/2023/` still match the Git blob IDs from `d6a38f57…`.

A future feature change that updates `modern/` without synchronizing the Pages mirror must fail quality instead of silently creating two production versions.

## Production smoke contract

A deployment is not complete because Actions is green.

The public endpoint must prove in a real browser:

- HTTPS HTTP 200;
- title `Modderhouse — Workspace docente local`;
- modern shell and continuity UI;
- no password/login surface;
- exact historical-baseline link;
- canonical, robots and sitemap authority;
- student creation;
- stable-ID editing;
- duplicate protection;
- search/sort/summary behavior;
- delete + undo;
- clear + undo;
- legacy `Usuarios` purge;
- explicit corrupted-store recovery;
- valid backup restore out of recovery;
- no historical heavy media requested by the current surface;
- no horizontal overflow at 360, 768 and 1440 px, including recovery state.

The same smoke that discovers a defect is rerun after the fix; the acceptance bar is not weakened after failure.

## Administrative simplification later

GitHub's Pages REST API supports switching `build_type` from `legacy` to `workflow`, but that mutation requires Pages write plus repository administration/manage-Pages permission. The connected GitHub integration does not expose that administrative mutation.

If the repository is later switched manually to **Settings → Pages → Build and deployment → Source → GitHub Actions**, the root mirror becomes a compatibility artifact rather than a second active publisher. It can then be removed in a dedicated change after production smoke proves the single-authority setup.

Until then, authority parity is intentional and tested.

## Rollback

Rollback paths are independent:

1. **Historical evidence:** exact commit `d6a38f57…`.
2. **Archived tree:** `historical/2023/`, verified byte-for-byte.
3. **Modern source rollback:** revert the modern feature/merge while preserving Git history.
4. **Deployment rollback:** redeploy a previously qualified modern artifact.

Rollback must never rewrite the 2023 commit or silently reintroduce historical credential handling into the 2026 app.

## Completion criteria

The lane can close only when:

- authority-parity changes are merged;
- permanent quality is green;
- both Pages paths have compatible entry content;
- custom Pages deployment succeeds;
- the public URL serves the 2026 workspace after all deployment activity settles;
- the full browser smoke passes;
- the historical archive passes blob-integrity checks;
- README/docs record final evidence;
- issues #1 and #5 are closed with evidence;
- the central portfolio roadmap/profile is synchronized.
