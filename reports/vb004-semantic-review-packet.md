# VB004 JavaScript adapter 语义审核包

> **这是待人工决定的工程审核包，不是批准记录。** 生成成功、`--check` 通过或哈希一致，均不批准 Flash 忠实度、human visual review、owner acceptance 或完成状态。

- Animation: `course-g03-l01-vb-004`
- Review scope: `sha256:0cc51bd67122aa5d4491863384f26da1a1225ee62850d771ed50ad4d1518d222`
- Packet marker: `sha256:faa3c9015cd581a080c4738efb9b66321fa4ecc94cc19bda4e2a282414673d24`
- Current decision: **pending-explicit-named-human-semantic-decision**
- Strict acceptance effect: **none**

## 为什么需要人工决定

旧 reviewed semantic pin 是 `04bb3c051ba6e4af1718637f3cb1ad2fa1bcc555f2728ef5d320ab4cfae691db`；当前 adapter projection 是 `ef1a3ae5552e408682ea6387d01ad070ef6a6f3da857f21515e6607d38ae98fa`。机器重建证明，reviewed projection 中唯一变化是 `evidence.authoringAuditSha256`，但机器不能替人判断新增的 schema-v2 递归 authoring 证据是否可纳入已审核工程语义。

| 项目 | 旧/记录值 | 当前值 | 状态 |
|---|---|---|---|
| Reviewed semantic pin | `04bb3c051ba6e4af1718637f3cb1ad2fa1bcc555f2728ef5d320ab4cfae691db` | `ef1a3ae5552e408682ea6387d01ad070ef6a6f3da857f21515e6607d38ae98fa` | 待人工批准 |
| Animate authoring audit | schema v1 / `6b7942cf2d9a082d9b7b0b345f59b8029a8d3e398d8183658839919f021fab31` | schema v2 / `38cbdd18a6d3f1fa2b75843fd6eb640ae59d6c36b670a100f7fb8bc018135e83` | stable facts match；递归证据新增 |
| Authoring frame | `cfaaaab224f7ae55ab5adacd85a5d266ba920b1734065b6fcfe1fde09d0a782b` | `cfaaaab224f7ae55ab5adacd85a5d266ba920b1734065b6fcfe1fde09d0a782b` | 字节相同 |
| Scenario inventory binding | `b6ebdc8a410ce4080c2d60009ea04607e1be1750850469ac4e060c4b936abeec` | `ea40576e9ff190c818d180088ecc6389f7f0b1a821df59da4ceb77cf1334334c` | **STALE** |

## 绑定证据

- Adapter spec: [`migrations/course-g03-l01-vb-004/audit/animate-createjs-adapter-spec.json`](<../migrations/course-g03-l01-vb-004/audit/animate-createjs-adapter-spec.json>) — SHA-256 `56ae25c82a9ffe52e4f198bcda4badeb2f3680d40decc1078ef85cf1b33a8a49`
- Reviewed-pin authority: [`scripts/refresh-course-candidate-spec-bindings.mjs`](<../scripts/refresh-course-candidate-spec-bindings.mjs>) — SHA-256 `53eb75aef722514c6363d0c7794c5b951861269851def96544efd0fab6ab851d`
- Adapter consumer: [`scripts/build-safe-animate-createjs-adapter.mjs`](<../scripts/build-safe-animate-createjs-adapter.mjs>) — SHA-256 `9661807c8b28d716deb88d506073ad8baad97e640e862434a7f602c5120642f7`
- Archived authoring audit: [`migrations/course-g03-l01-vb-004/audit/history/6b7942cf2d9a082d9b7b0b345f59b8029a8d3e398d8183658839919f021fab31/adobe-animate-2021-authoring-audit.json`](<../migrations/course-g03-l01-vb-004/audit/history/6b7942cf2d9a082d9b7b0b345f59b8029a8d3e398d8183658839919f021fab31/adobe-animate-2021-authoring-audit.json>) — SHA-256 `6b7942cf2d9a082d9b7b0b345f59b8029a8d3e398d8183658839919f021fab31`
- Authoring archive manifest: [`migrations/course-g03-l01-vb-004/audit/history/6b7942cf2d9a082d9b7b0b345f59b8029a8d3e398d8183658839919f021fab31/archive-manifest.json`](<../migrations/course-g03-l01-vb-004/audit/history/6b7942cf2d9a082d9b7b0b345f59b8029a8d3e398d8183658839919f021fab31/archive-manifest.json>) — SHA-256 `de5c6d8b558caa2e2dea75ba12ac2683c7d5b05ac9be6c155a670481bf7f8c4f`
- Current authoring audit: [`migrations/course-g03-l01-vb-004/audit/adobe-animate-2021-authoring-audit.json`](<../migrations/course-g03-l01-vb-004/audit/adobe-animate-2021-authoring-audit.json>) — SHA-256 `38cbdd18a6d3f1fa2b75843fd6eb640ae59d6c36b670a100f7fb8bc018135e83`
- Current scenario inventory: [`migrations/course-g03-l01-vb-004/audit/scenario-inventory.json`](<../migrations/course-g03-l01-vb-004/audit/scenario-inventory.json>) — SHA-256 `ea40576e9ff190c818d180088ecc6389f7f0b1a821df59da4ceb77cf1334334c`
- Current audio audit: [`migrations/course-g03-l01-vb-004/audit/audio-runtime-evidence.json`](<../migrations/course-g03-l01-vb-004/audit/audio-runtime-evidence.json>) — SHA-256 `c4b948d2893d27477e7592e3657a85097f01054b83369beae2f512991e249184`
- Source FLA: [`source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.fla`](<../source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.fla>) — SHA-256 `49f1694f1a7ec200d4d3455c1bc29699b83146043b7c0f25165228b32a9e3a1a`
- Source SWF: [`source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.swf`](<../source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.swf>) — SHA-256 `8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e`

## Authoring 对比

稳定事实一致：stage 800×600、12 FPS、root 10 frames、library 83 items、`Animation03` 222 frames / 9 layers。

schema-v2 新增并已机器核对：只读 working copy 的路径/哈希/权限、与源 FLA 字节一致、递归 library/timeline audit。当前递归审计还暴露：

- Action keyframes: frame 1 (duration 55, script length 39); frame 56 (duration 1, script length 65); frame 57 (duration 166, script length 28)
- Sound placements: G3L1_4 at frame 7 (duration 44, stream); G3L1_4a at frame 62 (duration 157, stream)

限制：Authoring evidence does not prove original-runtime reachability, interaction order, audio synchronization, bilingual behavior, Replay, scoring, or visual fidelity.

## Scenario 绑定状态

当前 inventory 状态是 `static-exhaustive-runtime-unverified`，`sprite-231` 为 222 frames；它仍列出 10 个 unresolved 项和 2 个 conflict。

- Unresolved: `runtime-reachability`, `hit-geometry`, `host-defaults`, `readiness-missing-01`, `readiness-missing-02`, `readiness-missing-03`, `readiness-missing-04`, `readiness-missing-05`, `unproven-nested-timelines`, `replay-target`
- Conflicts: `readiness-release-count-vs-exported-blocks`, `root-vs-nested-duration`
- Important limitation: The packet has the stale SHA recorded by the adapter spec but no archived bytes for that old scenario inventory, so it does not claim byte-level or semantic equivalence between old and current inventories.
- Refresh boundary: Scenario path/SHA is excluded from the reviewed semantic hash, but any later binding-only refresh must still pass the existing source, manifest, timeline, placement, readiness, and audio invariants.

## 请由具名人员作出明确决定

若批准，请在对话中原样发送以下完整声明：

> 我已人工审核 VB004 语义审核范围 sha256:0cc51bd67122aa5d4491863384f26da1a1225ee62850d771ed50ad4d1518d222。我批准将 course-g03-l01-vb-004 的 reviewed semantic pin 从 04bb3c051ba6e4af1718637f3cb1ad2fa1bcc555f2728ef5d320ab4cfae691db 更新为 ef1a3ae5552e408682ea6387d01ad070ef6a6f3da857f21515e6607d38ae98fa；该批准仅涵盖当前 adapter spec 对 schema-v2 Animate authoring audit 的语义绑定，以及在既有机器校验全部通过后把 scenario-inventory 绑定从 b6ebdc8a410ce4080c2d60009ea04607e1be1750850469ac4e060c4b936abeec 刷新为 ea40576e9ff190c818d180088ecc6389f7f0b1a821df59da4ceb77cf1334334c。它不批准 Flash 忠实度、原始运行时行为、音频、交互、human visual review、owner acceptance、strict completion 或 migration status 变更。

若拒绝，请发送：

> 我拒绝 VB004 语义审核范围 sha256:0cc51bd67122aa5d4491863384f26da1a1225ee62850d771ed50ad4d1518d222；不要更新 reviewed semantic pin 或刷新 adapter scenario-inventory 绑定。

### 不得扩大的含义

- Approval is not human visual review or owner acceptance.
- Approval is not evidence that the JavaScript adapter matches Flash.
- Approval is not authoritative original-runtime, audio, interaction, scoring, bilingual, Replay, RMSE, accessibility, or completion evidence.
- Codex, this generator, and automated checks cannot supply the named-human decision.

本包没有改 allowlist、adapter spec、migration status、human visual review 或 owner acceptance。Decision recorded by packet: `false`.
