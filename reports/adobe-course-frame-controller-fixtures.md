# Nine-course Adobe local-frame controller factory

This report covers the nine course-child pilots only; the course shell is excluded. Every specification is derived from the reviewed `scenario-inventory.json`: the unique root `animation` placement, its frame/label/objectId, corresponding local sprite frame count, source hash, native stage, and 12 FPS metadata.

| Animation | Root entry | Local timeline | Local frames | Canonical probe | Host-binding blockers | Random blockers |
|---|---:|---:|---:|---:|---:|---:|
| course-g03-l01-ts-008 | begin@6 | sprite-348 | 747 | 295 | 17 | 0 |
| course-g03-l01-vb-004 | begin@6 | sprite-231 | 222 | 56 | 19 | 0 |
| course-g03-l06-fq-002-review | Begin@6 | sprite-1168 | 82 | 2 | 61 | 1 |
| course-g03-l06-ti-001 | begin@6 | sprite-21 | 142 | 5 | 1 | 1 |
| course-g03-l08-re-001 | Begin@51 | sprite-621 | 27 | 2 | 13 | 0 |
| course-g04-l01-ir-001 | begin@6 | sprite-58 | 142 | 5 | 1 | 1 |
| course-g04-l03-in-009 | begin@6 | sprite-200 | 637 | 637 | 4 | 0 |
| course-g04-l09-gs-002 | begin@6 | sprite-787 | 653 | 642 | 38 | 1 |
| course-g05-l13-rw-002 | begin@6 | sprite-334 | 1873 | 673 | 2 | 0 |

All 9 canonical fixtures were compiled twice to identical hashes, decompiled for controller/safety markers, and passed sandbox syntax, local-write, outside-write-denial, and loopback-network-denial probes. No Adobe GUI was launched.

The canonical selection is structural only. It prefers the first audited local frame label after frame 1, then a nonterminal stop/action state, then an audited terminal state. It does not claim the selected frame is visually non-empty. Runtime confirmation must separately prove requested/actual frame equality for three ticks and preserve a lossless native-stage capture.

These fixtures mute and stop all audio and do not synthesize unknown host bindings. They cannot prove natural playback, nested phase, interaction branches, random outcomes, scoring, Replay, English/Spanish behavior, audio, RMSE, product QA, human review, or owner acceptance. Strict acceptance effect: **none**.

The earlier TI-only specification/report and output directory remain byte-preserved and are referenced by hash from the new TI compatibility record; this factory uses separate filenames and a separate output namespace.
