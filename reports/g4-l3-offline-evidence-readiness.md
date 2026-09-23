# G4 L3 Offline Evidence Readiness (leaf aggregate)

This is an acceptance-neutral, leaf-only aggregate for Grade 4 Lesson 3, **Negative Numbers**. It binds existing reports without modifying them.

## Exact scope and machine-prepared facts

- Lesson identity: **40 canonical items = 39 active pages + 1 course shell**.
- Source split: **29 paired FLA/SWF + 11 SWF-only**.
- Authoring evidence: **29/29** read-only source bindings with **87** exact-mode-0444 core files, plus **29/29 applicable verified work-only Animate authoring audits**; **11 SWF-only n/a**, **0 pending**. These audits establish authoring structure only, not original-runtime behavior or acceptance.
- Static ActionScript operation index v2: **40/40** items, **1,809** exported scripts, **3,403** exact operations, and **0** authoritative runtime trace specs.
- Original-runtime preparation: **1 installed-but-unapproved 32.0.0.414 candidate**, **23** exact static side-effect operations across **3** members, and **8 containment controls specified / 0 approved**. The historical 10-frame IN009 set remains unpromoted; runtime sessions and authoritative baselines are 0.
- Catalog audio: **143/143** physical MP3s passed technical parse and decode-to-null checks; listening, cue mapping, language identity, and synchronization remain unaccepted.
- Embedded audio: **88** CAS objects / **359** source references; the raw SWF ADPCM object is now bound to an acceptance-neutral **13-block / 5967-sample** PCM-WAV technical decode.
- Product state: **40 current-JavaScript candidate modules, 0 strict modules, 82 browser-verified current-JavaScript routes, 0/40 strict-complete**.
- Development state: **40/40** catalog-backed migration workspaces now exist (batch-001 **25/25**, batch-002 **15/15**) and both shard scaffold gates are **open**. Workspace presence does not authorize renderer implementation; lesson publication remains **atomic** and closed at 0/40 strict-complete. The capture-capacity snapshot says: `admit-full-lesson-capture-capacity`.

The SWF ADPCM-derived evidence is **acceptance-neutral-technical-decode-bound**. It does not prove independent FFDec/original PCM equality, spoken language, cue mapping, synchronization, listening quality, runtime behavior, or acceptance.

## Pending acceptance gates (all remain closed)

| Gate | Current evidence state | Required scope |
| --- | --- | --- |
| authoritative-original-runtime-baselines | 0/40 established | all reachable page, shell, locale, branch, terminal, navigation, and Replay states |
| final-frame-domain-scenario-and-trace-specification | 40/40 unresolved work cards; 193 source-bound candidates are static candidates, not authoritative traces | 40 canonical items |
| javascript-implementation-and-behavior-tests | 40 current-JavaScript candidate modules; 0 strict modules | 40 strict modules and registry entries |
| full-frame-rmse-diffs-and-visual-inspection | 0/40 strict visual-parity packages | every required frame in every reachable scenario and language |
| bilingual-audio-cue-sync-and-listening | technical byte/parse/decode evidence only; 0 listening reviews or cue/synchronization acceptances | embedded audio plus 143 catalog MP3 files across EN/ES runtime paths |
| browser-product-accessibility-and-network-qa | 82 current-JavaScript routes verified; strict original-runtime parity and acceptance remain 0/40 | English/Spanish lesson, page, shell, navigation, Replay, native/mobile, accessibility, console, asset, and network behavior |
| source-conflict-dispositions | unresolved | active XML versus shipped shell sequence; missing lesson-specific versus present grade-wide keyterm XML; missing reviewed Spanish titles |
| strict-human-visual-review | 0/40 | all strict-complete candidate requirements and every outlier/diff |
| owner-acceptance | 0/40 | separate owner signature after machine and strict-human gates |
| parallel-shard-implementation-and-atomic-publication | both scaffold gates open; 40/40 workspaces exist; implementation unauthorized; 0/40 strict-complete; atomic publication closed | complete all 40 scaffolded workspaces as strict migrations, then publish the lesson atomically |

## Bound reports

| Key | Report | SHA-256 | Bytes |
| --- | --- | --- | ---: |
| machineSourceAudit | `reports/g4-l3-machine-source-audits.json` | `c7f987904de8e2a5bca907931feedab0e3bd61ffdcf26b56ef5d7295e49ab9f6` | 5,152,829 |
| implementationWorkCards | `reports/g4-l3-implementation-work-cards.json` | `79ef4b4e4ef5c5e57e078fd5fcd07cefebb247bb8edaf588370c07e7abde41e0` | 1,132,339 |
| batch001SpecificationReadiness | `reports/g4-l3-batch-001-specification-readiness.json` | `64063ed6545e9405514989cc8975ce8dbd8fc4a3b4c6bfc979e97851e8c52ad5` | 1,690,338 |
| batch002SpecificationReadiness | `reports/g4-l3-batch-002-specification-readiness.json` | `5f7c558770be23449eb280ac1fbbae19d9e8ca4ba9d22f6dcd99117f353f210a` | 2,006,509 |
| lessonProductNavigationContract | `reports/g4-l3-lesson-product-navigation-contract.json` | `f5f12bfeca6247ff228a90254a85958fcd6ec6ba8355095771024051b0ee802c` | 285,364 |
| staticSourceEventIndex | `reports/g4-l3-static-source-event-index.json` | `88068fbea3907570295af5f891be72198e3ec5fef20d0e70590545ed2adbeb32` | 4,377,090 |
| sourceOperationIndexV2 | `reports/g4-l3-source-operation-index-v2.json` | `2b3d3b89d61dabcbcf3f6a40d8728b0429535c254180065fea7fa594c2879f3e` | 8,904,942 |
| assetDefinitionCensus | `reports/g4-l3-swf-asset-definition-census.json` | `278ab624428ef073d43b7487e6a8466b184256bfacce7369aba11675fb418a45` | 8,686,145 |
| embeddedAudioArchive | `reports/g4-l3-embedded-audio-archive.json` | `7a1fe8406c7b005ccde20bb34aec09ac6c2dc52a17bb913b65550915f2bb40c4` | 14,844,830 |
| audioCasMediaProbe | `reports/g4-l3-audio-cas-media-probe.json` | `ffe105817bc7aadd0a7edbccf0bd8bc847b165154412fa2611de601ce4f8d938` | 1,159,441 |
| swfAdpcmDerivedAudio | `reports/g4-l3-swf-adpcm-derived-audio.json` | `8e997a1abd772431c772803b4e1357b1857f485c1281dfd20eec452a57be6192` | 46,031 |
| catalogAudioMediaProbe | `reports/g4-l3-catalog-audio-media-probe.json` | `5d9b6392254dbba2ce2429045d3cb7670c648c100fffbacc2ffd73798023b5fe` | 3,584,381 |
| pairedAuthoringSourceBindings | `reports/g4-l3-paired-authoring-source-bindings.json` | `d690e63abf63ac64a369e7e037c02812983891691ebb672208287e6ec1591f0a` | 99,347 |
| animateAuthoringAuditIndex | `reports/g4-l3-animate-authoring-audit-index.json` | `746a5c503bb7bf49327b1b3a00ff4fa1a644ee5a81ac68364dc3f66ee78ee379` | 299,969 |
| shellLegacyHostContract | `reports/g4-l3-shell-legacy-host-dependency-contract.json` | `fc2bd9e5f3832b85d9078f6fecb7d28c61acbc0e999c1fa2ebc6fb945903161f` | 44,952 |
| captureCapacityReadiness | `reports/g4-l3-capture-capacity-readiness.json` | `88960a9ca24c4760da5f46a2a30b30472607bb2e3193d01c39ab96ec8b135ddd` | 33,799 |
| originalRuntimeEnvironmentReadiness | `reports/g4-l3-original-runtime-environment-readiness.json` | `06534a424cc7065e85044fa04665197f518abcef87cf4ddeae200510db8c6a54` | 11,540 |
| originalRuntimeContainmentReadiness | `reports/g4-l3-original-runtime-containment-readiness.json` | `012817c68c1c5ec70553bc7f4743d757fcdaa96eb1a72789d8b1f366d200616b` | 36,370 |
| automationPreflight | `reports/g4-l3-automation-preflight.json` | `4348354ad954511dd1e7b45fff9ccb481e355957cc78481c27a0b689a79f432a` | 204,595 |

## Acceptance boundary

This leaf report re-hashes and cross-checks acceptance-neutral offline G4 L3 evidence only. It binds 29/29 applicable completed work-only Animate authoring-structure audits, one installed-but-unapproved Flash Player candidate, and 23 exact static side-effect operations with eight specified but unapproved containment controls while changing no upstream artifact. Those facts are not authoring acceptance, shipped-SWF execution, FLA/SWF equivalence, runtime authorization, authoritative original-runtime evidence, or containment approval. The report does not establish final specification, JavaScript implementation fidelity, RMSE, audio listening/synchronization, human review, owner acceptance, parity, or migration completion.
