# Safe Adobe course-host fixtures

The nine course-child pilots depend on parent/root/global state that standalone
playback cannot reproduce. Build the controlled AVM1 host fixtures with:

```bash
npm run fixture:adobe:courses
npm run fixture:adobe:courses -- --check
```

The generated authority index is
`work/adobe-course-host-fixtures/manifest.json`. Each content-addressed fixture
contains the exact hash-verified child SWF, exact external audio associations,
the compiled host and decompiled compiler cross-check, a per-pilot fixture
specification, a sandbox profile, and capture instructions. The generated
binary tree is ignored by Git and can be rebuilt from preserved sources and
checked-in evidence.

## Safety and authority boundary

- The source SWFs and MP3s are copied byte-for-byte; nothing under
  `source-assets/` is edited.
- The original course shell is never opened or copied into a fixture. Its
  disposition is recorded under `work/adobe-course-host-fixtures/shell-exclusion/`.
- A child is loaded only after an explicit stage click.
- After `MovieClipLoader.onLoadInit`, the fixture performs the child's exact
  case-sensitive root `begin`/`Begin` handoff. This mirrors the reviewed HELP
  shell preloader contract and prevents the untouched child from remaining at
  its frame-1 preloader stop; it does not reconstruct the rest of the shell.
- The launcher denies network, Apple-event URL handoff, LaunchServices open and
  database services (`com.apple.lsd.open` / `com.apple.lsd.modifydb`), and
  writes outside the fixture/capture/temp roots. AppKit's bootstrap lookup of
  `com.apple.coreservices.launchservicesd` remains available because denying it
  prevents Flash Player from creating any window at all. The factory proves
  local TCP denial and inside/outside write behavior without opening a GUI.
- `getURL`, JavaScript URLs, `fscommand`, LMS/report calls, SharedObject writes,
  remote XML/data, sockets, and unknown resources are not fixture operations.
- The parent is a synthetic dependency injector. Until a scenario resolves all
  bindings and host adapters from source or authorized runtime evidence, its
  captures are synthetic-host probes—not original-host fidelity baselines.

## Two-step launch gate

Each fixture is fail-closed:

1. Run `smoke-sandboxed.sh`. Do not click the stage. Confirm only the fixture's
   pre-load screen appears and preserve the exact app-window screenshot bytes
   and MIME type. This image proves the launch gate only; it is not a visual-
   fidelity baseline.
2. Copy `sandbox-gui-smoke-test.template.json` to
   `capture/sandbox-gui-smoke-test.json`, enter the reviewer, ISO timestamp,
   evidence path, and SHA-256, and set `status` to `passed`.
3. Run `launch-sandboxed.sh`. It re-hashes every fixture file, rejects unlisted
   files/symlinks, validates the GUI smoke evidence, and only then starts the
   sandboxed Player. Click once to load the child.

Never double-click `host.swf`, the copied child, or the original shell.

## Scenario contract

Every `fixture-spec.json` lists required `_global`, `_root`/`_level0`, and
`_parent` bindings; copied and candidate-only dependencies; allowed/blocked
calls; English and Spanish-audio startup modes; branch obligations; and exact
capture steps. Bindings proven to be intrinsic AVM1 references or initialized
by the child are explicitly marked `do-not-inject-intrinsic-or-child-self-initialized`.
`S` starts an exact staged Spanish page-audio overlay when one is
available; `E` stops it. Those keys are forensic fixture controls, not product
UI.

Untouched AVM1 `random(n)` compiles to `ActionRandomNumber`. Adobe Player has no
parent-settable seed API. The authoritative protocol is therefore to restart,
classify, and hash observed outcomes until every index is covered. A patched
child can help diagnosis but cannot serve as authoritative baseline evidence.

These fixtures do not change migration status and do not satisfy full-frame
RMSE, audio listening, interaction traversal, human review, or owner acceptance.

## Source-derived local-frame controller candidates

The separate local-frame factory creates visual-only, exact-frame controller
candidates for the same nine child SWFs (the shell remains excluded):

```bash
npm run fixture:adobe:course-frames
npm run fixture:adobe:course-frames -- --check
npm run fixture:adobe:course-frames -- --id course-g04-l03-in-009 --frame 637
```

For each pilot, the tracked
`audit/adobe-course-frame-controller-spec.json` is derived without basename or
timeline guessing from the reviewed scenario inventory's unique root
`animation` placement: its exact placement frame and case-sensitive
`begin`/`Begin` label, objectId, corresponding local sprite frame count, source
hash, native stage, and 12 FPS metadata. The default canonical probe prefers an
audited local frame label after frame 1, then a nonterminal stop/action state,
then an audited terminal state. Static selection never claims that the frame is
visually non-empty.

Each content-addressed host keeps a full-stage opaque cover until the requested
root/local frame and local frame count match for three consecutive actual-frame
monitor ticks. A mismatch hides the child and displays `FRAME CONTROL FAILED
CLOSED`; after success, a transparent full-stage shield blocks pointer input.
The child is muted at root and local scope, source-named audio clips are stopped,
and `stopAllSounds()` is repeated. Hosts are compiled twice to identical SWF
hashes, decompiled for controller/safety markers, and subjected to sandbox
syntax, inside-write, outside-write-denial, and loopback-network-denial probes.

Generated binaries live under
`work/adobe-course-host-fixtures-frame-controller-all/`. The aggregate tracked
index and authority report are
`reports/adobe-course-frame-controller-fixtures.json` and `.md`. The earlier
TI-only controller evidence and output namespace are not overwritten; the new
TI specification records their exact hashes.

Direct `gotoAndStop` remains an engineering seek. It does not prove natural
playback or nested timeline phase, and the factory intentionally does not
synthesize unresolved host bindings. Interaction branches, random outcomes,
scoring, Replay, English/Spanish behavior, audio identity/timing, lossless Adobe
capture, RMSE, product QA, human review, owner acceptance, and strict migration
status all remain separate fail-closed obligations.
