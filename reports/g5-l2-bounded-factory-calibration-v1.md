# G5 Lesson 2 bounded factory calibration v1

Grade 5 Lesson 2 now has canonical source custody for all **64/64 active page placements**. The legacy Flash course shell remains excluded. That source result does not by itself authorize factory scale-out: this bounded slice audited the two formerly missing pages and generated **no renderer, registration, route, release, or publication change**.

## Decision

**Do not start source-static factory scale-out for G5 L2 from these two members.** Continue only with `course-g05-l02-fq-002` as a bounded, FLA-assisted behavior calibration after its authoring structure and ActionScript/host contracts are explicitly prepared. Keep `course-g05-l02-gs-002` outside the source-static path.

| Member | Source | Structural result | Disposition |
| --- | --- | --- | --- |
| `course-g05-l02-fq-002` | 47,344-byte SWF plus hash-matched 3,704,832-byte FLA | AS1/2; 109 exported script files; 2 `getURL` candidates; 183 nested definitions with unresolved reachability; no embedded SWF sound tags | Conditional FLA-assisted behavior calibration only; not eligible for a root-only static adapter |
| `course-g05-l02-gs-002` | 2,878,956-byte SWF; FLA missing | AS1/2; 101 exported script files; 66 `DoAction` tags; 1,939 streaming-audio blocks; 13 morphs; 13 nested timelines longer than the root, with a 593-frame maximum | Hold outside source-static factory; requires a behavior- and audio-capable strategy |

Both files are 800×600, 12 fps, and declare a ten-frame root. FFDec and swfmill agree on their headers, but the machine audit explicitly does not establish runtime traversal, interaction branches, entry states, terminal behavior, Replay, audio synchronization, or visual parity. A ten-frame root is therefore not a ten-frame fidelity denominator.

## Evidence boundary

- Canonical promotion receipt: `catalog/source-promotions/g5-l2-active-source-promotion-main-applied-v1.json`, SHA-256 `2ea6efdf214a786d08ce52adbe1e5e91bf6e546ef69fdd220a755645346010c0`.
- FQ02 machine audit: `migrations/course-g05-l02-fq-002/audit/machine/report.json`, SHA-256 `fa5820806d88372b57e0561c52e68e2369aba21e35d94fb7e42240b31a65557b`.
- GS02 machine audit: `migrations/course-g05-l02-gs-002/audit/machine/report.json`, SHA-256 `81624afdbe4419b693fbe5243ba2c8c4a475b8f00eea1ac20d7ff913f8384ffc`.
- Machine tooling: JPEXS FFDec 26.2.1, swfmill 0.3.6, OpenJDK 21.0.11, Python 3.13.3.

Current‑JS, original-runtime fidelity, behavior parity, visual fidelity, audio acceptance, human review, Owner acceptance, strict completion, release, and publication all remain false for this calibration.
