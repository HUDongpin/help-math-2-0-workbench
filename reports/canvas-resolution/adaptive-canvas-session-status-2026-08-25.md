# HELP MATH Adaptive Canvas Session Status — 2026-08-25

This is a repository-safe summary of the local, hash-bound adaptive Canvas
engineering and browser evidence. It does not replace the full local receipts,
authorize `--apply`, activate a production profile, record Owner acceptance, or
establish a deployment or publication decision.

## Frozen engineering boundary

- Production scope: five existing Lessons, 284 source-ordered placements,
  283 unique page renderers, and one G4 L3 IR001 loaded-host Canvas surface.
- Batch plan: `work/adaptive-canvas-production-five.plan.v10.json`, SHA-256
  `db4b349f5863d3e4b784953aa5342d5499a38311fa268ce9a068f7e7b633d983`.
- Batch generator SHA-256:
  `496692ac8a2ba0a6a0cda91cf31ba4432c531682180e3d0e8e667e7336af4c5e`.
- Gate 0A regeneration-provenance receipt SHA-256:
  `d901badb154a562b97f102edb0a1ffd23fee67628254d8235a8814fcaac0ce8a`.
- Inactive production-binding SHA-256:
  `e3999ed5a22d2eb1eb422bdfc3b25fe10aff237f0eb5aceb0908bee1219a1b63`.
- v1 production-asset profile SHA-256:
  `ccd832025b2df2c69615872645944b5bcfab18628d4d69df71ea0341925f9eca`.

The Gate 0A receipt contains exactly 284 source-first records: 283 page
renderers and one loaded-host surface. It records zero advanced-manual or
unresolved records. Gate 0A completion remains separate from pixel fidelity,
performance, product acceptance, release, and publication.

## Backing and performance baselines

- v1 backing baseline receipt:
  `reports/canvas-resolution/baseline/v1-backing-compact-v3/v1-backing-baseline.v1.json`,
  SHA-256
  `a494c1cacefe888745cfd5255317f153a55fb88d8bd42ed488f7073c429743a6`.
- The backing baseline covers all 284 runtimes and 102,400 declared Current-JS
  render states.
- v1 performance baseline:
  `reports/canvas-resolution/performance/v1-baseline.json`, SHA-256
  `9db1fbd3e89e0a7fd1aa4f3c26eb5528a1297e0d03268d28ee93bd1e0196b07b`.

## Fresh Chromium result

The full local real-browser gate receipt is
`reports/canvas-resolution/verification/adaptive-v10-core-browser-v11/real-browser-gate-review.v1.json`,
SHA-256
`f669f0c9f82b5de3db64608ed1cf672b15d286af766657e2f30e1165ec2bc117`.

Its authoritative result is:

- status: `no-go`;
- pixel gate: `pass`;
- final k=1 parity failures: 0;
- k=2 native-downsample fidelity failures: 0;
- render-state failures: 0;
- maximum normalized RGB RMSE: 0.038159447284542965;
- first-ready failures: 0;
- Canvas context-loss failures: 0;
- performance gate: `no-go`;
- unique performance-failure runtimes: 52;
- apply authorization: false;
- official apply-class Chromium proof: withheld.

Performance failures by Lesson are G3 L2 = 16, G4 L3 = 8, G5 L3 = 8,
G5 L4 = 6, and G5 L5 = 14. The fixed thresholds were not relaxed.

An initial three-realm capture reported 3,751 k=1 orchestration anomalies on
five pages. A complete, isolated two-realm A/B replay of all 4,696 affected
states found zero fresh-v1 baseline drift, zero candidate k=1 drift, and zero
render-state mismatch. The final gate therefore records zero effective k=1
parity failures while preserving the raw first-pass evidence locally.

## Explicit non-release boundary

At this snapshot:

- `scripts/generate-adaptive-canvas-batch.mjs --apply` was not run;
- the 284 existing production inputs still match the v10 input byte and hash
  identities exactly;
- `apps/web/config/current-js-production-assets.v2.json` does not exist;
- no adaptive production binding is active;
- no official apply-class Chromium proof exists;
- no Preview or production deployment was created or promoted;
- no human visual, Owner, strict-completion, release, or publication status is
  advanced.

The full browser runtime receipts, representative PNG set, local immutable
`work/` receipts, and superseded capture iterations remain local evidence.
They are deliberately excluded from this Git snapshot because they total
hundreds of megabytes and many preserve machine-specific absolute toolchain
paths. Their hashes above remain the local integrity anchors; this summary does
not claim to make those local artifacts independently reconstructible from Git.

The next authorized engineering step is bounded performance remediation for
the exact 52 failing runtimes, followed by a fresh full 284-runtime performance
gate. It is not `--apply`, v2 activation, Preview, or production promotion.
