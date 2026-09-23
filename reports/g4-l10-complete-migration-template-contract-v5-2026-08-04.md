# Grade 4 Lesson 10 complete-migration template contract v5

Evidence date: **2026-08-04**  
Status: **fail-closed-template-not-stable**  
Template stable: **false**  
Fingerprint: `dd7d74990dd518cdd98c73ba14317b133027e09ae7a64d8ef6c8cd1f11cd2e68`

## Outcome

V5 preserves v4 byte-for-byte and rejects/supersedes it only as a currentness contract. V4 bound fixed completion/release ledger bytes but did not invoke the authoritative generator functions. Those ledgers were later lawfully regenerated. The preserved v4 reader therefore correctly fails closed on its old epoch, while v5 rehydrates the same 375-binding semantic snapshot, replaces only those two ledger bindings, and reuses v4 `deriveContract`.

This successor proves currentness, not completion. Template stability is **false**. L10 remains **0/47 strict-complete** and **unpublished**. Every acceptance, integration, and publication effect remains false; downstream remains **DO_NOT_APPLY**.

## Preserved v4 artifacts

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| Generator | 24180 | `1b0c4300683014c45ee1c2bd80c4a2ef95003e9e38fc10bfb4599b68cc995341` |
| Tests | 6174 | `332cc3ac0bdcde1e15615b36c15024551beea9dbfc11eb190b4d5d450a1c1cdf` |
| JSON | 218067 | `c8a64fdf766efb56ef03c936fc2e6c9fd0179f81d780ab3d1a5042c1f815f261` |
| Markdown | 63980 | `e913ac52e305769d71ffe1caefd7c873f806746edf6869a2972459c41335b9e8` |

The v4 reader was reused and produced the expected fail-closed ledger-epoch rejection. Its derive function was then reused on the exact rehydrated v4 closure with the two authoritative-current successor ledgers. No v1-v4 file was rewritten or deleted.

## Authoritative ledger freshness

| Ledger | Checker result | Exact bytes | SHA-256 | Relevant strict/published state |
|---|---|---:|---|---|
| Completion | current; expected = actual | 122550 | `3b0a159ea3860d383b89582abd605bcfbe8933ae3bdfeb3e19bc42acdaa1f2db` | repository 0; Grade 4 0; L10 0 |
| Lesson release | current; expected = actual | 102724 | `1315e554a94a0461d365c50090f91a09e3d83724826d80a006bccbc8159c9fbc` | published 0; Grade 4 published 0; L10 0/47, unpublished |

The proof is generator-derived, not a JSON-shape or fixed-hash assertion: `checkCompletionLedger` reran the canonical strict validator across 215 migration directories, and `checkLessonReleaseLedger` regenerated the release projection while verifying the exact supplied completion-ledger bytes and marker.

The three recorded code hashes bind the invoked checker/validator **direct entrypoints only**. They are not a recursive semantic-code or package-runtime provenance closure. The currentness claim rests on the live authoritative functions actually executed plus exact expected/actual ledger bytes; it does not claim that every transitive validator or runtime dependency is separately hash-bound by v5.

## Native-helper v2 design boundary

The optional design document at `docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md` is deliberately outside v5's exact input closure while it evolves under separate review. V5 binds no design approval, implementation source, helper binary, policy, reproducible build receipt, protected-install receipt, or execution authority. The optional design closes no P0 here, changes no acceptance gate, and does not alter **DO_NOT_APPLY**.

## Formal state retained from v4

- L10 release denominator: 47 members; 520 bilingual requirements; 44,488 frame obligations.
- Authoritative original-runtime frames: 0; RMSE results: 0; checklist checks: 0.
- Recursive local candidate-code closure: 53 files.
- Digest-declared runtime assets: 24 files with zero recorded digest mismatch.
- Source custody remains the only satisfied gate, with source-custody-only effect.
- Grade 4 course audio closure still has 16 SHA-unresolved MP3s; L10 has 0 of those 16.

## Bound inputs

| Path | Bytes | SHA-256 | Mode |
|---|---:|---|---:|
| `catalog/alignments/g4-curriculum-runtime-dependency-map-v1.json` | 2272953 | `05357658e7c5f70b9d305ea64063130f1b1d816663748af45cfa1950319a670b` | `0644` |
| `reports/g4-l10-animate-authoring-audit-index.json` | 81971 | `6ccd3d19d1acf1b8a44c22e8e9ce2dc369b038dd346a6a452d442db9f0802f44` | `0644` |
| `scripts/build-completion-ledger.mjs` | 10642 | `922e8bf742c6916e492163b0c4787a71365d1d83177c02ad810b8f2f2fbd6ca0` | `0644` |
| `scripts/build-lesson-release-ledger.mjs` | 22577 | `c1881ab81ea897d3ac616abdf590644d9e773ccd47d1b810808160f153148a50` | `0644` |
| `skills/flash-to-js/scripts/validate_migration.mjs` | 165346 | `fdf214b3accf42d6801231bc4c6b5dd6ae9de32e7cb89f1f471ca838bc64d36d` | `0644` |
| `packages/demos/src/modules/course-g04-l10-fq-002.tsx` | 948 | `c5d8a2276676df151f89c0f44673ffa60fb3bef5b7b734f54a07ec32bf538fcb` | `0644` |
| `packages/demos/src/modules/course-g04-l10-fq-001.tsx` | 948 | `a473cea888ec99798b90c43284ae789b7e25f38251c3b8d34e0f9d03ec0cd1bf` | `0644` |
| `packages/demos/src/modules/course-g04-l10-fq-003.tsx` | 948 | `0ced69ffe146b1a03e1f9fccccaf0692f24e3c87422236041cef6e25dba870e9` | `0644` |
| `packages/demos/src/modules/course-g04-l10-in-006.tsx` | 948 | `dac5e607ef832c78a324aafefa95268e8fefd9b8465d900f2e23b282e87b5ac1` | `0644` |
| `packages/demos/src/modules/course-g04-l10-in-008.tsx` | 948 | `4260891dbdca9afcceb7edb54d33edc0e180ea1f41c61b355af40afd02613d35` | `0644` |
| `packages/demos/src/modules/course-g04-l10-in-009.tsx` | 948 | `7f56156647e8573871345ea60c05ba9135ed782908e8fcf89634f34ca9e8aa5b` | `0644` |
| `packages/demos/src/modules/course-g04-l10-in-011.tsx` | 948 | `f5bcb60f04fca93ff343059ff795f039995581f3268b2848009db6c80a152f0a` | `0644` |
| `packages/demos/src/modules/course-g04-l10-in-013.tsx` | 948 | `3520f669ad0459ce585347df25d5f6c849a84ffaee45423e97f740a1534f2f79` | `0644` |
| `packages/demos/src/modules/course-g04-l10-in-016.tsx` | 948 | `d6d69e40acc0036a768006efa9b9eefaf85d45b1b5790124cfd471c13132f000` | `0644` |
| `packages/demos/src/modules/course-g04-l10-ir-001.tsx` | 948 | `f7003c72f16130d12e9eaf99221c388c947fe8ffadf442d9c49aacfffd090f75` | `0644` |
| `packages/demos/src/modules/course-g04-l10-rw-004.tsx` | 948 | `76d2278ce1951978438670792a2ed0a5da0a9c5b870b28a09c963db034c1c13e` | `0644` |
| `packages/demos/src/modules/course-g04-l10-ti-003.tsx` | 948 | `5179d7bd960530a9bda8ee6badc95cac054ba9465c0e842b2f6886526cce3817` | `0644` |
| `packages/demos/src/modules/course-g04-l10-ts-006.tsx` | 948 | `15d06bb6f9f5b25d1f7c7ceb63cca67fcbe8c3c97c9d690c0ea230cc689b3c4d` | `0644` |
| `packages/demos/src/modules/course-g04-l10-ts-002.tsx` | 948 | `87d097e02bfbb7ede2ae7d0bbfe9c4c5723251bafc7e620c710352dd8f0866f2` | `0644` |
| `packages/demos/src/modules/course-g04-l10-ts-005.tsx` | 948 | `bd9c9d63e2f77545a5cb9eab030c0654d0c575de8f1aa8c3db44c40ceb1fc13d` | `0644` |
| `packages/demos/src/modules/course-g04-l10-vb-002.tsx` | 948 | `0977c15039d7cceaf2e6e40ffb3bb06ce2996a8efe134ffba191767bf89e48e5` | `0644` |
| `packages/demos/src/modules/course-g04-l10-vb-003.tsx` | 948 | `968193885718f47516043f9418769953cb71b30c98f98dfa250852058633a255` | `0644` |
| `packages/demos/src/modules/course-g04-l10-vb-004.tsx` | 948 | `0ca93429e48f2487ac779456709570d3f554c4fec0d43ccce42a610151b6159a` | `0644` |
| `packages/demos/src/modules/course-g04-l10-vb-005.tsx` | 948 | `a14a795109f8b969db3c6f31698c1d2a5e29382515f9765cd04db85488ee279b` | `0644` |
| `packages/demos/src/modules/course-g04-l10-vb-006.tsx` | 948 | `0ebfd77cf3e4d5877e5dadfd9c60f0ba762bd8eb967b02c7bc358d6d2c168607` | `0644` |
| `packages/demos/src/modules/course-g04-l10-vb-007.tsx` | 948 | `e66a5849ae96024076538ef4d00c8eb23d531a4b0a6ff02d5b9b9cac20d7cf2d` | `0644` |
| `packages/demos/src/modules/course-g04-l10-vb-008.tsx` | 948 | `8f889216e8167fcc5674317bd001babad8b65869aee6dafaf1625244ba057898` | `0644` |
| `packages/demos/src/modules/course-g04-l10-vb-010.tsx` | 948 | `8b65bb6c025df7090394d98eef223d17ad39c19e2ecdae1ef835f9bb7cefe84d` | `0644` |
| `packages/demos/src/modules/course-g04-l10-vb-011.tsx` | 948 | `63b1d02c5767736a45b8e5c1da725a32cf6d7323667c2dbd38368357a27c5c8a` | `0644` |
| `public/flash-assets/courses/course-g04-l10-fq-001/canvas-renderer.js` | 309304 | `42b26bbc248df9c1b699b289cbf630161455744e9ba12629b347fe8ff58efaf1` | `0644` |
| `public/flash-assets/courses/course-g04-l10-fq-002/canvas-renderer.js` | 1189659 | `1155bb2a8a59b83076e4265581631c11e22ccc5b3c697842ac363ac18920cd38` | `0644` |
| `public/flash-assets/courses/course-g04-l10-fq-003/canvas-renderer.js` | 1189659 | `68d093253fcbf6e9c07f737873776823810402e4a5f00934ea674c4139fe51b7` | `0644` |
| `public/flash-assets/courses/course-g04-l10-in-006/canvas-renderer.js` | 3111333 | `8bbdd8f8e8e69cee85af8c48f8bd688ad0c5c4b6ce1ad9d3e3cf4dc64ba9e115` | `0644` |
| `public/flash-assets/courses/course-g04-l10-in-008/canvas-renderer.js` | 1585121 | `97c664f3b5971e934b958c3baaafe82e9d254e913a3625364756e308ddf9c53f` | `0644` |
| `public/flash-assets/courses/course-g04-l10-in-009/canvas-renderer.js` | 5412118 | `0a2c8054c5aa322a57ffb70e6cccc2e4b745ba76c97b9a6912c46ae8a320d84d` | `0644` |
| `public/flash-assets/courses/course-g04-l10-in-011/canvas-renderer.js` | 939337 | `89c85ea34796fccd6b80347e6604153e5c5ceeb2d0ea6d52dfa1c7722e78ef17` | `0644` |
| `public/flash-assets/courses/course-g04-l10-in-013/canvas-renderer.js` | 3133269 | `c792c07a889e9c6b5a6c463105b810ec802e99975ba217c4690298141f4dd5de` | `0644` |
| `public/flash-assets/courses/course-g04-l10-in-016/canvas-renderer.js` | 1490702 | `4659e8d24b5e9f24d178579534bb8605a9e22395da6593f9625e97eefdedbc02` | `0644` |
| `public/flash-assets/courses/course-g04-l10-ir-001/canvas-renderer.js` | 480490 | `9112be5f3edb12bb0d6a1ecc7e04ddca28a21c253f42cd9c5dea3d87c6a8f10e` | `0644` |
| `public/flash-assets/courses/course-g04-l10-rw-004/canvas-renderer.js` | 8898262 | `8022a71bbeb80e8f3d6c6d53321e9943ed0dd69179a2fd54f4c4677463d27bee` | `0644` |
| `public/flash-assets/courses/course-g04-l10-ti-003/canvas-renderer.js` | 5323563 | `44090fbb7c07ddd6f9970e7185bcb2f90c5d3ac02e1205890b1972a2aa02ea69` | `0644` |
| `public/flash-assets/courses/course-g04-l10-ts-002/canvas-renderer.js` | 564235 | `a5dae5ae14de393370be24426dab15753060100bb5095bfaf2463a02cdfab0f9` | `0644` |
| `public/flash-assets/courses/course-g04-l10-ts-005/canvas-renderer.js` | 564887 | `58c8c0521f89e175f4ffdc25a0b2170fed86b88b4d5227fb643773b27b2d3525` | `0644` |
| `public/flash-assets/courses/course-g04-l10-ts-006/canvas-renderer.js` | 266166 | `ba4ab8464a6351576ee17bcd3ea0a542a0589652b9c6038b1da61328c02b2695` | `0644` |
| `public/flash-assets/courses/course-g04-l10-vb-002/canvas-renderer.js` | 1023213 | `d7561232bf59c58bf42c6088523826a7c5804cb7ae67dcbbe3cfa64de245adcd` | `0644` |
| `public/flash-assets/courses/course-g04-l10-vb-003/canvas-renderer.js` | 1400676 | `5923392682aa868e7348e31c3db7bbab1d1ef34861c4af641b0ac71385b583ee` | `0644` |
| `public/flash-assets/courses/course-g04-l10-vb-004/canvas-renderer.js` | 556286 | `6f6c089a92fd28fd1c2d547f51506932af6077935dc867eb86afc22453d52453` | `0644` |
| `public/flash-assets/courses/course-g04-l10-vb-005/canvas-renderer.js` | 489405 | `ebcf3af43c3998c99f8eb34f2af00240b2856a4aea31bf68eb96926f27f8dda9` | `0644` |
| `public/flash-assets/courses/course-g04-l10-vb-006/canvas-renderer.js` | 2898047 | `95bd749be5a31d68bb6ac296efb90b36d1b6784b288ab20db0db226b0867f614` | `0644` |
| `public/flash-assets/courses/course-g04-l10-vb-007/canvas-renderer.js` | 1432951 | `cc2fcdf8de2c1da29dd5c8edc88565e197371c821509a6660c59a68a2fbba3db` | `0644` |
| `public/flash-assets/courses/course-g04-l10-vb-008/canvas-renderer.js` | 2064437 | `8a6b258c53757ffaba7617547918f03d5f13d1284a14a9dc7bff2f4d1a12beca` | `0644` |
| `public/flash-assets/courses/course-g04-l10-vb-010/canvas-renderer.js` | 412590 | `7a4e594e6b53e5eafd455d0fb6afefdd29e4ee1a1d6de29fe54f605bc1e8c961` | `0644` |
| `public/flash-assets/courses/course-g04-l10-vb-011/canvas-renderer.js` | 354016 | `0315d7255b5333cbbea8e8d25af42b8c8351a537ab6cd5032b3c5466a58b2947` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-fq-001.ts` | 2656 | `276fc1ea1e42d6bce09088dd8cbabee1e5b58344b947d88a870c35977b414ae8` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-fq-002.ts` | 2652 | `1131c94eb145df8c6dfc6d8c126af5dd104dba401ee178bbc087a63c034e11b5` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-fq-003.ts` | 2652 | `90ccad896572530e46809deb5247fbe84fa112e3dac8d148b80643cba4b34bb1` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-in-006.ts` | 2667 | `4ef9df94e7d1af6fddfb30dc120015518e87d72663073fa217d35b26d92a7161` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-in-008.ts` | 2683 | `baef37a13749ed7a964e8857a69314b9e7c304d43b7e7c70b89002940bd8b25b` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-in-009.ts` | 2651 | `b2adfa619ac62f443e26a89a200291839c44372f549364166494900d725a26bd` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-in-011.ts` | 2662 | `ade139675ba9f188d96a12df8126f216d83903b09acbd86555aed9bf6ef3f90a` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-in-013.ts` | 2680 | `7da5a039c8be0adb9748d9f05aff76f30c1b109d81f225bf373f441d5c330262` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-in-016.ts` | 2674 | `b55d0af507df294c0cb9341edf2d8d1886de3ed647e118117398a7d176b1e54a` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-ir-001.ts` | 2657 | `5b1dc9c4857693e13228e1d9f6eaeeca8d4b19153da0a9435fd7aa2b46f166c5` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-rw-004.ts` | 2656 | `d7e6f4a16d67adef40efb4f2479def0b0caa6af9a6c58dc0fac0135d6d6e79c6` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-ti-003.ts` | 2669 | `60057c54e637ab004fa7296ae5f4c44362c9086c10ee6dc9a30898ee2d555018` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-ts-002.ts` | 2659 | `c13c7d4431c730654068777bcacedf20d39857464b9f38abc1021aec94a14d53` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-ts-005.ts` | 2660 | `3031987dd3d2d8ca356b3fc3c0d420f59e8a896dd7557a69faebd4ab72048549` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-ts-006.ts` | 2660 | `12086c83e1d5a8d3357d7b3e9062e0e812acbbbc74fbde125a623ead080a0c07` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-vb-002.ts` | 2653 | `5fcf30ff5ab60ded77ee831913beb5ceb3896e041b65e28363267d17501fa56f` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-vb-003.ts` | 2668 | `96c5f0384e912777107481f586dd7065d5c33e24d0e8723426ece23dfafb3342` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-vb-004.ts` | 2652 | `2806d5903fb8212db9f9184ecc04842bd28430e63a7bf862fd1191965719010c` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-vb-005.ts` | 2651 | `200630a4650f0275ebc5c190e42fa850f6000f175e7d055c83abe8c31b68e770` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-vb-006.ts` | 2670 | `928ecd79a544194d96a3e838ed70116632517a0a1cfea43accb5a7fcf119d2eb` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-vb-007.ts` | 2670 | `7f4629e199b6917c4207860a0d4d62a931aa7677f88458909e9d32f5ff2a8e61` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-vb-008.ts` | 2656 | `e23287cad332f68531e45c878b79181a7caafbe1f4c95e3d3b21c7381f246769` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-vb-010.ts` | 2658 | `1365d20900fd5c32c62d711b76d93f5bb859e11cfa1b44b24dd724c3ea798d66` | `0644` |
| `packages/demos/src/timelines/course-g04-l10-vb-011.ts` | 2654 | `ebc5236358df627bd03ffbd3783987fafa5f2b82fbc2a674d896a19fdcaf7f98` | `0644` |
| `packages/demos/src/contract.ts` | 8064 | `6d76b0237a1ed7e7b003791fa3a63023b1b8bab79079125bf2b9e24418daf0c5` | `0644` |
| `packages/demos/src/g4-l3-main-timeline-audio.generated.ts` | 33223 | `11be1bad01221721fec0342e6eae9d552b2c50ca62daeb466533ac0f7701f461` | `0644` |
| `packages/demos/src/lesson-host-contract.ts` | 13881 | `ea99edb75eb61779c08c4928ef2296922eb94f5ed5da52dc2e0180b96f3bb4c9` | `0644` |
| `packages/demos/src/source-static-candidate-authority.ts` | 817 | `8c8961ffc8e44e140be2c1871edb43bc7e34710872ae825c5e89ca7a3dada95d` | `0644` |
| `packages/demos/src/source-static-canvas-candidate.tsx` | 37696 | `c2ef68a8fa7911099cd1d7dbeae30050cf43c2cbdb37f1a8f2c1aa5ea14ac2a0` | `0644` |
| `catalog/completion-ledger.json` | 122550 | `3b0a159ea3860d383b89582abd605bcfbe8933ae3bdfeb3e19bc42acdaa1f2db` | `0644` |
| `reports/g04-l10-formal-migration-continuation-2026-08-02-v2.json` | 7364 | `69d41766d17acb0b728bbe24f09f6f1a3cee15119860e226185e140cbe0b8d85` | `0444` |
| `scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.mjs` | 118924 | `0d2aeb203281fc350b5e440b9669ca995aa6be17ad8e28784b8956b53436754d` | `0644` |
| `scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.test.mjs` | 44992 | `e68d8cf06a984371b17c41364fab54ab464b2a69aa570849915a93b3b96dd928` | `0644` |
| `packages/demos/tests/course-g04-l10-source-static-engineering-candidates.test.ts` | 17128 | `a508fe07db73ad75e3bbf3331f03ace1b2f29820d6660a632c20bb5003198130` | `0644` |
| `output/playwright/g4-l10-fq002-current-js-engineering-diagnostic-v1/capture-manifest.json` | 70005 | `088e97a58c0f6991428d9f064b57f490dd66eb1f8578b74a48f1287cf7e68f09` | `0444` |
| `packages/demos/src/registry.generated.ts` | 14545 | `f703ab555cd02fe98879398c1011caccde7ed8c7cbdc178c373a0ae5bfb399ce` | `0644` |
| `catalog/lesson-release-ledger.json` | 102724 | `1315e554a94a0461d365c50090f91a09e3d83724826d80a006bccbc8159c9fbc` | `0644` |
| `catalog/lesson-releases.json` | 115651 | `d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf` | `0644` |
| `migrations/course-g04-l10-fq-001/audio-inventory.csv` | 154 | `bbae8148f1753f228e69c4d86dd415a47d3be7c30f5c49246e58328641ae25d8` | `0600` |
| `migrations/course-g04-l10-fq-001/ACCEPTANCE_CHECKLIST.md` | 5427 | `9ab54d636218aeffbbbd170c0c2fe84f86288642b7e6f036922f5e8339483829` | `0644` |
| `migrations/course-g04-l10-fq-001/evidence/full-frame-coverage.json` | 12724 | `5ca000b5d5666de77f479e8b9eeea460ca58d232c47c21fe4dfdda317aa30433` | `0644` |
| `migrations/course-g04-l10-fq-001/migration.json` | 8696 | `370d465113e3f4abbed506fe16b18d9a05120e760da6b2c6a123f492d785f243` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ01.fla` | 356864 | `3eb3d315f9ff22ba08138ef6fdf64e7c64bcc66402afc5630a9c14a1c9c8b6f3` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ01.swf` | 18227 | `e61c2020d7f0b37ba9975c9981aa745cc8a21fb0f36f9581e32e6ebb711dde65` | `0500` |
| `migrations/course-g04-l10-fq-002/audio-inventory.csv` | 154 | `bbae8148f1753f228e69c4d86dd415a47d3be7c30f5c49246e58328641ae25d8` | `0600` |
| `migrations/course-g04-l10-fq-002/ACCEPTANCE_CHECKLIST.md` | 5427 | `b736d4e389c7353d3b76c03261c36b33deba7128fc29427b986a6167607b1266` | `0644` |
| `migrations/course-g04-l10-fq-002/evidence/full-frame-coverage.json` | 26788 | `23609b225d25a06eab9d0ab15eeaf59487c5b6d667ac8d876ff3a5137924cc1c` | `0644` |
| `migrations/course-g04-l10-fq-002/migration.json` | 13414 | `40c64b5ff4a694d08dc96f2c82979cca57eeb7b483677fcb44516faaefc40793` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ02.fla` | 3346944 | `c73eaa76438956aaac0aafd013e10ae7f3911b9a18b94047bf6b8bf4e27e229a` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ02.swf` | 47350 | `850ddbc1aeda20aa782d614a4ad44aae7e2ac8242b47fc27882860208c99d9ea` | `0500` |
| `migrations/course-g04-l10-fq-003/audio-inventory.csv` | 154 | `bbae8148f1753f228e69c4d86dd415a47d3be7c30f5c49246e58328641ae25d8` | `0600` |
| `migrations/course-g04-l10-fq-003/ACCEPTANCE_CHECKLIST.md` | 5427 | `40788aad0e4c783b6549d2cfa733c87361931b335b7659d7bdc60e28310a924a` | `0644` |
| `migrations/course-g04-l10-fq-003/evidence/full-frame-coverage.json` | 26788 | `55818f93797157020ed37bd4387059f1a37e665473181c4706a59f0b169cb166` | `0644` |
| `migrations/course-g04-l10-fq-003/migration.json` | 13414 | `54fd9eeb5afdec64796763e95762cd34d09fa03ad4e3d17ea5e84de4eae654f0` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ03.fla` | 2260480 | `cea922485510af755674585250b4b93a7433dd347828df2fe77d7db331014dd1` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FQ/L10FQ03.swf` | 46926 | `afa03a2a134bb5b1fe91fd3b2847b751cc65a07b0250940fca3a01e215976c39` | `0500` |
| `migrations/course-g04-l10-gs-002/audio-inventory.csv` | 5121 | `ebbe979f85c475fb734b25b85b6c8aeeac1ca540f393d82245f029e7c0e73482` | `0600` |
| `migrations/course-g04-l10-gs-002/ACCEPTANCE_CHECKLIST.md` | 5427 | `270b0319f0374f70abeeb4df88b34a1c51d78855f8b9bf8b3c954378df6492c8` | `0644` |
| `migrations/course-g04-l10-gs-002/evidence/full-frame-coverage.json` | 121147 | `26afb0a7f4c2cc47c74da3204fefc0d236281ca34cc4f45078adb8903abf39d8` | `0644` |
| `migrations/course-g04-l10-gs-002/migration.json` | 30479 | `c8c4bd31f58294093e4decee73137fcbec0cbae5103b536d27e7dca958865ee1` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/GS/L10GS02.swf` | 1164851 | `e7a473748005f43a5af8cc04ec72719752ea6b6751d0da190be1acde44d9ad9d` | `0500` |
| `migrations/course-g04-l10-in-002/audio-inventory.csv` | 1325 | `f722970caded217aac46434db638d0525402766771a9ccb70927295594de6659` | `0600` |
| `migrations/course-g04-l10-in-002/ACCEPTANCE_CHECKLIST.md` | 5427 | `b75e7ede16df7103dd2eee04b93e6d721c46e1fcf549e9e1553d5d1f7f895bbe` | `0644` |
| `migrations/course-g04-l10-in-002/evidence/full-frame-coverage.json` | 7779 | `d3e6fc5f40b0d9eef781a646a25ad33c3e5f2f01b269c192103439fe83013085` | `0644` |
| `migrations/course-g04-l10-in-002/migration.json` | 6863 | `c09e6f37aea8c1bc023e5fe9dce0dd0c1a47b8a8c2b0669ffdfe93ce6f753466` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN02.swf` | 337010 | `6d72ff40eca309470e8edab115105cef6fde9134b81ede0a4bb48b80d82b538b` | `0500` |
| `migrations/course-g04-l10-in-003/audio-inventory.csv` | 2943 | `4962b6efd947192cd78591732cb64dca81de5b48dbc083f1cc150528db43b315` | `0600` |
| `migrations/course-g04-l10-in-003/ACCEPTANCE_CHECKLIST.md` | 5427 | `c8f46f71c41728102baf9eba7467dd74a485a76de1d812bdf308c7fbec9a70cd` | `0644` |
| `migrations/course-g04-l10-in-003/evidence/full-frame-coverage.json` | 35519 | `99ae1558530c58bd141fae03228c1fcaa69601f96fabbf8d53c9a7043a5182c1` | `0644` |
| `migrations/course-g04-l10-in-003/migration.json` | 13635 | `6479b0afb0f12bd9601e895c8d14030374967d469bcc6a6864cb08ce2646bcd0` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN03.fla` | 1747968 | `9630242fa590cfa2000fd5e68a329a5f48a935f216abb478f3922c74aa094aed` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN03.swf` | 176429 | `4bd6c332318774ca1f4d1adeb7057733d96bc4287e9230901103930ac5fa55b8` | `0500` |
| `migrations/course-g04-l10-in-004/audio-inventory.csv` | 1327 | `57942520b6401e4f2785c38ad47be3fb02a51a1ce9a755efea96594b11aaef30` | `0600` |
| `migrations/course-g04-l10-in-004/ACCEPTANCE_CHECKLIST.md` | 5427 | `d5d61d9fb9a79e1719aa5f6622b448d5f232e93448a0e2a19bdb485d95f7ff20` | `0644` |
| `migrations/course-g04-l10-in-004/evidence/full-frame-coverage.json` | 7781 | `08c84f50e5ce61e592c2d1c164b9e41b5b54a3f6a93b93d12e3a6826645d5ac7` | `0644` |
| `migrations/course-g04-l10-in-004/migration.json` | 6799 | `39d3b34ade7c37e6179ddd8f36b0e82ea559dcd140ab718631c9951f25e43cd7` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN04.swf` | 342915 | `8d1387c5a450ed8c0ab8a430632578d69b80460825677fa6b47787a32b8387f8` | `0500` |
| `migrations/course-g04-l10-in-005/audio-inventory.csv` | 2949 | `049283dff267d0d9e9a7e842ede9b0798836169d9145fe73275f3a6b87194988` | `0600` |
| `migrations/course-g04-l10-in-005/ACCEPTANCE_CHECKLIST.md` | 5427 | `ccd10ee81bd9aa8ea972dc80d5d6c0c4c498b9aeb70d79de652ee6c105819aa4` | `0644` |
| `migrations/course-g04-l10-in-005/evidence/full-frame-coverage.json` | 40079 | `125f0ce72c4ca75466e0426d6adb0a08caf03e2c75f906be74e4d3ad261454ef` | `0644` |
| `migrations/course-g04-l10-in-005/migration.json` | 13510 | `d8a2b877b8799eb731b4ecdd99ad3af645ea37c28150360f5491ea3600162593` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN05.swf` | 229779 | `4b67f66ddbfc5c43d85eb2343affdb3dde3fc57a9840fbbb8cb0003b25d95d5f` | `0500` |
| `migrations/course-g04-l10-in-006/audio-inventory.csv` | 6735 | `2cbf23313da78a306f6a26cf1184deafa811d35827a4945d613764a076500f99` | `0600` |
| `migrations/course-g04-l10-in-006/ACCEPTANCE_CHECKLIST.md` | 5427 | `2d4120470591bc31aae474e13a352f9453305bf7e481528812521394477151af` | `0644` |
| `migrations/course-g04-l10-in-006/evidence/full-frame-coverage.json` | 58890 | `ba1888f2b9e6d49baf9d81162c2c149b3531f73f7fd3bc6320108e23732bb5bf` | `0644` |
| `migrations/course-g04-l10-in-006/migration.json` | 22893 | `a235c352b3ffb15fc9fd7dd41cf97c3ab951e2cb7b781431623f277f7226f17a` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN06.fla` | 3102720 | `e6c02646dc0b170442375d96f2a98b27a08112478d7a31519bedd451b60926c0` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN06.swf` | 819715 | `6fc6b139221628b7035d42e404fe4de7420f9b487d2e64e63431ac096297a51b` | `0500` |
| `migrations/course-g04-l10-in-007/audio-inventory.csv` | 1327 | `80fd7d2ca9a6c07a46f796429b9d53d21249dde86f331afc51d24a74f7973d42` | `0600` |
| `migrations/course-g04-l10-in-007/ACCEPTANCE_CHECKLIST.md` | 5427 | `abe3d7678f9aebb7a8886668dfe791310fae65467035af65811b4f198d5d95e9` | `0644` |
| `migrations/course-g04-l10-in-007/evidence/full-frame-coverage.json` | 7781 | `2b3703ada15251d189aaf1317862550628e59b31711c3b1079b5c7c22ff205dd` | `0644` |
| `migrations/course-g04-l10-in-007/migration.json` | 6863 | `5bc57e4ca2673b6081876a7adc555fc07228904798f3921011893439e42f7166` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN07.swf` | 366716 | `a8f102560e35eea74b1b281aad05c7f860d789ac81e860a61fc685f0f8e672da` | `0500` |
| `migrations/course-g04-l10-in-008/audio-inventory.csv` | 6736 | `9d5a06d196961ad8d1a0fb9a74a9467059574c76cfeb551a79633a69ba160a75` | `0600` |
| `migrations/course-g04-l10-in-008/ACCEPTANCE_CHECKLIST.md` | 5427 | `e5975af2e5550694c0034af7bf3cca1760f5887f6d00e36fc7f3eff349871266` | `0644` |
| `migrations/course-g04-l10-in-008/evidence/full-frame-coverage.json` | 58406 | `88fd103c1664269ff0219e6c140cc8ffdd90c1eacec39efacdcb1115efe6aa21` | `0644` |
| `migrations/course-g04-l10-in-008/migration.json` | 22961 | `0286128362ecd40569752a956c3dcb10dd1eb4f541c36ef925b3055de4f176a0` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN08.fla` | 2098688 | `30a91bf0b0180ec312a59f4c21e033d45cebbb344a2ce2fee6c2a063943b80cd` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN08.swf` | 213973 | `7f089cf7aa466477a103341fca1bd87fde93fbb94eab32fdaac10f7b08a94d2c` | `0500` |
| `migrations/course-g04-l10-in-009/audio-inventory.csv` | 1325 | `327683ce180167dbcea90699a423516562a23cc8dfcbc5002a10b66111196d92` | `0600` |
| `migrations/course-g04-l10-in-009/ACCEPTANCE_CHECKLIST.md` | 5427 | `6fb0659f0b1eeac9990a9c114d396db5d92457fe66256c2b08bf373d8ff325d9` | `0644` |
| `migrations/course-g04-l10-in-009/evidence/full-frame-coverage.json` | 7779 | `0d9575e763c478fe09c54621a665d8c8bffb3469733993ba753a8710839d92c7` | `0644` |
| `migrations/course-g04-l10-in-009/migration.json` | 6850 | `2df6e21ab8fcb75b5898bef4053367270bd6e2de8a90bc15cf29bb06767bac3e` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN09.fla` | 4302336 | `235081c52ea65826abddf9691aa3af6af5bb38944755ff20d2c1040b279cccec` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN09.swf` | 362032 | `6ab0100d0db4f3460fe71f836325cc821a5285b82ce470bfc961314a69ce7ef2` | `0500` |
| `migrations/course-g04-l10-in-010/audio-inventory.csv` | 3487 | `377926b3b1cd5a247d0c6a83f417990a0c1b4262602c28ccbf381952023c48a9` | `0600` |
| `migrations/course-g04-l10-in-010/ACCEPTANCE_CHECKLIST.md` | 5427 | `fdf632147b35683f0a97638dcb2e47037e4c56dba8ee1d0b7a0a39046dac77e4` | `0644` |
| `migrations/course-g04-l10-in-010/evidence/full-frame-coverage.json` | 42881 | `4f538d02aab66ac9b1f9c331d614237c883f0420be176a178c684dc6bd381abe` | `0644` |
| `migrations/course-g04-l10-in-010/migration.json` | 15088 | `656b5ac0e48d296656a9cd888bf229f47e2bbcaf89437e5601fb246f3f93aabe` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN10.fla` | 2962944 | `d022be7f26b8fccade8945527a7aa63bfb252414dcd31a0dbeccbd1ee694ef77` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN10.swf` | 212558 | `6c39e74f67b6b1c678f5836fb204d750675118a46254facfae89c2455d66d726` | `0500` |
| `migrations/course-g04-l10-in-011/audio-inventory.csv` | 6739 | `996f2580eb1809200c862a90a65e0513c8ae4cb9eab82a1839b8d87b4f002571` | `0600` |
| `migrations/course-g04-l10-in-011/ACCEPTANCE_CHECKLIST.md` | 5427 | `ca76ae3ca5a5b91965a19f10c0c4e7586f627cb23a1ded589e4c36635a2fd805` | `0644` |
| `migrations/course-g04-l10-in-011/evidence/full-frame-coverage.json` | 57858 | `a778986b9aa14f2ace8c609380025212249d1a84ed056e5dff724c1b718c65cc` | `0644` |
| `migrations/course-g04-l10-in-011/migration.json` | 22874 | `265273f0444d4ba4fdf95d759168db9c01d70dee6a95179a82670728d2f1a062` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN11.fla` | 757760 | `aff70f494bafa30e5d4b4fd9275126b5a731c0454e290e631816af72541911d4` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN11.swf` | 131708 | `c74b02b496c913d7d60cdad2c0667b426c582078b2a4fc7fc7a880a44209e2d5` | `0500` |
| `migrations/course-g04-l10-in-012/audio-inventory.csv` | 1329 | `c61a7148127eb87a7337e8ea49c0b17af67d27f84c8e5a0de6f8d84ab2445441` | `0600` |
| `migrations/course-g04-l10-in-012/ACCEPTANCE_CHECKLIST.md` | 5427 | `2b8d72af1659dd800f68a9e98fa3b46aab2e58de3af5ea50090b4862172b7a07` | `0644` |
| `migrations/course-g04-l10-in-012/evidence/full-frame-coverage.json` | 7782 | `af8e1d6084e5a114a2a784a65c30231bd09315d2252a598ebe7cf9a9b51dcc35` | `0644` |
| `migrations/course-g04-l10-in-012/migration.json` | 6854 | `32e3dcff438257202cacf435c2d455aeb612ad8693bd7fd69c827681c59e71d7` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN12.swf` | 452556 | `3f2b5ae9f3eceb663422312fd3cf165cc707c74cc23584a4bc6f7fcb906aa29c` | `0500` |
| `migrations/course-g04-l10-in-013/audio-inventory.csv` | 6735 | `f065da40109431037833eb17c156fede399dbdd867e5ca728d8586627f7d19ef` | `0600` |
| `migrations/course-g04-l10-in-013/ACCEPTANCE_CHECKLIST.md` | 5427 | `e18188aa0834509c1a8af4dd8c411fffe6f75f8cc6f6b6ab1eab03e96827a008` | `0644` |
| `migrations/course-g04-l10-in-013/evidence/full-frame-coverage.json` | 58838 | `332afa0d6ace0d2bcf0059911df430b11467ffc80efe24c91ac1ea4613b1cbf9` | `0644` |
| `migrations/course-g04-l10-in-013/migration.json` | 22949 | `c0aa3d155d207afffce3e7d0d2d5f4325ab8a489018000d9c4fee40b8d61e680` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN13.fla` | 2396160 | `8f05b9b8d81208b2e41cfca7eec979bab6995853ec9bc8f9a9db730d88eec33a` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN13.swf` | 818689 | `61c2b91cc84de4bb4a9a732e6c087512dc93785b28abdd1cb6b9cdd8595f1098` | `0500` |
| `migrations/course-g04-l10-in-014/audio-inventory.csv` | 1325 | `0249d5ceda840e8bff284300da161d161df8643856dca5af8a6a3ed92e40088c` | `0600` |
| `migrations/course-g04-l10-in-014/ACCEPTANCE_CHECKLIST.md` | 5427 | `ee5956a11279c7ab8af350a73b269bc7cc0a219a9d1d8b33628792a44f4654f4` | `0644` |
| `migrations/course-g04-l10-in-014/evidence/full-frame-coverage.json` | 7778 | `c0045051e1e5da796b297db0b68be1fea1b09d1e856f6ec60d5e1cba2a545824` | `0644` |
| `migrations/course-g04-l10-in-014/migration.json` | 6835 | `cde83df493571839c60f3050c776fcb6b691786787ec19ff00564b21ab06946b` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN14.fla` | 3973120 | `f507e189b08f26eb6f4b3be6c8650abd5ba315d935d6b73c7ff53f44d212ec01` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN14.swf` | 298738 | `06ddeacfd5eb764f8b6f19c612fd6cfaee9d3661a2a4ea90579409ab6dc24c21` | `0500` |
| `migrations/course-g04-l10-in-015/audio-inventory.csv` | 1325 | `ce6c32e5224ea9963daa410d52d101f9b3987eca90c622bfce879b2ca5dada6b` | `0600` |
| `migrations/course-g04-l10-in-015/ACCEPTANCE_CHECKLIST.md` | 5427 | `d93614ab6643a449fed6fa869479f934675c362c3f8f21c66f6e2afbf365b40e` | `0644` |
| `migrations/course-g04-l10-in-015/evidence/full-frame-coverage.json` | 7778 | `e09e773d1f8aed87c76ddf9124814dbd2f66fe26ba9ad82aff928127c0f16b1d` | `0644` |
| `migrations/course-g04-l10-in-015/migration.json` | 6969 | `74f599dfc82c435d70ec3b079d2a4c939070bb59157bc48e59172bb7864f346d` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN15.fla` | 3038208 | `cd6aab7cfef2cc147778aea491b7a65744536396eec0908ef4b84fd1a0cf00b9` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN15.swf` | 277686 | `2cd5470dacbf75e1a0799cb265a4cc6b4dd262db830abb5008cb0f689cf701d1` | `0500` |
| `migrations/course-g04-l10-in-016/audio-inventory.csv` | 6734 | `30efe1e276bfcf17d4334b49854f8adcc410b743f10d40441c73e805b0bd5d34` | `0600` |
| `migrations/course-g04-l10-in-016/ACCEPTANCE_CHECKLIST.md` | 5427 | `0912bc9034fe18da04e70eab42dd4a5b0b223eeffaad0367bb594135733ecd4e` | `0644` |
| `migrations/course-g04-l10-in-016/evidence/full-frame-coverage.json` | 57191 | `0244b2bfefd893156fa14f9f40fdf427d9baad23f8a43d58188a74b4767e2073` | `0644` |
| `migrations/course-g04-l10-in-016/migration.json` | 22958 | `4b345534443915b18dada6707bf0a4d9aa63917a747cb08ac44b04efaf12a36d` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN16.fla` | 2037248 | `d41477d7dbb6b728f83b8df7a8325cc66cad9a04c290bb52da64628a97735de4` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN16.swf` | 201435 | `a75e16f8707676152626d272643820076316029f9b1aa2e5b9938cf5f853e1d3` | `0500` |
| `migrations/course-g04-l10-ir-001/audio-inventory.csv` | 1234 | `cc41cd9f919b5e9a8a6dd3eb65a60be8c4c62f208e6e41d6fa21a5bd68035a94` | `0600` |
| `migrations/course-g04-l10-ir-001/ACCEPTANCE_CHECKLIST.md` | 5427 | `4e73d6dc0f1eaef34ba2e1b28148d1e8682c18e96ec91c268e40542de3d8333e` | `0644` |
| `migrations/course-g04-l10-ir-001/evidence/full-frame-coverage.json` | 29549 | `72d264f50c15130a2d3da8604700f3d232d24b76951e89c59edda57b3fb9b9d7` | `0644` |
| `migrations/course-g04-l10-ir-001/migration.json` | 11794 | `26b35a1007a10790c3f3690f85a9e08d2e4b583e1ccb27e076fc64b2c1d382c2` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IR/L10RW01.fla` | 612864 | `6c4261ad96af697f605d979f326db72617a139fbfa4b60474c6a211e7615059b` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IR/L10RW01.swf` | 58342 | `06c69a007c8c9cd2d5b6a928a9a67e34774b4f0cfec7892bfc7c709a91bf1e03` | `0500` |
| `migrations/course-g04-l10-rw-002/audio-inventory.csv` | 1328 | `efd12b00e49d9e336d2bc7fa47babf4ccf6c357466d50190280b1645be690e43` | `0600` |
| `migrations/course-g04-l10-rw-002/ACCEPTANCE_CHECKLIST.md` | 5427 | `f69743d4d234df86216104429bc73567c4ff64cb1098148e7d84d2784437d667` | `0644` |
| `migrations/course-g04-l10-rw-002/evidence/full-frame-coverage.json` | 40987 | `e317dd997b3181632afce1c0de64a454d56cdc677620d69edf4a05af934359fd` | `0644` |
| `migrations/course-g04-l10-rw-002/migration.json` | 9017 | `07ecb335206ad654c6069d98f6cdb5b7c3051324be111e25d5777d137c71eacd` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf` | 1865169 | `45b14745c04d452c71c7c7f9c99c26300a293d8d14f66afcd29a9ff590a01059` | `0500` |
| `migrations/course-g04-l10-rw-003/audio-inventory.csv` | 1328 | `836acaafda7cd22061539bcfe09d19ea787aec06c8b7c1ed56dc66602ab0f084` | `0600` |
| `migrations/course-g04-l10-rw-003/ACCEPTANCE_CHECKLIST.md` | 5427 | `c4e419f64736305ab987a5bd1ade3d3853ab8e72290253012cf9d9558d22e0db` | `0644` |
| `migrations/course-g04-l10-rw-003/evidence/full-frame-coverage.json` | 38579 | `fefc59bcc35d55241907fcf3da985ecfdf40b35169e6b233f59c92d5375be7d2` | `0644` |
| `migrations/course-g04-l10-rw-003/migration.json` | 9017 | `d67d7997e93fd4d8f1d4fa712509db33a2a675b645eff8f4d4546a1ef53d4bc5` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW03.swf` | 1189742 | `1e6a62a11fddd08c083d2a4556ff95f4fbb0e2447f442b7bdb264998dedba81e` | `0500` |
| `migrations/course-g04-l10-rw-004/audio-inventory.csv` | 1330 | `3b534c94bf345f3fadbb862d0542c3d03a59c8438568f75e3def38de86d5cda2` | `0600` |
| `migrations/course-g04-l10-rw-004/ACCEPTANCE_CHECKLIST.md` | 5427 | `1f495768e86603054d6dc6ad7518b88e975d4359926a1be97eb5cbe1719b0f87` | `0644` |
| `migrations/course-g04-l10-rw-004/evidence/full-frame-coverage.json` | 46391 | `b0491ea730fcafcd93d4375f18772f68688845cd727b76f7791d9b15146107fa` | `0644` |
| `migrations/course-g04-l10-rw-004/migration.json` | 9088 | `8abda128867214271fb8ec8eaf0396bcc60fa81216c93951cbef9c19ce4456f9` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW04.fla` | 3443712 | `08f5890a1175c72db509ce697d6aa0ec8e2e93e1ab8814cc3d021134aa64db14` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW04.swf` | 481721 | `8f0fe3a78ad9757b4388e0fd1f79e5e275914e5377d5e7be184ffa1779b63f95` | `0500` |
| `migrations/course-g04-l10-rw-005/audio-inventory.csv` | 1327 | `09c3ea57960864dec9a44e8b69089ba31702f05acc23b627ec4da998ff8cebf2` | `0600` |
| `migrations/course-g04-l10-rw-005/ACCEPTANCE_CHECKLIST.md` | 5427 | `75b625b8af7e8d5dd9b8721d2dccc43db66445b3ff37c7dea9d76ede5995fe2e` | `0644` |
| `migrations/course-g04-l10-rw-005/evidence/full-frame-coverage.json` | 35336 | `33985304e917826338f24499c9f0070d07c952284e903de0b876915320e3b436` | `0644` |
| `migrations/course-g04-l10-rw-005/migration.json` | 9016 | `5f35dd9708d338f717d91db0bd454d7244216cd5b0ce0416a9820c3e2c3ad79c` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW05.swf` | 1118195 | `d613b174aa73cb79e672079b658e17ff88b7b0da257e82eb644cfe8725834b40` | `0500` |
| `migrations/course-g04-l10-ti-002/audio-inventory.csv` | 5660 | `4620377cdf9f8d15152a652ffe1a7501e665df2a4b3cf62385103328fbe23d2e` | `0600` |
| `migrations/course-g04-l10-ti-002/ACCEPTANCE_CHECKLIST.md` | 5427 | `cb15b147848a5ec7ac68e8c4deb74406efb6b0ca08e0fdbbcc0960f2299dde7f` | `0644` |
| `migrations/course-g04-l10-ti-002/evidence/full-frame-coverage.json` | 67735 | `9ddbd94abb7fdd344a1289eadcb7657fd200a673547ccfec6642462278348d03` | `0644` |
| `migrations/course-g04-l10-ti-002/migration.json` | 24338 | `9c29661b871b0301fe1cb570f1f9eacee1f1379e818270694ec5f40efc41fac1` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI02.swf` | 217244 | `5562d0078de02f66ed37e336bc459d7e8012d9600fc7c33eee19a6e248b06fc8` | `0500` |
| `migrations/course-g04-l10-ti-003/audio-inventory.csv` | 5652 | `bf09aa56982804f83ef651755170af16e807544a0f33e4f117a960ea207a28b2` | `0600` |
| `migrations/course-g04-l10-ti-003/ACCEPTANCE_CHECKLIST.md` | 5427 | `a1d7eb4fe91b15882ead5f5f3372d8aca8a53af321bfd037349204dafa7139d7` | `0644` |
| `migrations/course-g04-l10-ti-003/evidence/full-frame-coverage.json` | 60157 | `3b17d4254622075fa116bbf1009bf8f268bdfaf6620bc922c87c8d6aa7c63731` | `0644` |
| `migrations/course-g04-l10-ti-003/migration.json` | 19817 | `f5898b14e1a90aac9314af9dd48a0b80f967a6982b15cb51708d92f7e35fdc33` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI03.fla` | 4519424 | `d413bb3380a0db033f162205e69d43cbb910ec5ae6607270bde201ec4ea6d072` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI03.swf` | 504828 | `57830bd6780ce5a2caa320042c80238ad54eaa019f65ff07a1c2471dcae9caf4` | `0500` |
| `migrations/course-g04-l10-ti-004/audio-inventory.csv` | 5663 | `9388f7d4199f14def994db5bba675e8d938de55f1f7c72d9a4487e232d64452f` | `0600` |
| `migrations/course-g04-l10-ti-004/ACCEPTANCE_CHECKLIST.md` | 5427 | `cae2756f3797bf121eb4c7fbe835aa9933b1ec93ce6ed7d2f486defafbd7601f` | `0644` |
| `migrations/course-g04-l10-ti-004/evidence/full-frame-coverage.json` | 60967 | `5b7f070749234a871e00a9ab6be91d03e56f02dcdcb14f1be2290b845932c1d8` | `0644` |
| `migrations/course-g04-l10-ti-004/migration.json` | 19823 | `52c406a88bf093ea66e51435a83043ac19e578142cbb3c6daed3470285bd97ed` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI04.fla` | 4467712 | `7ea410df6be541b7b3e2ad1632966c4c6fdab559a9a98ffe5478e8d8e89ad4fa` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI04.swf` | 748677 | `004d8dead784f263ee73417cbde2ee68206b338acba9d5dd7db420bff55af873` | `0500` |
| `migrations/course-g04-l10-ti-005/audio-inventory.csv` | 5663 | `150b45ed04638b970f25459de5ab9c3f8e6b2da7e91aac1a8e44a29c092ac426` | `0600` |
| `migrations/course-g04-l10-ti-005/ACCEPTANCE_CHECKLIST.md` | 5427 | `49d1c051596b2ccaad2759b756afa2662d77cd364a82fdca1f129ba2e8f08c5e` | `0644` |
| `migrations/course-g04-l10-ti-005/evidence/full-frame-coverage.json` | 59901 | `4b1ff559f6782c3a9c4499298f549a1a5206ad0ef54933271d171eb399916c4f` | `0644` |
| `migrations/course-g04-l10-ti-005/migration.json` | 19823 | `4744b3f7864cd0a17b40f3a8346a575c40a5d784c0357604ff51aea2b572f30e` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI05.fla` | 3956736 | `e758451b1b756e0cb1c0801eb3b0b61515c2baa2017f053b2d816ee3aa8f302a` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI05.swf` | 732059 | `dbbf0e7c4a38a7628320b0b6cbd315aab08f628b6357fec79c67a9a7693aaafa` | `0500` |
| `migrations/course-g04-l10-ti-006/audio-inventory.csv` | 3491 | `5fb0079542ddf62ce3b0ce21b6b61045e4bc34052e33298d3331a46f07b78afa` | `0600` |
| `migrations/course-g04-l10-ti-006/ACCEPTANCE_CHECKLIST.md` | 5427 | `5a1fd29b8a2489c88446363d040f8ef4fdb6809d7566e53fb684fc7ff895654a` | `0644` |
| `migrations/course-g04-l10-ti-006/evidence/full-frame-coverage.json` | 39296 | `61e9260ad17294e37e69f79f58ead7127f603287a2aa8855164db14b9fa520d3` | `0644` |
| `migrations/course-g04-l10-ti-006/migration.json` | 15095 | `14a35aad1b97de8df8911700538769b6e6ebcc0257e1e639c0c0445713742760` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI06.fla` | 3778560 | `c0a5c9a6c4664dc8f077b92bfdc489aad6ea213811e85c3f6bba903b2d41ffc0` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI06.swf` | 172562 | `96b4d947d94d89c9273dc96806cf93b38b5df0e2e78304cde540f89ce6a93759` | `0500` |
| `migrations/course-g04-l10-ts-002/audio-inventory.csv` | 1325 | `ec5799113df3827a9fa23a304c367714fa3075ace6231cc2f043eaf2d7e210e8` | `0600` |
| `migrations/course-g04-l10-ts-002/ACCEPTANCE_CHECKLIST.md` | 5427 | `986178a68bf02064f859844547e19637f22074b3dd61d2dc0a5e5d551c65409a` | `0644` |
| `migrations/course-g04-l10-ts-002/evidence/full-frame-coverage.json` | 19705 | `d885d36441d69dcd803ce4c3fec334a8b6b3a17a71724eb1de181b5f7eb7f280` | `0644` |
| `migrations/course-g04-l10-ts-002/migration.json` | 8974 | `92137fc9cde42d53df10512c77f2060e0606920b9b6e6367312eb5f411d62bd5` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS02.fla` | 1715200 | `cec688e616ec5005ae333edf2c90d3d64e4feb189c19369238aade7c62007409` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS02.swf` | 140199 | `852ef6a6f24e0666fe4d14d3bce63d0170f01c255c5f61e147db559895db032f` | `0500` |
| `migrations/course-g04-l10-ts-003/audio-inventory.csv` | 1325 | `a1c47931ff14f532c51868479c870098a440fb057de0bf8fdb1761921b2b7419` | `0600` |
| `migrations/course-g04-l10-ts-003/ACCEPTANCE_CHECKLIST.md` | 5427 | `364568efa4baa5aae691a8c9e00d2528017f4b8f2c15c84d900e93ed5af45d3e` | `0644` |
| `migrations/course-g04-l10-ts-003/evidence/full-frame-coverage.json` | 17182 | `b3a72be4b77a4788746342fa132a5f960e5335cb2e6456bac04c479c1bbfaea4` | `0644` |
| `migrations/course-g04-l10-ts-003/migration.json` | 8974 | `ebda9189214ccc2d4a95bea3630a12ce946d10e583b8127a1e48c455c334155c` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS03.fla` | 1068032 | `4a5fc3b270f1222f336e80a08250fb7e347da6f498b0e00a374fecaee5ea92f1` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS03.swf` | 95179 | `2dcad2e8fa1bc6908ee6ebe555ceccf85b5fe7ac170b652aa092c74b14740722` | `0500` |
| `migrations/course-g04-l10-ts-004/audio-inventory.csv` | 1325 | `2286d8ed096e9218ac8777edfc5dd3dfc93b57189837a0fdb55415176503c044` | `0600` |
| `migrations/course-g04-l10-ts-004/ACCEPTANCE_CHECKLIST.md` | 5427 | `ddc5f854d2a9b72dcb564e2d9ad0eaeb2fef2fae302e9f03209208ec823162dd` | `0644` |
| `migrations/course-g04-l10-ts-004/evidence/full-frame-coverage.json` | 18821 | `c23e0853c7713a7369b3c32a9777e4fa98b49eef93b405d00e0865e851fa17f4` | `0644` |
| `migrations/course-g04-l10-ts-004/migration.json` | 8975 | `a18a1978bba8bf15592b1c01077dd28b1164aebe102d881544e4a5270d7346d3` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS04.fla` | 1467392 | `3c2895d3a6c80fa7968e124af398658c8b8cdf69e0453f6e85c231992a7fc4bb` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS04.swf` | 122199 | `2286f867a166f82fcd17382df7d4800c3d996d671f629d6ffec103fb9ce878fc` | `0500` |
| `migrations/course-g04-l10-ts-005/audio-inventory.csv` | 1325 | `18f935a7826a4dda24076edd1511d29ad1ea163e486168f475996f30a377235d` | `0600` |
| `migrations/course-g04-l10-ts-005/ACCEPTANCE_CHECKLIST.md` | 5427 | `ed0719e9fec5eaf5fd50530ad9c38d211e65d55614963bb869b968675d56070f` | `0644` |
| `migrations/course-g04-l10-ts-005/evidence/full-frame-coverage.json` | 17365 | `e8c62c570eb63db811b4fe086fcce058bf853576e327b232efc4cddedacb101b` | `0644` |
| `migrations/course-g04-l10-ts-005/migration.json` | 8974 | `8c1393f006d0cadbbdda3b058ffddb33d595db841886d7b129e2bb38eb6713e3` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS05.fla` | 1144832 | `4a7f53072734b294da3df0dcbf8005779e5827ce393be814878ea7440cababaa` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS05.swf` | 100284 | `f0ec8f168ec7de0f20dc058730b02c880d9c8e81940b966e0bd2da2f3684d905` | `0500` |
| `migrations/course-g04-l10-ts-006/audio-inventory.csv` | 1324 | `ca6610ab3bc3670e34a2a250afbdb05dae82055f0e1bbbd66aad58ef7bd699f2` | `0600` |
| `migrations/course-g04-l10-ts-006/ACCEPTANCE_CHECKLIST.md` | 5427 | `9b33b9712e0cded7dc5ba3c943971d123d0ebf36f68b48760046e04c25a525d6` | `0644` |
| `migrations/course-g04-l10-ts-006/evidence/full-frame-coverage.json` | 17650 | `e951cad51f5680bab49f9061891038bd0b7aae117cbfab7dbdb272d117fe0a99` | `0644` |
| `migrations/course-g04-l10-ts-006/migration.json` | 8974 | `6e2d5b955e52ac7079b13f9ffe545f4a493292da09883828fe7a33bb60067b88` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS06.fla` | 834048 | `4991dd4d87468d7c9162a88c94a15b8c7d251bc240e4c855b7b470976e887eb8` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS06.swf` | 93745 | `b0ad832f7d755e2f94dddc53e3267414c5d8430ed0e8c28d498cc5ec3c05160e` | `0500` |
| `migrations/course-g04-l10-ts-007/audio-inventory.csv` | 7292 | `220de57bdf0836e2627796f85f9c6b731085c2467b4c1c55daec56315d4c98e2` | `0600` |
| `migrations/course-g04-l10-ts-007/ACCEPTANCE_CHECKLIST.md` | 5427 | `8175a3a0ae0e5d8262a79863e98815d027cb20d92e6b80e46bf14a7f094ba9d2` | `0644` |
| `migrations/course-g04-l10-ts-007/evidence/full-frame-coverage.json` | 97875 | `7a0b368f1d1f222a40a6a3185cfc0842036f7967063940e0511758aac100d789` | `0644` |
| `migrations/course-g04-l10-ts-007/migration.json` | 28936 | `62a981ef41d274f5ec9b3ad69852d3e7b860db4270cb895085387ca395cc8337` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS07.swf` | 585839 | `64070bdec0badb3cb009a741fe1b5e9c96bd98e68b92c4dfe125db3b43617eff` | `0500` |
| `migrations/course-g04-l10-ts-008/audio-inventory.csv` | 7293 | `4fc2bacd60223935438ee4efc7afdcbba6476ecaba626562aebecac336a3e876` | `0600` |
| `migrations/course-g04-l10-ts-008/ACCEPTANCE_CHECKLIST.md` | 5427 | `50e5ebddd5c7292761850375cf41df55920131746a7f9f2fb625e269fb0f3ce8` | `0644` |
| `migrations/course-g04-l10-ts-008/evidence/full-frame-coverage.json` | 95809 | `f00e858b4b8c5f1e589c68627a9c1a36b0c02745dfb15889aaceda0db19c7c9e` | `0644` |
| `migrations/course-g04-l10-ts-008/migration.json` | 28936 | `d7630d31090e204f84d6e93f334d876caf5f7d32428014d7396bb1490afaab6d` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS08.swf` | 556547 | `59299d4acf780a24e5f221fb1f4fe5e9a8330303367b9632c7b1ff2d6bf7b3a5` | `0500` |
| `migrations/course-g04-l10-vb-002/audio-inventory.csv` | 1325 | `6011548f28e2c04e2c31aa5cfc7d1faf68f2f8a26d974a407951d57b8595db32` | `0600` |
| `migrations/course-g04-l10-vb-002/ACCEPTANCE_CHECKLIST.md` | 5427 | `d407c057046e8743027be4df19f91b9884e74eeb3ea9c789023e9e98d4ab8f84` | `0644` |
| `migrations/course-g04-l10-vb-002/evidence/full-frame-coverage.json` | 18554 | `9abab1858cce6285ef3e1b54343e9ae98ae4876cb1ff585e56cf22c889a8eb9a` | `0644` |
| `migrations/course-g04-l10-vb-002/migration.json` | 9083 | `6e2002aa240d78b0c9bdae438c14410e665249d7cfebb81ded49eb25e2d2c163` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB02.fla` | 4706304 | `96b00648f79801c9be8fed6ab422c6b6235c494b75533d80bd4a31e8b7ad3544` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB02.swf` | 110715 | `a46fa315148118d58a379a2d7b921684f5a0a210c72cae9433550e755ae42a81` | `0500` |
| `migrations/course-g04-l10-vb-003/audio-inventory.csv` | 1327 | `50492491fd02782775e92544f3f0a73f23b2d3aab02aadf46de042df7a900335` | `0600` |
| `migrations/course-g04-l10-vb-003/ACCEPTANCE_CHECKLIST.md` | 5427 | `b8f9fc97d4644f8d3d13e187cf9118c4f0722f31c26da0c35c6bb7d6b7714056` | `0644` |
| `migrations/course-g04-l10-vb-003/evidence/full-frame-coverage.json` | 16564 | `98b85bc001b4538af82ba8cb92b82e482687a3bdd68ccece50f27854095bf4e2` | `0644` |
| `migrations/course-g04-l10-vb-003/migration.json` | 8998 | `2450dd99af1806acf04ef4130f4b63001ba785db7b5ae96b3c13080d2a06a585` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.fla` | 767488 | `1eccb733544de8eb0fa718cac6a1792e2e58145c737f6170e56268fc212003f7` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf` | 97444 | `96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d` | `0500` |
| `migrations/course-g04-l10-vb-004/audio-inventory.csv` | 1325 | `5c79579e938b9814c4a49b2f62192d3359672bd535469edab735a74bed6a1342` | `0600` |
| `migrations/course-g04-l10-vb-004/ACCEPTANCE_CHECKLIST.md` | 5427 | `cc74ee69890fb5519c9e7e4392a48077bb58e70a52abfb464f43a161cf4b8cd1` | `0644` |
| `migrations/course-g04-l10-vb-004/evidence/full-frame-coverage.json` | 16812 | `e72c5282c28ff098a062a3aa200ab291734a0bfd0fada92e183362e2db0e35d3` | `0644` |
| `migrations/course-g04-l10-vb-004/migration.json` | 9080 | `e8317a2324dffa59b175f785664ef7ff15dbf57af9bce5e34a5f2077a044a95c` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB04.fla` | 4461056 | `d1ba8716790dcec21a5a54990e165c7ac555ad901418ac10d20a3eaaf2b74cf0` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB04.swf` | 86638 | `f0d0ebfc9abebcfb13e6fb150a8663503330f1fbc2289713a678d64df307e500` | `0500` |
| `migrations/course-g04-l10-vb-005/audio-inventory.csv` | 1325 | `e627053e4438235fe2b6c4a49c7a0d099b4dd77d3f8da1350b3b3d02fd1d120a` | `0600` |
| `migrations/course-g04-l10-vb-005/ACCEPTANCE_CHECKLIST.md` | 5427 | `2782753e3ee39e8803d240bd937b1edc27386e32c3a514ba0e4a8be51cffac5a` | `0644` |
| `migrations/course-g04-l10-vb-005/evidence/full-frame-coverage.json` | 16916 | `fc99aca8062cd07958766ec06e4d5f0ca393d49d7f752792c0d111a8938cf9c6` | `0644` |
| `migrations/course-g04-l10-vb-005/migration.json` | 9077 | `13840810a37a0c6de0c37be1f5b61ea12b3db9f85ae57af6e332911dc1d2b892` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB05.fla` | 819712 | `db6b21bd2a39807bb91cb87393171e2e1f4e8227d20fb0da0bca32fbe0299fc2` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB05.swf` | 87261 | `ad41ce348f5412f090598ef73154cec82aa54877c4f95af65495129f1309321f` | `0500` |
| `migrations/course-g04-l10-vb-006/audio-inventory.csv` | 6733 | `3477f8b74acadf5d1132a8c2105bb2473a5133865d31cda1f3d95a5dcb2ae47d` | `0600` |
| `migrations/course-g04-l10-vb-006/ACCEPTANCE_CHECKLIST.md` | 5427 | `ac82516f5faf398e97e04fa487d474d294763149dd894eeefae54db978c864d8` | `0644` |
| `migrations/course-g04-l10-vb-006/evidence/full-frame-coverage.json` | 57930 | `3c6a1cc32ba58afa45541eadd34ae95be65839a4801238f76f182e7d1ea2c170` | `0644` |
| `migrations/course-g04-l10-vb-006/migration.json` | 22920 | `95604b86878d5900eebbd016c0b33cc0addf62420ee5881bab41f3af7940c44d` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB06.fla` | 2432000 | `2c809b81dedda337e6273197eaa29dcdd8275d16b250ed9a48837c3d1e0583e6` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB06.swf` | 806886 | `cb9881b4c6b790e4c1b13fa99ee3457b2d5438c261811d22d431b1fc0cefdaa4` | `0500` |
| `migrations/course-g04-l10-vb-007/audio-inventory.csv` | 6736 | `e7cd9af3d893fab0e746435345e07100079e3b1d5dc2f79ef0e07702de408909` | `0600` |
| `migrations/course-g04-l10-vb-007/ACCEPTANCE_CHECKLIST.md` | 5427 | `f7e66e2710fceaf68850aeb4a2a9d186e544240a509fe92a9def7928f0032ca7` | `0644` |
| `migrations/course-g04-l10-vb-007/evidence/full-frame-coverage.json` | 58422 | `c7814e225c5f4332f640bccdad091ab807975dec2e3ef82ee78e1df3631c6cd7` | `0644` |
| `migrations/course-g04-l10-vb-007/migration.json` | 22920 | `927ab59d0340cca03cf4a5f9b6304ab59d79616922fc709897f3fd31a88f965a` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB07.fla` | 2120192 | `943ffc9f32773a0cde3063308cad86a206e992334ca9db8a908d71d573229795` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB07.swf` | 219913 | `8480ad793b8f1f02caea83bea16b9fb4f2e08f573df4f4d22d6362366fe657c1` | `0500` |
| `migrations/course-g04-l10-vb-008/audio-inventory.csv` | 1325 | `6ada7b2514aaf13b21c668474c961e537d6e117ef189e8023f7d1e8ba0cbf76c` | `0600` |
| `migrations/course-g04-l10-vb-008/ACCEPTANCE_CHECKLIST.md` | 5427 | `c0ea53e3a5df6ea3b5793303ed2b47327048eb41fa2d5fea1e194de76c66e775` | `0644` |
| `migrations/course-g04-l10-vb-008/evidence/full-frame-coverage.json` | 22013 | `0aed963e94961fe99572c2b78586a150c0e9756498c8ff798c1a0baf479c3610` | `0644` |
| `migrations/course-g04-l10-vb-008/migration.json` | 9093 | `535fb5bcc99aa1bd7f7119a53c76d7c61d8205a4872a4f94b17f4eb01c974c30` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB08.fla` | 1055744 | `947bdac74507d8f1aa6903b90d7c7827d8a2a4aac04dbc97ad51a21ddcc8072c` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB08.swf` | 110332 | `6ff6b55a0f97bdc333caa1d813619cf10ba8d7f07f265e325ccd191f8e0c58d1` | `0500` |
| `migrations/course-g04-l10-vb-009/audio-inventory.csv` | 1327 | `5ceb3fc846f8f9369c84b35dd231e98bbf2edb5818f158a69c02d8b584b895cf` | `0600` |
| `migrations/course-g04-l10-vb-009/ACCEPTANCE_CHECKLIST.md` | 5427 | `7901381528531cd03335264c88a57aae42c114784b7ed3ee98644cf7946e9075` | `0644` |
| `migrations/course-g04-l10-vb-009/evidence/full-frame-coverage.json` | 20413 | `f54195f376e3dc15a12f0d2367b4752f7c43eea95a164df00bf361cf2402a004` | `0644` |
| `migrations/course-g04-l10-vb-009/migration.json` | 9077 | `75d4bef326531d79288ee4cd8a4e14e53a9a352ed4262218bdc22e489bf659b1` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB09.fla` | 1473024 | `b4f502e6b6d891ed6dfd39d345800e5e44f91524d0ebdd795530f52aadfb98fd` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB09.swf` | 132370 | `32a2905e40071d302cd350f09b0df8b4017550cbd93cac48648f5716dec4222d` | `0500` |
| `migrations/course-g04-l10-vb-010/audio-inventory.csv` | 1325 | `69553b0a49003e28b66e1314a7024dd2169e7c8008904ec7fd185cb28f4486a2` | `0600` |
| `migrations/course-g04-l10-vb-010/ACCEPTANCE_CHECKLIST.md` | 5427 | `c2a486bd5d066602a493b8e768e0210736d617619819bdd76cb2f873ab98f2b9` | `0644` |
| `migrations/course-g04-l10-vb-010/evidence/full-frame-coverage.json` | 14603 | `b05e244daac615eda4769bd40bd3085ff5c3c4dfb0dbaa42e3746b7c012fee1e` | `0644` |
| `migrations/course-g04-l10-vb-010/migration.json` | 9103 | `e135cc6b49200e79b755f08492b6b7bb62c632c205765dcf88fd901f9147179a` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB10.fla` | 4170240 | `80cf93ffec52c4952d59ba6de46b7ed964eef65bdb35b0cc37bf80efa837d201` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB10.swf` | 53095 | `d62e103871123717762bc7e8dc8a72a2902ef6a69c1752f8a42e83f1f2419994` | `0500` |
| `migrations/course-g04-l10-vb-011/audio-inventory.csv` | 1325 | `d5535ca4c36b1282e8d6132b3ad6bf69a30455f8c2e7713d7a051e8bb6cb8d84` | `0600` |
| `migrations/course-g04-l10-vb-011/ACCEPTANCE_CHECKLIST.md` | 5427 | `30ac018fd07eb7db772e368143aedae9c93a12b320628e04f25ad0079cf0ea85` | `0644` |
| `migrations/course-g04-l10-vb-011/evidence/full-frame-coverage.json` | 15253 | `74afa5737a54d77c5ecba2665e1f9ebfb6256b464efb57d58f5f1ef2f92bb513` | `0644` |
| `migrations/course-g04-l10-vb-011/migration.json` | 9084 | `1fb357f106498c91624e3d17488f07533dcaf2dd2ed153351f54b168a328d2e9` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB11.fla` | 4260864 | `b561dd6e3e1a7ea154094c9d4d58495c7b84111204394d5c97a5e87f362d68fa` | `0500` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB11.swf` | 60964 | `dd12bb87cffa76948020b1cfc34163f67fa4062bd286ea571bf4b08473709ba0` | `0500` |
| `migrations/shell-course-g04-l10-index-local/audio-inventory.csv` | 7500 | `55273db48bb9a42b0b2558b0a8909896bc2960b717359285dd2a1e50443101db` | `0600` |
| `migrations/shell-course-g04-l10-index-local/ACCEPTANCE_CHECKLIST.md` | 5438 | `15a2ba605cbb066a95958575b9d7757ca71ecfe6a5e800e8463b2b6b711f86dc` | `0644` |
| `migrations/shell-course-g04-l10-index-local/evidence/full-frame-coverage.json` | 121422 | `d5bf88e0503553c16bf0a08ed570095a3bf2c940e7c709f31a6a082216fe3df4` | `0644` |
| `migrations/shell-course-g04-l10-index-local/migration.json` | 35529 | `d6a836005a5d51b70867916768ca65a51b09cbff9cfeb8231a6f14b9954ccfb5` | `0644` |
| `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/index_local.swf` | 288233 | `050d4181f8d679e6232871371b70aeaa02dbecb4c7e16cfbc732437307cf6072` | `0500` |
| `reports/g4-l10-complete-migration-template-contract-2026-08-04.json` | 18633 | `2f51b65c82ad9b357e17a56ee1e8aefec694af5d8a5172f975a9f773922dded8` | `0644` |
| `reports/g4-l10-complete-migration-template-contract-2026-08-04.md` | 8546 | `cd408401ec2043fb8f8a5d05eaa324316bb299748c0483437991288fa9280201` | `0644` |
| `packages/demos/src/prototype-manifest.ts` | 91479 | `a56dda011879d1c72c9b111373862eb96f218519a6e8d137ec733695beee5e75` | `0644` |
| `packages/demos/prototype-registry.json` | 12653 | `8ab849e636f064501080238b50cbc69e2186025cda5715fe81bc3906a4148149` | `0644` |
| `scripts/build-g4-l10-complete-migration-template-contract-v2.mjs` | 33668 | `b082c2a8ddeb7ca2f2ed9be4444b9b2fad9c69f7547e2a5c7a6575fafaa62842` | `0644` |
| `reports/g4-l10-complete-migration-template-contract-v2-2026-08-04.json` | 18068 | `8a67d3a57b18442809fe70b8359d65b79e055a9435cb624bb40608b02256db74` | `0644` |
| `reports/g4-l10-complete-migration-template-contract-v2-2026-08-04.md` | 8661 | `ce616be0d0f1f93477df3e1af6d89a7f7215861533fddb6e923766f9c7fee655` | `0644` |
| `scripts/build-g4-l10-complete-migration-template-contract-v2.test.mjs` | 6214 | `3e8a47bc823271569d12fe49ba5f854d44ce3e7e273554ca2731a15f6ffb9ad4` | `0644` |
| `scripts/build-g4-l10-complete-migration-template-contract-v3.mjs` | 35803 | `00a5d40925220897506b341e8aa08354c7bcac3135807ac32f03a61a6f1794e2` | `0644` |
| `reports/g4-l10-complete-migration-template-contract-v3-2026-08-04.json` | 186132 | `c18ba22b2e78eaf989bca4e4394ecac6be7aa02c0e6f0df99a9698683a83c555` | `0644` |
| `reports/g4-l10-complete-migration-template-contract-v3-2026-08-04.md` | 58931 | `77471bf4d0952b541cebbc85dee11944e938cb38f3bdcf7398530ae5c75c194c` | `0644` |
| `scripts/build-g4-l10-complete-migration-template-contract-v3.test.mjs` | 7588 | `d87e4808cea907bf14f057af02324b76f140033d0e39717eeb7ae149a02b4052` | `0644` |
| `scripts/build-g4-l10-complete-migration-template-contract-v4.mjs` | 24180 | `1b0c4300683014c45ee1c2bd80c4a2ef95003e9e38fc10bfb4599b68cc995341` | `0644` |
| `reports/g4-l10-complete-migration-template-contract-v4-2026-08-04.json` | 218067 | `c8a64fdf766efb56ef03c936fc2e6c9fd0179f81d780ab3d1a5042c1f815f261` | `0644` |
| `reports/g4-l10-complete-migration-template-contract-v4-2026-08-04.md` | 63980 | `e913ac52e305769d71ffe1caefd7c873f806746edf6869a2972459c41335b9e8` | `0644` |
| `scripts/build-g4-l10-complete-migration-template-contract-v4.test.mjs` | 6174 | `332cc3ac0bdcde1e15615b36c15024551beea9dbfc11eb190b4d5d450a1c1cdf` | `0644` |
| `reports/g4-l10-root-capture-kit-protocol-v3-successor.json` | 328835 | `9c403289c12be94150b4afa783711ff377a0ea3c1dc6831446e5448a234e8753` | `0644` |
| `reports/g4-l10-ruffle-activated-evidence-closure-v3-successor.json` | 114279 | `bb77f565b68a5814aa210211da16f3c252b9f09603b02a19db04ce8f8f4a0f8f` | `0444` |
| `catalog/source-promotions/g4-runtime-dependency-successor-v3-2026-08-04.json` | 23456 | `789ddbd809b8fb8a8d8e3d7ab4b5d3c7c5cddb81cb6f358133575dd63e8ad07f` | `0644` |
| `migrations/lesson-release-trace-spec-indexes/lesson-g04-l10-perimeter-area.json` | 706051 | `d2f846831fa9a5c7c3a7e9cb0276a8b3671fbf6c26d17067bf4610c132e8687f` | `0644` |
| `output/playwright/g4-l10-vb003-current-js-engineering-diagnostic-v1/capture-manifest.json` | 218603 | `c44b36665057c66c22bc7dec5603d3482bd70aea4e7df9d5d3419a99c098d43c` | `0444` |
| `apps/web/lib/whole-lesson-course-registry.ts` | 6351 | `c2b977939e358839ad6c04f8b48cad5a7e1c2968b8f6342753909661bb740d0e` | `0644` |
