# HELP Math 16 项试点忠实迁移验收操作手册

这份手册规定如何把机器证据交给具名的人类审核人和 HELP Math owner。
它不是签名，也不能被 Codex、脚本、CI 或生成器当成签名。最终完成口径是：
`reports/pilot-strict-acceptance.json` 中 16/16 `strictAccepted: true`，且
`catalog/completion-ledger.json` 收录同一组当前 manifest 哈希。

## 角色与权限边界

- **Engineering evidence operator** 运行审计、原始运行时、浏览器捕获、比较和测试；不得填写 human/owner 决定。
- **Named human reviewer** 逐项查看全部帧/diff、contact sheet、双语、音频和交互证据；只能用本人姓名和实际审核时间创建 append-only、内容寻址的 human review record，并把其精确 descriptor 镜像到 `acceptance.humanVisualReview.record`。
- **Owner / authorized owner representative** 决定是否接受明确范围和例外；只能用本人姓名和实际决定时间创建绑定 human/audio/behavior/product/exception 证据的 append-only owner record，并把其精确 descriptor 镜像到 `acceptance.ownerReview.record`。
- **Release custodian** 在两类人工决定已真实记录后重建验证收据、严格报告和完成 ledger；不得代替前两者决定。

任何自动化生成的姓名、日期、勾选框、`--check` PASS、工程 prereview 或 Codex
说明都不是 human review 或 owner acceptance。

## 一、先建立可审核快照

在仓库根目录运行：

```bash
npm run verify:sources
npm run accept:current-js -- --check
npm run audit:pilot-audio -- --check
npm run audit:static-frame-domain-evidence:check
npm run audit:frame-domain-dispositions:check
npm run audit:course-trace-specs:check
npm run audit:course-trace-evidence:check
npm run audit:renderer-frame-domains:check
npm run fixture:adobe:course-frames -- --check
npm run verify:pilots:check
node scripts/build-pilot-strict-acceptance.mjs --check
node scripts/build-pilot-owner-review-packet.mjs --check
npm run ledger:check
```

任一命令失败都要保存原始输出并返回 engineering；不得把失败解释为“owner
可接受”。打开 `reports/pilot-owner-review-packet.md`，逐项确认：

`accept:current-js -- --check` 只验证项目用户对当时 JavaScript 候选输出的范围限定
批准仍绑定当前实现和捕获哈希。它不是本手册要求的具名 all-diff human review，
也不是 owner acceptance、原始 Flash baseline、音频验收或 strict completion。
当前 schema v3 还绑定实现的递归本地 import、直接/间接公开 renderer 与音频资产、
Next.js 隐式路由/构建配置，以及每个 animation 的 route-visible catalog 投影；
manifest 必须逐字段镜像 reviewer、reviewedAt、sourceMessage、scope、记录路径和哈希。
schema v1/v2 或上述边界中任一内容变化都要求 fresh human approval；
`--amend-binding` 只能在受保护输出和身份镜像完全未变时更新非权威工程证据绑定。
共享 report 的 animation 集合不可拆分：重新记录时必须覆盖原集合，避免单个 manifest
改指新报告后使其余动画的既有批准成为孤儿。历史条目也必须与 report 精确镜像，且
只能保留 current-JavaScript 范围，不能夹带 owner、strict、fidelity 或 audio 权威。

1. 16 个 `manifestBinding` 全部为 `CURRENT`；
2. 每个 evidence 文件都存在且显示内容 SHA-256，而不是 `MISSING`；
3. 在 human 签字前，除 `human-review`、`owner-acceptance` 和依赖这些签名的
   `strict-validator` 外，其余 12 个门禁均为 PASS；
4. `strict-validator` 的剩余原因只能是尚未记录的 human/owner 决定、最终
   `status: complete` 及其派生收据；若还有帧、音频、行为、证据哈希、测试或构建
   问题，停止审核。

## 二、课程与课程壳的原始运行时证据

`audit/trace-specs/*.json` 只是执行说明。`traceSpecStatus` 为 `unresolved`、
`orderedSteps` 为空但自然行为又是必需、或 source target 无法解析时，不得根据
Next.js 行为猜测操作；返回 engineering。

对每个 coverage requirement：

1. 从 `migrations/course-shell-pilot-trace-spec-index.json` 打开索引中的精确 spec，
   核对 `animationId`、`requirementId`、`frameDomainId`、`traceId`、
   `entryStateSha256`、language、seed、舞台和 FPS。
2. 只在 spec 指定的授权原始运行时中执行。自然交互必须严格按
   `schedule.orderedSteps` 的 source target、前置状态和后置状态运行；产品实现
   不能作为操作脚本。
3. 线性 root visual 可以逐帧 direct seek，或在 frame 1 执行一次 Rewind、随后
   每帧只执行一次 Step Forward。它只能证明 root 视觉帧，不能证明自然播放、
   nested phase、分支、Replay 或音频。
4. 对上述已就绪的线性 root visual，先由具名操作员在授权 Adobe 原始运行时生成
   append-only operation JSONL、display-list JSONL、原生尺寸 lossless PNG 和
   toolchain receipt。开始人工会话前，先为索引中当前的 18 个就绪 requirement
   生成未签名操作包（也可用 `--spec` 只选一个）：

   ```bash
   npm run scaffold:course-root:capture -- --all-ready
   npm run scaffold:course-root:capture -- --all-ready --check
   ```

   如果 `--check` 仅因当前 trace-spec、trace-spec index 或 scenario-inventory 的
   SHA-256 绑定更新而失败，并且现有目录仍是生成器逐字节可复现的空白 unsigned
   template，可运行一次受控刷新：

   ```bash
   npm run scaffold:course-root:capture -- \
     --all-ready --refresh-unsigned-template
   npm run scaffold:course-root:capture -- --all-ready --check
   ```

   刷新器只接受固定的三个 hash 字段漂移；manifest 其余字段、文件集合、只读模式、
   空 `frames/` 占位、staged source 和 launcher 必须完全匹配。它使用持有所有权的锁、
   compare-and-swap 和全批回滚，并把旧模板及完整 hash inventory 追加归档到
   `work/root-capture-kit-stale-archive/`。发现任何 PNG、session/log、人工填写内容、
   额外文件、符号链接或非白名单语义变化时必须拒绝刷新。刷新不生成原始运行时证据，
   不改变 migration、coverage、review 或 strict 状态。

   操作包固定位于 `work/root-capture-kits/<animation-id>/<requirement>/`，绑定当前
   indexed spec、source SWF、逐字节 staged SWF、native stage/FPS/range 和 Projector
   executable SHA-256。包内只有 operator card、空模板、schema 描述、空 frames
   README 和 checked launcher；它不包含运行时观察、PNG 或签名。launcher 只启动
   **未带 SWF 参数的空 Projector**，然后必须由具名操作员本人通过
   `File → Open File…` 选择包内列出的 hash-bound staged SWF。禁止命令行 SWF
   参数、`open`、LaunchServices 或直接从 `source-assets/` 启动。launcher 输出和
   Projector PID 都不证明 SWF 已打开。必须把 `--check` 的单 requirement JSON 结果保存到
   kit 外，并由 schema-v2 launch receipt 绑定它；receipt 分别记录空 Projector 的
   executable、PID、startedAt、`swfArgument: null`，以及具名人工 GUI open 的 method、
   `['File', 'Open File…']`、staged source 路径/哈希、openedAt 和
   `playerWindowObserved: true`。完成的真实 session artifacts 必须写入 kit
   之外的独立目录；candidate preparer 会拒绝 kit 路径、template/schema 文件及仅改名但
   仍为空的模板内容。

   完成现场证据后，再运行下列离线候选包 preparer。它会校验逐帧操作、两条
   哈希链、800×600 尺寸、运行时身份与源 SWF 绑定，但只生成待人工/owner 复核的
   非权威候选包：

   ```bash
   npm run prepare:course-root:capture -- \
     --spec migrations/<animation-id>/audit/trace-specs/<requirement>.json \
     --operation-log <operation-log.jsonl> \
     --display-list-states <display-list-states.jsonl> \
     --frames <native-png-directory> \
     --launch-receipt <source-open-launch-receipt.json> \
     --toolchain-receipt <toolchain-receipt.json> \
     --capture-session-attestation <named-human-session-attestation.json> \
     --proof-mode sequential-step-root-exhaustive
   ```

   `direct-seek-root-exhaustive` 只可用于每一帧都有一次显式 seek 且运行时回报完全
   相同帧号的日志。session attestation 必须由实际现场操作的具名人类签署，并与
   source/spec/runtime receipt、两条日志链和每个 PNG 哈希精确绑定。不得手写、
   补齐或从候选实现反推操作记录。preparer 只写入
   `artifacts/full-frame/pilot-baselines/<animation-id>/<requirement>/pending-human-owner/`
   和 `migrations/<animation-id>/evidence/pending-root-capture/<requirement>/`；不会写
   canonical baseline、execution report、coverage、manifest 状态或 review。
   候选包本身不会被 `audit:course-trace-evidence:check` 视为已验收证据。即使已取得
   operator/runtime identity、独立 human evidence review 和 owner decision，当前也只能按
   [`docs/ORIGINAL_RUNTIME_EVIDENCE_PROMOTION.md`](ORIGINAL_RUNTIME_EVIDENCE_PROMOTION.md)
   执行只读 dry-run；canonical 写入因未解决的 authority、natural causality/DAG、path 和
   transaction P1 正处于硬关闭状态。不得去掉 `--dry-run`、复制 PNG、手写 canonical
   report 或编辑 coverage authority。
5. 对 `source-schedule-ready-for-authoritative-execution` 的自然交互 requirement，
   先生成与当前 spec、原 child、原课程 host 和本机 Adobe Projector 绑定的未签名
   操作包：

   ```bash
   npm run scaffold:course-natural:capture -- \
     --spec migrations/<animation-id>/audit/trace-specs/<requirement>.json
   ```

   已存在但仅因 trace-spec index SHA-256 更新而陈旧的空白 natural-trace template，
   可使用同样的 fail-closed 刷新模式；英语和西班牙语必须分别执行并再次检查：

   ```bash
   npm run scaffold:course-natural:capture -- \
     --spec migrations/<animation-id>/audit/trace-specs/<requirement>.json \
     --refresh-unsigned-template
   npm run scaffold:course-natural:capture -- \
     --spec migrations/<animation-id>/audit/trace-specs/<requirement>.json \
     --check
   ```

   该模式要求旧 kit 整棵文件树、runtime tree、文件权限和空模板都与旧 index 绑定下的
   生成器输出逐字节一致；旧字节及 canonical inventory 追加保存在
   `work/natural-trace-capture-kits/_stale-unsigned-template-archive/`。存在帧、运行日志、
   session evidence、签名、额外文件、符号链接或任意其他语义漂移时刷新失败。
   每个 natural stale archive 还必须包含只读 `archive-integrity-v2.json`：它绑定原
   `archive-record.json` 的原始 SHA-256、完整含权限 inventory，以及目录 tree identity
   的明确算法。最早两份 RW02 归档使用历史的“按 code-unit 排序、排除 mode”算法；
   sidecar 保留该可复算 identity，并另记当前含 mode 的完整 inventory SHA-256，不修改
   旧 record、kit 字节或目录名。刷新或复核后运行独立只读校验器：

   ```bash
   node scripts/validate-capture-kit-stale-archives.mjs
   ```

   它同时重算 root 与 natural stale archive 的文件集合、字节数、SHA-256、权限、目录
   identity 和 sidecar 绑定；不会生成运行时证据、改变 migration/status/review 或给予
   strict acceptance。

   操作包位于 `work/natural-trace-capture-kits/`，包含 operator card、执行计划、
   schema 模板，以及由审计清单逐字节复制的只读 `runtime-tree/`；零 PNG、零事件、
   零签名，不能算 evidence。包内从当前用户账户运行的 checked launcher 明确标记为
   `safety-probe-only-not-authoritative-clean-profile`：它会禁止读取该账户已有的
   Flash preference/SharedObject，因此可能改变 `SharedObject.getLocal` 语义。它只能用于
   安全排练，其输出不得作为权威候选。

   英语和西班牙语必须分别在互不复用的独立 disposable 环境中采集：使用恢复后的
   disposable macOS VM 快照，或专用的一次性真实 macOS 登录账户；账户必须有独立
   home，Flash profile 在 preflight 时为空，且保留正常可读写的 SharedObject 语义，会话后
   必须重置或销毁。每个语言会话都要有独立的 `environment-isolation receipt`，
   不得共用 Flash profile、会话或收据。在这个合格环境中，自然执行必须遵循
   two-stage launch contract：checked launcher 只启动**未带 SWF 参数的空 Adobe
   Projector 进程**；随后由具名操作员本人通过 `File → Open File…` 选择 kit 内精确
   hash-bound、byte-identical staged host。launcher 的输出、PID 或进程存在只证明
   Projector process launch，绝不证明 host 已被打开；不得把 SWF 作为命令行参数，
   也不得使用 `open`、LaunchServices 或其他命令行/系统打开机制代替这个 GUI 操作。
   不能直接从 `source-assets/` 启动、不能单独启动 child，也不能使用会 direct-seek、
   mute 或遮挡输入的 local-frame controller。当前 RW L13 包绑定的原 host 是
   `HELP_COURSES/ELMGR5/L13/index_local.swf`，SHA-256
   `956d8e90ca07d59aeb9b3e97bc20f7e2e14221125913d8f774b8c98a61d4292d`。
   它还绑定 entry contract、structural placement proof、side-effect deny list 和
   5 文件 minimal tree（host、启动 IR、RW02、Spanish MP3、自动读取的
   `ELKTEG4.xml`），并保留从 archive root 开始的原相对目录。任何额外或缺失文件、
   stale hash、旧 SharedObject/bookmark、未清单化 load 或副作用都使本次 capture 失败。

   会话前在 kit 外的独立 evidence 目录保存纯 JSON 自检收据（stdout 只有 JSON；警告走
   stderr），并在 schema v2 launch receipt 中绑定原字节与 SHA-256：

   ```bash
   node scripts/scaffold-natural-trace-capture-kit.mjs --check \
     --spec migrations/<animation-id>/audit/trace-specs/<requirement>.json \
     > <separate-session-directory>/kit-check.json
   ```

   schema v2 launch receipt 必须分别记录空 Projector 的 executable、PID、startedAt 和
   `swfArgument: null`，以及 GUI open 的 method、`["File", "Open File…"]` menuPath、
   staged 相对路径与 SHA-256、openedAt 和由具名操作员确认的
   `playerWindowObserved: true`。旧 schema v1、命令行 SWF 参数、未绑定 staged host 或
   非人工窗口观察一律 fail closed。

   具名操作员在上述每语言独立环境的 Adobe Flash Player 32.0.0.414 session 中生成：
   environment-isolation receipt、上述 hash-bound original-host launch receipt、恰好 8 条且按序哈希链接的
   host-entry log，以及 append-only operation JSONL、每帧 state snapshot JSONL、每 step
   source-target resolution JSONL、全部原生 800×600 lossless PNG、session-bound toolchain
   receipt 和 attestation。host-entry log 必须严格为：clean profile、host root frame 50、
   `ELKTEG4.xml` 自动读取结果、默认 IR child load、原 host Next 动作、RW child load、nested
   entry，以及空 unexpected-side-effect summary。证据完成后运行：

   ```bash
   npm run prepare:course-natural:capture -- \
     --spec migrations/<animation-id>/audit/trace-specs/<requirement>.json \
     --operation-log <operation-log.jsonl> \
     --state-snapshots <state-snapshots.jsonl> \
     --source-target-resolutions <source-target-resolutions.jsonl> \
     --host-entry-log <host-entry-log.jsonl> \
     --environment-isolation-receipt <environment-isolation-receipt.json> \
     --launch-receipt <original-host-launch-receipt.json> \
     --frames <native-png-directory> \
     --toolchain-receipt <toolchain-receipt.json> \
     --capture-session-attestation <named-human-session-attestation.json>
   ```

   preparer 会重新核对 exact indexed spec、技术 projection、原 child、原 host、四份
   host audit 报告、checked runtime-tree manifest、5 个 staged 文件及无额外文件、
   Projector executable SHA、disposable environment receipt、launch receipt、恰好 8 条 host-entry
   record、session/人员/四条 hash chain、1..N 每帧、800×600、ordered action、source target、
   前后 checkpoint、terminal 和空 unexpected events。
   它只写 `pending-natural-trace-capture` 与
   `pending-human-owner-natural-trace` 候选目录，不写 canonical execution report、
   coverage、status、human review 或 owner review。禁止只回填 ID、expected-state
   hash 或由 JavaScript 实现反推 observed state；候选仍需按
   [`docs/ORIGINAL_RUNTIME_EVIDENCE_PROMOTION.md`](ORIGINAL_RUNTIME_EVIDENCE_PROMOTION.md)
   经过外部签名身份锚、独立 human/owner 决定、完整 typed DAG/causality 复核和经安全
   复审的事务发布。当前 promotion 写入已硬关闭。
   当前尚未用这套升级合同完成英/西任一权威自然轨迹采集或验收；试点严格完成仍为
   **0/16**。生成操作包、安全排练或 preparer 候选包都不改变这个数字。
6. 对每个已真实审核的 root/natural 候选，release custodian 先运行只读晋级演练：

   ```bash
   npm run adopt:course:original-runtime-evidence -- \
     --candidate-manifest <fixed-pending-candidate-manifest> \
     --candidate-report <fixed-pending-candidate-report> \
     --trust-registry <pre-registered-trust-registry> \
     --human-review <accepted-human-evidence-review> \
     --owner-review <accepted-owner-promotion-decision> \
     --dry-run --json
   ```

   Dry-run 通过后仍不得去掉 `--dry-run`。当前无晋级步骤；无模式调用会以
   `ORIGINAL_RUNTIME_EVIDENCE_PROMOTION_DISABLED` 失败，npm alias 也固定为 dry-run。
   `--check` 仅是既有字节的非权威只读诊断，不建立 original-runtime baseline authority。
   requirement `status`、JavaScript capture、RMSE、migration-wide human/owner 决定和
   strict completion 均不会改变。
7. 运行 `npm run audit:course-trace-evidence:check`。只有 inspector 重新读取每个
   文件字节并验证全部 requirement 后，才可进入比较和人工审核。

### Adobe local-frame controller 的限制

九个 course-child 的
`audit/adobe-course-frame-controller-engineering-report.json` 给出唯一允许使用的
content-addressed fixture manifest 和 `verificationCommands`。按报告命令验证，先
运行 fixture 目录内 `smoke-sandboxed.sh`，不点击舞台；具名操作员记录 smoke
截图及 SHA-256 后，再运行 `launch-sandboxed.sh` 并执行一次显式 load click。
只有 opaque cover 在连续三次 actual-frame 检查后消失，且 root/local frame、
local frameCount 与报告完全一致时，lossless 原生舞台截图才是受控视觉候选。

不得用目录中“最新”或手工挑选的 fixture；必须使用工程报告精确绑定的 manifest。
不得直接双击 `host.swf`、child SWF 或原课程壳。该 controller 会静音、直接
`gotoAndStop` 且不补全未知 host binding，因此其截图永远不能单独证明自然分支、
随机/计分、Replay、英语/西语状态、音频或原 host 行为。

## 三、逐帧、语言、音频与产品人工检查

Named human reviewer 对每个 pilot 执行以下操作，并在自己的审阅记录中写下
requirement ID 和证据哈希：

1. 核对 baseline/capture/metrics 三层 manifest 的 animation、requirement、
   frame domain、trace、entry state、scenario、language、seed、原生尺寸及 PNG
   哈希完全一致。
2. 查看分页 contact sheet，同时逐个打开全部失败/离群 diff；不能用平均 RMSE
   代替视觉检查。公式、数字、标签、得分、层级或一帧时序错误一律退回，即使
   总 RMSE 低于阈值。
3. 对 en/es 各自覆盖全部 requirement；检查文字边界和所有语言专属状态。
4. 对每条音轨核对文件 SHA-256、语言、时长、开始帧、停止/重播，并实际监听。
   缺失音频不得以合成音频或静音自动通过。
5. 自然操作每个可达分支，包括正确/错误、随机结果、计分、完成、Replay、
   鼠标、Enter、Space；确认 Replay 重置完整状态向量。
6. 在原生舞台、桌面、平板和窄屏检查焦点、可访问名称、reduced motion、文字
   溢出、控制台错误、资源失败和非预期网络请求。

### 音频试听的 system of record

`audit/audio-runtime-evidence.json` 是确定性的结构审计，不能承载人工签名。对于
`migration.audio.required: true` 的 pilot，engineering 先在机器音频审计和
`audio-inventory.csv` 稳定后运行：

```bash
npm run scaffold:audio-acceptance -- --id <animation-id>
```

该命令只创建一次未签名的
`evidence/audio-listening-acceptance.json`，不会覆盖已有记录。它自动绑定当前 SWF、
机器音频审计、inventory，以及每条 cue 的 source hash、语言、时长和开始语义。
Named human audio reviewer 对每条 `cueReviews[]` 自然执行原 host/runtime 操作后，
先创建专用 session：

- session 只能放在 `evidence/audio-listening-sessions/*.json`；
- session 引用的 lossless capture、append-only runtime log 或 waveform 只能放在
  `evidence/audio-runtime-sessions/`；
- `runtime.runtimeId/name` 只能使用 strict allowlist 中的 Adobe Animate Test Movie、
  Adobe Flash Player Projector 或经授权的 legacy-browser Flash Player 身份；任意
  `Chrome`/`fake` 字符串不能通过；
- `runtime.toolchainReceipt` 必须绑定同目录下的
  `authorized-original-runtime-toolchain-receipt`，其 runtimeId/name/version 与 session
  完全一致，并至少哈希绑定一份 product-version capture、executable SHA receipt 或
  workstation toolchain log；
- `runtime.hostFile/hostSha256` 必须等于 machine audio audit 恢复的权威 host；
- `cue` 必须逐字段等于 manifest + machine audit + inventory 三方一致的 cue；
- `operationEvents` 是 SHA-256 链，顺序必须证明
  `activate → start → stop-or-complete → replay → start`，时间单调；
- session 的 reviewer 对象必须与最终 acceptance reviewer 完全一致。

session 最低形状为：

```json
{
  "schemaVersion": 1,
  "evidenceType": "original-runtime-audio-listening-session",
  "animationId": "<animation-id>",
  "cue": { "cueId": "...", "language": "...", "sourceFile": "...", "sha256": "...", "durationMs": 1000, "startFrame": null, "startFrameDomainId": null, "startSemantics": "host-user-activated" },
  "reviewer": { "kind": "human", "fullName": "...", "role": "...", "organizationOrOwnerId": "...", "contact": "..." },
  "observedAt": "实际操作时间的 ISO 时间戳",
  "runtime": {
    "runtimeId": "adobe-flash-player-projector",
    "name": "Adobe Flash Player Projector",
    "version": "...",
    "hostFile": "权威 host 路径",
    "hostSha256": "...",
    "toolchainReceipt": { "file": "evidence/audio-runtime-sessions/runtime-toolchain-receipt.json", "sha256": "..." }
  },
  "operationEvents": [
    { "sequence": 1, "action": "activate", "observedAtMs": 0, "previousEventSha256": null, "eventSha256": "规范 JSON 的 SHA-256" }
  ],
  "observations": { "spokenContentAndLanguage": "pass", "naturalHostTraversal": "pass", "startStopAndSynchronization": "pass", "replayReset": "pass" },
  "artifacts": [{ "kind": "lossless-runtime-capture", "file": "evidence/audio-runtime-sessions/...", "sha256": "..." }]
}
```

再由同一 reviewer 只把实际通过项填写到 acceptance：

```json
{
  "status": "accepted",
  "cueReviews": [{
    "results": {
      "spokenContentAndLanguage": "pass",
      "naturalHostTraversal": "pass",
      "startStopAndSynchronization": "pass",
      "replayReset": "pass"
    },
    "evidence": [{
      "kind": "original-runtime-audio-listening-session",
      "file": "evidence/audio-listening-sessions/<cue>.json",
      "sha256": "session 文件的完整 SHA-256"
    }]
  }],
  "summary": {
    "everyCueListened": true,
    "everyReachableHostStateTraversed": true,
    "synchronizationAccepted": true,
    "replayAccepted": true
  },
  "review": {
    "decision": "accepted",
    "reviewer": { "kind": "human", "fullName": "具名人员", "role": "审核角色", "organizationOrOwnerId": "组织或 owner 发放 ID", "contact": "可核验联系方式" },
    "attestation": "I personally performed the authoritative original-runtime audio listening and host traversal recorded here.",
    "signedAt": "实际完成时间的 ISO 时间戳，不得是未来时间",
    "scope": "all-declared-audio-cues-and-reachable-host-states",
    "notes": "试听设备、原始运行时版本和异常说明"
  }
}
```

不要改 `bindings` 或 cue identity 来“配合”签名；strict validator 和 strict report
会重新读取并哈希 machine audit、inventory、每个 audio source 和每个 operation
log/capture。模板、空 reviewer、自动 reviewer、未来时间、任一 pending、缺失或
哈希不符都失败。机器能拒绝非 allowlist runtime，并核验 toolchain receipt 及其
identity artifacts 的内容寻址绑定；它不能单凭 receipt 证明 Adobe 授权、运行时
真实性或 reviewer 生物学上是人。owner 必须独立核验运行时授权/身份和 reviewer
身份。拒绝或证据过期时，保留旧记录为带哈希的
审计历史，由 engineering 重新建立技术快照和新的未签名模板，禁止覆写旧签名。
`audio.required: false` 不创建此记录；它只能依赖 source-bound
机器负证中的 `accepted-not-required`，不能由人工听感替代结构负证。

证据 DAG 必须单向：source/machine audit/inventory/stable trace → original-runtime
session → audio listening acceptance → strict report/verification → owner packet/ledger。
session/acceptance 不得引用自身、migration acceptance/status、strict report、
verification、owner packet 或 ledger。

不接受时在新的不可变 record 中填写 `decision: "rejected"` 和具体
requirement/evidence；接受时先创建位于
`evidence/reviews/human/` 的不可变 record。它必须引用位于
`evidence/review-inputs/` 的当前 hash-bound review input，包含全部 requirement，
并以 `previousRecord` 保留任何旧决定。随后只把决定镜像和 record 的完整 descriptor
写入对应 `migration.json`：

```json
"humanVisualReview": {
  "decision": "accepted",
  "reviewer": "具名人员（不得写 Codex/CI/脚本）",
  "reviewedAt": "YYYY-MM-DDTHH:mm:ss.sssZ 或带明确时区的等价 ISO 时间",
  "scope": "all-keyframe-and-full-frame-diffs",
  "record": {
    "path": "migrations/<animation-id>/evidence/reviews/human/human-review-<timestamp>-<sha256>.json",
    "bytes": 1234,
    "sha256": "记录文件完整字节的 SHA-256"
  }
}
```

`migration.json` 只是当前决定和 descriptor 的 mirror，不是签署 system of record。
不得覆写旧 input/record，descriptor 的 `path`、`bytes`、`sha256` 任一不匹配都使
accepted 失效。不要编辑生成的 owner packet 作为 system of record。完成 human 记录后，release
custodian 必须重建 verification、严格报告和 owner packet；owner 只能审核新包中
`manifestBinding: CURRENT` 的结果。

## 四、Owner 决定

Owner 逐 pilot 核对 human 记录、全部 PASS 技术门禁、失败/离群帧、音频、分支和
`acceptance.knownExceptions`。严格 owner 门禁只接受明确的 `accepted`；
`not-required` 不会通过。Owner acceptance 不能覆盖错误公式/数字/标签/得分、缺帧、
未执行自然分支或缺失的权威音频。

若某项 validator 明确支持书面例外，owner 必须逐条核对 `id`、`reason` 和精确
`evidenceIds`，再把该条 `ownerDecision` 设为 `accepted` 或 `rejected`。Owner
本人必须创建位于 `evidence/reviews/owner/` 的新不可变 record；它绑定当前 human
record descriptor、当前 audio/behavior/product descriptor 集合、known exceptions，
并用 `previousRecord` 连接旧决定。随后只把当前决定和 record descriptor 镜像到
`migration.json`：

```json
"ownerReview": {
  "decision": "accepted",
  "reviewer": "Owner 或获授权代表的具名人员",
  "reviewedAt": "YYYY-MM-DDTHH:mm:ss.sssZ 或带明确时区的等价 ISO 时间",
  "reason": "明确接受范围及逐条例外；无例外也要说明",
  "record": {
    "path": "migrations/<animation-id>/evidence/reviews/owner/owner-review-<timestamp>-<sha256>.json",
    "bytes": 2345,
    "sha256": "记录文件完整字节的 SHA-256"
  }
}
```

Owner 拒绝时填写 `decision: "rejected"` 和原因并返回 engineering；不得改成空白或
让自动化重写为 accepted。只有 inline reviewer/date/reason 而没有 record descriptor
的历史 accepted 数据属于 `legacy-unbound`，不能通过 strict gate。

## 五、签署后的防循环检查与最终关闭

Human/owner record mirror 和最终 status 的修改不应破坏已经审核的原始运行时证据。每次签署
后立即运行：

```bash
npm run audit:course-trace-specs:check
npm run audit:course-trace-evidence:check
npm run audit:static-frame-domain-evidence:check
npm run audit:frame-domain-dispositions:check
npm run audit:renderer-frame-domains:check
```

如果仅修改签署字段或 status 就导致 trace spec、execution report、frame-domain
disposition 或 renderer audit 失效，立即停止：这表示证据把可变签署数据纳入了
技术哈希，形成“签署会销毁待签证据”的循环。不得通过重写旧签署时间、复制哈希或
在证据完成前预签来绕过；engineering 必须改用明确排除 acceptance/status 的稳定
技术 contract binding，并重新验证后再提交人审。

### 稳定 technical projection 的最低契约

下列上游证据不得绑定整个 `migration.json` 或整个可变 coverage 文件。统一 projection
必须用稳定 JSON key 顺序和显式 schema version 计算 SHA-256，且至少包括：

- manifest identity：`id`、`animationId`、`assetId`；
- immutable source：placement/SWF/FLA 路径、SHA-256、paired-FLA 状态；
- source runtime：SWF signature/version/declared length、stage、FPS、root frame count、
  background、ActionScript version、root timeline definitions 和 instance placements；
- trace identity：语言集合，scenario 的 `id/kind/reachable`，default frame domain，
  每个 frame domain 的 source timeline/instance、parent/entry frame、frame count 和
  scenario IDs；
- authoritative audio identity（适用时）：required、语言和 cue 的
  `id/language/startFrame`，不含审核状态；
- coverage requirement identity：`requirementId`、scenario、frameDomainId、traceId、
  language、seed、requiredRange、完整 entryState 及其 SHA-256、
  baselineAuthorityRequirement。

必须排除：migration `status`、全部 `acceptance`、known-exception 的 owner 决定、
verification/QA/review 日期，以及 coverage 的 `status`、blocking reason/evidence、
captured/missing frames、baseline/capture/metrics 路径和结果。后者由各自内容哈希和
requirement identity 单独绑定。

采用 projection 的生成器必须有 mutation tests：只改 acceptance/status 或 coverage
结果字段时 projection SHA 不变；改 source hash、舞台/FPS/帧数、scenario/domain、
语言/audio cue、requirement range/entry/authority 时 SHA 必须改变。还必须有一项
end-to-end 测试证明 execution report 在 human、owner 和最终 status 更新后仍可由
只读 inspector 验证。

### 已验证的绑定边界与回归防线

下表是当前实现应维持的边界，不再表示尚未修复的循环。projection-capable
生成器必须通过 acceptance/status mutation test 和 `--check`；任一项退回到“绑定
整个可变文件”才触发 HALT。

| Artifact | 当前实现边界 | 回归判据 |
|---|---|---|
| `audit/strict-readiness.json` | 只读 source/tool/audit 技术输入；status/review 不进入生成身份 | 完成后仍可重建和 `--check` |
| `audit/scenario-inventory.json` | `migration-technical-contract` projection | 只改 status/acceptance 时 hash 不变 |
| `audit/frame-domain-disposition.json` | manifest technical projection + scenario inventory technical identity | 签署后 disposition 仍 current |
| `audit/renderer-frame-domain-support.json` | renderer/domain projection + renderer 源码哈希 | 签署后 probe identity 仍 current |
| `audit/trace-specs/*.json` 和 index | manifest、coverage requirement、scenario inventory projections | execution report 在签署后仍可被只读 inspector 验证 |
| `audit/audio-runtime-evidence.json` | 确定性结构证据，排除 migration status；不含人审 | `evidence/audio-listening-acceptance.json` 单独绑定其最终 SHA |
| `evidence/verification.json` | 整个最终 manifest | terminal receipt；签署和 status 后重建 |
| strict report、owner packet、completion ledger | 整个最终 manifest 与 terminal evidence | 最后重建，不能作为上游 runtime evidence |

在签名和全部技术证据稳定后，release custodian 依次运行：

```bash
npm run verify:pilots
node scripts/build-pilot-strict-acceptance.mjs
node scripts/build-pilot-owner-review-packet.mjs
npm run ledger:build
npm run verify
node scripts/build-pilot-strict-acceptance.mjs --check
node scripts/build-pilot-owner-review-packet.mjs --check
npm run ledger:check
```

最后重新打开 JSON（不是只看终端摘要），要求 16 个 pilot 全部
`strictAccepted: true`、15/15 gates PASS、manifest binding CURRENT，completion
ledger 收录同一 manifest/validator 哈希。否则只能报告未完成和精确 blocker。
