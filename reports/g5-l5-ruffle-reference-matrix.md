# G5 L5 Ruffle Forensic Reference Matrix

Release: `lesson-g05-l05-add-subtract-negative-numbers` — **Add & Subtract Negative Numbers**

Queue: **57/57** exact members; physically verified source SWFs: **57/57**.
Representative diagnostics: **8/8** from the exact existing risk-calibration set.

## Local-only safety boundary

- Development reference page/API only; source guards require 404 in production. This matrix did not launch a production server or claim an observed production HTTP status.
- Frozen SWF bytes are streamed on demand with `no-store`; SWF copies in `apps/web/public`: **0**.
- Ruffle configuration: `allowNetworking: none`, `allowScriptAccess: false`, `openUrlMode: deny`.
- Ruffle: `@ruffle-rs/ruffle@0.4.1`.

## Representative English diagnostics

| # | Animation | Release # | Exact source | Ruffle load | Loopback containment | PNG | Blocked local | Console/page errors |
|---:|---|---:|---|---|---|---|---:|---:|
| 1 | `shell-course-g05-l05-index-local` | 57 | pass | pass | pass | 800×600 | 2 | 2/0 |
| 2 | `course-g05-l05-rw-002` | 2 | pass | pass | pass | 800×600 | 0 | 0/0 |
| 3 | `course-g05-l05-in-016` | 32 | pass | pass | pass | 800×600 | 0 | 0/0 |
| 4 | `course-g05-l05-in-020` | 36 | pass | pass | pass | 800×600 | 0 | 0/0 |
| 5 | `course-g05-l05-ti-006` | 41 | pass | pass | pass | 800×600 | 0 | 0/0 |
| 6 | `course-g05-l05-gs-002` | 46 | pass | pass | pass | 800×600 | 0 | 0/0 |
| 7 | `course-g05-l05-ts-007` | 52 | pass | pass | pass | 800×600 | 0 | 0/0 |
| 8 | `course-g05-l05-fq-002` | 55 | pass | pass | pass | 800×600 | 0 | 0/0 |

The eight-member selection covers the bound shell, SWF-only and paired-FLA members, instructional and practice interaction risks, game/test/quiz state, branch/random risks, embedded audio tags, and legacy side-effect candidates. These are selection axes, not accepted coverage.

Observed surfaces: **7 uniform page surfaces / 1 nonuniform shell surface**. The shell attempted **2** unallowlisted local dependency reads; both were blocked before server execution, producing **2** recorded browser console errors and **0** page errors. This is a dependency/host-entry diagnostic, not behavior acceptance.

## Commands

Start the loopback development server:

```bash
npm run dev --workspace @helpmath/web -- --hostname 127.0.0.1 --port 3105
```

Each of the 57 queue records contains exact English and Spanish probe commands. Example:

```bash
node scripts/probe-g5-l5-ruffle-reference.mjs --base-url http://127.0.0.1:3105 --animation-id course-g05-l05-ir-001-664ab764 --expected-sha256 03c0a8ef50c79c7c1e672471df3c2d294674ca28a9dd68e0bf1cbffda66bd613 --expected-bytes 55368 --expected-width 800 --expected-height 600 --lang en --settle-ms 3500 --output output/playwright/g5-l5-ruffle-reference-diagnostics/course-g05-l05-ir-001-664ab764/en-3500ms
```

## Acceptance-neutral boundary

- Exact source frame evidence: **0**
- Authoritative original-runtime baselines: **0**
- Audio and interaction acceptances: **0 / 0**
- Fidelity/human/Owner acceptances: **0 / 0 / 0**
- Strict completion / publication: **0/57 / false**

A passing diagnostic proves only exact source delivery, local Ruffle loading, loopback/network containment, and an 800×600 PNG after a fixed delay. It does not prove source-frame identity, baseline behavior, audio, interaction, fidelity, or acceptance.

## 57-member queue

| # | Animation | Role | Source SHA-256 | Root frames | Risk calibration |
|---:|---|---|---|---:|---|
| 1 | `course-g05-l05-ir-001-664ab764` | active-xml-referenced-page | `03c0a8ef50c79c7c1e672471df3c2d294674ca28a9dd68e0bf1cbffda66bd613` | 10 | no |
| 2 | `course-g05-l05-rw-002` | active-xml-referenced-page | `2c1988158116954da31fa820e0b5a3f4feddab3ea2e5ce4ec0fe87a96b5d9d33` | 10 | selected #2 |
| 3 | `course-g05-l05-rw-003` | active-xml-referenced-page | `5726f1760ff9378e9141b2e952c919a5c8b9eb76796e8c6a5d222da4378f93ba` | 10 | no |
| 4 | `course-g05-l05-rw-004` | active-xml-referenced-page | `78b003d025ef66eec5d5f9c7a0729f671067acc3286d05fb81e0930694e7fa30` | 10 | no |
| 5 | `course-g05-l05-vb-002` | active-xml-referenced-page | `979fe1d9d43068320a1c4881c89a2edbe7fa849c4375704dfb4033d3ec34e855` | 10 | no |
| 6 | `course-g05-l05-vb-003` | active-xml-referenced-page | `9f3b7475cadeb8f5780d98a047b7bfe2b5aa6d3f90c3cf7206b206bd0bee3eaa` | 10 | no |
| 7 | `course-g05-l05-vb-004` | active-xml-referenced-page | `b0e87cff11a7d866591194914f687e023a443d73e716fa21d6fbf02d3830539e` | 10 | no |
| 8 | `course-g05-l05-vb-005` | active-xml-referenced-page | `9ad6420dafab8894853f2f629569ac2f019369d79f413a8e321f5dd9f65f4ac0` | 10 | no |
| 9 | `course-g05-l05-vb-006` | active-xml-referenced-page | `23763527fb0498187b54c81ef5597d7618f72def7b6418262f5a35465101db8f` | 10 | no |
| 10 | `course-g05-l05-vb-007` | active-xml-referenced-page | `4154dc07c23b84a88f0e30b158ca599807e203154a121cbf74c642a0c2eba6a6` | 10 | no |
| 11 | `course-g05-l05-vb-008` | active-xml-referenced-page | `5a5612779481b2ded1e7ccbb32992c1b435ba88358bfa4901d2df8d2a16e3ed4` | 10 | no |
| 12 | `course-g05-l05-vb-009` | active-xml-referenced-page | `5f3869ddcca1d7cebaf32da74f909d1a8d1716d7efb874a512618c5a0b6cef2f` | 10 | no |
| 13 | `course-g05-l05-vb-010` | active-xml-referenced-page | `ff6b9fa3dba9ea36dc437b6eacec3d2fb2f08a675d93bac15d0e25e8e30ed5e6` | 10 | no |
| 14 | `course-g05-l05-vb-011` | active-xml-referenced-page | `fde24d912218c9e20344b4a933aa07ddcf586fc37d3c7c93e018c54abef203ea` | 10 | no |
| 15 | `course-g05-l05-vb-012` | active-xml-referenced-page | `9530d6f3adb0ed6a3c8fbb5ba22c8084e2f8a20b45a735381574eb78e714abd0` | 10 | no |
| 16 | `course-g05-l05-vb-013` | active-xml-referenced-page | `cc2b3a405682e3fc684ebdcebc72be044eeb1817839dd6f0f9fe5a4fd1eb9811` | 10 | no |
| 17 | `course-g05-l05-vb-014` | active-xml-referenced-page | `e2e3615d3934e4cc90281d6c28c7cdb54f60cb0293e924f873878d7f7b753dbb` | 10 | no |
| 18 | `course-g05-l05-in-002` | active-xml-referenced-page | `5853518abc04ce613e395c26ecaf7e14baa2bf86add1f3212a11ddb6dcad9eea` | 10 | no |
| 19 | `course-g05-l05-in-003` | active-xml-referenced-page | `16843d9656c750accbdcf8b8f02f96ef5ab0c01619762eae7d12795a65722a14` | 10 | no |
| 20 | `course-g05-l05-in-004` | active-xml-referenced-page | `8440659a366590d363dda8e44a1e3a2fdd2fc8a5e1ba5aafabdd35c134aea6b4` | 10 | no |
| 21 | `course-g05-l05-in-005` | active-xml-referenced-page | `5de683c2edc64408a4c1927d2bf90f389f6713d2e040aaf6641d91b29873ccc0` | 10 | no |
| 22 | `course-g05-l05-in-006` | active-xml-referenced-page | `d980b5143c3b734cc5607db37eb89099dd2848bbb6e0e250d4ae9c75b5eb039f` | 10 | no |
| 23 | `course-g05-l05-in-007` | active-xml-referenced-page | `be30db847ea9f8f9634cd4e15c34c805b20f2d691283f813c0976dc8be1958f4` | 10 | no |
| 24 | `course-g05-l05-in-008` | active-xml-referenced-page | `002c3a22a97ea9e90614bb6807b6832048f7fcb07590682673e1396f4d56a2c7` | 10 | no |
| 25 | `course-g05-l05-in-009` | active-xml-referenced-page | `e46c069d4bc2fa7b44dc53ad067a104e84db924bf9f17781f6d715c7fa5ea4a9` | 10 | no |
| 26 | `course-g05-l05-in-010` | active-xml-referenced-page | `57959126d5b13ea2831ac3c779fdaf489e8c4e7f405c586561435272239a85a4` | 10 | no |
| 27 | `course-g05-l05-in-011` | active-xml-referenced-page | `8d1b08c83909f421939a225de45f1739dc4488190465c744a27464e5bfbe5f12` | 10 | no |
| 28 | `course-g05-l05-in-012` | active-xml-referenced-page | `a6c045b6235195e67aefd48f5ea37deaea250f3a1ab3c75e99f8b1d5932315b3` | 10 | no |
| 29 | `course-g05-l05-in-013` | active-xml-referenced-page | `87ba609ec15aac759bc708dc5fa67b84e2057accf348bed202a027fbb6cdac64` | 10 | no |
| 30 | `course-g05-l05-in-014` | active-xml-referenced-page | `0805a9e871e74e253f6bbaf334356c9a9245026286cdd3e450d236d5b37e887a` | 10 | no |
| 31 | `course-g05-l05-in-015` | active-xml-referenced-page | `03c90b1528f2c73bc5ff4e4a6c6e2e33aa36bcc3208d4d42a4b1d1d560973f96` | 10 | no |
| 32 | `course-g05-l05-in-016` | active-xml-referenced-page | `229fb0ec81b4fc662b69dc4c4913a327b9c680aca299fbef2540b6f89a96d386` | 10 | selected #3 |
| 33 | `course-g05-l05-in-017` | active-xml-referenced-page | `3be9e6551570f17a7495e4edc2f670b18cd8f61497053e531d060de76111f661` | 10 | no |
| 34 | `course-g05-l05-in-018` | active-xml-referenced-page | `f315cc518fd7ca50449b0db2f00838042997ca8d9fbff04bd98d52ebf7893609` | 10 | no |
| 35 | `course-g05-l05-in-019` | active-xml-referenced-page | `2888a14cbeff83f7e6c2e3574e6a887739b5111726658e6d65fa2c37c8aa145f` | 10 | no |
| 36 | `course-g05-l05-in-020` | active-xml-referenced-page | `3773661b456c70bfc84e9c5416b959ac6bd0bbb9249478049f0752fd62de9e9d` | 10 | selected #4 |
| 37 | `course-g05-l05-ti-002` | active-xml-referenced-page | `54edc245960ecb1847f0117393601f5ca5644777b1d22f28ab94fcdb195f2a38` | 10 | no |
| 38 | `course-g05-l05-ti-003` | active-xml-referenced-page | `6b7a4abead6d38a3975bbcfd71f723df35854718219e99351aeff01b53cd250c` | 10 | no |
| 39 | `course-g05-l05-ti-004` | active-xml-referenced-page | `91dbb6f96a43f9813670c5aa5ffc7d38e5a4f159292103b26e63b363325740a6` | 10 | no |
| 40 | `course-g05-l05-ti-005` | active-xml-referenced-page | `ee73784b6972524937619ac58b86a0c7f3f2ff9fb2a08aca2ef901ca9c56dc0b` | 10 | no |
| 41 | `course-g05-l05-ti-006` | active-xml-referenced-page | `faca6a7490f74cc46744476216566b08a5b72a2828ad2251242e3aab63341249` | 10 | selected #5 |
| 42 | `course-g05-l05-ti-007` | active-xml-referenced-page | `566c7ca16798138865adedc2c50f0f5360b91044a90fa7f9f68b63d1a34eb6e0` | 10 | no |
| 43 | `course-g05-l05-ti-008` | active-xml-referenced-page | `12d721251493bcde5da9009aace68f1cc644ca959b86b7ba8c237d58f369b4cc` | 10 | no |
| 44 | `course-g05-l05-ti-009` | active-xml-referenced-page | `e5397632f23e139fb130c275fb5215df917a7b53b14289a3194bc2d4bfa3df88` | 10 | no |
| 45 | `course-g05-l05-ti-010` | active-xml-referenced-page | `a2e6ff0fbe41d35aa71b9bed44235db86314a99499046ec292c5126ce50b3bdc` | 10 | no |
| 46 | `course-g05-l05-gs-002` | active-xml-referenced-page | `ba769ee78e13c4f757d9b85f12a77cb5379ea6866552c9867988938ff45e31fa` | 10 | selected #6 |
| 47 | `course-g05-l05-ts-002` | active-xml-referenced-page | `8ff02406f8ebb13c66a59212561b2764e71ba8a0c709a3d3eff926d3121a8f39` | 10 | no |
| 48 | `course-g05-l05-ts-003` | active-xml-referenced-page | `c32346a309928540738395842a224f81fac4e3b4cd98bf2f6c544ef8666a735f` | 10 | no |
| 49 | `course-g05-l05-ts-004` | active-xml-referenced-page | `a5c007f771acb077ee9b57266407de1a74b162966fc295ab10fc87e1556a1178` | 10 | no |
| 50 | `course-g05-l05-ts-005` | active-xml-referenced-page | `5c4ad222e8a710acc84d3260ae934a9df8855a9daa22aee3f7ef17717f0aa431` | 10 | no |
| 51 | `course-g05-l05-ts-006` | active-xml-referenced-page | `c8fb2601bfcd20fa041c2fb8333d142fc046f9d730ddd6df94541c6c8a3f486a` | 10 | no |
| 52 | `course-g05-l05-ts-007` | active-xml-referenced-page | `e034c05612a1ff93223b4d3071f56b41204518b0cf9d7a4b436323e79b18a588` | 10 | selected #7 |
| 53 | `course-g05-l05-ts-008` | active-xml-referenced-page | `752ec6444203e2faff46a9c711ed76ee54a9f42e1111d9f78aad506cf8cc95d2` | 10 | no |
| 54 | `course-g05-l05-fq-001` | active-xml-referenced-page | `98522023d261a4b024eb54b386a909c12444c870d30bc52604c79654abf74d9b` | 10 | no |
| 55 | `course-g05-l05-fq-002` | active-xml-referenced-page | `1a28dba8c875c62dd655248b6f7ebe0af634ffe5ff174882d306a1f40d3060c3` | 10 | selected #8 |
| 56 | `course-g05-l05-fq-003` | active-xml-referenced-page | `43c27a0b81662befa75d09fe042c0379090acee274839316d614c8d66ab0d7d2` | 10 | no |
| 57 | `shell-course-g05-l05-index-local` | course-shell | `5375c535f0761ae580f00eeda29c00d34d0de901239a7d2c65acf968a8290c66` | 50 | selected #1 |

