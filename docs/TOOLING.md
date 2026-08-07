# Flash Migration Tooling

This guide prepares a second computer to audit FLA/SWF files, run the HELP Math project, capture deterministic browser frames, and compare them. Links point to primary project documentation and were checked on 2026-07-21.

## Supported Toolchain

Use Node.js 24 LTS for this repository. Node.js lists v24 as an LTS line, while v20 and v18 are end-of-life: <https://nodejs.org/en/about/previous-releases>.

Required for the complete workflow:

- Node.js 24 LTS and the bundled npm.
- Python 3.11 or newer for reproducible extraction/generation helpers.
- A Playwright Chromium browser for native-size frame capture.
- The project dependencies from `package-lock.json`.

Recommended forensic tools:

- JPEXS Free Flash Decompiler (FFDec) for scripts, symbols, fonts, sounds, shapes, and SWF metadata.
- Ruffle for reference playback of SWF content.
- swfmill for deterministic SWF-to-XML inspection.
- FFmpeg for legacy audio/video inspection and conversion.
- ImageMagick for an independent RMSE/difference-image check.
- Adobe Animate when an authorized license is available and the FLA must be inspected in its authoring environment.

## Bootstrap This Project

From the project root:

```bash
node --version
npm --version
python3 --version
npm ci
npx playwright install chromium
npm run doctor
npm run verify:workbench
npm test
npm run build
```

Use the version in `.nvmrc` when a Node version manager is available. Do not copy `node_modules` or `.next` between computers.

## Node.js And Python

Download Node.js from <https://nodejs.org/en/download>. Use the supported LTS line recorded in `.nvmrc`, not an end-of-life release.

Download Python from <https://www.python.org/downloads/>. On Windows, the official Python Install Manager provides the `python` and `py` commands; this project also accepts `python3` on macOS/Linux.

Confirm:

```bash
node --version
npm --version
python3 --version
```

## Playwright

Playwright supports Chromium, Firefox, and WebKit on Windows, macOS, and Linux. This project pins the Node package in `package-lock.json`; browser binaries are installed separately:

```bash
npm ci
npx playwright install chromium
```

Official installation guidance: <https://playwright.dev/docs/intro>.

## Ruffle

The project contains both the npm dependency and a self-hosted Ruffle build under `public/ruffle/`. `npm ci` restores the package; no browser plugin is required. Ruffle documents both npm and self-hosted setups at <https://ruffle.rs/js-docs/master/> and publishes downloads at <https://ruffle.rs/downloads/>.

Use Ruffle to observe legacy behavior and capture a versioned forensic reference. Ruffle is not an authoritative original-runtime baseline and cannot close fidelity, audio, interaction, human-review, owner, strict-completion, or release gates. Do not ship Ruffle as the modern implementation unless the owner explicitly accepts emulation as the product strategy.

## JPEXS Free Flash Decompiler

Download the latest stable FFDec release from <https://github.com/jindrapetrik/jpexs-decompiler/releases>. The project provides Windows, macOS, Linux, and cross-platform packages. Its documented capabilities include exporting scripts, images, shapes, movies, sounds, texts, and fonts from AS1/2 and AS3 SWFs: <https://github.com/jindrapetrik/jpexs-decompiler>.

Prefer the platform installer or app bundle. The generic JAR/ZIP route may require a working Java runtime. After installation, record the exact FFDec version in `migration.json`; CLI launcher names and locations vary by package, so verify them with the installed release's help before scripting exports.

FFDec is recommended rather than mandatory because some environments cannot run Java or a GUI. When it is unavailable, use swfmill plus Ruffle and mark script/font extraction confidence as reduced.

## swfmill

swfmill converts SWF to a structured XML dialect. Its documented command is:

```bash
swfmill swf2xml input.swf output.xml
```

Project and usage documentation: <https://github.com/djcsdy/swfmill>.

macOS users can install the Homebrew package when available:

```bash
brew install swfmill
```

Use XML parsing, not regular-expression scraping, when deriving frame, tag, matrix, or color-transform data.

## FFmpeg And ImageMagick

FFmpeg is optional unless the SWF contains audio or video. Obtain it from the platform links on <https://ffmpeg.org/download.html> and confirm with `ffmpeg -version`.

ImageMagick provides an independent normalized RMSE and diff-image calculation. Official comparison documentation: <https://imagemagick.org/compare/>.

Example:

```bash
magick compare -metric RMSE baseline.png implementation.png difference.png
```

The value in parentheses is normalized RMSE. The repository's `npm run compare:frames` command performs the same class of check in Node and is the portable default.

## Adobe Animate

Adobe Animate is optional and paid. Use it when the FLA is readable and its library, timeline, publishing settings, or test movie resolves ambiguity. Adobe states that Animate remains available in maintenance mode and documents its current requirements at <https://helpx.adobe.com/animate/system-requirements.html>.

Animate can publish HTML5 Canvas/CreateJS, but unsupported ActionScript and document features may be removed or converted. Treat automatic Canvas output as evidence or an asset source, not an automatic final migration: <https://helpx.adobe.com/animate/using/creating-publishing-html5-canvas-document.html>.

### Verified Animate 2021 JSFL invocation on macOS

On the current licensed workstation, Adobe Animate 2021 `MAC 21,0,7,42652`
executes a cold-start JSFL command with this argument shape:

```bash
"/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021" \
  --run-jsfl -o "/absolute/path/to/controller.jsfl"
```

Do **not** add Animate's `--quit` flag. On this release, `--quit` exits with
code zero before the JSFL creates its output. The controller must close its
disposable document without saving and call `fl.quit(false)` after writing a
completion marker.

Run the repository probe before relying on JSFL:

```bash
npm run audit:animate:probe
```

The probe refuses to run when the Animate application process is already open.
It creates an unsaved blank document, runs
`scripts/animate-audit-current-document.jsfl`, closes without saving, and
stores a unique `probe-result.json` plus script, process-log, report, and PNG
SHA-256 hashes under `work/animate/jsfl-cli-probes/`. A passing probe proves
only that cold-start JSFL execution and the audit script work on a generated
document. It is not migration fidelity evidence.

The HELP Math FLAs are legacy binary ActionScript documents. A controller-side
`fl.openDocument()` call against a byte-identical, read-only working copy of
`Conversion_1_1.fla` stopped at Animate's legacy conversion warning: after 30
seconds it had produced neither a controller marker nor an audit report. The
source and working-copy SHA-256 remained
`9b369aa2a927e0417a7aef0c94956f609643b6c6737ba824a308d32ba8d928d4`.
Therefore a passing blank-document probe must not be represented as an
unattended legacy-FLA audit.

For a legacy HELP Math FLA, use this human-assisted, fail-closed procedure:

1. Run `npm run verify:sources` and record the manifest-declared FLA SHA-256.
2. Run `npm run audit:animate:stage-pilots` once, then
   `npm run audit:animate:stage-pilots:check`. This creates the eight approved
   pilot working copies outside `source-assets/`, preserves every basename,
   sets mode `0444`, and records byte-identical SHA-256 bindings. For the
   current pilot set, follow `docs/ANIMATE_PILOT_AUDIT_OPERATOR_CARD.md`.
3. Start a fresh licensed Animate process, open only that working copy, and
   acknowledge the legacy ActionScript conversion warning. Do not save or
   publish the converted in-memory document.
4. Use **Commands > Run Command** to execute
   `scripts/animate-audit-current-document.jsfl`. Adobe documents this menu as
   the supported way to run an Animate JavaScript command:
   <https://helpx.adobe.com/animate/desktop/multimedia-and-video/automating-tasks-commands-menu.html>.
5. Confirm that `work/animate/<FLA-basename>-authoring-audit.json` and its
   current-frame PNG exist, then close the FLA without saving. Re-hash the
   working copy and require the before/after hashes to match.
6. Run `npm run audit:animate:finalize -- <animation-id>`. The schema-v2
   finalizer requires the exact read-only working copy, the current recursively
   inventoried JSFL contract, native-size PNG dimensions, and complete
   source/script/report/PNG hashes. Older schema-v1 pilot audits remain useful
   metadata evidence but are partial and must be refreshed before claiming a
   current comprehensive FLA authoring audit. The original SWF bytecode remains
   authoritative for scripts that Animate removes during its in-memory AS1
   conversion.

The same evidence path can be executed with less manual handling by running:

```bash
npm run audit:animate:assist -- <animation-id>
```

This command still requires a human to acknowledge Animate's legacy
ActionScript conversion warning. It verifies the registered read-only working
copy, cold-starts exactly one Animate process, selects the operator-card frame,
runs the current recursive audit, closes without saving, quits, validates the
raw JSON/PNG, and invokes the same schema-v2 finalizer. It records no human
review, owner decision, original-runtime behavior, audio, or fidelity approval.
If Animate is already running, the working copy is writable or stale, the
dialog is not acknowledged before the bounded timeout, or any output binding
differs, it fails closed and retains an append-only run receipt under
`work/animate/human-assisted-fla-runs/`.

For an FLA-only dependency that is not a registered migration, use the same
command's `--dependency-fla`, `--evidence-id`, and `--source-sha256` mode. That
mode stages a byte-identical `0444` copy and retains all results only below
`work/animate/dependency-authoring-audits/`; it never invokes the migration
finalizer or writes status/approval evidence. The full run additionally
requires `--dialog-operator <human-name>`. That named person may acknowledge
only the legacy conversion warning; no dialog automation is permitted. Use
`--prepare-only` to stage and verify without launching Animate. The pinned
L6FQ01 command and operator steps are in
[`docs/ANIMATE_FLA_ONLY_DEPENDENCY_AUDIT.md`](ANIMATE_FLA_ONLY_DEPENDENCY_AUDIT.md).

For an unscaffolded batch item that has both an FLA and its shipped SWF, add
`--paired-swf <source.swf> --paired-swf-sha256 <sha256>` to the same command.
This paired-source mode stages independent read-only FLA and SWF copies and
binds both source hashes in work-only evidence, avoiding the false statement
that the item is FLA-only. Animate still opens only the FLA working copy; the
paired SWF is not executed, and the result does not prove FLA/SWF equivalence,
original-runtime behavior, fidelity, acceptance, or migration completion.

For the 29 FLA-backed G4 L3 items, the prepared paired-source packages and
one-process-at-a-time operator order are bound by:

```bash
npm run audit:animate:g4-l3:operator-queue
npm run audit:animate:g4-l3:operator-queue:check
npm run report:g4:l3:animate-authoring
npm run report:g4:l3:animate-authoring:check
```

The queue physically re-hashes both source files, the batch-staged `0444` FLA,
the paired assist-runner `0444` FLA/SWF copies, the current recursive JSFL, and
the current passing disposable-blank-document probe. It also checks the live
process table without launching or interacting with Animate. The blank-document
probe is recorded only as cold-start JSFL capability; it is never reused as
legacy-FLA authoring evidence. Each row remains acceptance-neutral and requires
one user-supplied named human dialog operator. That person may acknowledge only
the legacy ActionScript conversion warning. Run exactly one row per fresh
Animate process, close without saving, and fully quit Animate before the next
row.

The immutable preparation bindings retain the assist-runner hash that created
their `source-binding.json` files. If the runner is repaired later, the queue
validates that historical provenance separately from the current execution
runner and never rewrites the read-only bindings. New dependency runs shard
large FLA library inventories into per-item JSON files while Animate is open;
the Node runner validates every shard and materializes the final raw audit
before a run may pass.

The result-index commands validate actual run receipts independently from the
pre-execution queue. They re-hash all declared evidence and preserve failed
runs as failed-only receipts with no artifacts or acceptance effect. The
current G4 L3 index has all 29 paired members verified as work-only authoring
audits and no pending authoring item. Historical failures remain fail-closed
diagnostic receipts; the generated index summary is the authoritative source
for attempt totals. An observed GUI dialog is not promoted to machine evidence
by this index.

Build the acceptance-neutral 16-pilot authoring coverage index with:

```bash
npm run audit:animate:pilot-index
npm run audit:animate:pilot-index:check
```

After all eight FLA-backed pilot audits have been finalized under the current
schema-v2 contract, bind their exact canonical audit path, SHA-256, Animate
version, and recursive-audit status into the migration manifests with:

```bash
npm run sync:animate:pilot-bindings
npm run sync:animate:pilot-bindings:check
```

The sync command fails the whole selected transaction before any manifest write
if a source FLA path/hash, audit schema or protocol, current JSFL hash, read-only
working copy, native authoring frame, or project-relative path is invalid. It
changes only `audit.machineEvidence.authoringEvidence`; it does not approve
human review, owner review, runtime behavior, audio, fidelity, or completion.

### Source-driven random-branch capture packages

TI001 and IR001 contain untouched AVM1 `random(2)` branches. Build and verify
their static schedule prerequisites and the non-launching operator packages with:

```bash
npm run audit:ir001-host-bindings:check
npm run audit:course-trace-specs:check
npm run scaffold:course-source-driven:capture -- --check
```

The source-driven scaffold binds the exact trace spec/index, projected manifest,
coverage and scenario-inventory identities, preserved child SWF, content-addressed
minimal adapter, sandbox, and Adobe Projector executable. It creates only read-only
empty templates. It contains no launcher, PNG, reviewer identity, runtime claim,
or acceptance decision. The current IR fixture remains ineligible until its new
digest receives a named-human GUI sandbox smoke approval.

When a generator or trace index changes, preserve a currently verified empty
package before replacing it:

```bash
npm run scaffold:course-source-driven:capture -- --archive-current-unsigned-template
npm run scaffold:course-source-driven:capture
npm run scaffold:course-source-driven:capture -- --check
```

If the active empty package binds an older trace specification solely because
`sourceBindings.scheduleDerivation.generator.sha256` changed, the archive step
must receive the exact prior generator hash as an explicit witness. This
fail-closed witness path also recognizes exactly one historical schema upgrade:
the fixed coverage-v1 ten-field
`sourceBindings.fullFrameCoverage.includedPaths` list to the current
coverage-v2 seventeen-field list, with an unchanged bound projection SHA-256.
No other descriptor, specification, index, template, or source change is
accepted:

```bash
npm run scaffold:course-source-driven:capture -- \
  --archive-current-unsigned-template \
  --previous-trace-spec-generator-sha256 <previous-sha256>
```

The factory reconstructs every changed specification in the embedded prior
global index byte-for-byte; changing only the selected requirement is
insufficient. Each entry must be derivable from the current generator-formatted
bytes through the exact coverage-v1-to-v2 descriptor transition above and,
only when that entry contains the binding, the witnessed generator SHA-256
transition. The GS002 technical-binding cascade is separately bounded to its
indexed manifest, coverage, and scenario-inventory descriptor SHA-256 values,
the paired coverage-inventory file/projection SHA-256 values, and a validated
historical generated-fixture witness for the prior scenario-inventory file
hash. No other field is mutable.

The archive record carries a hash-bound compressed snapshot of all current
specification bytes plus the allowlisted transforms for every changed index
entry. The read-only stale-archive validator independently reruns all
reconstructions and the final index hash. An arbitrary historical
`traceSpecs[].sha256` value is rejected even if the prior index is rehashed
around it. A missing or incorrect witness, filled template, index-structure
change, or any other byte drift fails before archival. Run the ordinary
scaffold command separately afterward to create the current template.

The append-only archive records every file byte hash, size, and mode. A future
authorized session must separately supply the launch and environment receipts,
two adapter-entry records, every natural random trial, 145 ordered passive
operations, three source-event observations, 142 frame-state records, and 142
native 800x600 PNGs. Validate such inputs with
`npm run prepare:course-source-driven:capture -- --help`. The preparer only writes
a pending candidate; it cannot write canonical baseline/execution evidence,
change coverage/status/reviews, inject a seed, force a branch, or launch Adobe.

## Tool Status Policy

`npm run doctor` exits nonzero when a required tool or project dependency is missing. It reports FFDec, Java, swfmill, FFmpeg, ImageMagick, and Adobe Animate as optional capabilities. Record missing optional tools in the migration brief; never imply that scripts, fonts, or morphs were fully audited when the needed extractor was unavailable.

The exact versions used by the current migration workstation, including the
downloaded FFDec release-asset checksum and the Adobe Animate availability
gate, are recorded in `catalog/toolchain.json`. Update that record whenever a
baseline or audit is regenerated with a different tool version.
