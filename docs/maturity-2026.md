# Modderhouse 2026 — maturity record

## Purpose

This document records the product-maturity phase tracked in issue #5.

The repository intentionally keeps two truths at once:

1. the 2023 course project remains preserved as historical evidence;
2. the 2026 application is allowed to become substantially more reliable, understandable and usable.

The second truth does not rewrite the first one.

## Maturity is not dependency count

The guiding question for this phase is:

> Does this change solve a real limitation in use, safety, recovery, understanding or maintenance?

That rule is why this phase adds backup/restore, explicit recovery, editing, undo and neutral summaries, while still not adding React, a backend, a database, authentication infrastructure, Docker, analytics or AI.

Those technologies may be valid in other products. They are not maturity by themselves here.

## Version boundary

### Historical authority

Baseline:

`d6a38f5795569131ff4cd0db63640aff8dc09007`

The original root files remain the source evidence for the 2023 submission.

### Current authority

The maintained application lives in `modern/`.

It does not claim that the old password flow was secure, and it does not reuse it as present-day authentication.

## Data continuity

The largest maturity gap after the first reconstruction was data durability.

The application is deliberately local-only, so browser storage is not merely a cache: for the user it is the primary copy. That makes recovery and portability product requirements.

### Backup format

Current format:

```text
format: modderhouse.student-backup
version: 1
```

The JSON envelope contains:

- explicit format identifier;
- format version;
- export timestamp;
- validated students with stable IDs.

It intentionally contains no credentials, account information or hidden application state.

### Import policy

Import is atomic.

The application rejects the whole operation when the selected file has:

- invalid JSON;
- another format;
- an unsupported backup version;
- malformed students;
- grades outside 0–10;
- duplicate students inside the same backup;
- an ID collision that points to a different student during merge.

There are exactly two user-selected modes:

- **replace** — the imported list becomes the current list;
- **merge** — valid new students are appended while normalized identity duplicates are skipped.

There is no implicit or heuristic merge mode.

## Store recovery

Before this phase, an invalid current storage payload could be interpreted as an empty list by the UI. That loses an important distinction:

- "there are no students";
- "there may be students, but the current application cannot read the data".

The storage adapter now reports explicit states:

- empty;
- ready;
- recovery needed because JSON is corrupt;
- recovery needed because the version is unsupported;
- recovery needed because the schema is invalid.

When recovery is needed:

- the raw payload is not overwritten;
- normal student writes are disabled;
- the user can download the raw payload;
- a valid backup can replace it;
- merge is disabled because merging into unknown unreadable state would be unsafe;
- discarding the unreadable store requires an explicit confirmation.

## Editing

Editing now preserves the stable student ID.

The edit flow reuses the same validation contract as creation and applies duplicate detection while excluding the record being edited.

Canceling edit:

- clears the draft;
- restores create mode;
- does not write storage.

This removes the previous delete-and-recreate workaround.

## Reversible operations

The application keeps one in-memory undo snapshot for the latest meaningful mutation that benefits from reversal.

Currently this includes:

- individual deletion;
- editing;
- clearing the complete list;
- restoring a backup when the previous store was readable.

This is deliberately a one-step session-level undo, not an event-sourcing or history subsystem.

The snapshot is written back through the normal storage adapter when restored.

## Neutral student summary

The workspace now calculates:

- count;
- average grade;
- minimum grade;
- maximum grade.

It does **not** label students as passed/failed because no passing threshold belongs to the historical domain contract.

The visible list can be ordered by:

- surname/name;
- grade descending;
- grade ascending.

Ordering changes presentation only and never rewrites persisted student order.

## Historical discoverability

The current product links directly to the exact 2023 baseline commit.

This is preferred over copying or rewriting the old files into a fake "legacy" implementation because the commit is the precise historical artifact.

Historical tutors remain archive fixtures in the current UI and are explicitly not presented as active users or roles.

## Accessibility contract

The maturity additions preserve the existing accessibility baseline:

- visible labels;
- semantic form controls;
- keyboard-focus movement for edit/recovery confirmation;
- status/live-region feedback;
- inline destructive confirmations;
- no modal dependency;
- native file input and radio controls;
- disabled controls during recovery rather than silently ignoring actions.

## Responsive contract

The previous production qualification found and fixed a real 360 px overflow caused by grid/flex intrinsic minimum sizing.

The maturity UI must preserve the same browser contract at representative widths:

- 360 px;
- 768 px;
- 1440 px.

New maturity surfaces use zero-minimum grid tracks and stack their controls on narrow widths rather than hiding overflow.

## Testing strategy

The tests focus on behavior and invariants rather than a coverage percentage.

Domain/storage tests cover:

- student validation;
- duplicate normalization;
- editing with stable identity;
- sort modes;
- neutral summaries;
- current-store inspection;
- historical migration;
- credential-key purge;
- backup round-trip;
- malformed files;
- unsupported versions;
- invalid student data;
- backup duplicates;
- merge behavior;
- ID conflicts.

UI tests cover:

- no current password/login surface;
- historical baseline discoverability;
- create/edit/cancel flows;
- duplicate protection while editing;
- search;
- summary rendering;
- presentation-only ordering;
- delete/reset undo;
- backup export;
- recovery blocking;
- recovery raw download;
- explicit recovery discard;
- restoring a valid backup out of recovery mode.

## Deliberate non-goals

This maturity phase still does not justify:

- real accounts;
- backend/API;
- database;
- multi-device sync;
- OAuth/JWT/Auth0;
- admin panel;
- permissions/roles;
- analytics;
- push notifications;
- AI;
- Docker/Kubernetes;
- a UI framework solely for appearance.

A future requirement may change that boundary. If so, it should be introduced as a new product decision, not retroactively called part of the original modernization.

## Deployment boundary

The repository currently has an important operational distinction:

- the historical root must remain preserved;
- the modern GitHub Pages workflow publishes `modern/dist`;
- GitHub has also been observed running the historical dynamic Pages/Jekyll pipeline on `main`.

The repository must not solve that conflict by rewriting the 2023 root. The final Pages authority decision belongs to issue #1 and `docs/deployment-cutover-2026.md`.

## Completion criteria

The maturity lane is complete when:

- data continuity contracts are green;
- edit/undo/summary/order contracts are green;
- README/docs match the real behavior;
- permanent quality passes on the final PR head;
- browser qualification confirms no regression at representative widths;
- the historical root remains outside the functional diff;
- no unjustified infrastructure was introduced.
