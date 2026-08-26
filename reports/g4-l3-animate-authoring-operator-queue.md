# G4 L3 Adobe Animate authoring-audit operator queue

This package is a deterministic, acceptance-neutral queue for 29 pending human-assisted FLA authoring audits. It launches nothing and grants no review or acceptance authority.

## Current gate

- Queue JSON: `reports/g4-l3-animate-authoring-operator-queue.json`
- Queue JSON SHA-256: `cfda8f2ae4eccea2e6969c1f003fa3e3d258b074c73f2dce69999589bc457b1c`
- Source FLA/SWF pairs verified: 29/29
- Batch FLA copies verified at exact mode 0444: 29/29
- Paired assist FLA/SWF copies verified at exact mode 0444: 29/29
- Assist-runner provenance: current-execution-runner-updated-after-immutable-preparation
- Running Animate processes: 0
- Process gate: **closed-awaiting-named-human-operator**
- Current blank-document cold-start probe: passed (not reused as FLA evidence)
- Human-assisted runs performed by this builder: 0
- Authoring audits established: 0
- Strict acceptance effect: false

Adobe Animate is currently closed and the blank-document cold-start probe passed. The queue is still waiting for a named human dialog operator; this report does not authorize an unattended run. Re-run the queue check immediately before each row.

## Operator boundary

1. Execute rows in `queueOrdinal` order, one row per fresh Animate process.
2. The named human may acknowledge only the legacy ActionScript conversion warning.
3. Do not click any other dialog; do not save, publish, export, or edit.
4. The controller must close without saving and Animate must fully quit before the next row.
5. A successful work-only audit still does not prove original-runtime behavior, FLA/SWF equivalence, JavaScript fidelity, audio, RMSE, human review, owner acceptance, or migration completion.

## Queue

Order | Animation | Batch/order | FLA | SWF | Current state
---: | --- | --- | --- | --- | ---
1 | `course-g04-l03-ir-001-341242cc` | `batch-001/1` | `L3RW01.fla` | `L3RW01.swf` | ready-for-named-human-one-item-run
2 | `course-g04-l03-rw-003` | `batch-001/3` | `L3RW03.fla` | `L3RW03.swf` | ready-for-named-human-one-item-run
3 | `course-g04-l03-vb-002` | `batch-001/5` | `L3VB02.fla` | `L3VB02.swf` | ready-for-named-human-one-item-run
4 | `course-g04-l03-vb-003` | `batch-001/6` | `L3VB03.fla` | `L3VB03.swf` | ready-for-named-human-one-item-run
5 | `course-g04-l03-vb-004` | `batch-001/7` | `L3VB04.fla` | `L3VB04.swf` | ready-for-named-human-one-item-run
6 | `course-g04-l03-vb-005` | `batch-001/8` | `L3VB05.fla` | `L3VB05.swf` | ready-for-named-human-one-item-run
7 | `course-g04-l03-vb-006` | `batch-001/9` | `L3VB06.fla` | `L3VB06.swf` | ready-for-named-human-one-item-run
8 | `course-g04-l03-vb-007` | `batch-001/10` | `L3VB07.fla` | `L3VB07.swf` | ready-for-named-human-one-item-run
9 | `course-g04-l03-vb-008` | `batch-001/11` | `L3VB08.fla` | `L3VB08.swf` | ready-for-named-human-one-item-run
10 | `course-g04-l03-vb-009` | `batch-001/12` | `L3VB09.fla` | `L3VB09.swf` | ready-for-named-human-one-item-run
11 | `course-g04-l03-in-003` | `batch-001/14` | `L3IN03.fla` | `L3IN03.swf` | ready-for-named-human-one-item-run
12 | `course-g04-l03-in-004` | `batch-001/15` | `L3IN04.fla` | `L3IN04.swf` | ready-for-named-human-one-item-run
13 | `course-g04-l03-in-005` | `batch-001/16` | `L3IN05.fla` | `L3IN05.swf` | ready-for-named-human-one-item-run
14 | `course-g04-l03-in-006` | `batch-001/17` | `L3IN06.fla` | `L3IN06.swf` | ready-for-named-human-one-item-run
15 | `course-g04-l03-in-008` | `batch-001/19` | `L3IN08.fla` | `L3IN08.swf` | ready-for-named-human-one-item-run
16 | `course-g04-l03-in-010` | `batch-001/21` | `L3IN10.fla` | `L3IN10.swf` | ready-for-named-human-one-item-run
17 | `course-g04-l03-in-012` | `batch-001/23` | `L3IN12.fla` | `L3IN12.swf` | ready-for-named-human-one-item-run
18 | `course-g04-l03-ti-002` | `batch-001/24` | `L3TI02.fla` | `L3TI02.swf` | ready-for-named-human-one-item-run
19 | `course-g04-l03-ti-003` | `batch-001/25` | `L3TI03.fla` | `L3TI03.swf` | ready-for-named-human-one-item-run
20 | `course-g04-l03-ti-004` | `batch-002/1` | `L3TI04.fla` | `L3TI04.swf` | ready-for-named-human-one-item-run
21 | `course-g04-l03-ti-005` | `batch-002/2` | `L3TI05.fla` | `L3TI05.swf` | ready-for-named-human-one-item-run
22 | `course-g04-l03-ti-006` | `batch-002/3` | `L3TI06.fla` | `L3TI06.swf` | ready-for-named-human-one-item-run
23 | `course-g04-l03-gs-002` | `batch-002/4` | `L3GS02.fla` | `L3GS02.swf` | ready-for-named-human-one-item-run
24 | `course-g04-l03-ts-002` | `batch-002/5` | `L3TS02.fla` | `L3TS02.swf` | ready-for-named-human-one-item-run
25 | `course-g04-l03-ts-005` | `batch-002/8` | `L3TS05.fla` | `L3TS05.swf` | ready-for-named-human-one-item-run
26 | `course-g04-l03-ts-006` | `batch-002/9` | `L3TS06.fla` | `L3TS06.swf` | ready-for-named-human-one-item-run
27 | `course-g04-l03-fq-001` | `batch-002/12` | `L3FQ01.fla` | `L3FQ01.swf` | ready-for-named-human-one-item-run
28 | `course-g04-l03-fq-002` | `batch-002/13` | `L3FQ02.fla` | `L3FQ02.swf` | ready-for-named-human-one-item-run
29 | `course-g04-l03-fq-003` | `batch-002/14` | `L3FQ03.fla` | `L3FQ03.swf` | ready-for-named-human-one-item-run

Each row's exact `npm` argv template, immutable hashes, read-only working-copy bindings, capture frame, and sole operator substitution are in the JSON report.
