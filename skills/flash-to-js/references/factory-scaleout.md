# Compiler-Assisted Factory Scale-Out

Use this reference when designing, calibrating, running, measuring, or expanding a public-tool-assisted Flash-to-JavaScript migration factory. Govern operational scale here; continue to use the existing references for source intake, SWF/FLA audit, original-runtime authority, fidelity, audio and review, strict completion, and lesson release.

## Contents

- Preserve the factory boundary
- Track the product state machine
- Calibrate a representative vertical slice
- Decide whether to scale
- Bind public tools and licensing
- Separate source, IR, generated, product, and evidence artifacts
- Make batches reproducible and recoverable
- Measure end-to-end efficiency
- Report without inflating completion

## Preserve The Factory Boundary

Treat the factory as a compiler-assisted hybrid workflow. Use public tools to accelerate source locking, structural extraction, Canvas or asset generation, ActionScript/P-code classification, audio/video inspection, and deterministic browser checks. Do not represent those capabilities as automatic recovery of maintainable interaction semantics.

Keep tool roles explicit:

- Use FFDec Canvas, asset, ActionScript, and P-code exports as source-bound extraction or candidate-rendering inputs.
- Use swfmill as an independent structural cross-check where it supports the SWF.
- Use FFmpeg and ffprobe when audio or video is detected. Require full EOF decode for machine integrity when practical; do not treat probing, decoding, waveform inspection, or silent playback as listening acceptance.
- Use Playwright for deterministic candidate and product-host QA. Treat a callable renderer or smoke screenshot as runtime evidence for the candidate only, never as visual fidelity.
- Use Ruffle only under the forensic restrictions in the canonical skill and existing evidence references.

Fix AVM1/AVM2 behavior in a generator, normalized IR, shared adapter, or source-evidenced product state machine. Do not hide unresolved random branches, scoring, drag/scroll behavior, host calls, nested timelines, or audio clocks behind successful Canvas rendering.

## Map The Operational Funnel

Use this operational funnel to report factory throughput. Do not replace or collapse the independent evidence and acceptance states in the canonical Operating Contract:

1. `structural`: count source-locked static extraction and reproducible structural evidence.
2. `candidate`: count runnable but unregistered engineering implementations.
3. `registered-current-js`: count only reviewed module/assets whose exact placement is in the official registry, source-ordered lesson descriptor, and admitted modern My Lesson surface.
4. `evidence`: report original-runtime authority, behavior comparison, visual fidelity, and audio evidence as separate fields and counts.
5. `review`: report immutable human visual review and owner acceptance as separate decisions and counts.
6. `downstream`: report strict completion, release eligibility, and actual publication as separate authorities and counts.

Do not convert the funnel into one ordinal status or a combined acceptance boolean. In particular:

- Do not count extracted files, successful compiler commands, callable Canvas assets, headless screenshots, or unregistered wrappers as registered Current-JS.
- Do not count a registry entry without the exact source-ordered descriptor and modern My Lesson presentation path.
- Allow private or local engineering registration while downstream acceptance states remain explicitly false or pending.
- Do not expose an engineering registration through a learner-facing public route until the existing strict and release contracts permit it.

Use the page-only catalog denominator from `AGENTS.md`. Exclude legacy Flash course-shell SWFs from factory coverage, product registration, acceptance, and release counts.

## Calibrate A Representative Vertical Slice

Freeze the slice before implementation. Bind every selected page to its `animationId`, `assetId`, placement path, source hashes, lesson order, complexity lane, and selection reason. Do not replace a difficult page after failure merely to make the slice pass.

Select every complexity lane present in the intended batch:

- `low`: linear or primarily visual content with no unresolved behavior or nested-audio clock.
- `interactive-understood`: Replay, buttons, branches, or input whose source behavior and host contract are already understood.
- `behavior-heavy`: unresolved or high-risk randomization, multistage feedback, scoring/reporting, drag/scroll behavior, timeline control, nested clocks/audio, or historical host APIs.

Include relevant language and audio variants. If a lane is genuinely absent, bind that conclusion to the source audit instead of silently omitting it.

Require every slice page to traverse this product path:

`source -> extraction -> compact IR/config -> generated candidate -> maintainable module/shared adapter -> official registry -> source-ordered lesson descriptor -> private modern My Lesson -> Replay/interaction/audio lifecycle -> desktop/mobile browser QA`

For the slice to pass:

- Rebuild every generated layer from frozen inputs with no unexplained byte drift.
- Exercise the actual modern host, navigation, lifecycle, and source-evidenced interactions; do not test only a standalone Canvas.
- Reset the complete state vector on Replay and verify applicable audio start, stop, completion, and reset behavior.
- Reject placeholders, substituted instructional content, disabled interactions represented as complete, and undeclared network dependencies.
- Bring every frozen slice page to `registered-current-js`, including at least one page from every applicable complexity lane. Any selected page that fails the product path blocks the slice; do not discard it or let an easier page in the same lane mask the failure.
- Keep original-runtime, fidelity, audio acceptance, human, owner, strict, release, and publication status unchanged unless their existing authorities independently advance.

A passing slice authorizes engineering scale-out for the represented lanes only. It does not authorize a fidelity claim or learner-facing release.

## Decide Whether To Scale

Use these decisions:

- `GO-front-end`: repeatable source locking, extraction, classification, caching, and smoke evidence justify retaining the factory front end.
- `CONDITIONAL-GO-product`: every frozen slice page, covering every applicable representative lane, reaches registered Current-JS through the modern My Lesson path with measured rework and no unresolved product bridge.
- `NO-GO-scale-out`: the high-risk lane has not reached product integration, the run is not reproducible, product registration is manual and unmeasured, generated output is being hand-maintained, tool or schema identity is ambiguous, capacity is unsafe, or an applicable distribution-license boundary is unresolved.

Do not authorize lesson-wide, grade-wide, or catalog-wide scale-out from compiler success rate, file count, screenshot count, or structural wall-clock time alone. Recalibrate when the source family, ActionScript generation, renderer strategy, host contract, generator, IR schema, public-tool version, or page-complexity mix materially changes.

## Bind Public Tools And Licensing

Create a hash-bound toolchain/run manifest. Bind at least:

- Tool role, upstream project/repository URL, release tag or commit, and acquisition source.
- Exact version output, executable or package path, byte size, and SHA-256 of the binary or release asset actually used.
- The path and SHA-256 of `catalog/toolchain.json` or its reviewed successor.
- Saved launcher help, exact argv, configuration, environment variables by name, working-directory contract, operating system, architecture, and required language/runtime/browser versions.
- Generator, normalizer, wrapper, adapter, IR schema, and configuration hashes.
- Input source and dependency hashes plus the output checksum-set hash.

Do not claim reproducibility from a version string alone. Do not silently upgrade a public tool inside a calibrated batch; create a new bound run and repeat the applicable calibration.

Keep licensing separate from technical success:

- Record the exact license identifier, upstream license/NOTICE source, and a hash-bound copy or receipt for every public tool or runtime that affects generated or distributed output.
- Record whether the project invokes the tool locally, copies generated helpers, modifies upstream code, embeds a runtime, or redistributes binaries; these are different review cases.
- Require an authorized project-specific license review before committing or shipping generated helper/runtime code, modified upstream components, notices, or binaries whose distribution obligations are unresolved.
- Keep the affected product-bundle and publication path closed while that review is unresolved. Do not turn this operational gate into an unverified legal conclusion about the tool or generated output.

## Separate Artifact Layers

Keep these layers identifiable and independently hashable:

1. `preserved source`: immutable FLA/SWF/audio/XML and catalog identity.
2. `raw extraction`: large FFDec/swfmill/assets/P-code outputs retained as reproducible build or audit artifacts.
3. `compact IR/config`: versioned, source-bound metadata needed by generators and models, including stage, frame domains, symbols, timelines, dependencies, behavior classifications, audio cues, and unresolved semantics.
4. `generated candidate`: reproducible Canvas/assets/modules produced from the bound source, IR, toolchain, and generator.
5. `maintained product integration`: reviewed shared wrappers, state machines, host adapters, registry entries, descriptors, tests, and product contracts.
6. `evidence and receipts`: immutable run manifests, checksums, captures, comparisons, reviews, and ledgers governed by their existing references.

Never replace preserved source or raw extraction with the compact IR. Keep large generated outputs on the filesystem rather than pasting them into model context; provide the model only the hash-bound IR, indexes, and smallest source-evidenced excerpts required for the task.

Do not hand-edit generated files. If generated files must be committed or bundled, label their provenance and rebuild them deterministically. Put durable fixes in the generator, normalizer, shared wrapper, behavior adapter, or maintained product module, then regenerate and reverify the affected output set.

Use content-addressed caches. Invalidate a cache entry whenever its source, dependency, toolchain, launcher arguments, generator, adapter, schema, configuration, or relevant environment identity changes.

## Make Batches Reproducible And Recoverable

- Work in the reviewed isolated worktree and preserve unrelated dirty work.
- Preflight writable capacity before extraction, browser capture, comparison, or archive generation.
- Separate read-only planning from write mode. Freeze the exact batch membership and input manifests before generation.
- Stage outputs create-exclusively; never overwrite a successful or failed retained run in place.
- Write one page-level receipt before any reviewed batch promotion. Bind inputs, outputs, toolchain, generator, cache result, timings, warnings, failure class, and exit status.
- Isolate page failures so one malformed SWF or browser failure cannot corrupt another page or the batch index.
- Promote only a fully validated, exact output set through an atomic or rollback-safe transaction. Do not use a partial copy as successful batch promotion.
- Rerun identical frozen inputs and require either a verified cache hit or an identical output checksum set. Investigate unexplained drift before continuing.
- Retain failed attempts as diagnostic evidence and create a new run identity for retries.

Bound concurrency by CPU, memory, browser-process limits, and available storage. Higher parallelism is not higher efficiency when it increases nondeterminism, retry rate, or product QA rework.

## Measure End-To-End Efficiency

Measure by page placement and complexity lane. Record at least:

- Batch wall-clock time and per-tool machine time.
- Non-cached model tokens and cache hits/misses.
- Named engineering and review minutes; separate automated waiting from human work.
- Pages attempted, structurally extracted, runnable candidates generated, registered Current-JS pages, and modern My Lesson integrations.
- Candidate-to-registration yield and first-pass product-integration yield.
- Failed pages, retries, failure classes, browser-QA rework rate, and manual-adapter count.
- Raw extraction, cache, candidate, product, and evidence byte sizes.
- Throughput by low, interactive-understood, and behavior-heavy lane.

Compare a factory claim against a defined baseline using the same scope and complexity mix. Include the full path through registered Current-JS and modern My Lesson QA. Do not repeat an estimated percentage saving as a measured result, and do not extrapolate catalog-wide savings from a low-complexity structural batch.

## Report Without Inflating Completion

Report these funnels separately for the exact page-only denominator:

1. Structural compiler coverage.
2. Runnable but unregistered engineering candidates.
3. Registered Current-JS and modern My Lesson integration.
4. Original-runtime, behavior, visual-fidelity, and audio evidence.
5. Independent human and owner acceptance.
6. Strict completion, release, and publication.

Within funnels 4 through 6, retain separate fields for original runtime, behavior, visual fidelity, audio, human review, owner acceptance, strict completion, release eligibility, and publication. For each number, include the dated run identity, denominator, complexity mix, and source/tool/generator binding. State whether the value is generated, registered, accepted, or published; never let a larger upstream count stand in for a smaller downstream count.

Keep lesson-specific page IDs, dated counts, one-off timings, current worktree dirtiness, fixed tool versions, and unmeasured savings estimates in run reports or project memory, not in this reusable reference.
