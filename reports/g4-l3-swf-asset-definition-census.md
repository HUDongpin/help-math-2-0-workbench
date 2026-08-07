# G4 L3 SWF Asset-definition Identity Census

> Acceptance-neutral static source evidence only. This report does not establish runtime visibility, original-runtime behavior, visual/behavioral parity, audio acceptance, human/owner approval, renderer reuse safety, or migration completion.

## Bound scope and method

- Scope: 40 canonical items (39 active pages + 1 course shell), 40 source paths, 40 distinct SWF binaries, 11,435,428 compressed bytes.
- Physical source verification: 40/40 SWFs re-read and SHA-256 matched to the work-card binding.
- Exact identity rule: same SWF tag code plus SHA-256 of the complete uncompressed raw tag payload; CharacterID and all referenced local IDs remain included.
- Definitions parsed recursively: 8,068 total; 6,727 unique exact identities.
- Exact duplicate groups: 1,107; groups confined to one SWF: 0; groups spanning multiple SWF binaries: 1,107 (2,448 occurrences).
- Structural count cross-checks: 40/40 items agree with the independent machine work-card shape/morph/bitmap/text/button/sprite facts. 7 sprite tag streams retain nonzero bytes after their End tag; those bytes remain covered by the enclosing DefineSprite payload hash but are not reinterpreted as tags.

The reuse groups below prove only equal tag code and equal complete raw payload bytes. Character IDs remain in the hash. A match does not prove placement/visibility, shared FLA-library origin, identical referenced dependencies, semantic equivalence, or safe renderer reuse. Conversely, definitions that differ only by a local ID remain separate by design.

## Totals by definition category

| Category | Definitions |
|---|---:|
| shape | 3,165 |
| morph | 433 |
| bitmap | 82 |
| font | 217 |
| text | 2,618 |
| button | 343 |
| sprite | 1,205 |
| sound | 5 |
| video | 0 |
| binary | 0 |

## Per-item counts

| # | Animation | Total | shape | morph | bitmap | font | text | button | sprite | sound | video | binary |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | `course-g04-l03-ir-001-341242cc` | 27 | 4 | 0 | 0 | 4 | 11 | 0 | 8 | 0 | 0 | 0 |
| 2 | `course-g04-l03-rw-002` | 426 | 353 | 6 | 17 | 2 | 43 | 3 | 2 | 0 | 0 | 0 |
| 3 | `course-g04-l03-rw-003` | 54 | 26 | 2 | 0 | 2 | 20 | 2 | 2 | 0 | 0 | 0 |
| 4 | `course-g04-l03-rw-004` | 126 | 100 | 3 | 12 | 2 | 4 | 2 | 3 | 0 | 0 | 0 |
| 5 | `course-g04-l03-vb-002` | 52 | 12 | 2 | 0 | 4 | 26 | 6 | 2 | 0 | 0 | 0 |
| 6 | `course-g04-l03-vb-003` | 106 | 29 | 0 | 1 | 6 | 45 | 6 | 19 | 0 | 0 | 0 |
| 7 | `course-g04-l03-vb-004` | 53 | 10 | 1 | 0 | 4 | 33 | 3 | 2 | 0 | 0 | 0 |
| 8 | `course-g04-l03-vb-005` | 53 | 10 | 1 | 0 | 4 | 33 | 3 | 2 | 0 | 0 | 0 |
| 9 | `course-g04-l03-vb-006` | 44 | 10 | 0 | 0 | 4 | 24 | 4 | 2 | 0 | 0 | 0 |
| 10 | `course-g04-l03-vb-007` | 271 | 111 | 89 | 2 | 13 | 35 | 4 | 17 | 0 | 0 | 0 |
| 11 | `course-g04-l03-vb-008` | 195 | 75 | 52 | 13 | 12 | 24 | 4 | 15 | 0 | 0 | 0 |
| 12 | `course-g04-l03-vb-009` | 24 | 7 | 0 | 0 | 4 | 7 | 4 | 2 | 0 | 0 | 0 |
| 13 | `course-g04-l03-in-002` | 88 | 49 | 2 | 0 | 2 | 27 | 6 | 2 | 0 | 0 | 0 |
| 14 | `course-g04-l03-in-003` | 84 | 28 | 2 | 0 | 3 | 49 | 0 | 2 | 0 | 0 | 0 |
| 15 | `course-g04-l03-in-004` | 160 | 59 | 20 | 1 | 7 | 46 | 3 | 24 | 0 | 0 | 0 |
| 16 | `course-g04-l03-in-005` | 80 | 36 | 0 | 0 | 3 | 17 | 4 | 20 | 0 | 0 | 0 |
| 17 | `course-g04-l03-in-006` | 151 | 53 | 0 | 1 | 4 | 72 | 6 | 15 | 0 | 0 | 0 |
| 18 | `course-g04-l03-in-007` | 98 | 57 | 0 | 0 | 2 | 33 | 4 | 2 | 0 | 0 | 0 |
| 19 | `course-g04-l03-in-008` | 57 | 18 | 0 | 1 | 3 | 25 | 4 | 6 | 0 | 0 | 0 |
| 20 | `course-g04-l03-in-009` | 200 | 157 | 4 | 11 | 2 | 19 | 2 | 5 | 0 | 0 | 0 |
| 21 | `course-g04-l03-in-010` | 90 | 33 | 0 | 1 | 3 | 31 | 3 | 19 | 0 | 0 | 0 |
| 22 | `course-g04-l03-in-011` | 51 | 20 | 0 | 0 | 2 | 25 | 2 | 2 | 0 | 0 | 0 |
| 23 | `course-g04-l03-in-012` | 228 | 81 | 68 | 2 | 8 | 41 | 4 | 24 | 0 | 0 | 0 |
| 24 | `course-g04-l03-ti-002` | 272 | 106 | 20 | 0 | 10 | 78 | 20 | 38 | 0 | 0 | 0 |
| 25 | `course-g04-l03-ti-003` | 126 | 31 | 0 | 0 | 4 | 56 | 12 | 22 | 1 | 0 | 0 |
| 26 | `course-g04-l03-ti-004` | 274 | 74 | 0 | 0 | 6 | 84 | 13 | 97 | 0 | 0 | 0 |
| 27 | `course-g04-l03-ti-005` | 208 | 53 | 0 | 0 | 5 | 66 | 5 | 79 | 0 | 0 | 0 |
| 28 | `course-g04-l03-ti-006` | 269 | 73 | 0 | 0 | 6 | 88 | 11 | 91 | 0 | 0 | 0 |
| 29 | `course-g04-l03-gs-002` | 321 | 214 | 9 | 2 | 5 | 56 | 16 | 19 | 0 | 0 | 0 |
| 30 | `course-g04-l03-ts-002` | 27 | 6 | 0 | 0 | 2 | 14 | 3 | 2 | 0 | 0 | 0 |
| 31 | `course-g04-l03-ts-003` | 25 | 5 | 0 | 0 | 2 | 14 | 2 | 2 | 0 | 0 | 0 |
| 32 | `course-g04-l03-ts-004` | 70 | 8 | 0 | 0 | 2 | 48 | 10 | 2 | 0 | 0 | 0 |
| 33 | `course-g04-l03-ts-005` | 40 | 10 | 0 | 0 | 2 | 17 | 9 | 2 | 0 | 0 | 0 |
| 34 | `course-g04-l03-ts-006` | 23 | 3 | 0 | 0 | 3 | 15 | 0 | 2 | 0 | 0 | 0 |
| 35 | `course-g04-l03-ts-007` | 445 | 188 | 91 | 2 | 12 | 101 | 28 | 23 | 0 | 0 | 0 |
| 36 | `course-g04-l03-ts-008` | 354 | 133 | 60 | 10 | 9 | 97 | 24 | 21 | 0 | 0 | 0 |
| 37 | `course-g04-l03-fq-001` | 41 | 3 | 0 | 0 | 12 | 19 | 0 | 7 | 0 | 0 | 0 |
| 38 | `course-g04-l03-fq-002` | 899 | 249 | 0 | 0 | 7 | 429 | 7 | 207 | 0 | 0 | 0 |
| 39 | `course-g04-l03-fq-003` | 899 | 249 | 0 | 0 | 7 | 429 | 7 | 207 | 0 | 0 | 0 |
| 40 | `shell-course-g04-l03-index-local` | 1057 | 422 | 1 | 6 | 23 | 317 | 97 | 187 | 4 | 0 | 0 |

## Largest cross-SWF exact payload-reuse groups

| Tag | Payload bytes | SWFs | Occurrences | Raw payload SHA-256 |
|---|---:|---:|---:|---|
| DefineSprite | 20 | 17 | 17 | `83388c5278693ee3dc5ebe316df35993769d2858c8f0e129e50b3bbb8fcc3cbd` |
| DefineText | 77 | 10 | 10 | `18cdf307678cc7e0bcb56bdcff800f13c521ee03376b9789b89b3fc8a42622e5` |
| DefineFont2 | 1215 | 10 | 10 | `44784fd15ac0be996ad643624b89651837d88f1785b19a1ca31ba7869819c184` |
| DefineShape2 | 170 | 8 | 8 | `8c0efa2b3a0c18dc0a282237e4ef6bb9fb2d22fa2cc38aaddf6003fce9f08b41` |
| DefineShape3 | 97 | 8 | 8 | `83e92ccb6979d665e3a5686e523e18847c6c8ca6d4c2a9345199e0d0825177ca` |
| DefineShape3 | 96 | 8 | 8 | `9fc3e7de03b7c2617832f45c4cdb070597b7ddfa93e377f06198a26062521d15` |
| DefineText | 91 | 7 | 7 | `717d4a3b5b733ec3db7902f8e33a81d41cf1cfe2f8b0ab21a0598a2d8d1620a3` |
| DefineFont2 | 1568 | 7 | 7 | `c618f82846cc5980f42c468d1a276ff43748b8ba944464262e35edc63f8a9818` |
| DefineShape | 34 | 5 | 5 | `a16c43d83eecb4cef71c6cfaf078b3da18f184af53fbd599164f1c832744d185` |
| DefineShape | 31 | 5 | 5 | `c3c1383e11d296f19d7b8cfbaa04c3e7be65128055b2c304c31a65226addd2e1` |
| DefineText | 88 | 5 | 5 | `3647314ea7931d06894bfe6076a0e6222dce94a222ac0858cae5fcfdd440ef63` |
| DefineSprite | 20 | 5 | 5 | `45920701894ce973eb5bd6145b322d0f17a14172f284ee0de84dcb322e64511a` |
| DefineFont2 | 1309 | 5 | 5 | `050fe1835f45efd4dae6f1fc9d1d2bd7cf7c4b85c4e231fb4b8def03461f479c` |
| DefineText | 25 | 4 | 4 | `bcea674945d2aa7f96f865877018d9a1c9730149f6b5fe208206c538890438e0` |
| DefineText | 24 | 4 | 4 | `f520ab44a89785a7ce93bf021b9e009f38f254abc5c7a6cab5eebfaea97c9542` |
| DefineShape3 | 35 | 4 | 4 | `eb784d95ba672f4b41806725bf1b721bdaf445c05756383e9eac698ea6c5ce23` |
| DefineButton2 | 58 | 4 | 4 | `9d9b338cbc22e9e7d462de1433253a84d839d807130eada67abf3d326e9ccf92` |
| DefineShape | 31 | 3 | 3 | `019e4eb7bdfad1b58e1722fb64eec3a352c9184d633418aed4d466b2380fa771` |
| DefineShape | 30 | 3 | 3 | `01eb861209b6fda387137d58f5b97704f497946d1550cc13e121487cf63be977` |
| DefineShape | 31 | 3 | 3 | `07c77799ea3ca511be145ac012bf1a48fff396eb5e2ab54ee631c7dc927ae9ed` |
| DefineShape | 41 | 3 | 3 | `1d47a4784da87b6f003171d58ff1719908fac6a717cf0f85f918e25e0c17c840` |
| DefineShape | 24 | 3 | 3 | `2e988b824f1444c68f436335c2bfcfea06c6592c134ac54068fa0e18aeba0586` |
| DefineShape | 28 | 3 | 3 | `474cb2a964e0d9052288d906c916a3deb213e4960ee0c57d7283aed151645930` |
| DefineShape | 27 | 3 | 3 | `4da3cc0b4e0c3758e6c31a390f7f144b0c2d9c908a0947d98d71952e8caa66b3` |
| DefineShape | 390 | 3 | 3 | `518b3eb0f5c591754421cc80ba79544951682b97261bc56577b3bbdd8bdb9682` |
| DefineShape | 33 | 3 | 3 | `6080ce79cc4be3a090b74932a460b69b1ab6cab33cb720fc9efd56f61542ef86` |
| DefineShape | 33 | 3 | 3 | `7fe191c96e05570dab0a21250ede5f48834b58d574da0f24a3d317a3164bdf4f` |
| DefineShape | 40 | 3 | 3 | `832573ce83468ed80556ab9674bca3bb5fa325e0df5bb7121b8f87d25d812a79` |
| DefineShape | 44 | 3 | 3 | `87cc3b459dd7477764ba79a80ef53818870eb9da57d24bc7d8293a98db2752cf` |
| DefineShape | 32 | 3 | 3 | `8ddf4da3e16a5f82e4c3c9a0a533fb365e8144075d448d5bbfd5dd4f9f7b8cc3` |

The complete duplicate and cross-SWF group inventories, including every occurrence and file-local CharacterID, are retained in the JSON report.

## Exactly parsed font names

Exactly decoded name identities: 35. Glyph counts are emitted only when the SWF font structure exposes and validates them.

| Font name | Occurrences | Exact glyph-count facts | Name-byte SHA-256 |
|---|---:|---|---|
| _sans | 1 | 0 | `ff96a1ad2be8efa0da80733fcf8781c58e41ebd8cb69871950c1f0baa86fb31d` |
| _serif | 2 | 0 | `bdf9ca1a455c419e02126fa82f2b41761935be63e8e96bc39817fc7fc568943d` |
| Arabolical | 2 | 31 | `2da80ba0f8fcaedfcc9750d1ff4a00c7a034310258c7fc66cf27bde7d5b5d499` |
| arial | 5 | 1 | `6fc0ee450e51f11f6bb59a4bff57484f6af40b3f93ba2a88bb1bfa6e7f5eaa82` |
| Arial | 26 | 0, 1, 5, 6, 7, 9, 10, 11, 19, 37 | `aac910161f16402c8108e8df6d7dc5941b65103b4deec7830cb141e563c68ee7` |
| Arial Baltic | 35 | 17, 18, 19, 20 | `84204174b6baa14249a00e17ad276408e02cd40ae06438226dad4aae4cd062dc` |
| Bauhaus Md BT | 56 | 0, 1, 4, 9, 15, 16, 17, 19, 26, 27, 28, 29, 33, 34, 35, 36, 38, 40, 41, 42, 43, 44, 45, 47, 48, 50, 51, 56, 57, 60, 62, 115 | `0a5483f7b04c6b374875e9d9f337e8fd2cdff4ef933ae1a4adf2bf36afd7df01` |
| Bedrock | 2 | 5 | `4b7159920f77bc83cf84acced8b1f02243b2c4156f885f71d442eaae23be8913` |
| Berlin Sans FB Demi | 4 | 14 | `38d7913fd1095ae46b48aad4f103edbaf3d7b69f66816f2d6685f7220fe3f6f1` |
| Bertram LET | 14 | 5, 7, 10 | `d93185279f34f1194e110cd6bedb54c7594e35e5272d02a938b4e48644401048` |
| Bobcat | 2 | 6 | `4445f1030df3e987d118dd6f8e814a0d6adeb8f16f5780bd4834f0108625afa2` |
| Boink LET | 9 | 8, 15, 22 | `3c56caea4215c5c7e9e35a32b8fd95104e09383d7180a4572817284237463b82` |
| Book Antiqua | 2 | 3 | `a69d35632f078e196b97531247cb203c807784bf72553416b8064cded95aa048` |
| Britannic Bold | 1 | 2 | `661d2b60b10197e746b4fd164d1bc1f430b5631258fa86b3e22fc7d2339df7b2` |
| Bubbleboy | 2 | 6 | `95795e4239f283a2c6121165f3769ca09f748afb42272e8f0c4563c7cb1211d2` |
| Bullpen 3D | 2 | 3 | `af0a6279f25ba5e70f1ccdec0ec9fc1a22c6af882d9ab46d0f5886a8b5863bde` |
| Busorama Md BT | 1 | 5 | `d04748fe3de322a948d854ede1561223b6c4d25f5e4b21db2771f10c4df24946` |
| Calligraph421 BT | 2 | 8 | `12cee79dd47bc9d23661fa4d8b04497e1bd4d265e145edd4b47b960413505ae7` |
| Comic Sans MS | 2 | 8, 25 | `ef9b0c00addf6a0612995b69a56769f72b9b34d1bfb234e2c49d9922d0f4b78d` |
| Compacta Lt BT | 1 | 6 | `de773c9958d3702215ebd2b6962bac4939fcd657be6a1a2627edbbb3733440c4` |
| Ensemble Medium SSi | 1 | 11 | `ca742da70641130a386ddae07034abe5a5bf5b1a325a1113d4762e6cc9462836` |
| Eras Bd BT | 7 | 8, 10 | `842f645254b509b7dcfa68704625cbc2c77f1e3c436548d55c422a3e639af784` |
| Eras Bold ITC | 2 | 10 | `7444162a4408e75eb180d4e37643ea7ac1eb1d21328dbcae802a9dd3c3e8adf5` |
| Facile Black SSi | 3 | 6 | `51b63c66b0397943a01f78578a759d60bacded48b6fba3f9713112fa9998acee` |
| GeoSlab703 MdCn BT | 2 | 5 | `f7229d847d8b628d31e2716c2811eebd934313d65610fb0225e20b0b0f842dff` |
| Gill Sans MT | 2 | 5 | `d72c628dfa67b83bf638b0d1370241743c09bd6c8030c424b6e7bc9afba9562e` |
| Gulim | 1 | 3 | `e3daf112ae611a27f5bdd2d6a82c6eafea866df658bd646957d3dc16ab85d129` |
| Helvetica | 1 | 0 | `44768824fe10901e89c17b4621a05942b5fc3b6469b9e9e780e366472a2903bf` |
| Helvetica Condensed | 4 | 10 | `b6bd73a96dcf53886ab77882425426328b8bfd6bc46931df0607f97ff90d01be` |
| MicrogrammaDBolExt | 4 | 8 | `2a440db82d21d106cd990c86762b4ac51a3ff445b3fd2d171d8cc9bf0f1bf249` |
| Performa Black SSi | 3 | 14 | `da65609e22a9a7b470c1867c9a7bc9bb6ccd973e0032aa436883c36ef3be43ec` |
| Revue BT | 7 | 7, 12, 13 | `2c310fa99a86c55d74e3a08c4a9136b3c8235230630a56af7d0cef31a09feded` |
| verdana | 3 | 12, 55 | `3966fd36d9d83860bfe2bf83b314a55e0384e1e45b14f00cc87962d1526be465` |
| Verdana | 5 | 0, 13, 43 | `5dd35fcd3bc07521db115e09181fbe2852550aee3019c39296113d03766aae74` |
| Wingdings 3 | 1 | 1 | `071ce198ed01eb3d63a91e14ffbb2fd07035b1cb2413e91ec692856278e6a9c4` |

## Exactly parsed text

Exactly decoded unique text values: 969, across 40/40 items. The JSON report retains exact occurrences. Static DefineText values are emitted only when every glyph index resolves through an exactly parsed embedded code table; unresolved glyph records are not guessed.

## Acceptance boundary

This static, source-bound asset-definition census changes no migration or acceptance state and proves none of the strict fidelity gates.
