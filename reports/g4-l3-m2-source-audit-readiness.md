# G4 L3 M2 Source-Audit Readiness

This deterministic, acceptance-neutral ledger validates the exact **40-member** Grade 4 Lesson 3 release in source order: **39 active pages + 1 course shell**, split **25 + 15**.

## Result

- Machine audit complete: **40/40 (true, static artifact completeness only)**. Every workspace has a current, hash-bound `audit/machine/g4-l3-source-audit.json` artifact.
- `migration.json` source-audit bindings: **0 expected / 0 observed**. All 40 manifests were inspected only as read-only identity and ownership boundaries; source-audit-owned manifest evidence entries: **0**.
- Machine inventories: **40/40 schema-v2 receipts**, **80/80 machine CSV outputs** below `audit/machine/`, and **120/120 generated inventory artifacts** including receipts. Machine rows: **8,068** asset definitions, **359** embedded-audio candidates, and **359** catalog-audio candidates.
- Canonical inventories: **80/80 read-only bindings** for `asset-inventory.csv` and `audio-inventory.csv`; they are preserved files, not machine outputs.
- Adobe Animate work-only authoring coverage: **29/29 applicable verified; 11 SWF-only n/a; 0 pending**. This is authoring-structure evidence, not authoring acceptance or runtime proof.
- Authoritative original runtime complete: **0/40 (false)**.
- Final specification ready: **0/40 (false)**.
- Implementation authorized: **0/40 (false)**.
- Strict complete: **0/40 (false)**.

Machine-audit completeness in this report still means static artifact completeness only. Separately, the current work-only Animate index proves 29/29 applicable authoring-structure audits. Neither evidence class proves original-runtime reachability, FLA/SWF equivalence, visual or behavioral parity, audio listening/synchronization, human review, owner acceptance, or migration completion.

Current scope authority is `catalog/lesson-releases.json`. Three older workflow-snapshot bindings are explicitly excluded from M2 source authority and replaced by exact current release/order plus physical artifact checks; they are listed in the JSON report rather than silently treated as current.

## Evidence snapshot

- Exact static source operations: **3,403**.
- Indexed static source-event files: **1,546**.
- Embedded audio: **359** source units / **88** CAS objects.
- SWF asset definitions: **8,068**.
- Paired FLA/SWF prepare-only bindings: **29/29**; verified work-only authoring audits: **29/29**.
- Evidence-set SHA-256: `fafdf9b71104844d4feff03e5864dfee3491de4a71584e23b0825b432e5a79a7`.
- Upstream machine-audit set SHA-256: `ef3e3f2d6757778662d280d10a4b04f46da84f0bd402c9d6c41017f58da69709`.

## Bound upstream reports

| Key | File | SHA-256 |
| --- | --- | --- |
| machineSourceAudits | `reports/g4-l3-machine-source-audits.json` | `c7f987904de8e2a5bca907931feedab0e3bd61ffdcf26b56ef5d7295e49ab9f6` |
| sourceOperationIndexV2 | `reports/g4-l3-source-operation-index-v2.json` | `2b3d3b89d61dabcbcf3f6a40d8728b0429535c254180065fea7fa594c2879f3e` |
| staticSourceEventIndex | `reports/g4-l3-static-source-event-index.json` | `88068fbea3907570295af5f891be72198e3ec5fef20d0e70590545ed2adbeb32` |
| embeddedAudioArchive | `reports/g4-l3-embedded-audio-archive.json` | `7a1fe8406c7b005ccde20bb34aec09ac6c2dc52a17bb913b65550915f2bb40c4` |
| assetDefinitionCensus | `reports/g4-l3-swf-asset-definition-census.json` | `278ab624428ef073d43b7487e6a8466b184256bfacce7369aba11675fb418a45` |
| pairedAuthoringSourceBindings | `reports/g4-l3-paired-authoring-source-bindings.json` | `d690e63abf63ac64a369e7e037c02812983891691ebb672208287e6ec1591f0a` |
| animateAuthoringAuditIndex | `reports/g4-l3-animate-authoring-audit-index.json` | `746a5c503bb7bf49327b1b3a00ff4fa1a644ee5a81ac68364dc3f66ee78ee379` |
| catalogAudioMediaProbe | `reports/g4-l3-catalog-audio-media-probe.json` | `5d9b6392254dbba2ce2429045d3cb7670c648c100fffbacc2ffd73798023b5fe` |
| audioCasMediaProbe | `reports/g4-l3-audio-cas-media-probe.json` | `ffe105817bc7aadd0a7edbccf0bd8bc847b165154412fa2611de601ce4f8d938` |

## Per-workspace ledger

| # | Animation | Source | Artifact SHA-256 | Inventory | Manifest binding | Machine artifact | Authoring | Runtime | Spec | Implement | Strict |
| ---: | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| 1 | `course-g04-l03-ir-001-341242cc` | fla+swf | `c5b373c0f5e98978b2ac5efcba722ecf92f344be128bf7cc59884fa16e346009` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 2 | `course-g04-l03-rw-002` | swf-only | `7345d811a1b7ecbbda8c07e3465b1e0b9564a0cdc4255c124e383607ed7c52e1` | v2 / 2 machine / 2 canonical RO | 0 | yes | n/a (SWF-only) | no | no | no | no |
| 3 | `course-g04-l03-rw-003` | fla+swf | `b11784d885836194e7e931a6eb7724b3c8020bc162657adf41e005737e4e532f` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 4 | `course-g04-l03-rw-004` | swf-only | `38aaf14f4b4b1887495c842a8f6aba5e3fb4e341c680af5942a35f1081a5cacf` | v2 / 2 machine / 2 canonical RO | 0 | yes | n/a (SWF-only) | no | no | no | no |
| 5 | `course-g04-l03-vb-002` | fla+swf | `bd8fab3d688c5f9154aeda152997fb5583c1f7e5d0b1b7eb2b42a27b95c5e62f` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 6 | `course-g04-l03-vb-003` | fla+swf | `ea2e52c9519e3a8ced60572aba892b418980c81d5198dd87b1b5bc84859c060b` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 7 | `course-g04-l03-vb-004` | fla+swf | `f1be0b916434e8204822b92bf8f2affafbb5034229a362c9ea5e1fdc22c96a0c` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 8 | `course-g04-l03-vb-005` | fla+swf | `f73bb8cd4b9c56f072399d96c74042ab6d29d3a036809568f6aa305f3e0b8f93` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 9 | `course-g04-l03-vb-006` | fla+swf | `446d29244d4ff767207f7d82e7b94b269c2ee7f26efd820d5a8aefaf1483aa53` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 10 | `course-g04-l03-vb-007` | fla+swf | `84fd0c7631f19af72b180f9732319cd352bbd696b797090d8d961bbc1ccd6136` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 11 | `course-g04-l03-vb-008` | fla+swf | `2cb8b3af5d4049e6f0f3c0135e5fef577aee9491812a41291e34c7e2dcb0639a` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 12 | `course-g04-l03-vb-009` | fla+swf | `6a90aee62ba2192ef3dddf73f83341fe9011404142af032214e727a57554894a` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 13 | `course-g04-l03-in-002` | swf-only | `2b0a4b29d2b72dcead339b0d9d28df6d0cfc1a6e33ce22ffb7a5dfc6fd4072be` | v2 / 2 machine / 2 canonical RO | 0 | yes | n/a (SWF-only) | no | no | no | no |
| 14 | `course-g04-l03-in-003` | fla+swf | `8c57248ac1dfae4b7c66106b85da3dd7c0d42befd4024e7eb9d53602d3ec4f2c` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 15 | `course-g04-l03-in-004` | fla+swf | `4694e532c758d59e87878402c8e857fe9bd637f27253d5a16cd0d69e6bcf5db0` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 16 | `course-g04-l03-in-005` | fla+swf | `9dc6d290559564f1208499656d29c816d05acfbc2b3caed784edd214757a37af` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 17 | `course-g04-l03-in-006` | fla+swf | `1ea0068cc7acdbb94a9d82b0b5cc11f2b168a9a92271bedaabbeaa6a63e29bf0` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 18 | `course-g04-l03-in-007` | swf-only | `07208cb939fe39375ab27890b4369c07414b05c612b16bac086dc60ec1484b93` | v2 / 2 machine / 2 canonical RO | 0 | yes | n/a (SWF-only) | no | no | no | no |
| 19 | `course-g04-l03-in-008` | fla+swf | `478a06c2ef379377f52b9920905e109bd1966b32a21c2696a5efdbbacedff739` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 20 | `course-g04-l03-in-009` | swf-only | `1d38eac64095768dece5bfd56311165987c3793ed20c4108b85a0bb58f7928e4` | v2 / 2 machine / 2 canonical RO | 0 | yes | n/a (SWF-only) | no | no | no | no |
| 21 | `course-g04-l03-in-010` | fla+swf | `5bef5f4d944d4071121cb8a6debd970711fa44c438ae8e5a333f42b0e857960f` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 22 | `course-g04-l03-in-011` | swf-only | `78a7a9f3b3563daecf70c82943674ebd5e867dfb5f45d6d54d9783de13fe49a7` | v2 / 2 machine / 2 canonical RO | 0 | yes | n/a (SWF-only) | no | no | no | no |
| 23 | `course-g04-l03-in-012` | fla+swf | `4c59108274b1d674c312c43a32e4fe5b400fac329ca31611659fa52dfc1b13e6` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 24 | `course-g04-l03-ti-002` | fla+swf | `9995b17de5a1b43db42a99fd3050ac8148887c391286877ae40ebbb3b84ae373` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 25 | `course-g04-l03-ti-003` | fla+swf | `a81598f44df3f38f74ef96fc32b52d828a4d6c94086d27b95498f4b774f8362b` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 26 | `course-g04-l03-ti-004` | fla+swf | `d279d9e6273acbf0c16a82b8e0b98a47f69dd014f331e23d8c296bf80cdb989a` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 27 | `course-g04-l03-ti-005` | fla+swf | `94bbf02ae8abb3a9aa43ef3f85986f224c9aeb3a999344c7897b3fecda0def48` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 28 | `course-g04-l03-ti-006` | fla+swf | `1d3de7a4123eb554027d5b5775bbaf9a25aadae6985db0d1b499ca124f32d346` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 29 | `course-g04-l03-gs-002` | fla+swf | `36e866e27c3350137a755ab71e9d22d8d1d0dc474320e4c2e6cf634ac263446d` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 30 | `course-g04-l03-ts-002` | fla+swf | `8cc2a3b44c024c3c711345b54e44f2035917c6651131291028d0010b554c6fa5` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 31 | `course-g04-l03-ts-003` | swf-only | `02a380a808f2c10e8443a9f7c90c08b2bf09d30035fe8358de3730b86e1d9694` | v2 / 2 machine / 2 canonical RO | 0 | yes | n/a (SWF-only) | no | no | no | no |
| 32 | `course-g04-l03-ts-004` | swf-only | `9a2b2b56efa92236fa992cd7d56ddc05a88c7058df59249182d812d3b105d9e4` | v2 / 2 machine / 2 canonical RO | 0 | yes | n/a (SWF-only) | no | no | no | no |
| 33 | `course-g04-l03-ts-005` | fla+swf | `ba67ae0347d83dae9f614ad1047ec14c07cfa491ca0da708ed465ea180fa860e` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 34 | `course-g04-l03-ts-006` | fla+swf | `e27f043f7c2153896128cdd780a67b1d2c0e87557af9a622d42d4c0b76f41cfc` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 35 | `course-g04-l03-ts-007` | swf-only | `1864141c4ec5ed092dea76f2718b1a10f8088cb981583d6b063c9eb2c1ab160c` | v2 / 2 machine / 2 canonical RO | 0 | yes | n/a (SWF-only) | no | no | no | no |
| 36 | `course-g04-l03-ts-008` | swf-only | `98522b152d7ec9cc41ce8ae613c12d99b446bc8926157f69649b2a33ed9113a4` | v2 / 2 machine / 2 canonical RO | 0 | yes | n/a (SWF-only) | no | no | no | no |
| 37 | `course-g04-l03-fq-001` | fla+swf | `a2a195bb253a030e4a23a2dc0403a841214dbf7307fc7e54d3e6bfb5c08b43db` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 38 | `course-g04-l03-fq-002` | fla+swf | `4648e32010992f57f3f0b10d2fc42d4d5aa709a2a51d2b4a7f8aeb87ec71ab97` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 39 | `course-g04-l03-fq-003` | fla+swf | `d0619b3dd00210acad91748e3b4ae023aa4d33077bede0f1625b751ed6a22755` | v2 / 2 machine / 2 canonical RO | 0 | yes | verified work-only | no | no | no | no |
| 40 | `shell-course-g04-l03-index-local` | swf-only | `155aebeb3923e1f3dfdd0698cea267f41e5c339295b6e6f8fca0c69aaf9250b7` | v2 / 2 machine / 2 canonical RO | 0 | yes | n/a (SWF-only) | no | no | no | no |

## Acceptance boundary

This report binds 40 current static source-audit artifacts, their hash-bound v2 machine-inventory evidence, and 29/29 applicable work-only Adobe Animate authoring-structure audits. It creates no migration.json binding. The Animate audits are not authoring acceptance, shipped-SWF execution, FLA/SWF equivalence, authoritative original-runtime evidence, final specification, implementation authorization, fidelity or audio acceptance, human/owner review, or strict migration completion.
