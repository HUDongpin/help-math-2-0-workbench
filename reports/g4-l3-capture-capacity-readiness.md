# G4 L3 Capture Capacity Readiness

> Dynamic workstation snapshot and acceptance-neutral planning estimate only. Capacity does not prove baseline authority, RMSE, behavior, audio, human/owner acceptance, parity, or migration completion.

## Current environment snapshot

- Snapshot time: `2026-07-26T18:15:19.512Z`
- Filesystem: `/dev/disk8s1` mounted at `/Volumes/WestWorld`; inspected path `/Volumes/WestWorld/HELP MATH 2.0`
- Available bytes: 914,073,133,056 (851.30 GiB); total 931.32 GiB; df capacity 9%
- Existing `output/playwright`: 3.49 GiB
- Existing `artifacts/full-frame`: 2.58 GiB
- Existing `work`: 3.22 GiB

## Evidence basis

- Lesson scope: 40 canonical items (39 active pages + 1 shell); 38/40 machine-triaged behavior-sensitive.
- Source root frames: 440. Static nested DefineSprite definitions: 1,205 definitions / 19,763 declared frames; longest single nested definition 1,289 frames.
- Actual capture sample: 223 schema-v4 manifests and 34,259 existing 800×600 PNG frames. Bytes/frame p50 52.9 KiB, p75 119.0 KiB, p95 324.9 KiB.
- Coarse implementation-capture throughput: p50 0.79 s/frame, p75 1.46, p90 2.11. This is inferred from consecutive manifest completion times, not per-frame instrumentation.
- Historical commands: npm test p50 18.1 s / p90 88.3 s; build p50 9.6 s / p90 13.0 s.

Static nested-definition totals are storage-sizing inputs only. They are not proof of runtime reachability or required independent frame domains.

## Capacity projection

Each logical evidence frame reserves three PNGs: authoritative original-runtime baseline, JavaScript implementation, and diff. Fixed working allowances plus retry/archive overhead are included.

| Scenario | Logical evidence frames | PNG objects | Incremental storage | One implementation-capture stream |
|---|---:|---:|---:|---:|
| low | 27,480 | 82,440 | 5.78 GiB | 6.0 h |
| expected | 68,456 | 205,368 | 33.47 GiB | 27.8 h |
| high | 155,702 | 467,106 | 235.60 GiB | 91.1 h |

Recommended minimum safe free space: **382.72 GiB** (high remaining-evidence projection 235.60 GiB × 1.20 + 100.00 GiB operational reserve).

Admission recommendation at snapshot time: **admit-full-lesson-capture-capacity**. Current headroom against that safe threshold: 468.57 GiB.

No evidence was deleted, moved, compressed, or reclassified to reach this recommendation. Re-run the snapshot immediately before every capture sub-batch because free space is dynamic.

## Codex automation wall-clock

- Useful parallelism: 3 pipelines (next audit / current implementation / previous validation); keep browser capture at one stream on the current high-utilization volume, with two only as an idealized ceiling.
- JavaScript conversion only: about 5-10 continuous Codex days.
- Automated engineering plus validation: about 8-18 continuous Codex days, excluding named-human gates and fidelity repair triggered by them.
- High-uncertainty case: about 18-30 Codex days if behavior branches, fonts, audio timing, or shell integration require repeated reconstruction.
- The measured capture-hour values are in the table. Renderer reconstruction time is not instrumented by the repository, so the day ranges are planning estimates, not promises.

Codex can automate static extraction, source inventories, renderer/timeline generation, deterministic implementation captures, diffs, tests, builds, and report assembly. A named human must still personally operate/sign required original-runtime sessions, listen to both language tracks, perform strict visual review, and provide owner acceptance. Those gates are excluded from machine wall-clock estimates.

## Acceptance boundary

This readiness report is an environment and planning snapshot only. It does not establish original-runtime authority, visual or behavioral parity, RMSE acceptance, audio acceptance, human/owner approval, or migration completion.
