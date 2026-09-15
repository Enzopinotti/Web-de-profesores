# GitHub Pages cutover — 2026

## Purpose

Move the public `Web-de-profesores` project page from the historical repository-root deployment to the generated 2026 application under `modern/dist`, without rewriting or deleting the 2023 source.

## Production authority

Expected public URL:

`https://enzopinotti.github.io/Web-de-profesores/`

Expected Vite base path:

`/Web-de-profesores/`

Historical baseline / rollback reference:

`d6a38f5795569131ff4cd0db63640aff8dc09007`

Product/foundation merge before cutover:

`0931236878ea12a4c019669951b3eb2dc3fc82db`

## State discovered before cutover

Repository metadata reports GitHub Pages enabled.

After merging the modern application, GitHub automatically started the dynamic `pages build and deployment` workflow using the Jekyll build image. That behavior proves Pages is still configured for **branch-based publication from `main`**.

Therefore the historical root remains the current publication source until the Pages source is switched to **GitHub Actions**.

This distinction is intentional: the modern application is already in `main`, but production authority has not changed yet.

## Versioned deployment workflow

`.github/workflows/pages-deploy.yml` builds and uploads only `modern/dist`.

Pinned actions:

- `actions/checkout` — `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09`;
- `pnpm/action-setup` — `0977fd99725f1db4007ccb2928dbb4e90d06cc86`;
- `actions/setup-node` — `a0853c24544627f65ddf259abe73b1d18a591444`;
- `actions/configure-pages` v6.0.0 — `45bfe0192ca1faeb007ade9deae92b16b8254a0d`;
- `actions/upload-pages-artifact` v5.0.0 — `fc324d3547104276b827a68afc52ff2a11cc49c9`;
- `actions/deploy-pages` v5.0.1 — `368f82528645a54fb793d4d04e342629a3f51346`.

The workflow uses:

- `contents: read`;
- `pages: write`;
- `id-token: write`;
- locked Node/pnpm authority already committed by the project;
- `pnpm install --frozen-lockfile`;
- production Vite build;
- artifact assertions before upload;
- the protected `github-pages` deployment environment.

## Artifact contract

Before upload the workflow requires:

- generated `index.html`;
- `robots.txt`;
- `sitemap.xml`;
- the exact production canonical authority in generated HTML;
- the exact production sitemap authority in `robots.txt`;
- no historical JPG/JPEG/JFIF tutor/background media inside the generated artifact.

The large 2023 assets remain in Git but are not part of production delivery.

## Administrative boundary

The `actions/configure-pages` action can read/configure Pages metadata, but changing or enabling the repository Pages source administratively requires permissions beyond the normal `GITHUB_TOKEN`.

The available connected GitHub integration does not expose a supported Pages-settings mutation. Therefore this document will not claim that **Settings → Pages → Source → GitHub Actions** has been changed until GitHub itself provides evidence through the custom deployment run/public endpoint.

If the first custom deployment fails because the repository is still configured for branch deployment, the required manual action is exactly:

1. open repository **Settings**;
2. open **Pages**;
3. under **Build and deployment → Source**, select **GitHub Actions**;
4. re-run `Deploy modern app to GitHub Pages`.

No code change or historical-root mutation is required for that switch.

## Production smoke contract

The cutover is not complete merely because `deploy-pages` succeeds.

The real public endpoint must then prove:

- HTTPS HTTP 200;
- title `Modderhouse — Workspace docente local`;
- modern shell text, including `100% local · sin cuentas`;
- bundled JS and CSS resolve under `/Web-de-profesores/`;
- canonical is the exact production URL;
- `robots.txt` resolves and points to the production sitemap;
- `sitemap.xml` contains exactly one production URL;
- no password field or historical login/registration form exists in the modern surface;
- representative student add/search/remove/reset behavior works in a real browser when browser smoke is available;
- no historical heavy tutor photograph or concrete-background image is requested by the modern page;
- representative mobile/tablet/desktop widths do not introduce horizontal overflow.

## Rollback

The deployment strategy preserves two independent rollback paths:

1. **Source rollback:** the complete 2023 implementation remains available from historical commit `d6a38f57…` and still exists in the repository tree after modernization.
2. **Pages-source rollback:** if the modern Pages artifact has a production defect, repository Settings can temporarily switch publication back to the historical branch source while a fix is prepared.

A rollback must not delete `modern/` or rewrite Git history.

## Completion criteria

The deployment lane is complete only when:

- the versioned Pages workflow is merged into `main`;
- its build artifact contract passes;
- a GitHub Pages deployment succeeds from that workflow;
- the public URL serves the modern application;
- production smoke passes;
- README and modernization documentation record the final evidence;
- issue #1 is updated and closed;
- the central portfolio roadmap/profile is synchronized.
