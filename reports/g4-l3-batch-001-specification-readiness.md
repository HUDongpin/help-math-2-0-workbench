# G4 L3 Batch-001 Specification Readiness

> Acceptance-neutral projection for G4 L3 batch-001's 25 lesson cards. Its parallel-shard scaffold gate is open for workspace creation; renderer implementation, fidelity, acceptance, strict completion, and atomic publication remain unauthorized.

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

All 25 SWFs and all 19 available FLAs were physically re-hashed. The 19 staged FLA copies were rechecked as byte-identical, read-only, single-link files separate from their sources.

## Current boundary

- Scaffold gate: **open** — this parallel development shard has no strict-completion prerequisite and the completion ledger is current
- Development/publication policy: **parallel-shards** / **atomic**; shard `shard-01` has no development prerequisite.
- Source mix: 19 FLA+SWF, 6 SWF-only.
- Static domain candidates: 260; none is promoted to final runtime coverage by this report.
- Static risks: 24 interaction, 6 random, 0 external-call items; 24 unique catalog audio files.
- Machine prerequisite bundles bound: **25/25**; 519 indexed event/signal files, 239 handler files, 112 archived embedded-audio units, and 3116 exact SWF definition records.
- Work-only Animate authoring audits: **19/19 applicable verified**, **0 pending**, and **6 SWF-only n/a**. They establish authoring structure only, not authoring acceptance or original-runtime behavior.
- Remaining unresolved gaps: 81 human, 131 runtime, and 200 final-specification obligations across this batch.
- Human evidence ready: **0/25**; authoritative runtime ready: **0/25**.
- Final specification ready: **0/25**; implementation authorized: **0/25**; strict complete: **0/25**.

## Ordered readiness table

| # | Animation | XML | Source | SWF SHA-256 | Root frames | Static domains | Machine facts | Known static risks | Specification state |
|---:|---|---|---|---|---:|---:|---|---|---|
| 1 | `course-g04-l03-ir-001-341242cc` | IR/1 | FLA+SWF / 3f5fe69773de… | 2af6431db3ed… | 10 | 4 | 18/0 events; 2 audio; 27 definitions | interaction:40, random:1, embedded-audio:272 | existing partial; not ready |
| 2 | `course-g04-l03-rw-002` | RW/2 | SWF-only | 8b2aa7afd7e8… | 10 | 3 | 6/3 events; 1 audio; 426 definitions | interaction:3, embedded-audio:1287, catalog-audio:1 | existing partial; not ready |
| 3 | `course-g04-l03-rw-003` | RW/3 | FLA+SWF / 16fb7b49f0d1… | 783b74b036a7… | 10 | 3 | 4/2 events; 1 audio; 54 definitions | interaction:2, embedded-audio:272, catalog-audio:1 | existing partial; not ready |
| 4 | `course-g04-l03-rw-004` | RW/4 | SWF-only | 506c062e33d4… | 10 | 4 | 5/2 events; 1 audio; 126 definitions | interaction:2, embedded-audio:438, catalog-audio:1 | existing partial; not ready |
| 5 | `course-g04-l03-vb-002` | VB/2 | FLA+SWF / e47d05e8ebbd… | 0e378f21899c… | 10 | 3 | 8/6 events; 1 audio; 52 definitions | interaction:6, embedded-audio:188, catalog-audio:1 | existing partial; not ready |
| 6 | `course-g04-l03-vb-003` | VB/3 | FLA+SWF / 263b18fb695f… | ab47ed70dd5b… | 10 | 18 | 31/20 events; 4 audio; 106 definitions | interaction:15, embedded-audio:199, catalog-audio:1 | existing partial; not ready |
| 7 | `course-g04-l03-vb-004` | VB/4 | FLA+SWF / 51541729c19b… | 13bff9e32e20… | 10 | 3 | 5/3 events; 1 audio; 53 definitions | interaction:3, embedded-audio:229, catalog-audio:1 | existing partial; not ready |
| 8 | `course-g04-l03-vb-005` | VB/5 | FLA+SWF / b63ccfb65ed4… | 7595fa85408e… | 10 | 3 | 5/3 events; 1 audio; 53 definitions | interaction:3, embedded-audio:175, catalog-audio:1 | existing partial; not ready |
| 9 | `course-g04-l03-vb-006` | VB/6 | FLA+SWF / 44ce279b65a6… | e83889619f1a… | 10 | 3 | 6/4 events; 1 audio; 44 definitions | interaction:4, embedded-audio:158, catalog-audio:1 | existing partial; not ready |
| 10 | `course-g04-l03-vb-007` | VB/7 | FLA+SWF / b4eb0a360733… | e3e6c45a56f3… | 10 | 17 | 31/4 events; 11 audio; 271 definitions | interaction:4, embedded-audio:318, catalog-audio:1 | existing partial; not ready |
| 11 | `course-g04-l03-vb-008` | VB/8 | FLA+SWF / 25b7f4acc112… | 3c61fd04bbaf… | 10 | 15 | 31/4 events; 11 audio; 195 definitions | interaction:4, embedded-audio:302, catalog-audio:1 | existing partial; not ready |
| 12 | `course-g04-l03-vb-009` | VB/9 | FLA+SWF / fc6a5819a64d… | 5a6532c1635e… | 10 | 3 | 6/4 events; 1 audio; 24 definitions | interaction:4, embedded-audio:141, catalog-audio:1 | existing partial; not ready |
| 13 | `course-g04-l03-in-002` | IN/2 | SWF-only | 60a1a78e5e92… | 10 | 3 | 8/6 events; 1 audio; 88 definitions | interaction:6, embedded-audio:487, catalog-audio:1 | existing partial; not ready |
| 14 | `course-g04-l03-in-003` | IN/3 | FLA+SWF / c960c1bef663… | ae967172d857… | 10 | 3 | 2/0 events; 1 audio; 84 definitions | embedded-audio:443, catalog-audio:1 | existing partial; not ready |
| 15 | `course-g04-l03-in-004` | IN/4 | FLA+SWF / 879624e9cfac… | 2ac5cd71bbc5… | 10 | 24 | 45/18 events; 11 audio; 160 definitions | interaction:13, random:1, embedded-audio:417, catalog-audio:1 | existing partial; not ready |
| 16 | `course-g04-l03-in-005` | IN/5 | FLA+SWF / 91654d016163… | dcbc74e5f839… | 10 | 20 | 36/25 events; 4 audio; 80 definitions | interaction:18, embedded-audio:210, catalog-audio:1 | existing partial; not ready |
| 17 | `course-g04-l03-in-006` | IN/6 | FLA+SWF / c79c838ba91c… | e303dcdd4dbd… | 10 | 14 | 46/16 events; 5 audio; 151 definitions | interaction:12, random:3, embedded-audio:1141, catalog-audio:1 | existing partial; not ready |
| 18 | `course-g04-l03-in-007` | IN/7 | SWF-only | 91c013434558… | 10 | 3 | 6/4 events; 1 audio; 98 definitions | interaction:4, embedded-audio:556, catalog-audio:1 | existing partial; not ready |
| 19 | `course-g04-l03-in-008` | IN/8 | FLA+SWF / b4c50528ad9f… | 5462ead92086… | 10 | 6 | 18/4 events; 4 audio; 57 definitions | interaction:8, random:2, embedded-audio:297, catalog-audio:1 | existing partial; not ready |
| 20 | `course-g04-l03-in-009` | IN/9 | SWF-only | 766b6ab686bb… | 10 | 6 | 4/2 events; 1 audio; 200 definitions | interaction:2, embedded-audio:589, catalog-audio:1 | existing partial; not ready |
| 21 | `course-g04-l03-in-010` | IN/10 | FLA+SWF / ac91921e09cc… | fab625d5c402… | 10 | 19 | 31/21 events; 5 audio; 90 definitions | interaction:15, embedded-audio:330, catalog-audio:1 | existing partial; not ready |
| 22 | `course-g04-l03-in-011` | IN/11 | SWF-only | a106b7a889b5… | 10 | 3 | 4/2 events; 1 audio; 51 definitions | interaction:2, embedded-audio:440, catalog-audio:1 | existing partial; not ready |
| 23 | `course-g04-l03-in-012` | IN/12 | FLA+SWF / 9b53a7990ab3… | fa131c4cfad5… | 10 | 24 | 40/19 events; 9 audio; 228 definitions | interaction:14, embedded-audio:389, catalog-audio:1 | existing partial; not ready |
| 24 | `course-g04-l03-ti-002` | TI/2 | FLA+SWF / 3068bbd11d14… | e640f8dcbfb6… | 10 | 35 | 74/38 events; 9 audio; 272 definitions | interaction:33, random:1, embedded-audio:446, catalog-audio:1 | existing partial; not ready |
| 25 | `course-g04-l03-ti-003` | TI/3 | FLA+SWF / 4670c0aa1e8b… | 7abcc6151596… | 10 | 21 | 49/29 events; 24 audio; 126 definitions | interaction:23, random:1, embedded-audio:122, catalog-audio:1 | existing partial; not ready |

## Exact remaining evidence contract

Every JSON card contains the original three `exactRemainingEvidence` lists plus exact `remainingGaps.human`, `remainingGaps.runtime`, and `remainingGaps.finalSpecification` lists. They are conditional per item and cover:

- completed work-only paired Animate authoring evidence, or an explicit missing-FLA limitation;
- final frame-domain dispositions and entry-state bindings;
- source-evidenced natural original-runtime traces for nested and interactive requirements;
- every interaction, random outcome, language/host state, terminal state, and Replay reset;
- embedded/external audio cue, language, timing, synchronization, and named listening evidence;
- native-size one-indexed original-runtime PNG manifests and the complete visual/behavior boundary map;
- a renderer decision revisited only after the evidence above exists.

25 selected existing migration workspace is recorded as partial/current-JavaScript context only. Its presence is not promoted to final specification or strict acceptance.

## Bound completed work-only Animate authoring audits

No further Animate command is emitted by this report. Each row binds a completed work-only audit; none is original-runtime, review, approval, or strict evidence.

| # | Animation | Run | Receipt SHA-256 | Authority |
|---:|---|---|---|---|
| 1 | `course-g04-l03-ir-001-341242cc` | `run-7AWuup` | `939760719e22f849fb2a1a4eaf55ee3434a947bbd53f1c22fa6d7d41dd47f091` | work-only; no runtime/acceptance effect |
| 3 | `course-g04-l03-rw-003` | `run-k0EVGy` | `9c3b093f38bb935222ea7108753e40b15d4af12d2ebc6d82ca2842bbf5ad654c` | work-only; no runtime/acceptance effect |
| 5 | `course-g04-l03-vb-002` | `run-xhw3jV` | `e7c2f6499778e9e1c5066be110635ebb5b8b088356e06105a37b50aa921dcc22` | work-only; no runtime/acceptance effect |
| 6 | `course-g04-l03-vb-003` | `run-xQnc2h` | `f75d850293c437a2d33d5b5c07544a56c059bdeeb9ea25fbe325b1d673bfd0b9` | work-only; no runtime/acceptance effect |
| 7 | `course-g04-l03-vb-004` | `run-BRw9X2` | `98400dcf19e4904f36eb9ba25f32aa834cc9fd57e4f8762943632c4470eff196` | work-only; no runtime/acceptance effect |
| 8 | `course-g04-l03-vb-005` | `run-NdvwJc` | `a12d6017341560dbd5d539c834077dac69cb1515d97cfdd2cc21852d3bdfa58b` | work-only; no runtime/acceptance effect |
| 9 | `course-g04-l03-vb-006` | `run-SWHIKC` | `0f260da3750e60371425c749422a227078fab133c32f38252e9d8cdaa08f0581` | work-only; no runtime/acceptance effect |
| 10 | `course-g04-l03-vb-007` | `run-xhtN9i` | `8cf4da1a18231193413bcd1e191fef40fedd96deb663599bc2419883dac5a1ee` | work-only; no runtime/acceptance effect |
| 11 | `course-g04-l03-vb-008` | `run-Vws2Pq` | `b8e8d0925b55e2b2f46dcd6afb03d1f80f6283256ee062e57590aa941c26bade` | work-only; no runtime/acceptance effect |
| 12 | `course-g04-l03-vb-009` | `run-RRLh3l` | `6945ab836eb5bdfaa5c135d0701cfb8dfbe4ce434de148b4fbbf181a7dc168ea` | work-only; no runtime/acceptance effect |
| 14 | `course-g04-l03-in-003` | `run-B4bgJP` | `473f5dba18646bee485b734c4e113f78bb8bff155628696fd461fb732e5d0107` | work-only; no runtime/acceptance effect |
| 15 | `course-g04-l03-in-004` | `run-aVDXR7` | `5747b64d71e811309d243de61cee3874c169a886fe696bed3076bcb2e864878f` | work-only; no runtime/acceptance effect |
| 16 | `course-g04-l03-in-005` | `run-HLuWN7` | `3aa0aafb2fbb0a81dce3af0ef87319fe25efab3169bc29276f37705b7ecf9f16` | work-only; no runtime/acceptance effect |
| 17 | `course-g04-l03-in-006` | `run-VCea44` | `82a0c917dd661b778f4cf18d28674609c57f079eeb6c8ef4e4f0d762b04d10e8` | work-only; no runtime/acceptance effect |
| 19 | `course-g04-l03-in-008` | `run-o9vprb` | `0ac252c6a1c4537aad0debb5d0624139e6203f97db79cc1c1ad0a6fbc2a77b01` | work-only; no runtime/acceptance effect |
| 21 | `course-g04-l03-in-010` | `run-tuQxQr` | `b30f7892a57fd51e5db3a5ae2246d013160af772b0ac9801fc22a53819556f25` | work-only; no runtime/acceptance effect |
| 23 | `course-g04-l03-in-012` | `run-hFIqVw` | `9aeb843a9ff6d012ec7fff02345b2e8f40b00550e9c720be9a80a397ca9abefd` | work-only; no runtime/acceptance effect |
| 24 | `course-g04-l03-ti-002` | `run-IIAQCO` | `dfc5ac2c480cd64b41322184037ef48978baa485ff1d406aeee5107592eddb8c` | work-only; no runtime/acceptance effect |
| 25 | `course-g04-l03-ti-003` | `run-ojgs8p` | `3012adae872dceda847db8efa30fbac1a46eb673a8a746357b94cef6e277db9c` | work-only; no runtime/acceptance effect |

## Acceptance boundary

This report proves physical source bindings, acceptance-neutral static source-event/embedded-audio/asset-definition machine prerequisites, content-addressed read-only FLA preparation, and completed work-only Animate authoring-structure audits for every FLA-backed card. Those audits are not authoring acceptance, shipped-SWF execution, FLA/SWF equivalence, or original-runtime proof. The report does not prove runtime reachability, final specification, JavaScript fidelity, audio synchronization/listening, RMSE, review, acceptance, or completion.
