# Formula pilots — engineering review index

Engineering evidence is complete for the English standalone visual scenario across all four formula pilots, and Codex engineering review is accepted for that limited scope plus the modern behavior/product QA. This is **not strict acceptance**: migration status remains `preserved`, and Spanish original-host parity, audio listening/synchronization, human visual review, and owner signatures remain open.

Machine-readable index: [formula-pilot-engineering-review-index.json](formula-pilot-engineering-review-index.json)  
SHA-256: `6b4a375d60f55fb8e3ba543823199f08e5a86dfeda95038ace195580ea286de7`

## Aggregate result

| Item | Result |
| --- | ---: |
| Formula pilots | 4 |
| One-indexed source / implementation / diff frames | 440 |
| Paginated contact-sheet pages | 45 |
| Comparisons passing assigned RMSE thresholds | 4/4 |
| Captures with zero reported-frame, console, request, HTTP, or unexpected-network errors | 4/4 |
| Migrations marked `complete` | 0 |
| Strict acceptance | `not-accepted` |

| Animation | Current status | Frames | RMSE mean | RMSE max | Pages | Assigned thresholds | Capture cleanliness |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| [01-01](formula-elementary-conversion-01-01/) | `preserved` | 94 | 0.018781 | 0.021777 | 10 | pass 94/94 | clean |
| [01-02](formula-elementary-conversion-01-02/) | `preserved` | 109 | 0.026524 | 0.030660 | 11 | pass 109/109 | clean |
| [01-03](formula-elementary-conversion-01-03/) | `preserved` | 170 | 0.020053 | 0.022678 | 17 | pass 170/170 | clean |
| [01-04](formula-elementary-conversion-01-04/) | `preserved` | 67 | 0.035575 | 0.039531 | 7 | pass 67/67 | clean |

## Acceptance gates intentionally left open

| Gate | State |
| --- | --- |
| `engineeringEvidenceIndexBuilt` | `true` |
| `fullFrameStandaloneEnglishCoverageVerified` | `true` |
| `allAssignedRmseThresholdsPass` | `true` |
| `implementationCaptureClean` | `true` |
| `engineeringReviewAcceptedForLimitedScope` | `true` |
| `humanVisualReview` | `false` |
| `ownerAcceptance` | `false` |
| `originalHostSpanishTraversal` | `false` |
| `authoritativeAudioListening` | `false` |
| `audioSynchronization` | `false` |
| `strictValidatorPass` | `false` |
| `strictMigrationComplete` | `false` |
| `statusPromotionAuthorized` | `false` |

The blocking `false` gates are deliberate: human review, owner acceptance, original-host Spanish traversal, authoritative English/Spanish audio listening and synchronization, and strict validation have not been completed by this engineering evidence pass. Engineering acceptance applies only to the explicitly listed English visual and modern product/behavior evidence.

## 01-01 — 94 frames

Status remains `preserved`. Stage 780×379, 12 FPS. Assigned RMSE thresholds pass 94/94; mean 0.0187806954971481, max 0.021777376134572212.

Evidence:

- [Adobe baseline report](formula-elementary-conversion-01-01/baseline/adobe-flash-player-32-standalone-default.json) — `e5a9b5a1924dcc9c404c7ec5330fa51d796f068254a5bdee699f8b2f3e58e10b`
- [Full-frame comparison](formula-elementary-conversion-01-01/evidence/full-frame-comparison-standalone-default-en.json) — `13670117bc34ec54a3c5923f13a32b9cb5398dac0069bce9dac739508fd5d389`
- [Implementation capture manifest](../output/playwright/conversion-1-1-fidelity-pass/en-default/capture-manifest.json) — `399241d4801cd5c349c23e69645794d85aac192d6c22c8dca99e54c0b4745682`
- [Contact-sheet manifest](formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/manifest.json) — `5ed412d1113c29845dd3745d1aaae4300e75cc23fee350020034e770d41f938c`
- [Engineering prereview](formula-elementary-conversion-01-01/evidence/full-frame-comparison-standalone-default-en-engineering-prereview.json) — `42db66058daf5635ba16991df4a86aba4653a97240d7eb24bef945a6ef23aebe`

Contact-sheet pages (baseline / implementation / diff):

- [Page 01 — frames 1–10](formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/page-01.png) — 4732×2111, SHA-256 `564d63b157733112a24b4b21920cbf3f1065a2876f7f86563fde3640f7ece33f`
- [Page 02 — frames 11–20](formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/page-02.png) — 4732×2111, SHA-256 `14f577a743d480587a473801d14ee379ea5a55d757923406ebd35cced55c3c97`
- [Page 03 — frames 21–30](formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/page-03.png) — 4732×2111, SHA-256 `712631c569077ad6d7d3104526d94eae68cf405aa2dd2aac0b0981c77fe5d4fa`
- [Page 04 — frames 31–40](formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/page-04.png) — 4732×2111, SHA-256 `8df86aa1d4a940f9a3a56632c6919ffc6aa9567d838341b668c1e170e877bba0`
- [Page 05 — frames 41–50](formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/page-05.png) — 4732×2111, SHA-256 `8e71e653a9dee000b8ef080d0297acc37397f44b0326fc6ee859244b9f769683`
- [Page 06 — frames 51–60](formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/page-06.png) — 4732×2111, SHA-256 `5745d76aec21b80c8c53bbf7ccbaabc318d482e9764578627361b4ffb6860683`
- [Page 07 — frames 61–70](formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/page-07.png) — 4732×2111, SHA-256 `0472a93c5f81e6a8a13ef8d71d3bba35fc692a24e3070b21871650f4a2df6403`
- [Page 08 — frames 71–80](formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/page-08.png) — 4732×2111, SHA-256 `3c6300fde666cef81aa792a040df67c8f6e155c4645d7cf8eb6e5d99b7403a1e`
- [Page 09 — frames 81–90](formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/page-09.png) — 4732×2111, SHA-256 `c38113919869453cd168139f6c1d1c7f1f631cb74c26655a247d960d8ecc5efb`
- [Page 10 — frames 91–94](formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/page-10.png) — 4732×2111, SHA-256 `f797373034ec37f614440421abece5b8c53a2364227f506dbe9cf960ba4065d5`

## 01-02 — 109 frames

Status remains `preserved`. Stage 780×379, 12 FPS. Assigned RMSE thresholds pass 109/109; mean 0.02652369817714099, max 0.030659726204404127.

Evidence:

- [Adobe baseline report](formula-elementary-conversion-01-02/baseline/adobe-flash-player-32-standalone-default.json) — `b4ce551d97c9a2cac84f2803bdfe1449f2ceffffd2430f929c0d1b95b5645563`
- [Full-frame comparison](formula-elementary-conversion-01-02/evidence/full-frame-comparison-standalone-default-en.json) — `d567f735fd846e84928a180cecaa4ed427bfed2496e9ddc1dabf98c10dfef233`
- [Implementation capture manifest](../output/playwright/conversion-1-2-fidelity-final-isolated/en-default/capture-manifest.json) — `45be74d526f01d3918daab72c3949bab6b3b7dc1ab2a6c73fb5e4a364beef12f`
- [Contact-sheet manifest](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/manifest.json) — `45e5dc9e82756ae860c1dacda8ba8aa388cd6616ceb23b347c2367566379bf02`
- [Engineering prereview](formula-elementary-conversion-01-02/evidence/full-frame-comparison-standalone-default-en-engineering-prereview.json) — `cfe00fd15d4d93b91818d62bbbc9bc7e59f4115e5585fac6d8242a043ae539e9`

Contact-sheet pages (baseline / implementation / diff):

- [Page 01 — frames 1–10](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/page-01.png) — 4732×2111, SHA-256 `920131c0ada1331125c34198d710c0a907d4e3fa7391f1bbf09d81333c0d4066`
- [Page 02 — frames 11–20](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/page-02.png) — 4732×2111, SHA-256 `ba7cbabedbf79134f3d52402836157885420aff6b70932ad812cce014d5c215d`
- [Page 03 — frames 21–30](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/page-03.png) — 4732×2111, SHA-256 `fe4338a6667abe85a40dc0d8597610f7acdf66daacf945a6daf3ad4f5041fc1c`
- [Page 04 — frames 31–40](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/page-04.png) — 4732×2111, SHA-256 `54015aaaacf6912e0c2cbf7526ebd67efcadf21b7edab9a540236ebada51eb05`
- [Page 05 — frames 41–50](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/page-05.png) — 4732×2111, SHA-256 `2bdb174e65d56c81f9e49c3bf83a4ddd651338a4152269a8aab0b7660f56ede9`
- [Page 06 — frames 51–60](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/page-06.png) — 4732×2111, SHA-256 `03b64b6c7807a85e9cfa4414fb533b435cd3e986ff66cb36ee0a35245edd4861`
- [Page 07 — frames 61–70](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/page-07.png) — 4732×2111, SHA-256 `2403cf71c77880b4d8af225f03869ea52c4f9828ed58632022400d94422f0cf2`
- [Page 08 — frames 71–80](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/page-08.png) — 4732×2111, SHA-256 `9d13f70aff1550bb14c2e781c23f599d2df6833bc80e5681952ae2aae0e6ddc7`
- [Page 09 — frames 81–90](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/page-09.png) — 4732×2111, SHA-256 `a8168a109d38711a64e18334939d37768aa24eb2b909c66ca541b26eb2f7aaf4`
- [Page 10 — frames 91–100](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/page-10.png) — 4732×2111, SHA-256 `91241345142109c9c659c84eec31e3de3a2c1e0212c7ee26431ba5d334f869c0`
- [Page 11 — frames 101–109](formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/page-11.png) — 4732×2111, SHA-256 `3edc46cf7c4b97789e70e1ccf2fe068c30c26e5dc943324bafdd7c8dbc550833`

## 01-03 — 170 frames

Status remains `preserved`. Stage 780×379, 12 FPS. Assigned RMSE thresholds pass 170/170; mean 0.020053442630627524, max 0.022677782990904123.

Evidence:

- [Adobe baseline report](formula-elementary-conversion-01-03/baseline/adobe-flash-player-32-standalone-default.json) — `8802aa386b819bb7db30914cce26177c6d7d0d9edcf25450e9c96baafaef985f`
- [Full-frame comparison](formula-elementary-conversion-01-03/evidence/full-frame-comparison-standalone-default-en.json) — `6da15160aa33b2cd42ac361890226082cd4d797331e52d21bc210dd3dff4b354`
- [Implementation capture manifest](../output/playwright/conversion-1-3-fidelity-final-vector/en-default/capture-manifest.json) — `bdc4f80ea2aaffe5e92ddd6143bcc197f9aefbb524f63b998368cd8123264d58`
- [Contact-sheet manifest](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/manifest.json) — `12a49aa77e9ea0c84bf8d7d32aa8bfb882c4199d84492a60c73a25c1c92b4174`
- [Engineering prereview](formula-elementary-conversion-01-03/evidence/full-frame-comparison-standalone-default-en-engineering-prereview.json) — `189e2798236123d300c3700cb6c157e406fdfa282d8e0f5a221a262d14b15572`

Contact-sheet pages (baseline / implementation / diff):

- [Page 01 — frames 1–10](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-01.png) — 4732×2111, SHA-256 `ccb355f53b8b648b7541933411f3dc5b60cb7edb776000ffffbb5b2ea11d3fe3`
- [Page 02 — frames 11–20](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-02.png) — 4732×2111, SHA-256 `1bd6fb364e076887f33b3af2cede653b727d742aff37f171aa3b754106e7fd09`
- [Page 03 — frames 21–30](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-03.png) — 4732×2111, SHA-256 `7e84104d2838281f844301bb979c677e197cdd01bd4ceff4d2cd4016d5093903`
- [Page 04 — frames 31–40](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-04.png) — 4732×2111, SHA-256 `8c1d14ccdb9e67e392b9d5ae479ecb8e2c5b2d4f532319c81c5e63194c6bf5b1`
- [Page 05 — frames 41–50](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-05.png) — 4732×2111, SHA-256 `79d52dfeb2523e4c6835bb16d207882b3adacace8e76d85638e31d711a2b870a`
- [Page 06 — frames 51–60](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-06.png) — 4732×2111, SHA-256 `4b554e4ed13cc813bb552e298963614f0fc66a68a9ba9d2d5d0731d2fed4de51`
- [Page 07 — frames 61–70](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-07.png) — 4732×2111, SHA-256 `e6e3c51417b8a2b3a8034db6184ef9e1462244b42c738d38fa51a8f4a1e4bdc5`
- [Page 08 — frames 71–80](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-08.png) — 4732×2111, SHA-256 `aacb2f5807d1cec72c7e040bb27a2970d65b96cccaf6bda529a265da050e6363`
- [Page 09 — frames 81–90](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-09.png) — 4732×2111, SHA-256 `2313ebae9f2ff6b568143b2ce13ed61859a05705e4ad1c00bc291dfab2236c4f`
- [Page 10 — frames 91–100](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-10.png) — 4732×2111, SHA-256 `21c55c8585866f4a3292805dd27d431e7df0ca89367f6ad3601e00fabe0b559e`
- [Page 11 — frames 101–110](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-11.png) — 4732×2111, SHA-256 `f99bfcd8432e0933b756ac8579934fabf399e2cdab31229bbd6c9aa60ed48a5d`
- [Page 12 — frames 111–120](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-12.png) — 4732×2111, SHA-256 `bdcb2025cf8adc91f63be1865a1220dc3adb787dfac4d298610e3847cc63fc5c`
- [Page 13 — frames 121–130](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-13.png) — 4732×2111, SHA-256 `a86ebfdaee2b8ea17cc01d59e1724e62cde84fd6bc9abb41f655002eedf13c02`
- [Page 14 — frames 131–140](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-14.png) — 4732×2111, SHA-256 `0722010449a2ea8e00b245845b5b24f03f92da53ae8c08308cf25897df841499`
- [Page 15 — frames 141–150](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-15.png) — 4732×2111, SHA-256 `1ae88ea9b02bd012862fc2515b52c3db778ced1c2cc9fe947ed56011ccf826f2`
- [Page 16 — frames 151–160](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-16.png) — 4732×2111, SHA-256 `99f4399a98764d373e046cdc83783213d27950715af5ea2f0abb8a2f2975e8e8`
- [Page 17 — frames 161–170](formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/page-17.png) — 4732×2111, SHA-256 `760854b0102a5977b4afa49b85755cf2be7924a240ca5212ddd697341ed0938b`

## 01-04 — 67 frames

Status remains `preserved`. Stage 780×379, 12 FPS. Assigned RMSE thresholds pass 67/67; mean 0.03557528461499095, max 0.03953098594449571.

Evidence:

- [Adobe baseline report](formula-elementary-conversion-01-04/baseline/adobe-flash-player-32-standalone-default.json) — `b3ef8b7efd2cc64e87de6006881bc112a006581ab7d3ac2effcd0d87e624ff54`
- [Full-frame comparison](formula-elementary-conversion-01-04/evidence/full-frame-comparison-standalone-default-en.json) — `0099f8a87bb0fcfff66957badba3018691f2faedd3ff94c72599d26172ef06a2`
- [Implementation capture manifest](../artifacts/full-frame/pilot-implementations/formula-elementary-conversion-01-04/default/en/capture-manifest.json) — `7640e021f2692cce5887763eecdba8b8ace4159e9b248b22881905e4940b999d`
- [Contact-sheet manifest](formula-elementary-conversion-01-04/evidence/contact-sheets/standalone-default-en/manifest.json) — `6fe0f205e65de58ecd62c4933182c2ed18f997628beb961332e46a57e33a21cb`
- [Engineering prereview](formula-elementary-conversion-01-04/evidence/full-frame-comparison-standalone-default-en-engineering-prereview.json) — `e6e8e350f4c10274bd3efe61fef81471dd8429d70cdf49c7674a8ff01f199ed3`

Contact-sheet pages (baseline / implementation / diff):

- [Page 01 — frames 1–10](formula-elementary-conversion-01-04/evidence/contact-sheets/standalone-default-en/page-01.png) — 4732×2111, SHA-256 `1153817413107de43dfe28dafa21436008f02f0973c0795e76fb1710188de9a9`
- [Page 02 — frames 11–20](formula-elementary-conversion-01-04/evidence/contact-sheets/standalone-default-en/page-02.png) — 4732×2111, SHA-256 `96fc3b43e1be4a0df0d5213ad991da5671598746380c49378ef69e49c23aef3b`
- [Page 03 — frames 21–30](formula-elementary-conversion-01-04/evidence/contact-sheets/standalone-default-en/page-03.png) — 4732×2111, SHA-256 `dfb43e8b6da54ffee1f8e083517cb0354a41fdf2d4003cd83f804dd264c0911c`
- [Page 04 — frames 31–40](formula-elementary-conversion-01-04/evidence/contact-sheets/standalone-default-en/page-04.png) — 4732×2111, SHA-256 `b131d792c88e3c5f321680eaad4ee45537685fea8772c6d9814c4bdb727c6deb`
- [Page 05 — frames 41–50](formula-elementary-conversion-01-04/evidence/contact-sheets/standalone-default-en/page-05.png) — 4732×2111, SHA-256 `438d55465b6bed4dfea7a909952394b89ecc3da138b72e8a6f6603df5a5e4401`
- [Page 06 — frames 51–60](formula-elementary-conversion-01-04/evidence/contact-sheets/standalone-default-en/page-06.png) — 4732×2111, SHA-256 `b3d400b083fd298d8fdf4543ccc0174448bd0f75861e1e55c249d125887506c8`
- [Page 07 — frames 61–67](formula-elementary-conversion-01-04/evidence/contact-sheets/standalone-default-en/page-07.png) — 4732×2111, SHA-256 `c2e1a69918f808abcbc03dab42f83aaf5f3d4feffdad2b38d544d645eb08e3fa`

## Review boundary

Every listed page is hash-addressed and covers each one-indexed frame exactly once. The contact sheets are engineering review aids only. Silent English standalone PNGs cannot prove original-host Spanish selection, spoken-language correctness, audio trigger behavior, timing/synchronization, Replay interaction QA, accessibility, or owner approval.
