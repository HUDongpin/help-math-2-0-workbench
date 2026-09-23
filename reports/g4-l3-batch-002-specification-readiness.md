# G4 L3 Batch-002 Specification Readiness

> Acceptance-neutral projection for G4 L3 batch-002's 15 lesson cards. Its parallel-shard scaffold gate is open for workspace creation; renderer implementation, fidelity, acceptance, strict completion, and atomic publication remain unauthorized.

## Bound evidence

- Work cards: `reports/g4-l3-implementation-work-cards.json` / `79ef4b4e4ef5c5e57e078fd5fcd07cefebb247bb8edaf588370c07e7abde41e0`
- Machine audit: `reports/g4-l3-machine-source-audits.json` / `c7f987904de8e2a5bca907931feedab0e3bd61ffdcf26b56ef5d7295e49ab9f6`
- Static source-event index: `reports/g4-l3-static-source-event-index.json` / `88068fbea3907570295af5f891be72198e3ec5fef20d0e70590545ed2adbeb32`
- Embedded-audio archive: `reports/g4-l3-embedded-audio-archive.json` / `7a1fe8406c7b005ccde20bb34aec09ac6c2dc52a17bb913b65550915f2bb40c4`
- SWF asset-definition census: `reports/g4-l3-swf-asset-definition-census.json` / `278ab624428ef073d43b7487e6a8466b184256bfacce7369aba11675fb418a45`
- Animate readiness: `reports/g4-l3-animate-prepare-readiness.json` / `d8aa91cd0a7c304f83930dfc34e7b63c714bf5c395022c192bc4c39251382982`
- Animate authoring result index: `reports/g4-l3-animate-authoring-audit-index.json` / `746a5c503bb7bf49327b1b3a00ff4fa1a644ee5a81ac68364dc3f66ee78ee379`
- Historical prepare-snapshot runner: `scripts/run-assisted-animate-authoring-audit.mjs` / `b53bb812d087025a1eec5a4d2654a83cd63c278565fb818772cbc776f9c978af`
- Paired-source Animate assist runner: `scripts/run-assisted-animate-authoring-audit.mjs` / `b7a81178bf21ff43d91d7d89691adb44feb769c4588bbc0ad0fac3b662269bf3`
- Content-addressed 0444 FLA staging manifest: `work/animate/g4-l3-read-only-fla-copies/manifests/sha256/0607defa8de16ea0ca1985ccfa79e25514f9d98906938ed4d9ac94f35ea0559b.json` / `0607defa8de16ea0ca1985ccfa79e25514f9d98906938ed4d9ac94f35ea0559b`

All 15 SWFs and all 10 available FLAs were physically re-hashed. The 10 staged FLA copies were rechecked as byte-identical, read-only, single-link files separate from their sources.

## Current boundary

- Scaffold gate: **open** — this parallel development shard has no strict-completion prerequisite and the completion ledger is current
- Development/publication policy: **parallel-shards** / **atomic**; shard `shard-02` has no development prerequisite.
- Source mix: 10 FLA+SWF, 5 SWF-only.
- Static domain candidates: 639; none is promoted to final runtime coverage by this report.
- Static risks: 14 interaction, 6 random, 3 external-call items; 119 unique catalog audio files.
- Machine prerequisite bundles bound: **15/15**; 1027 indexed event/signal files, 577 handler files, 247 archived embedded-audio units, and 4952 exact SWF definition records.
- Work-only Animate authoring audits: **10/10 applicable verified**, **0 pending**, and **5 SWF-only n/a**. They establish authoring structure only, not authoring acceptance or original-runtime behavior.
- Remaining unresolved gaps: 50 human, 81 runtime, and 120 final-specification obligations across this batch.
- Human evidence ready: **0/15**; authoritative runtime ready: **0/15**.
- Final specification ready: **0/15**; implementation authorized: **0/15**; strict complete: **0/15**.

## Ordered readiness table

| # | Animation | XML | Source | SWF SHA-256 | Root frames | Static domains | Machine facts | Known static risks | Specification state |
|---:|---|---|---|---|---:|---:|---|---|---|
| 26 | `course-g04-l03-ti-004` | TI/4 | FLA+SWF / 68837d6c25eb… | 04145dae5f7b… | 10 | 26 | 67/33 events; 7 audio; 274 definitions | interaction:66, random:1, embedded-audio:254, catalog-audio:1 | existing partial; not ready |
| 27 | `course-g04-l03-ti-005` | TI/5 | FLA+SWF / 40d3cb630a07… | c6c46c779084… | 10 | 8 | 28/4 events; 6 audio; 208 definitions | interaction:48, random:2, embedded-audio:298, catalog-audio:1 | existing partial; not ready |
| 28 | `course-g04-l03-ti-006` | TI/6 | FLA+SWF / 4143f5a7ac38… | 8b1b570cb14d… | 10 | 20 | 56/25 events; 7 audio; 269 definitions | interaction:60, random:1, embedded-audio:296, catalog-audio:1 | existing partial; not ready |
| 29 | `course-g04-l03-gs-002` | GS/2 | FLA+SWF / 096d332d7572… | d1786d2ed78c… | 10 | 17 | 38/15 events; 6 audio; 321 definitions | interaction:26, random:1, embedded-audio:661, catalog-audio:1 | existing partial; not ready |
| 30 | `course-g04-l03-ts-002` | TS/2 | FLA+SWF / bf845949c452… | 777224c6e7c1… | 10 | 3 | 6/3 events; 1 audio; 27 definitions | interaction:3, embedded-audio:356, catalog-audio:1 | existing partial; not ready |
| 31 | `course-g04-l03-ts-003` | TS/3 | SWF-only | 1ff4291c2d50… | 10 | 3 | 5/2 events; 1 audio; 25 definitions | interaction:2, embedded-audio:237, catalog-audio:1 | existing partial; not ready |
| 32 | `course-g04-l03-ts-004` | TS/4 | SWF-only | ec56922f78cb… | 10 | 3 | 13/10 events; 1 audio; 70 definitions | interaction:10, embedded-audio:332, catalog-audio:1 | existing partial; not ready |
| 33 | `course-g04-l03-ts-005` | TS/5 | FLA+SWF / bcc558c091fc… | 877b15eb4a14… | 10 | 3 | 12/9 events; 1 audio; 40 definitions | interaction:9, embedded-audio:276, catalog-audio:1 | existing partial; not ready |
| 34 | `course-g04-l03-ts-006` | TS/6 | FLA+SWF / 3f500c60b73b… | fa8962a6ca72… | 10 | 3 | 3/0 events; 1 audio; 23 definitions | embedded-audio:129, catalog-audio:1 | existing partial; not ready |
| 35 | `course-g04-l03-ts-007` | TS/7 | SWF-only | f29b6880fea6… | 10 | 23 | 72/34 events; 12 audio; 445 definitions | interaction:37, embedded-audio:1016, catalog-audio:1 | existing partial; not ready |
| 36 | `course-g04-l03-ts-008` | TS/8 | SWF-only | 9c7288f67f76… | 10 | 21 | 67/30 events; 12 audio; 354 definitions | interaction:32, embedded-audio:1094, catalog-audio:1 | existing partial; not ready |
| 37 | `course-g04-l03-fq-001` | FQ/1 | FLA+SWF / 03ed6895b89b… | a7efda88b324… | 10 | 3 | 12/0 events; 0 audio; 41 definitions | interaction:40, catalog-audio:108 | existing partial; not ready |
| 38 | `course-g04-l03-fq-002` | FQ/2 | FLA+SWF / 146bbfa62ccb… | ab1940815259… | 10 | 208 | 120/107 events; 0 audio; 899 definitions | interaction:110, random:1, external:2, catalog-audio:108 | existing partial; not ready |
| 39 | `course-g04-l03-fq-003` | FQ/3 | FLA+SWF / a873da8016d5… | f40e24b47e05… | 10 | 208 | 120/107 events; 0 audio; 899 definitions | interaction:110, external:1, catalog-audio:108 | existing partial; not ready |
| 40 | `shell-course-g04-l03-index-local` | null/null | SWF-only | 817e599de43a… | 50 | 90 | 408/198 events; 192 audio; 1057 definitions | interaction:255, random:3, external:18, embedded-audio:283 | existing partial; not ready |

## Exact remaining evidence contract

Every JSON card contains the original three `exactRemainingEvidence` lists plus exact `remainingGaps.human`, `remainingGaps.runtime`, and `remainingGaps.finalSpecification` lists. They are conditional per item and cover:

- completed work-only paired Animate authoring evidence, or an explicit missing-FLA limitation;
- final frame-domain dispositions and entry-state bindings;
- source-evidenced natural original-runtime traces for nested and interactive requirements;
- every interaction, random outcome, language/host state, terminal state, and Replay reset;
- embedded/external audio cue, language, timing, synchronization, and named listening evidence;
- native-size one-indexed original-runtime PNG manifests and the complete visual/behavior boundary map;
- a renderer decision revisited only after the evidence above exists.

15 selected existing migration workspace is recorded as partial/current-JavaScript context only. Its presence is not promoted to final specification or strict acceptance.

## Bound completed work-only Animate authoring audits

No further Animate command is emitted by this report. Each row binds a completed work-only audit; none is original-runtime, review, approval, or strict evidence.

| # | Animation | Run | Receipt SHA-256 | Authority |
|---:|---|---|---|---|
| 26 | `course-g04-l03-ti-004` | `run-tG7PBD` | `4003baaa7004975844730aa2f2cca5434fdd5f741cf7c6a610efc10c79a0c70d` | work-only; no runtime/acceptance effect |
| 27 | `course-g04-l03-ti-005` | `run-q2yoDX` | `00c0d28321156949cf3c7fddb8a3084049d8a4dddcf873c8da0f30740d7bd324` | work-only; no runtime/acceptance effect |
| 28 | `course-g04-l03-ti-006` | `run-VkToja` | `0264d90712fd165096c69f55fd989530318fdd2bec093bdeb755fe4241b3fd6a` | work-only; no runtime/acceptance effect |
| 29 | `course-g04-l03-gs-002` | `run-GQhxSs` | `340a7af142bb1fccb126bde57fb321c86fe3bd289fe1409a2554878be26e726b` | work-only; no runtime/acceptance effect |
| 30 | `course-g04-l03-ts-002` | `run-FsXWgX` | `e7c1f75a26b5422be49e0694637185866cec405d6a810f3949ce7e5296212e6d` | work-only; no runtime/acceptance effect |
| 33 | `course-g04-l03-ts-005` | `run-2Nt0WP` | `cab8b49166a45a3a015b173774ce80d58209a30a2e729366ef6afe5a7574a758` | work-only; no runtime/acceptance effect |
| 34 | `course-g04-l03-ts-006` | `run-tkpM0N` | `a1a6009f3a3278e349e98c991358bf10425998378106f7a36df5cd0cb29a3a6b` | work-only; no runtime/acceptance effect |
| 37 | `course-g04-l03-fq-001` | `run-9yFFXc` | `6f6fb70e5bb0d96958444e863149be1fc4971de08f4fcef305afdfc6de87ab9d` | work-only; no runtime/acceptance effect |
| 38 | `course-g04-l03-fq-002` | `run-2lj30i` | `a028290c192b15b33f2d4876581f0852cda8143e622a80dfc717217421aba2b0` | work-only; no runtime/acceptance effect |
| 39 | `course-g04-l03-fq-003` | `run-PnF3uG` | `d26decb3984ed0be297e37de01d1b4dca3a627c7d3768509d54ad8d07298912a` | work-only; no runtime/acceptance effect |

## Acceptance boundary

This report proves physical source bindings, acceptance-neutral static source-event/embedded-audio/asset-definition machine prerequisites, content-addressed read-only FLA preparation, and completed work-only Animate authoring-structure audits for every FLA-backed card. Those audits are not authoring acceptance, shipped-SWF execution, FLA/SWF equivalence, or original-runtime proof. The report does not prove runtime reachability, final specification, JavaScript fidelity, audio synchronization/listening, RMSE, review, acceptance, or completion.
