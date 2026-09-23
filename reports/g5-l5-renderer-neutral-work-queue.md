<!-- generated-by: scripts/build-g5-l5-renderer-neutral-work-queue.mjs -->
# G5 L5 renderer-neutral source-static implementation work queue

状态：`renderer-neutral-source-static-implementation-planning-only`。这是仅供复核的静态规划队列，不选择 renderer，不授权或启动实现，也不执行 runtime/GUI。

## 严格边界

- 57 个发布成员（56 页 + Shell），每个成员固定 7 个 renderer-neutral work packages。
- 结构可达 child domains 1,047 个：仅 696 个有逐项静态证据绑定，可并入 parent composite；其余 351 个保持 unresolved，另有 185 个 excluded-not-proven。
- 9,767 个 definition candidates、2,456 个 canonical static scripts、6 个 dependency candidates（17 occurrences）全部已路由。
- 精确类型/哈希只用于复核候选；不证明 placement、bounds、runtime reachability、instructional beats、renderer suitability 或可复用实现。
- renderer 仍为 `undecided`；implementation authorized/started 均为 0。
- canonical asset/keyframes/coverage 写入均为 0；runtime/GUI 均为 0；acceptance/strict/publication 均为 false。
- `runnable: false`，`commands: []`。

## Work-package totals

| Package | Definitions | Scripts | Dependencies | Dependency occurrences | Renderer | Implementation started |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| visual-assets | 4585 | 0 | 0 | 0 | undecided | 0 |
| timeline-behavior | 1232 | 739 | 0 | 0 | undecided | 0 |
| controls-interactions | 578 | 879 | 0 | 0 | undecided | 0 |
| text-localization | 3367 | 62 | 0 | 0 | undecided | 0 |
| audio | 5 | 244 | 0 | 0 | undecided | 0 |
| external-side-effects | 0 | 10 | 6 | 17 | undecided | 0 |
| shell-host | 0 | 522 | 0 | 0 | undecided | 0 |

## Member queue

| # | Member | Definitions | Scripts | Dependencies | Renderer | Implementation authorized |
| ---: | --- | ---: | ---: | ---: | --- | --- |
| 1 | `course-g05-l05-ir-001-664ab764` | 30 | 9 | 0 | undecided | false |
| 2 | `course-g05-l05-rw-002` | 248 | 3 | 0 | undecided | false |
| 3 | `course-g05-l05-rw-003` | 131 | 4 | 0 | undecided | false |
| 4 | `course-g05-l05-rw-004` | 495 | 8 | 0 | undecided | false |
| 5 | `course-g05-l05-vb-002` | 34 | 3 | 0 | undecided | false |
| 6 | `course-g05-l05-vb-003` | 89 | 52 | 0 | undecided | false |
| 7 | `course-g05-l05-vb-004` | 16 | 6 | 0 | undecided | false |
| 8 | `course-g05-l05-vb-005` | 69 | 14 | 0 | undecided | false |
| 9 | `course-g05-l05-vb-006` | 87 | 63 | 0 | undecided | false |
| 10 | `course-g05-l05-vb-007` | 32 | 6 | 0 | undecided | false |
| 11 | `course-g05-l05-vb-008` | 61 | 8 | 0 | undecided | false |
| 12 | `course-g05-l05-vb-009` | 36 | 8 | 0 | undecided | false |
| 13 | `course-g05-l05-vb-010` | 83 | 31 | 0 | undecided | false |
| 14 | `course-g05-l05-vb-011` | 53 | 11 | 0 | undecided | false |
| 15 | `course-g05-l05-vb-012` | 234 | 33 | 0 | undecided | false |
| 16 | `course-g05-l05-vb-013` | 225 | 34 | 0 | undecided | false |
| 17 | `course-g05-l05-vb-014` | 38 | 10 | 0 | undecided | false |
| 18 | `course-g05-l05-in-002` | 31 | 7 | 0 | undecided | false |
| 19 | `course-g05-l05-in-003` | 103 | 8 | 0 | undecided | false |
| 20 | `course-g05-l05-in-004` | 125 | 55 | 0 | undecided | false |
| 21 | `course-g05-l05-in-005` | 153 | 63 | 0 | undecided | false |
| 22 | `course-g05-l05-in-006` | 45 | 7 | 0 | undecided | false |
| 23 | `course-g05-l05-in-007` | 53 | 10 | 0 | undecided | false |
| 24 | `course-g05-l05-in-008` | 63 | 32 | 0 | undecided | false |
| 25 | `course-g05-l05-in-009` | 292 | 40 | 0 | undecided | false |
| 26 | `course-g05-l05-in-010` | 77 | 4 | 0 | undecided | false |
| 27 | `course-g05-l05-in-011` | 42 | 2 | 0 | undecided | false |
| 28 | `course-g05-l05-in-012` | 100 | 22 | 0 | undecided | false |
| 29 | `course-g05-l05-in-013` | 28 | 5 | 0 | undecided | false |
| 30 | `course-g05-l05-in-014` | 137 | 40 | 0 | undecided | false |
| 31 | `course-g05-l05-in-015` | 112 | 33 | 0 | undecided | false |
| 32 | `course-g05-l05-in-016` | 73 | 50 | 0 | undecided | false |
| 33 | `course-g05-l05-in-017` | 30 | 8 | 0 | undecided | false |
| 34 | `course-g05-l05-in-018` | 161 | 67 | 0 | undecided | false |
| 35 | `course-g05-l05-in-019` | 114 | 7 | 0 | undecided | false |
| 36 | `course-g05-l05-in-020` | 122 | 58 | 0 | undecided | false |
| 37 | `course-g05-l05-ti-002` | 320 | 64 | 0 | undecided | false |
| 38 | `course-g05-l05-ti-003` | 149 | 46 | 0 | undecided | false |
| 39 | `course-g05-l05-ti-004` | 130 | 46 | 0 | undecided | false |
| 40 | `course-g05-l05-ti-005` | 143 | 66 | 0 | undecided | false |
| 41 | `course-g05-l05-ti-006` | 342 | 103 | 0 | undecided | false |
| 42 | `course-g05-l05-ti-007` | 158 | 48 | 0 | undecided | false |
| 43 | `course-g05-l05-ti-008` | 120 | 46 | 0 | undecided | false |
| 44 | `course-g05-l05-ti-009` | 103 | 65 | 0 | undecided | false |
| 45 | `course-g05-l05-ti-010` | 128 | 50 | 0 | undecided | false |
| 46 | `course-g05-l05-gs-002` | 585 | 85 | 0 | undecided | false |
| 47 | `course-g05-l05-ts-002` | 26 | 6 | 0 | undecided | false |
| 48 | `course-g05-l05-ts-003` | 24 | 5 | 0 | undecided | false |
| 49 | `course-g05-l05-ts-004` | 66 | 10 | 0 | undecided | false |
| 50 | `course-g05-l05-ts-005` | 41 | 14 | 0 | undecided | false |
| 51 | `course-g05-l05-ts-006` | 21 | 3 | 0 | undecided | false |
| 52 | `course-g05-l05-ts-007` | 441 | 92 | 0 | undecided | false |
| 53 | `course-g05-l05-ts-008` | 349 | 86 | 0 | undecided | false |
| 54 | `course-g05-l05-fq-001` | 49 | 14 | 0 | undecided | false |
| 55 | `course-g05-l05-fq-002` | 830 | 123 | 1 | undecided | false |
| 56 | `course-g05-l05-fq-003` | 830 | 123 | 1 | undecided | false |
| 57 | `shell-course-g05-l05-index-local` | 1090 | 540 | 4 | undecided | false |

## 输入绑定

- Release catalog: `catalog/lesson-releases.json` (f3caa2ae0e9bfd6c02dd846aa2d45de5c2f746cc57ba01a09e506d4d3c42d632)
- Release fingerprint: `c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84`
- 每个成员工件单独绑定 current manifest、M1 receipt、candidate census/definition inventory、canonical static script/dependency inventories、scenario/frame-domain、coverage-trace plan 与 strict-readiness。
