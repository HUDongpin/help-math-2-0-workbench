# Session memory — Project handoff audit and Ruffle

Thread: `019f812b-1d50-7ad2-a69c-3685ee2fa7d4`

## Initial handoff audit

The project had been copied from another Mac as a deliberate snapshot. The
original export omitted `.git/`, `node_modules/`, and `.next/`; this was treated
as intentional, not corruption.

At the time of audit:

- the handoff manifest verified 204/204 entries;
- dependency installation, workbench checks, 21/21 tests, and the Next.js
  production build passed;
- a roughly 2.6 GB original HELP Math corpus was present beyond the handoff
  manifest;
- historical Conversion 1.2 and 1.4 implementations, screenshots, tests, and
  standalone packages existed, but the newer strict `migrations/` evidence
  packages had not yet been backfilled;
- therefore historical “high fidelity” output was not promoted to current
  strict completion.

## Ruffle installation

- Project web runtime: `@ruffle-rs/ruffle` 0.4.1 and self-hosted assets were
  already present and verified.
- macOS desktop runtime: official Ruffle 0.4.1 Universal app was installed at
  `/Applications/Ruffle.app`.
- The official archive hash, Developer ID signature, code integrity, and
  notarization were checked before installation.
- Ruffle web and desktop playback, terminal state, and Replay were tested.
- `.swf` association was registered with Ruffle through `duti`.

## Known Ruffle caveat

The official 0.4.1 macOS app did not declare the document types required for a
fully working Finder double-click flow. Launching and using Ruffle’s internal
Open File worked. The signed application was not modified to force the
association.

## Authority boundary

Ruffle can demonstrate compatibility and help inspect runtime behavior, but it
is not proof of original Flash fidelity. Preserve the exact Ruffle version in
any forensic record and prefer authorized original runtime or Animate Test
Movie evidence when strict behavior matters.

## Reverify on HELP MATH 2.0

- Current source manifest and corpus totals.
- Current Node/dependency/tool versions.
- Current project tests/build.
- Ruffle installation and route behavior.
- Whether historical migration gaps have since been closed.

