# HFR headless feasibility prototype

Written for the 10 October 2026 review to test the riskiest assumption behind the HELP Flash Runtime: can one AVM1 interpreter plus one course-shell adapter carry the real behaviour of every G6–G8 page?

**This is not product code.** It is unregistered and unreviewed, renders nothing and plays no audio. It reads source SWFs read-only and writes only the output file you name.

## Files

| File | Purpose |
| --- | --- |
| `swf.mjs` | Minimal SWF 6/7 parser: timelines, PlaceObject2 with clip actions, buttons, edit text, exports, init actions, shape bounds |
| `avm1.mjs` | AVM1 object model, SWF-version-aware coercions and the bytecode interpreter (all opcodes used by the corpus) |
| `runtime.mjs` | Display list and timeline, built-ins, the 1.0 course-shell adapter (preloader handshake, shell functions, navigation clips, gSound) and the interaction driver |
| `run-page.mjs` | Run one page: play until it settles, then activate every enabled control (up to 30) and report |
| `run-corpus.mjs` | Run all placements in the G6–G8 release manifest in parallel worker processes |
| `run-dir.mjs` | Run every SWF under one or more directories (used for G3–G5) |
| `static-inventory.mjs` | Full static opcode and feature inventory, including clip-event scripts |
| `dump-root.mjs` | Print a page's root timeline structure |

## Run

```bash
cd hfr-spike
node run-page.mjs "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L8/GS/L8GS02.swf"
```

```bash
node run-corpus.mjs "<g678 worktree>/catalog/g678-page-only-release-manifest.v1.json" "<g678 worktree>/packages/demos/private-current-js-registry.json" "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared" out.jsonl 10
```

Requires Node 24; no npm install.

## Results (10 Oct 2026, v3)

- G6–G8: 2,282 placements in 8–17 s on 10 processes (median 13 ms per page). 0 fatal; **2,281 clean** (no interpreter error, no unimplemented built-in, no unknown shell call); 1 timeout (GEO L11 P019, `tellTarget` with a slash path).
- 646 pages reach right/wrong feedback; 1,400 call `DoHyperLinks`; 10,716 controls activated; 62 of 63 opcodes executed.
- P040 (`ALG001/L8/GS/L8GS02.swf`) runs clean with 11 controls; P050 (`ALG001/L8/FQ/L8FQ02.swf`) runs with 13 controls.
- G3–G5: 2,071 of 2,074 SWFs clean (1 corrupt file, 1 budget stop, 1 missing-method call).

Raw results are in `../corpus-analysis/spike-run-v3.jsonl` and `spike-run-g345-v3.jsonl`.

## What “clean” does not mean

It means the page did not exercise anything the prototype lacks. It does **not** mean the behaviour matches Flash. Known approximations:

- frame-1 script order of a parent and its newly placed children;
- button-state children are not instantiated (P050's `Mc_PlayPause_Audio` calls);
- getBounds and hitTest are approximated;
- there is no keyboard input, no rendering and no audio.

186 pages call methods on targets that do not exist at that moment. Differential testing against Ruffle must classify these as content timing (also a no-op in Flash) or runtime gaps.
