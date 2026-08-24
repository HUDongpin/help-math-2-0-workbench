# Browser QA record

Status: `PASS_FOR_INTERNAL_DESIGN_REVIEW_WITH_DECLARED_BOUNDARIES`

Verification date: 2026-08-12 (Asia/Taipei)

This result applies only to the standalone reconstruction package under this
directory. It confirms that the package is reproducible and inspectable and
that its current-contract derivative behaves as described below. It is not a
product, fidelity, acceptance, release, deployment, or publication verdict.

## Reconstruction and support-contract checks

### Deterministic replay

Two consecutive executions of:

```bash
node design/claude-ui-reconstructions/2026-08-08/recover-from-claude-sessions.mjs
```

produced the same eight page byte counts and SHA-256 values. A before/after
digest comparison reported no differences. The replay remained fail-closed on
its four explicitly identified Claude session ledgers and its hash-bound local
dependencies.

The seven historical-page dispositions remain deliberately narrow:

- Six pages are deterministic transcript-replay candidates. No surviving
  published-artifact SHA-256 is available to prove original-byte identity.
- The Grade 4 control-surface review is structurally recovered with a labeled
  replacement image. Claude's original 263,146-byte screenshot is missing.
- The eighth page is a new derivative of the recovered lesson player and the
  nine current support files. It is not represented as a historical Claude
  artifact.

### Focused support tests

From `apps/web/`, the three focused suites passed:

```bash
npx tsx --test \
  tests/whole-lesson-host-presentation.test.ts \
  tests/tutor-integration.test.ts \
  tests/reviewer-instrumentation.test.ts
```

Result: **40 tests passed, 0 failed**.

The application workspace type check also passed:

```bash
npm run typecheck --workspace @helpmath/web
```

These were read-only validations of the existing support inputs. The nine
untracked files under `apps/web/` were not edited by this reconstruction.

## Real-browser verification

The archive was served only on `127.0.0.1` and tested with Playwright 1.61.1
Chromium. The repeatable runner is `verify-static.mjs`; its dated machine
output is:

```text
output/playwright/claude-ui-reconstructions-2026-08-12/verify-static-results.json
```

Profiles:

- 1440×1000, light color scheme;
- 375×812 at 2× device scale, light color scheme;
- 1280×800, dark color scheme with reduced motion requested.

Final result: **102 assertions passed, 0 failed**.

### Archive and page availability

- The launcher returned HTTP 200 and exposed exactly eight catalog entries.
- Selecting every entry updated the active state, preview path, iframe, direct
  link, status copy, and URL hash as designed.
- Every reconstructed HTML page returned HTTP 200 when opened directly and
  rendered non-empty content.
- All eight direct pages produced zero JavaScript page errors, zero console
  errors, and zero external network requests during the check.
- The archive produced no horizontal overflow at desktop or 375px mobile
  width.
- The embedded current-contract preview uses the iframe's actual narrow layout
  viewport rather than a wide desktop viewport scaled into the mobile card.
- Its light, dark, and reduced-motion presentations rendered without console
  errors.

### Current-contract lesson player

- The player starts in Focus mode with Nova closed; the historical `Today`
  mode is removed from this derivative.
- The authored lesson plane preserves the declared 800×415 aspect ratio.
- Previous, Next, Play/Pause, Volume, and Replay controls produced their
  expected local state changes.
- Focus opens Nova as a non-modal desktop side region that pushes rather than
  covers the lesson plane.
- Study starts on `Read it`; its visible desktop reference region remains
  keyboard-accessible.
- Classroom opens the projector-scale bottom band and keeps the unused side
  chat out of navigation.
- Closing hidden support makes it both `inert` and `aria-hidden`; reopening it
  restores keyboard and accessibility navigation.
- The provider state says `Provider not configured`, the historical simulated
  conversation is absent, and microphone, camera, classroom microphone, and
  Send remain disabled.
- A question starter prepares a local draft. Enter cannot send the draft or
  synthesize a tutor reply.
- `Read it`, `Words`, and `Nova Tutor` support arrow/Home/End tab movement.
- The assessment boundary states that support scaffolds thinking and does not
  provide the answer.

### Mobile Nova modal

- The closed page has no horizontal overflow at 375px.
- Opening Nova creates a full-width, viewport-bounded `aria-modal` dialog and
  scrim; the lesson spine and stage become inert.
- Close receives initial focus. Forward and reverse Tab remain trapped in the
  dialog.
- Escape and the scrim both close Nova. Focus returns to `Ask Nova`, the page
  background becomes interactive again, and the hidden support region leaves
  keyboard/accessibility navigation.
- The page still has no horizontal overflow after repeated modal use.

### Automated accessibility scan

`@axe-core/playwright` reported **zero violations** in each checked state:

- archive launcher chrome, excluding its isolated historical-page preview;
- current-contract desktop, Focus closed;
- current-contract desktop, Focus/Nova open;
- current-contract mobile, Nova modal open.

This scan is evidence for those exact states, not an accessibility
certification of all content and interactions in every historical replay.

## Visual inspection

The following Playwright captures were rendered and inspected at original
resolution:

- `archive-launcher-desktop.png`
- `archive-launcher-mobile.png`
- `archive-launcher-dark.png`
- `support-contract-desktop-focus-open.png`
- `support-contract-mobile-modal.png`
- `identity-page-desktop.png`
- `g4-review-replacement-desktop.png`

They are stored under:

```text
output/playwright/claude-ui-reconstructions-2026-08-12/
```

Observed outcome:

- the launcher hierarchy, provenance tags, acceptance boundary, direct links,
  previews, and responsive one-column layout are legible;
- the current-contract desktop player preserves the lesson plane while giving
  Nova a distinct side region;
- the narrow-screen sheet remains within the viewport, keeps a visible Close
  control, and exposes the offline/assessment boundaries without covering its
  active controls;
- the regenerated identity presentation renders its logo and brand-system
  sections coherently;
- the Grade 4 review renders end to end, with the known replacement image
  visibly embedded. That rendering does not cure the recorded source mismatch
  or make its annotations exact for the replacement.

A second snapshot-first run through the Playwright command-line browser
confirmed the launcher and open Nova state and reported zero console messages.

## Final page digests

| Page | Bytes | SHA-256 |
|---|---:|---|
| `g4-ui-review.html` | 207,897 | `8f6f03527c48ec7942023de4cafd43347222a3e159f0efbe4a8223fdd72f5ed9` |
| `help-math-ui-geometry.html` | 9,778 | `11409c052231f879593173d84791bbf34bc94147cec7143c432a1968d16eec26` |
| `help-math-player.html` | 116,503 | `ad349ae9583d5b57bd9913ec90a6f8ec0462f2c493210991677ae6dcb6e2fe17` |
| `helpmath-2-ui.html` | 124,795 | `c206cf33fd9c23cdc8115fd21a82c2a5b275562fbc762bbb46639f3eed429860` |
| `helpmath-2-kids.html` | 105,691 | `f974f2d7a849c87d0b6cb1d68bb56da3dae845f244870594f788df1194b5a096` |
| `helpmath-2-soft.html` | 98,621 | `8b88726037856b6cb99aec0430cbc77088b905c17c18f16855d1b14a4c7ddf6c` |
| `helpmath-identity.html` | 130,456 | `ec098331947b4f63fd78480487b0080defa4f92d7dd9b78b974e699c01505e7d` |
| `help-math-player-support-contract.html` | 128,914 | `2b458a30907d9819d7b359771ee10f72444886c41309da07231218baa29562a5` |

`replay-results.json` and `reconstruction-manifest.json` are the
machine-readable authority for these values and for the hashes of the support
inputs, Claude session ledgers, and local dependencies.

## Acceptance boundary

This QA record does **not** establish any of the following:

- byte identity with Claude's previously published artifact payloads;
- integration into the current Next.js application;
- a working Nova provider or transmission of page, frame, draft, voice, photo,
  or learner data;
- privacy, security, COPPA/FERPA, retention, moderation, or school deployment
  approval;
- FLA/SWF source custody, original-runtime behavior, visual/runtime fidelity,
  or audio correctness;
- human visual acceptance, owner acceptance, strict completion, release
  authorization, deployment, or publication.
