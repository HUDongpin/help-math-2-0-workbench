# Fidelity Validation

Use native-size deterministic captures and pair quantitative comparison with visual inspection. A low aggregate error can still hide a wrong formula, button, or event frame.

## Contents

- Capture protocol and runtime identity
- Deterministic implementation capture
- Requirement authority and trace proof
- Full-domain capture and comparison
- Pixel thresholds and visual review
- Interaction, responsive, and evidence records

## Capture Protocol

Keep these values identical between baseline and implementation:

- Native stage width and height.
- Device scale factor, normally `1` for pixel comparison.
- Background color and transparency.
- Font/glyph source and loading state.
- One-indexed frame number and the timeline/frame domain that owns it.
- Requirement ID, reachable trace ID, deterministic seed, language, and the
  canonical entry-state SHA-256.
- Cropping rectangle and page padding.

Record these separately instead of pretending they are identical:

- Authorized original-runtime ID, name, version, executable/toolchain receipt, host, and capture method.
- Implementation browser, browser version, operating system, renderer/backend, and capture-tool version.
- Ruffle version and renderer when a forensic reference was used.

The baseline and implementation normally use different runtimes. Ruffle is never the authority field for strict original-runtime evidence.

Use these keyframes for teaching-beat and transition spot review:

- Frame 1.
- Start and end of every tween or morph.
- Boundary frames where layers overlap, appear, or disappear.
- Every text, number, formula, language, or counter change.
- Every interaction state.
- Final frame and Replay state.

Use filenames such as `frame-001.png`, `frame-025.png`, and `frame-109.png` in both baseline and implementation directories. These spot checks do not replace complete one-indexed coverage for a strict coverage-v2 requirement.

## Deterministic Implementation Capture

Expose non-production-affecting capture parameters such as
`?frameDomain=root&requirementId=req-default-root-en&trace=default-root-en&entryStateSha256=<sha256>&frame=25&scenario=default&lang=en&seed=0`.
They must derive the same state as normal playback and freeze the exact requested
state. The stage wrapper must report matching `data-flash-frame`,
`data-flash-frame-domain`, `data-flash-requirement-id`, `data-flash-trace-id`,
`data-flash-entry-state-sha256`, `data-animation-id`, and runtime
scenario/language/seed attributes; capture fails on any mismatch.
For a multi-domain module, the pure frame state must also report the requested
frame domain. A host wrapper that says `root` while the renderer returns a
nested MovieClip state is a capture failure, not a root-domain implementation.

`runtime.frameCount` always describes the SWF root timeline. A nested MovieClip
uses its own declared frame domain and instance entry state. Do not use a root
standalone capture, a direct-seek probe, Ruffle output, or the JavaScript rewrite
itself as proof of an original-runtime natural trace in a nested domain.

Authority is selected per requirement, not merely per SWF. A linear root-only
visual requirement may use an authorized original-runtime, frame-accurate
direct-seek or Rewind-plus-sequential-step baseline. Every nested requirement and every interactive scenario,
including an interactive scenario on the root timeline, requires a natural
original-runtime trace. Frame positioning establishes frame appearance only; it does
not establish buttons, navigation, scoring, terminal behavior, or Replay.

Before accepting a declared frame-domain set, validate the conventional
`audit/frame-domain-disposition.json` artifact against the current manifest and
scenario inventory. Every root-reachable source timeline must have an
evidence-backed final disposition. An `unresolved` timeline blocks strict
acceptance, even if all currently declared domains have images.

Each coverage-v2 requirement also has a conventional, hash-indexed trace
specification under `audit/trace-specs/`. Linear root direct-seek specifications
must prove every requested/observed root frame. Natural specifications must
contain a source-evidenced ordered event schedule, exact source targets,
pre/post checkpoints, terminal semantics, and a separately hash-chained
execution report from the authorized original runtime. Merely repeating a
requirement ID, trace ID, or SHA-256 is not execution evidence.

Run:

```bash
npm run capture:keyframes -- \
  --id formula-elementary-conversion-01-02 \
  --url http://127.0.0.1:3000/animations/formula-elementary-conversion-01-02 \
  --frame-domain root \
  --requirement-id req-default-root-en \
  --trace default-root-en \
  --entry-state-sha256 <canonical-entry-state-sha256> \
  --scenario default --lang en --seed 0 \
  --frames 1,5,10,19,25,35,49,55,68,75,88,100,109 \
  --output migrations/Conversion_1_2/evidence/implementation
```

For complete current-JavaScript requirement capture, run:

```bash
npm run capture:coverage-v2 -- \
  --id formula-elementary-conversion-01-02 \
  --base-url http://127.0.0.1:3000
```

Use `--check` first when validating the capture plan. The command captures the JavaScript candidate only and cannot create original-runtime authority, RMSE acceptance, audio acceptance, human review, owner acceptance, strict completion, or release state.

Before a large capture, verify the target volume is writable and has enough free capacity for both native PNG sets, comparison outputs, manifests, logs, and retained archives. Write implementation output only below the designated fresh `output/playwright` root. Keep canonical original-runtime evidence in its protocol-defined, append-only location.

## Full-Domain Comparison

Key every strict pair by the exact coverage requirement. Compare complete hash-bound manifests:

```bash
npm run compare:full-frames -- \
  --id formula-elementary-conversion-01-02 \
  --baseline <authoritative-original-runtime-directory> \
  --implementation <current-js-directory> \
  --requirement-id <requirement-id> \
  --frame-domain <frame-domain-id> \
  --trace <trace-id> \
  --entry-state-sha256 <entry-state-sha256> \
  --baseline-authority <original-runtime-authority> \
  --baseline-manifest <baseline-manifest.json> \
  --implementation-manifest <implementation-manifest.json>
```

The comparator writes diffs only below `artifacts/full-frame/comparisons/` and binds the tracked metrics report to both manifests and every paired frame hash. Do not copy or rename images to manufacture a complete pair.

## Pixel Comparison

Run the portable Node comparator:

```bash
npm run compare:frames -- \
  migrations/Animation/baseline/keyframes/frame-025.png \
  migrations/Animation/evidence/implementation/frame-025.png \
  --diff migrations/Animation/evidence/diffs/frame-025.png \
  --json migrations/Animation/evidence/diffs/frame-025.json \
  --max-rmse 0.05
```

Normalized RGB RMSE is:

`sqrt(mean((baselineChannel - implementationChannel)^2)) / 255`

Use these default review gates:

- Static/key teaching frames: normalized RMSE `<= 0.05`.
- Transitional frames with renderer-specific antialiasing: target `<= 0.08`.
- Timing: exact source frame; allow at most one frame only with a documented scheduler or baseline limitation.
- Dimensions: exact pixel match before comparison.

These are review thresholds, not permission to ignore obvious errors. A formula, count, label, button, or major object must never be wrong even when aggregate RMSE passes.

For coverage schema version 2, retain a complete original-runtime baseline
capture manifest and a complete implementation capture manifest for each
requirement. Both manifests must bind the exact animation, requirement, frame
domain, trace, entry-state hash, scenario, language, seed, native stage, and
one-indexed range. Every PNG path, SHA-256, and dimension is revalidated. The
metrics report must bind both manifest hashes and each pair of baseline and
implementation frame hashes; directory position or matching filenames alone
are insufficient.

When the owner accepts a justified exception, add it to `migration.json` under `acceptance.knownExceptions` and use `accepted-exception` in the affected CSV result field. Never use that value without a written exception.

## Visual Review

Inspect every diff for:

- Whole-stage translation or scaling.
- Wrong registration point, matrix, rotation, or depth order.
- Missing masks, filters, highlights, shadows, or morph states.
- Font substitution, baseline shift, glyph spacing, or clipped text.
- Wrong alpha or color transform.
- Background and stage-crop differences.
- Unexpected Ruffle overlays or browser UI.

Record accepted antialiasing differences separately from behavioral or layout discrepancies.

## Interaction And Responsive Review

Verify:

- Replay restarts at frame 1 with mouse, Enter, and Space.
- Focus order and accessible control names are meaningful.
- `prefers-reduced-motion` has an intentional behavior.
- Native stage, wide desktop, tablet, and narrow mobile layouts do not crop or overlap.
- Text and numeric labels remain inside their intended objects.
- No console errors, failed assets, accidental network calls, or layout shifts occur.

## Evidence Table

For each row in `keyframes.csv`, record `requirement_id`, frame domain, trace and
entry-state identity, baseline file, implementation file, diff file, normalized
RMSE, timing result, visual result, reviewer, and notes. For interactive content,
`full-frame-coverage.json` must enumerate explicit reachable trace requirements;
do not infer coverage from a global scenario × language × root-frame Cartesian
product. Complete the acceptance checklist only after every required row and
every explicit trace requirement has evidence.
