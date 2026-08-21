# HELP Math 2.0 Claude UI reconstruction archive

This package recreates the missing standalone HELP Math UI design pages made in Claude Code between August 6 and August 11, 2026. It is deliberately isolated from `apps/web/`; none of the dirty application implementation or the nine user-identified support files was edited.

Open `index.html` through a local HTTP server for the catalog, provenance labels, direct links, and isolated previews.

## Outcome

The package contains eight inspectable pages:

| Page | Disposition | What that means |
|---|---|---|
| `pages/help-math-player-support-contract.html` | `DERIVED_FROM_CURRENT_SUPPORT_FILES` | A new derivative of the recovered Claude lesson player. It adopts the later 800×415 presentation, offline/fail-closed Nova, mobile sheet, focus, assessment-scaffolding, and reviewer-boundary requirements. It is not an original Claude artifact. |
| `pages/help-math-player.html` | `DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE` | Replayed from Claude’s final complete Write plus four successful local source mutations. Its tracked embedded lesson image is hash-bound. The page preserves the historical prototype’s locally simulated Nova replies. |
| `pages/helpmath-2-ui.html` | `DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE` | Replayed from one complete Write, twenty successful Edits, and twenty-three successful Python source mutations through the final bilingual artifact publication. |
| `pages/helpmath-2-kids.html` | `DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE` | Replayed from one complete Write plus five successful Python source mutations. |
| `pages/helpmath-2-soft.html` | `DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE` | Replayed from one complete Write plus six successful Python source mutations. |
| `pages/helpmath-identity.html` | `DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE` | Regenerated from Claude’s recovered final builder and the ten surviving SVG inputs under `design/brand/`. |
| `pages/help-math-ui-geometry.html` | `DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE` | Replayed from its complete Write and two successful Edits. This was an unpublished intermediate geometry study. |
| `pages/g4-ui-review.html` | `STRUCTURALLY_RECOVERED_WITH_REPLACED_EMBED` | Its final source structure was replayed, but Claude’s original 263,146-byte embedded screenshot is gone. The package substitutes a same-project historical 1366×768 lesson capture and records the difference. |

“Deterministic transcript replay candidate” is intentionally narrower than “byte-identical original.” Claude’s session record retained the final artifact version identifiers but not SHA-256 values for the published HTML, and the remote artifacts are no longer available in the active Claude organization for comparison.

## Reconstruction authority

The primary recovery evidence is the complete local Claude Code JSONL history. The replayer:

1. Parses the full source session ledger.
2. Precomputes tool-call success/failure from `tool_result` records.
3. Preserves physical JSONL order and each message’s content-array order.
4. Treats each successful `Write` as a complete reset.
5. Requires every successful `Edit` match to be unambiguous and applies it literally.
6. Executes only explicitly scoped Python/Node source transformations inside a fresh temporary directory.
7. Skips historical deletion, copy, preview, server, browser, network, Artifact, and Git operations.
8. Hash-checks the tracked lesson image before embedding it.
9. Generates only the files under `pages/` and `replay-results.json`.

The current support files are a second, implementation-alignment evidence layer. They are the direct basis for `help-math-player-support-contract.html` and the browser acceptance checklist, not a substitute for the recorded HTML source history.

## Current support inputs

All nine files below existed and were untracked when reconstruction began on August 12, 2026. Their current contents may include work after Claude’s initial design session; each is hash-bound in `reconstruction-manifest.json`.

- `apps/web/lib/whole-lesson-host-presentation.ts`
- `apps/web/lib/tutor-integration.ts`
- `apps/web/lib/reviewer-instrumentation.ts`
- `apps/web/e2e/modern-wide-geometry.spec.ts`
- `apps/web/e2e/prototype-acceptance.spec.ts`
- `apps/web/e2e/canvas-sharpness.spec.ts`
- `apps/web/tests/whole-lesson-host-presentation.test.ts`
- `apps/web/tests/tutor-integration.test.ts`
- `apps/web/tests/reviewer-instrumentation.test.ts`

Those inputs establish or strongly constrain the following reconstruction behavior:

- `modern-wide` exposes the 800×415 authored content band cropped from the 800×600 source stage.
- Activation remains a fail-closed G4 L3 pilot choice, not a universal lesson default.
- The learner surface uses an eight-section spine, one transport group, and one progress display.
- Focus uses a non-occluding 290px Nova column on desktop and a focus-trapped modal sheet on narrow screens.
- Study uses one tabbed support region and starts on `Read it` at wide viewports.
- Classroom uses a full-width voice band, not a side chat.
- Nova has no configured provider; frame/context and drafts remain local and unsent.
- Voice, photo, and Send controls remain semantically and visibly disabled.
- `TI`, `TS`, and `FQ` receive scaffolding rather than answers.
- Nova and other assistance surfaces borrow and restore narration state instead of independently controlling it.
- Reviewer instrumentation is an explicit separate opt-in and is absent from the ordinary learner reconstruction.
- Canvas-backed content must not be visibly enlarged beyond its backing store.

## Rebuild

From the repository root:

```bash
node design/claude-ui-reconstructions/2026-08-08/recover-from-claude-sessions.mjs
```

The replayer fails closed if a required JSONL, source image, source SVG, Write/Edit match, or recorded dependency is missing or has drifted. It writes `replay-results.json` with candidate byte counts and SHA-256 values.

The historical Claude Code ledgers are private local recovery evidence and are not copied into this package.

## Preview

From the repository root:

```bash
python3 -m http.server 3212 \
  --bind 127.0.0.1 \
  --directory design/claude-ui-reconstructions/2026-08-08
```

Then open:

```text
http://127.0.0.1:3212/
```

The catalog previews each page in a sandboxed iframe. Use “Open full page” for full-window interaction and responsive testing.

## Known differences and historical behavior

### Grade 4 review screenshot

Claude’s missing `small-chromebook.png` was 263,146 bytes and yielded a 350,864-character base64 payload. It came from a 1366×768 browser capture of the then-current G4 L3 route, resized to a maximum dimension of 1200px. Neither the resized PNG nor its original capture survives locally.

This reconstruction uses:

```text
output/playwright/whole-lesson-responsive-transport-2026-07-29/g4-l3-desktop-1366x768.png
```

That replacement is a same-project historical lesson screenshot, but it is not the original Claude embed and the overlay annotations do not perfectly match it.

### Historical Nova simulation

`pages/help-math-player.html` preserves Claude’s original local scripted replies, microphone/photo simulations, and prototype copy because those are part of the deterministic transcript-replay candidate. They do not establish a live tutor provider or authorize that behavior for the product.

Use `pages/help-math-player-support-contract.html` when reviewing the current support contract. It removes fake provider behavior, makes the offline boundary explicit, prepares only local drafts, disables transmission controls, and adds the narrow-screen modal semantics.

### Identity inputs

The regenerated identity page embeds the current surviving SVG inputs. Their hashes are recorded in the manifest and their modification times predate the final recorded Claude identity publication. This supports deterministic regeneration but is not an independently published-artifact hash comparison.

## Acceptance boundary

The package is suitable for internal, inspectable design review. It does **not** establish:

- original published-artifact byte identity;
- integration into the current Next.js product;
- deployment or public availability;
- FLA/SWF source custody, original-runtime behavior, or Flash fidelity;
- audio correctness or acceptance;
- live Nova-provider delivery;
- privacy, COPPA/FERPA, retention, moderation, or production-data approval;
- human visual acceptance or owner acceptance;
- strict completion, release authorization, or publication.

See `QA.md` for the exact browser checks and `reconstruction-manifest.json` for machine-readable provenance.
