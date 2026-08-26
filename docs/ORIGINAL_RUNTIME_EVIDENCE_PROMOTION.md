# 原始运行时候选证据晋级合同

> **SECURITY HOLD — canonical 晋级写入已在代码中硬关闭。**
> `adopt-course-original-runtime-evidence.mjs` 当前只接受 `--dry-run` 和 `--check`
> 两种只读、非权威诊断模式。没有环境变量、CLI flag 或 npm alias 可以启用写入。
> 该 legacy adopter 的旧 pathname-based canonical 写入/回滚实现也已物理移除；
> 翻转布尔常量无法恢复写入能力。
> 在本页“重新启用的必要条件”全部实现、测试并经独立安全复核之前，不得删除
> `PROMOTION_WRITES_ENABLED = false` 熔断，也不得在该 legacy 模块中重新添加 writer、
> 手工复制候选、生成 canonical report
> 或编辑 coverage baseline authority。当前 accepted canonical promotion 数仍为 **0**。

`prepare-root-capture-candidate.mjs` 和
`prepare-natural-trace-candidate.mjs` 只产生 `pending-human-owner` 候选。
候选即使包含全部 PNG 和哈希链，也不能直接成为 strict baseline。本文件规定如何用
`adopt-course-original-runtime-evidence.mjs` 对未来晋级合同做只读诊断；当前版本不会把
任何候选晋级为 canonical original-runtime evidence。

## 当前实现状态（仍不可晋级）

| 层 | 已实现的独立只读/隔离能力 | 尚缺的生产条件 |
|---|---|---|
| 外部信任 | Ed25519、registry/revocation checkpoint、human/owner/release envelope 及重放约束的独立验证器 | 固定生产 trust anchor 仍为 `null`，`PRODUCTION_TRUST_ANCHOR_CONFIGURED = false`；生产入口固定以 `ORIGINAL_RUNTIME_PROMOTION_ANCHOR_NOT_CONFIGURED` 失败；尚未接入 adopter |
| Natural 因果 | 固定仓库 canonical loader、typed DAG、完整 archive closure、帧/操作/Replay 因果和前后 canonical 快照复核 | 结果仍为 `diagnostic-only-not-writer-acceptable`；当前 RW002 immutable natural candidate 不存在；尚无真实候选正向验收 |
| 文件事务 | 锁、原子可见的 coverage replacement、no-replace、持久 nonce、分段 journal、rollback/recovery 的隔离临时目录协议及真实子进程崩溃测试；独立 test-only reference harness 验证“先持久保留一次性 nonce、再执行；重放只能进入 recovery”的顺序、崩溃恢复和 poisoned-`TMPDIR` 负向合同 | production-entry 模块已物理移除测试 writer/隐藏 CLI，只保留只读 plan/inspection；transaction 生产模块也已物理移除隐藏 CLI、环境变量、测试 marker、fault/capability harness；production entry 和 canonical executor 仍无条件熔断；尚无内核级 compare-and-swap 或固定祖先目录 dirfd；尚未接入 adopter |
| 内核路径闭包 | 独立能力检测器和 private-only、内容寻址 operation plan；禁止 pathname fallback、filesystem root、`source-assets` 和把绝对工作站路径放入 public report/receipt；祖先/真实目录/destination 替换负测保持零写入 | 当前 Node 公共 API 不暴露所需 dirfd-relative mutation；需要经审查且 hash-pinned 的 native helper/N-API，以及真正的 coverage CAS 或 immutable content-addressed/no-replace commit 重新设计；production execute/recover 保持熔断 |
| Receipt 签发前置 | 独立、无写入的 G5 L4-pinned EvidenceReceiptV1 structural preflight 与 hash-only external handoff descriptor；只接受 canonical-JSON string 和 primitive time，拒绝 caller-owned objects/callbacks，authority subject 只输出 SHA-256；检查 exact 55-member release、caller-supplied strict/published projection、内部 hash/member bindings、命令声明形状和 revocation-claim freshness | 这些仍是 caller-supplied、未验证声明；模块不验证命令实际执行或外部 trust root，也不含 key loader、签名、receipt builder 或文件写入；production issuer 不存在，必须由外部 owner-controlled integration 完成密码学与命令证据验证并经独立评审 |
| Legacy adopter | `--dry-run` / `--check` 只读诊断；旧 canonical writer 已物理移除，并有结构测试禁止 filesystem mutation capability 和 latent `promote` return | 未导入上述三层；`PROMOTION_WRITES_ENABLED = false`；未来必须使用另行评审的 production integration，而不是“重新打开”这个 legacy adopter |

当前 accepted canonical promotion 数为 **0**。这些 standalone prerequisites 的测试通过只
证明相应安全合同在隔离范围内成立，不建立 production authority，也不证明任何动画已
通过 original-runtime、RMSE、音频、human、owner 或 strict 验收。

当前 RW002 root operator card 仍是 `unsigned template only`，没有新会话的 candidate
manifest/report、capture attestation、human review 或 owner decision。现有 Dr. Peter Hu
记录只绑定 L6FQ01 的 Animate 弹窗确认，且 `acceptanceEffect: none`；不得转用于 RW002
capture。另有 Dr. Peter Hu 于 `2026-07-23T11:05:10+08:00` 明确作出的 schema-v3
current-JavaScript-only approval，绑定本次确认时现有的全部 16 项 JavaScript 输出；它不
构成 RW002 capture、JavaScript/Flash 忠实度、strict human visual review、owner/audio
acceptance、authoritative original-runtime baseline、parity 或 migration completion。
RW002 root requirement `req:root:root-standalone:en` 与仍缺候选的 natural requirement
`req:sprite-334:default:en` 是两项独立证据合同。

只读诊断不会编辑 `source-assets/`、pending candidate、capture kit、coverage、manifest、
JavaScript capture、RMSE、音频记录、review 或 migration status。`--dry-run` 返回的
planned outputs、`ok: true` 或 `READ-ONLY DIAGNOSTIC` 仅表示当前诊断器走完了相应检查，
不建立 baseline authority，也不能据此声称动画或试点已经忠实迁移完成。

## 重新启用的必要条件

只有以下 P1 全部解决并新增端到端回归后，才可另行评审一个新的 production
integration/writer；不得通过在 legacy adopter 中翻转熔断或恢复已删除代码来启用写入：

1. 所有 animation ID 必须来自固定 course/shell pilot allowlist；spec execution path 和
   每个 canonical 输出必须是固定、非符号链接、realpath-contained 的路径，且永远不在
   `source-assets/` 下。
2. 晋级器必须复用 preparer 的完整 root/natural 语义验证，而不是只重哈希 JSON：包括
   capture kit、kit-check、empty Projector + GUI open、sandbox、runtime tree、disposable
   environment、host-entry chain、unexpected events 和 source/host 字节身份。
3. Natural DAG 必须使用 typed、base-aware descriptor；每个 staged/source dependency 都
   必须可解析、重哈希且归档。action event 必须精确绑定 scheduled pre/post checkpoint、
   observation occurrence 和单调时间，不能复用无关或 Replay 前的状态记录。
4. 每 migration 必须有互斥锁；coverage 使用 compare-and-swap；canonical file/directory
   使用原子 no-replace；rollback 只能删除/恢复仍属于本事务且哈希匹配的内容，并具备
   可恢复 transaction journal。
5. 必须实现下述外部身份信任锚，不能把候选目录中可回填时间的自哈希 JSON 当作
   “预注册”证明。

### 外部身份信任锚最低合同

- Owner 在 capture session `startedAt` 之前，把 registry 原始字节 SHA-256 写入候选目录
  之外、owner 控制的 append-only ledger，并由预配置的 owner trust-root 私钥签名。
- Registry、human review、owner decision 和 release transaction 分别使用可验证数字签名；
  每个人以稳定公钥指纹/owner subject ID 标识，不能只用可重复创建的 `identityId`。
- Human decision 绑定完整 candidate DAG、source/spec、registry checkpoint；owner decision
  再绑定 human decision。release transaction 绑定一次性 nonce、当前 revocation checkpoint
  和全部待写 canonical hashes，防止旧决定重放。
- 验证器的 trust root 必须来自候选和项目工作树之外的明确配置；签名、授权、撤销、
  时间顺序或 ledger inclusion proof 任一缺失即失败。

上述签名、registry/revocation ledger 和 human/owner/release 绑定已有独立只读验证器；但
生产 trust anchor 尚未配置，验证器尚未接入 adopter，也没有 production authority。
因此当前 operational registry 仍只能用于人工审计记录，不能解除写入熔断。

代码当前以五个机器可读的 remaining-gate code 报告这一边界：
`SIGNED_RELEASE_BUNDLE_INTEGRATION_REQUIRED`、
`TYPED_CAUSALITY_DAG_INTEGRATION_REQUIRED`、
`DURABLE_NONCE_AND_TRANSACTION_ENTRY_REQUIRED`、
`KERNEL_ANCHORED_PATH_RACE_CLOSURE_REQUIRED`、
`REAL_CANDIDATE_E2E_AND_INDEPENDENT_REVIEW_REQUIRED`。这些 code 是未完成门槛，
不是 waiver 或已满足声明。

## 前置条件

1. 候选必须位于 preparer 的固定 pending 路径，不能是复制、改名或手写到其他目录的
   JSON。
2. 当前 trace spec 必须仍在总索引中，source SWF、manifest technical projection、
   coverage identity projection 和 scenario inventory projection 必须全部保持原哈希。
3. 实际 capture operator、human evidence reviewer、owner representative 和原始运行时
   必须在 capture 完成前写入一份 content-addressed trust registry。三个人必须是三个
   不同的、非自动化身份。
4. Human 必须查看完整 DAG、全部原生尺寸帧和 trace 语义；owner 必须在 human 接受后，
   明确授权“只晋级为 original-runtime baseline”。两份决定都必须绑定候选、当前 spec、
   preserved source 和 registry 的精确文件 SHA-256。
5. Registry/review 中的 `*Sha256` 自哈希使用 canonical JSON（对象 key 排序）并排除
   自身哈希字段；各 `{file, sha256}` 使用磁盘文件原始字节 SHA-256。可调用
   `prepare-root-capture-candidate.mjs` 导出的 `recordHash()` 采用同一算法生成，但填写
   决定的人仍必须亲自确认内容。

Registry 是可追责的 operational pre-registration，不是证书、数字签名或生物身份验证。
Release custodian 和 owner 仍需在仓库之外核验人员授权、Adobe 许可和 runtime provenance。

## Legacy adopter 的非密码学诊断 schema

以下 Trust registry、human review 和 owner decision JSON 只描述现有 legacy adopter 的
只读诊断输入，与新的外部签名 trust 模块不兼容。它们缺少 signed release transaction、
revocation checkpoint、planned outputs 和 durable nonce；`recordHash()` 自哈希也不是身份
签名。未来 production 合同必须使用候选/项目工作树之外的 trust root、签名 checkpoint
和分别由 registry、human、owner、release 四个不同 subject/key 签发的 envelope。

## Trust registry

Registry 顶层字段必须严格为：

```json
{
  "schemaVersion": 1,
  "evidenceType": "course-original-runtime-promotion-trust-registry",
  "registryId": "owner-issued-registry-id",
  "issuedAt": "capture 完成前的 ISO 时间",
  "issuer": {
    "kind": "human",
    "fullName": "具名签发人",
    "role": "Trust Registry Issuer",
    "organizationOrOwnerId": "owner 发放的组织/身份 ID",
    "contact": "可核验联系方式"
  },
  "identities": [{
    "identityId": "稳定身份 ID",
    "kind": "human",
    "fullName": "具名人员",
    "role": "实际角色",
    "organizationOrOwnerId": "owner 发放的组织/身份 ID",
    "contact": "可核验联系方式",
    "authorizedRoles": ["capture-operator"],
    "status": "active",
    "registeredAt": "capture 完成前且不晚于 issuedAt 的 ISO 时间"
  }],
  "runtimes": [{
    "runtimeId": "adobe-flash-player-projector",
    "name": "Adobe Flash Player Projector",
    "version": "精确版本",
    "executableSha256": "精确可执行文件 SHA-256；候选未声明时才可为 null",
    "status": "approved",
    "registeredAt": "capture 完成前且不晚于 issuedAt 的 ISO 时间",
    "provenanceArtifacts": [{
      "kind": "product-version-capture",
      "file": "项目内、非符号链接的证据文件",
      "sha256": "文件原始字节 SHA-256"
    }]
  }],
  "statement": "This content-addressed registry pre-registers named human roles and original-runtime identity evidence for fail-closed HELP Math evidence promotion; it is an operational trust record, not a cryptographic identity signature.",
  "registrySha256": "排除 registrySha256 后的 canonical record hash"
}
```

`authorizedRoles` 只接受 `capture-operator`、`human-evidence-reviewer` 和
`owner-representative`。候选 toolchain receipt 至少一份 identity artifact 的
`kind + sha256` 必须与 registry runtime provenance 完全相同；有 executable hash 时也
必须相同。

## Human evidence review

Human review 顶层字段必须严格使用下列合同。`candidateManifest`、`candidateReport`、
`traceSpec`、`sourceSwf` 和 `trustRegistry` 都必须是当前实际文件的精确路径/哈希；不得
复制示例中的占位值。

```json
{
  "schemaVersion": 1,
  "evidenceType": "course-original-runtime-evidence-human-review",
  "decision": "accepted",
  "animationId": "...",
  "requirementId": "...",
  "candidateManifest": {"file": ".../candidate-manifest.json", "sha256": "..."},
  "candidateReport": {"file": ".../candidate-report.json", "sha256": "..."},
  "traceSpec": {"file": ".../audit/trace-specs/<requirement>.json", "sha256": "..."},
  "sourceSwf": {"path": "source-assets/flash/HELP MATH_ORIGINAL FILES/...", "sha256": "..."},
  "trustRegistry": {"file": ".../trust-registry.json", "sha256": "..."},
  "captureOperatorIdentityId": "registry 中唯一匹配候选 operator 的 ID",
  "runtimeId": "registry 中匹配候选 runtime 的 ID",
  "reviewer": {
    "identityId": "registry 中 human reviewer ID",
    "kind": "human",
    "fullName": "具名 reviewer",
    "role": "实际角色",
    "organizationOrOwnerId": "owner 发放的组织/身份 ID",
    "contact": "可核验联系方式"
  },
  "reviewedAt": "实际完成审核的 ISO 时间",
  "scope": "complete-candidate-dag-native-frames-and-trace-semantics",
  "statement": "I inspected the complete candidate evidence DAG, all native-stage frames and declared trace behavior, confirmed the exact current source/spec bindings, and accept this candidate only as original-runtime baseline evidence for the named requirement.",
  "notes": "实际查看范围、异常帧和限制",
  "reviewSha256": "排除 reviewSha256 后的 canonical record hash"
}
```

## Owner promotion decision

Owner decision 除绑定上述全部 immutable inputs 外，还必须绑定 human review 文件字节，
时间不得早于 human review，并提供非空理由：

```json
{
  "schemaVersion": 1,
  "evidenceType": "course-original-runtime-evidence-owner-promotion-decision",
  "decision": "accepted",
  "animationId": "...",
  "requirementId": "...",
  "candidateManifest": {"file": "...", "sha256": "..."},
  "candidateReport": {"file": "...", "sha256": "..."},
  "traceSpec": {"file": "...", "sha256": "..."},
  "sourceSwf": {"path": "...", "sha256": "..."},
  "trustRegistry": {"file": "...", "sha256": "..."},
  "captureOperatorIdentityId": "...",
  "runtimeId": "...",
  "reviewer": {
    "identityId": "registry 中 owner representative ID",
    "kind": "human",
    "fullName": "具名 owner/代表",
    "role": "实际角色",
    "organizationOrOwnerId": "owner 发放的组织/身份 ID",
    "contact": "可核验联系方式"
  },
  "reviewedAt": "实际决定时间",
  "scope": "promote-exact-candidate-to-original-runtime-baseline-only",
  "statement": "I reviewed the bound human evidence decision and authorize this exact candidate DAG to be promoted only into canonical original-runtime baseline evidence for the named requirement; this does not approve JavaScript fidelity or strict migration completion.",
  "notes": "限制与例外",
  "humanReview": {"file": "human review 文件", "sha256": "文件原始字节 SHA-256"},
  "decisionReason": "为什么允许这份精确候选只作为原始运行时 baseline",
  "decisionSha256": "排除 decisionSha256 后的 canonical record hash"
}
```

## Legacy adopter 的只读诊断执行与复核

先完整校验且不写文件：

```bash
npm run adopt:course:original-runtime-evidence -- \
  --candidate-manifest migrations/<animation-id>/evidence/<pending-kind>/<requirement>/candidate-manifest.json \
  --candidate-report migrations/<animation-id>/evidence/<pending-kind>/<requirement>/candidate-report.json \
  --trust-registry <registry.json> \
  --human-review <human-review.json> \
  --owner-review <owner-review.json> \
  --dry-run --json
```

当前不得去掉 `--dry-run`。直接调用脚本且不带 `--dry-run`/`--check` 会在读取候选之前以
`ORIGINAL_RUNTIME_EVIDENCE_PROMOTION_DISABLED` 失败；npm 的默认 alias 也固定追加
`--dry-run`。`--check` 只用于诊断未来或隔离测试中的既有 canonical bytes：

```bash
npm run adopt:course:original-runtime-evidence:check -- \
  --candidate-manifest <同一文件> \
  --candidate-report <同一文件> \
  --trust-registry <同一文件> \
  --human-review <同一文件> \
  --owner-review <同一文件> \
  --json

npm run audit:course-trace-evidence:check
```

未来安全复核通过并重新启用后，canonical 合同预期固定写入以下位置；当前命令不会创建
或修改这些路径：

- `artifacts/full-frame/pilot-baselines/<animation>/<requirement>/accepted-original-runtime/`
- `migrations/<animation>/baseline/original-runtime/<requirement>.json`
- trace spec 指定的 `baseline/trace-executions/<requirement>.json`
- `migrations/<animation>/evidence/original-runtime-promotions/<requirement>.json`
- 同一 requirement 的 coverage baseline 字段和阻塞证据

未来 canonical archive 必须保存 pending archive 的逐字节副本、候选 manifest/report、
registry、两份 review、完整 typed evidence DAG 和外部 ledger/signature inclusion proof，
并记录全文件 inventory/hash。当前 `--check` 仍属于非权威 legacy 诊断。对应的独立
preparer 语义、外部信任、并发事务和 Replay/causality 组件已经存在，但尚未完成 production
provisioning/integration、真实 immutable candidate 的正向验收，也未启用 writer/recovery；
因此它们不能替代 canonical promotion，更不能解除任何 strict gate。legacy adopter 本身
已经不再包含 canonical 写入实现；未来 production writer 必须作为单独、完整绑定上述组件的
安全边界接受评审。
