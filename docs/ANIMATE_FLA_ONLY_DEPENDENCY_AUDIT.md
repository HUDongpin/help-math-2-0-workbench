# Adobe Animate FLA-only dependency authoring audit

This procedure audits an owner-provided FLA that has no matching shipped SWF.
It is an acceptance-neutral authoring dependency audit, not a migration, an
original-runtime baseline, human review, owner approval, or fidelity evidence.
Every output remains under `work/animate/dependency-authoring-audits/`; the
command cannot write a migration, status, or approval record.

## Pinned L6FQ01 dependency

- Evidence ID: `course-g03-l06-fq-001-fla-only-dependency`
- Source: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/FQ/L6FQ01.fla`
- Source bytes: `362496`
- Source SHA-256: `38ab265170817cf0c2c92d48cfe6ccd3770eddf6f757a753ec16f6dfcdedb9cf`
- Expected animation identity from the catalog: `course-g03-l06-fq-001`
- Matching SWF: missing from the provided archive
- Authoring PNG frame: root frame `1`

The preparation step has staged this exact read-only working copy:

`work/animate/dependency-authoring-audits/course-g03-l06-fq-001-fla-only-dependency/working-copy/L6FQ01.fla`

Its mode is `0444`, its bytes and SHA-256 match the source, and its immutable
binding is `source-binding.json`. Re-run the preparation check without opening
Animate:

```bash
npm run audit:animate:assist -- \
  --dependency-fla 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/FQ/L6FQ01.fla' \
  --evidence-id course-g03-l06-fq-001-fla-only-dependency \
  --source-sha256 38ab265170817cf0c2c92d48cfe6ccd3770eddf6f757a753ec16f6dfcdedb9cf \
  --capture-frame 1 \
  --prepare-only
```

`--prepare-only` never checks, opens, or launches Adobe Animate.

## Run with one named dialog operator

First quit every Adobe Animate process. Then run exactly one cold-start audit:

```bash
npm run audit:animate:assist -- \
  --dependency-fla 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/FQ/L6FQ01.fla' \
  --evidence-id course-g03-l06-fq-001-fla-only-dependency \
  --source-sha256 38ab265170817cf0c2c92d48cfe6ccd3770eddf6f757a753ec16f6dfcdedb9cf \
  --capture-frame 1 \
  --dialog-operator '<HUMAN-NAME-OR-STABLE-ID>'
```

Replace `<HUMAN-NAME-OR-STABLE-ID>` with the exact operator identity supplied
in the review conversation; do not infer it from an OS account name. When
Animate displays its legacy ActionScript conversion warning, the named
operator may acknowledge that warning only. Do not click any other dialog. Do
not save, publish, export, or edit the document. If another dialog blocks the
run, leave it untouched and let the bounded command fail closed.

After the one allowed acknowledgement, the controller opens only the staged
copy, selects root frame 1, runs the recursive authoring audit, exports a PNG
at the document's native stage dimensions, closes without saving, and quits.
The generated dependency audit extends the stable project JSFL in the unique
run directory so frame scripts and attached instance scripts are recorded at
every root/library keyframe when Animate exposes them after conversion. It
does not change the pilot JSFL template or any existing pilot evidence.

Each unique run directory retains the controller, generated JSFL, stdout,
stderr, raw recursive JSON, native PNG, SHA-bound work evidence, and final run
receipt. A successful run still carries these limitations:

- Animate 2021 may remove or alter legacy ActionScript during its in-memory
  conversion before inspection.
- The missing SWF prevents shipped-bytecode and original-runtime
  corroboration.
- The authoring PNG does not establish interaction branches, audio timing,
  localization, scoring, navigation, Replay, or visual parity.
- The named dialog operator is not recorded as a reviewer or owner approver.
