# Nova Tutor 修复、发布与验收报告（2026-08-23）

- 报告性质：`REMEDIATION_IMPLEMENTATION_AND_PROTECTED_PREVIEW_RECEIPT`
- 当前总状态：`IMPLEMENTED_AND_LOCALLY_VERIFIED / PROTECTED_PREVIEW_FAIL_CLOSED_PASS / NOT_RELEASED`
- Vercel 审计、受保护 Preview 与 CI 首次收口时间：2026-08-23 23:29 CST（UTC+08:00）；八课 fail-closed Preview 追加验收：2026-08-24
- 原始故障证据：`reports/nova-tutor-runtime-problem-report-2026-08-23.md`
- 发布契约：`docs/NOVA_OPENROUTER.md`
- 数据边界：本报告不记录任何 secret 值、真实学习者数据、prompt/reply 正文、provider response ID、IP 地址、原始语音或课程帧

本文件用于在修复后逐层填写验收证据，不覆盖原始问题报告，也不把代码完成、自动测试、人审、Owner/法律批准、Preview、staged Production 或正式生产混写成一个“完成”。截至本次收口，修复已形成远端 draft PR，代码 artifact `5fce7424a54f6f11b39c82f7b588d800b298681d` 已完成本地门、Site workspace CI，以及两个受保护 Vercel Preview 的 fail-closed 验收：首次 Preview 证明空 rollout，追加 Preview 在部署级强制 master/frame/speech 关闭的同时打开八课 Current-JS surface，证明八课 EN/ES 路由与 Nova 隐藏状态；两者都没有调用 Provider。此前本地私有配置下的八门课英文文字 OpenRouter canary 仍为 8/8。没有推广、回滚、修改 Vercel 项目级环境变量、修改 Firewall、创建 drain 或改动正式生产。所有真实 canary 只保存无内容 receipt，未保存 prompt/reply 正文或 provider response ID。

## 1. 当前分层状态

| 层级 | 当前状态 | 可以证明什么 | 还不能证明什么 |
|---|---|---|---|
| 原故障复现 | `EVIDENCED_FAIL` | 2026-08-23 线上/本地的 G5 L4 422、图片 503、UI/服务端能力断裂已有真实证据 | 修复是否有效 |
| 实现 | `IMPLEMENTED_REMOTE_DRAFT_PR` | 八课策略、canonical resolver、rollout/capability、frame、speech confirmation、错误、日志与 EN/ES 文档已落盘并推送；八课 426 placements 的 production asset profile 已形成 | 人工/Owner/法律、合并或正式发布 |
| 自动测试 | `PASS_LOCAL_AND_SITE_WORKSPACE_CI` | web 414/414、server-only 61/61、modern-wide 54/54、full-stack 74/74、typecheck、lint、build、asset profiles、diff-check 和秘密扫描已通过；Site workspace CI 的对应门已通过 | Workbench 的继承迁移台账失败、人工评审或生产行为 |
| 本地真实 Provider | `8/8_PROVIDER_PASS_WITH_LOCAL_CLERK_WARNING` | 八课各一条英文首屏文字请求经真实本地 `/api/nova` 和 OpenRouter 返回 200、exact Luna、UUID requestId、no-store，2.0–5.6 秒 | 西语、人审、Preview 或无 console warning 的部署验收；本地 Clerk React key warning 与 Nova 无关但仍记录为未关闭观察项 |
| 人工课程/安全/无障碍评审 | `NOT_RUN` | 无 | 数学质量、儿童安全、EN/ES、学习困难与无障碍适当性 |
| Owner 与法律 | `NOT_APPROVED` | Privacy/Terms 仍明确标为 DRAFT | 合同、COPPA/FERPA、同意、保留、删除、subprocessor 或公开发布授权 |
| Vercel Preview | `EIGHT_COURSE_FAIL_CLOSED_PROTECTED_PREVIEW_PASS` | exact code artifact 已部署为 READY protected Preview；八课 EN/ES 共 16 条 modern-wide 路由均为 200，真实浏览器中 Nova/file input 均为 0，warning/error 为 0；master-off API 在 Provider 前返回 503 | release list/master 开启后的真实 Provider canary、媒体与人审 |
| staged Production | `NOT_DEPLOYED` | 无 | Production-scoped 配置下的同一候选 artifact |
| 正式 Production | `KNOWN_FAIL_BASELINE` | 当前公开版本仍受原问题报告边界约束 | 修复已发布、正式域名已复验、观察窗已通过 |

严格状态规则：只有某一行自己的证据齐全时才能更新该行；不得因为下一行开始了，就把上一行写成 PASS；不得因为 mock E2E 通过，就把真实 route、provider、Preview 或 Production 写成 PASS。

## 2. 修复范围与默认关闭策略

代码策略可识别八个精确课程 release：G4 L3、G5 L4、G3 L2、G4 L5、G4 L10、G4 L11、G5 L3、G5 L5。完整 release ID 与顺序见 `docs/NOVA_OPENROUTER.md`。

这只是代码能力矩阵，不是发布清单。实际学习者可见性必须同时满足：

1. `NOVA_TUTOR_ENABLED=true`；
2. 当前课程本身是已发布、可用的现代 My Lesson 课程；
3. 当前精确 release ID 出现在 `NOVA_TUTOR_RELEASE_IDS`；
4. grade、lesson、release ID、descriptor、animation/page 与服务端 canonical registry 一致；
5. exact OpenRouter/Luna 配置有效；
6. 对应能力的独立 gate 已打开。

默认值必须保持：

```dotenv
NOVA_TUTOR_ENABLED=false
NOVA_TUTOR_RELEASE_IDS=
NOVA_ALLOW_FRAME_CONTEXT=false
NOVA_ALLOW_SPEECH_INPUT=false
```

缺失或空的 release list 合法地表示零课程；未知、空项或重复 release ID 必须使整个列表 fail-closed，不能部分放行。

## 3. 实现验收表

| 义务 | 必要结果 | 实现证据 | 审核状态 |
|---|---|---|---|
| 单一 server capability | API、页面和 Nova 控件使用同一个服务端能力解释；配置错误时全部隐藏/关闭 | `apps/web/lib/nova-capabilities{,.server}.ts`；课程/首页 RSC 只传公开 DTO；API 独立重验 | `IMPLEMENTED_LOCAL` |
| 课程 allowlist | 只允许 exact release list；8 课 policy 不等于 8 课上线 | 八个 exact release/descriptor policy；empty closed；unknown/duplicate/empty item 整体 503 | `IMPLEMENTED_LOCAL` |
| canonical context | 客户端只能提出身份，服务端从可信 registry/descriptor 重建并校验 course/page/animation | `apps/web/lib/nova-request-resolver.server.ts`；426 placements × EN/ES；G5 L3 ordinal 45/46 | `IMPLEMENTED_LOCAL` |
| 请求最小化 | 上游只接收已确认问题、限长/限条的本会话 history、canonical context | strict schema、最多 8 条/4,800 字符 history、32 KiB 有界流读取、常见直接标识符最小化 | `IMPLEMENTED_LOCAL` |
| 受限 frame | 只能显式附加当前课程帧；无本地文件、相机、直播视频入口；flag off 时控件不存在 | placement 三元组；显式 Attach+Send；Sharp decode/rotate/flatten/resize/re-encode；删除 FileReader/file input/camera | `IMPLEMENTED_LOCAL_NOT_APPROVED` |
| speech-to-draft | flag off 时控件不存在；flag on 时识别结果只进入可编辑草稿，显式 Send 前网络请求数为 0 | `useNovaSpeech` 不再有 `onFinal` 网络动作；Focus/Classroom 只写 draft；14 个负面浏览器 case 已在真实 Next route + fake upstream 层执行通过 | `IMPLEMENTED_LOCAL_NOT_APPROVED` |
| 安全错误 | 区分课程不支持、frame/speech 关闭、校验失败、请求过大、超时、429、上游故障和不安全输出 | 409/413/422/429/502/503/504 + requestId/no-store；EN/ES UI；non-JSON Firewall 429 | `IMPLEMENTED_LOCAL` |
| exact model | 请求固定 `openai/gpt-5.6-luna`，无应用层 fallback；只接受 allowlisted exact/canonical Luna response ID | `apps/web/lib/nova-provider-contract.ts` 与 `nova-openrouter.server.ts` | `IMPLEMENTED_LOCAL` |
| 隐私路由 | 每次请求要求 ZDR-eligible route、拒绝 provider data collection、要求全部参数受支持；文案不作绝对零保留保证 | `data_collection=deny`、`zdr=true`、`require_parameters=true`；EN/ES Privacy/Terms 同步且仍为 DRAFT | `IMPLEMENTED_NOT_LEGALLY_APPROVED` |
| 防滥用 | 应用层预算 + Vercel Firewall + provider spending/kill-switch 运维方案都有证据 | 应用层 12/min；线上已有 exact POST `/api/nova` 12/60s/IP；spend/值班/drain/分布式限流未关闭 | `PARTIAL_EXTERNAL_GATE` |

最终实现 receipt：

- Git branch：`codex/help-math-learning-platform-nova-fq`
- 基线 Git HEAD：`93fb79aa16e68d32edb43b864a1c8972d59b219f`；本报告验收的代码 artifact：`5fce7424a54f6f11b39c82f7b588d800b298681d`
- 远端分支：`codex/help-math-learning-platform-nova-fq`；draft PR：[PR #4](https://github.com/HUDongpin/help-math-2-0-workbench/pull/4)
- 审核过的文件 allowlist：见本报告第 12 节；没有执行 `git add -A`、reset、stash、clean 或覆盖共享工作树中的无关修改
- `git diff --check`：`PASS`；所有 Nova 提交均通过精确 path/hunk 提交，当前 index 为空
- 独立 code review：`P0=0`；代码默认关闭候选无 P1；面向学生 Production 的 K–12 人审/隐私法律/Owner 门仍为发布 P1 blocker
- 未解决工程/外部门：真实 Preview provider canary、可执行生产监控/值班、staged Production、rollback receipt、数学/安全人审与 Owner/法律批准；均不得在 Production 开启前跳过。八课 Preview surface 已通过，不得扩展解释为八课 Provider 或 Production PASS

## 4. 自动测试证据层级

### 4.1 必须分别记录

| 证据层 | 必须通过的内容 | Receipt | 状态 |
|---|---|---|---|
| 单元/schema | release parser、8 课 canonical lookup、history bounds、media flags、错误与安全最小化 | `test:nova:server` 61/61；含 426 placements × EN/ES = 852 canonical cases、G4 L3 39 页 × EN/ES = 78 custom/formal invariant | `PASS_LOCAL_STUB_ONLY` |
| provider stub route | 真实 `/api/nova` handler 的请求、响应、body bounds、timeout/429/5xx/model mismatch；不宣称 live provider | 同一 server-only suite 61/61；fake/stub transport；错误路径断言零上游和无内容泄漏 | `PASS_LOCAL_STUB_ONLY` |
| 普通 web 单测 | React/client、capability、frame/speech helper、fake build guard、deployment/private asset split 与既有 web 回归 | `npm test --workspace @helpmath/web` 414/414；同一 suite 在 Site workspace CI 通过 | `PASS_LOCAL_AND_CI` |
| mock browser E2E | 控件、draft、可见性、错误 UI；明确标注 `page.route` bypass | 精确 index 隔离候选 modern-wide `CLIENT_RENDER_MOCK` 54/54 | `PASS_CLIENT_RENDER_ONLY` |
| unmocked local route | 浏览器没有拦截 `/api/nova`，走真实 schema/canonical route + server fake upstream | 精确 index 隔离候选：67 all-on + 7 fail-closed gates = 74/74 | `PASS_FULL_STACK_FAKE_UPSTREAM` |
| local live provider | 合成数学问题，经真实 OpenRouter 返回 exact Luna；修复后重新执行 | 八课各一条英文首屏文字 canary；8/8 API/provider PASS；无 frame；收据 `reports/nova-tutor-local-real-canary-2026-08-23.json` | `PASS_WITH_LOCAL_CLERK_WARNING` |
| Vercel Preview fail-closed | protected Preview、empty/master-off、真实 Next RSC/UI/API、零 Provider | 初始 deployment `dpl_7b7jYFXoVByaFpEVPJrpZB2eWpnN`；追加八课 surface deployment `dpl_FQ52SdgZicJNVm2tXqsRi1mUsNJT`；八课 EN/ES 16/16 为 200 且无 Nova/file input；有效 API 请求 503 | `PASS_NO_PROVIDER_EIGHT_COURSE_SURFACE` |
| Vercel Preview live | release list 开启后的 Preview URL、真实 route/provider/UI、无 secret 的 trace/receipt | `TODO` | `PENDING_AUTHORIZATION_AND_CONFIG` |
| staged Production live | Production env、无正式域名的 exact deployment URL、同一 artifact | `TODO` | `PENDING` |
| Production domain | `www.helpmath.ai` 最终 smoke、日志/监控观察窗、回滚准备 | `TODO` | `PENDING` |

### 4.2 防止 mock E2E 漏报

1. 将测试套件明确命名为 `mock-ui`、`route-integration`、`live-provider`，报告不得只写笼统的 E2E。
2. `live-provider` 与 deployed canary 必须断言页面没有注册 `**/api/nova` interception；网络记录必须出现真实同源 POST。
3. 每个被 allowlist 的 release 至少有一条真实 route 请求；每个发布批次至少一门课程有 live provider 请求。
4. 对 omitted/unsupported/invalid release、Tutor off、frame off、speech off 的负面测试，必须断言 provider 请求数为 0，而不只是 UI 看起来隐藏。
5. 保留真实 HTTP status、HELP Math request ID、exact model、latency、finish reason 与安全计数；不得保存 prompt/reply、provider response ID、IP、secret 或学习者数据。
6. mock PASS 只能关闭 UI wiring 项；若 unmocked 或 live 层未跑，整体状态仍是 `UNVERIFIED`。

### 4.3 最终命令与结果

```text
PASS: npm run typecheck --workspace @helpmath/web
PASS: npm test --workspace @helpmath/web — 414/414
PASS: npm run test:nova:server --workspace @helpmath/web — 61/61
PASS: npm run lint --workspace @helpmath/web — 0 errors, 3 warnings
PASS: npm run verify:asset-profiles --workspace @helpmath/web — 16/16，production 1,320 files + private candidate 3 runtime/204 evidence
PASS: npm run verify:asset-profiles:deployment --workspace @helpmath/web — 11/11，production-only closure
PASS: npm run build --workspace @helpmath/web — production-only asset verification + Next.js production build
PASS: npm ls sharp --workspace @helpmath/web --depth=0 — sharp@0.35.3 direct dependency
PASS: git diff --check；index 为空
PASS: exact server-secret scan — 3 sensitive local values，0 exact matches across 15,483 tracked candidate files + 1,664 final build files；0 sensitive env names in `.next/static`
PASS: FULL_STACK_FAKE_UPSTREAM — 74/74（67 all-on + 7 fail-closed gates）
PASS_CLIENT_RENDER_ONLY: CLIENT_RENDER_MOCK modern-wide — 54/54
PASS_WITH_WARNING: local real OpenRouter text canary — 8/8 exact Luna；每课一条英文首屏请求；本地 Clerk dependency React key warning 尚未关闭
```

上述自动化 PASS 来自 2026-08-23 的精确提交候选，Node `v24.18.0`、npm `11.16.0`。server suite 与 full-stack suite 使用 fake/stub upstream，不能替代后面单列的真实 OpenRouter canary。全量 lint 只有三个既有 unused-parameter warning。秘密扫描另外发现一个与本地值相同的 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 测试 fixture；该值按 Clerk 契约属于浏览器公开标识，不计为 server secret，且报告不记录其值。远端 CI 的 Site workspace 已通过 Nova 所在应用的 lint、typecheck、414/414 unit、61/61 server、build、ordinary/modern-wide/full-stack 浏览器门；同一 workflow 的 Workbench job 因继承的 migration ledger/release expected-count 门失败，未通过改写受保护迁移证据来制造绿色。外部人审和发布各门仍需独立收据；不要只抄最后一行。

远端 CI receipt：[run 32647780088](https://github.com/HUDongpin/help-math-2-0-workbench/actions/runs/32647780088)（head `5fce7424a54f6f11b39c82f7b588d800b298681d`）。[Site workspace job 97214636147](https://github.com/HUDongpin/help-math-2-0-workbench/actions/runs/32647780088/job/97214636147) 在 16m46s 后成功；[Workbench job 97214636102](https://github.com/HUDongpin/help-math-2-0-workbench/actions/runs/32647780088/job/97214636102) 失败，精确原因为 `completion ledger is stale` 与 `lesson releases[0].expectedCounts` 仍是旧字段契约。workflow 总结因此是 failure，而不是全仓绿色；Nova 所在 Site workspace 是 success。该继承失败必须由独立迁移台账工作解决，不能作为 Nova 修复的一部分刷新受保护证据。

## 5. 八课能力、产品发布与外部验收矩阵

八课都已进入 Nova 的代码策略、canonical resolver 与候选 production asset/publication profile。G4 L5/L10/L11 的 142 个 page-only runtime 已通过 hash-bound promotion receipt 纳入候选 production profile；该 profile 当前精确包含 1,135 个 public 文件与 185 个 server 文件，合计 1,320 个八课部署成员，checksum 为 `54e11e77a8d684fcf9542ba7458c12add3edb1a85c16ac99db756a34ed5c6ad4`。这证明候选构建产品资格，不证明远端部署、Flash fidelity、音频、人审、Owner、strict completion 或 Nova rollout 已开放。

| 课程 | 代码策略与 canonical resolver | Final full-stack fake（EN/ES × 3 页） | 本地真实 Provider 文字 | 候选 Production 产品资格 | Protected Preview surface | 人工数学/安全 |
|---|---|---|---|---|---|---|
| G4 L3 | `LOCAL_PASS` | `PASS_FINAL_CANDIDATE` | `PASS_EN_FIRST_PAGE` | `ELIGIBLE_NOT_RELEASED_BY_NOVA` | `EN_ES_200_NOVA_HIDDEN` | `NOT_RUN` |
| G5 L4 | `LOCAL_PASS` | `PASS_FINAL_CANDIDATE` | `PASS_EN_FIRST_PAGE` | `ELIGIBLE_NOT_RELEASED_BY_NOVA` | `EN_ES_200_NOVA_HIDDEN` | `NOT_RUN` |
| G3 L2 | `LOCAL_PASS` | `PASS_FINAL_CANDIDATE` | `PASS_EN_FIRST_PAGE` | `ELIGIBLE_NOT_RELEASED_BY_NOVA` | `EN_ES_200_NOVA_HIDDEN` | `NOT_RUN` |
| G4 L5 | `LOCAL_PASS` | `PASS_FINAL_CANDIDATE` | `PASS_EN_FIRST_PAGE` | `CANDIDATE_ELIGIBLE_PREVIEW_ONLY` | `EN_ES_200_NOVA_HIDDEN` | `NOT_RUN` |
| G4 L10 | `LOCAL_PASS` | `PASS_FINAL_CANDIDATE` | `PASS_EN_FIRST_PAGE` | `CANDIDATE_ELIGIBLE_PREVIEW_ONLY` | `EN_ES_200_NOVA_HIDDEN` | `NOT_RUN` |
| G4 L11 | `LOCAL_PASS` | `PASS_FINAL_CANDIDATE` | `PASS_EN_FIRST_PAGE` | `CANDIDATE_ELIGIBLE_PREVIEW_ONLY` | `EN_ES_200_NOVA_HIDDEN` | `NOT_RUN` |
| G5 L3 | `LOCAL_PASS` | `PASS_FINAL_CANDIDATE` | `PASS_EN_FIRST_PAGE` | `ELIGIBLE_NOT_RELEASED_BY_NOVA` | `EN_ES_200_NOVA_HIDDEN` | `NOT_RUN` |
| G5 L5 | `LOCAL_PASS` | `PASS_FINAL_CANDIDATE` | `PASS_EN_FIRST_PAGE` | `ELIGIBLE_NOT_RELEASED_BY_NOVA` | `EN_ES_200_NOVA_HIDDEN` | `NOT_RUN` |

`PASS_FINAL_CANDIDATE` 指 8 课 × 2 locale × 3 page selector 的 48 个真实本地 `/api/nova` + server fake-upstream case 已在精确提交候选上通过；同一列车还通过 G5 L3 重复 animation 的 ordinal 45/46、current-frame、EN/ES speech confirmation、14 个语音负面 case 和七个关闭场景，总计 74/74。`PASS_EN_FIRST_PAGE` 只证明固定英文首屏文字 canary，不扩展为西语、assessment、frame、speech、人审或部署证据。追加 protected Preview 只使用 deployment-specific 非秘密 overrides 打开八课 Current-JS surface，并把 Nova master、rollout、frame、speech 全部强制关闭；因此它证明八课课程页面与 Nova fail-closed UI/API 的组合，不证明任何 deployed Provider、frame 或 speech 能力。

每次真实 canary 只使用中性合成数学问题。Receipt 可以记录固定 fixture ID，但不记录实际请求或回复正文。

## 6. 图片与语音负面测试

### 6.1 当前课程帧

在 `NOVA_ALLOW_FRAME_CONTEXT=false` 下必须通过：

- 不显示 frame 控件；DOM 中没有本地 file input、camera capture 或 video capture；
- 键盘、屏幕阅读器和移动端都无法绕过控件构造附件；
- 发送普通文字时 payload 没有 frame；
- 人为构造 frame payload 时 API fail-closed，provider 请求数为 0；
- Privacy/Terms EN/ES 与 UI 一致。

未来单独开启时还必须通过：

- 只有显式 **Attach current lesson frame** 才附加，页面进入/切页/重播不自动上传；
- Cancel/Remove 后 payload 无 frame；每次附件只服务于明确的下一次请求；
- release ID、page ordinal、animation ID 与 canonical 当前页一致，旧页/跨课/stale frame 被拒绝且不上游；
- 尺寸、格式、解码失败与超时 fail-closed；无本地文件和相机路径；
- 数学、安全、隐私、人审、Owner 和法律 gate 独立签字。

本地代码/测试状态：`IMPLEMENTED_LOCAL / OWNER_LEGAL_NOT_APPROVED`。服务端负面矩阵已覆盖 magic/MIME、损坏 PNG/JPEG、APNG、多页/尺寸/pixel/byte 限制、canonical identity、重编码与失败时零上游。无人物、无文字、无 PII fixture 的 SHA-256 收据：

- 正向纯色 PNG：`3f3194901a03310151c423c781724259216aa5ea01492d510e5ae9b8cfe69536`
- 损坏 PNG：`1b56b50ac4e976f488f128cabdcdffb2fc9331d6974bb9968131a415d14ade24`
- 损坏 JPEG：`03b70d49139e0ee9121b9aa599be36d4e93e3ac61604974c3fd41e1e22012e58`
- 固定 APNG：`373df112cb2f4103564ca164f9690d074a4389b3ba1f4f7974327084c8efb8f3`

### 6.2 speech-to-draft

在 `NOVA_ALLOW_SPEECH_INPUT=false` 下必须通过：

- 麦克风控件不存在；无法仅靠客户端事件开启；provider 请求数为 0。

未来单独开启时还必须通过：

- 不支持 SpeechRecognition、拒绝权限、无麦克风、取消、超时和错误都保持可恢复；
- partial/final transcript 只更新可编辑 draft，产生 transcript 时 `/api/nova` 请求数仍为 0；
- 用户编辑、清空或取消 draft 不发送；只有显式 Send 才发送确认文本；
- 连续 final events、语言切换、关窗/切页不会重复或偷偷发送；
- EN/ES 清楚披露：HELP Math 收到确认文本而非 raw audio，但浏览器、OS 或 speech vendor 可能按自己的条款接收/处理 raw audio；
- 完成人审、Owner 和法律 gate 后才能把 flag 设为 true。

本地代码状态：`IMPLEMENTED_LOCAL / OWNER_LEGAL_NOT_APPROVED`。14 个独立 SpeechRecognition 浏览器负面用例已在精确 index 隔离候选上真实执行通过，覆盖 unsupported、permission denied、`service-not-allowed`、`audio-capture`、`no-speech`、`network`、`aborted`、`start()` 抛错、interim-only、duplicate final/onend、双击停止、关窗 abort 及 EN `en-US`/ES `es-US`。它们使用真实 Next UI 与 `/api/nova` route、server fake upstream；因此可以证明“转写到草稿、Send 前零请求”的应用行为，但不能替代真实设备、浏览器 speech vendor、Privacy/法律或生产验收。

## 7. 人审与 Owner/法律门

### 7.1 人工评审（自动测试不能代替）

- 数学教育者逐课检查正确性、提示质量、不过度泄露 assessment 答案：`TODO`
- 儿童安全与 adversarial EN/ES：`TODO`
- 特殊教育、学习困难、无障碍与 English learner 评审：`TODO`
- 键盘、屏幕阅读器、移动端、低带宽和错误恢复：`TODO`
- 图片与语音若保持关闭，也要人审确认入口真正不存在：`TODO`

### 7.2 Owner 与法律

- EN/ES Privacy Notice：`DRAFT / NOT APPROVED`
- EN/ES Terms：`DRAFT / NOT APPROVED`
- child-directed service、COPPA、FERPA、school contract：`TODO`
- consent、retention/deletion、international transfer、subprocessors：`TODO`
- raw-audio browser/OS/vendor disclosure：`TODO`
- ZDR 是请求/路由要求而非绝对保证的表述：`TODO`
- 课程批次、frame、speech 的逐项 Owner release 决定：`TODO`

没有上述批准时，代码和测试即使全绿也只能写 `IMPLEMENTED_UNVERIFIED_FOR_RELEASE`。

## 8. Vercel readiness 与受保护 Preview 审计

### 8.1 链接、认证与部署

| 检查 | 只读结果 |
|---|---|
| CLI | 全局/工作区无 `vercel` binary；`npx` 可用；审计使用缓存后的 Vercel CLI `59.5.0` |
| Link | 仓库根 `.vercel/project.json` 存在，链接项目名 `helpmath-web`；ID/owner 未写入本报告 |
| Auth | `vercel whoami` 成功；账户标识不写入本报告 |
| Project | Vercel 找到 `helpmath-web`；Root Directory `.`，Next.js，Node.js `24.x` |
| 当前公开别名 | `www.helpmath.ai` 解析到 deployment `dpl_6pj5sVFj7P1r7M7Cg12DJngSXhhj`，状态 `READY`，target `production` |
| 当前 deployment URL | `helpmath-mdcvbv23q-peter-dongpin-hu-s-projects.vercel.app` |
| 创建时间 | 2026-08-21 14:52:00.229 UTC；这只是当前旧版本 provenance，不是修复后的部署 |
| 初始受保护 Preview | deployment `dpl_7b7jYFXoVByaFpEVPJrpZB2eWpnN`，状态 `READY`，target `preview`；[URL](https://helpmath-2rqheem9k-peter-dongpin-hu-s-projects.vercel.app) |
| 八课 fail-closed Preview | deployment `dpl_FQ52SdgZicJNVm2tXqsRi1mUsNJT`，状态 `READY`，target `preview`；[URL](https://helpmath-l2m6b7bt1-peter-dongpin-hu-s-projects.vercel.app) |
| Preview artifact 绑定 | 初始 Preview 的 `gitCommitSha`/自定义 `gitSha` 精确绑定 `5fce7424…`；八课 Preview 从干净、HEAD=`5fce7424…` 的独立 worktree 直接上传 2,675 个文件，构建检查记录八课 1,320-file checksum `54e11e77…`。CLI direct deployment 的 runtime `commit` 字段为空，因此不伪造 Vercel Git 绑定声明 |
| 保护/noindex | 未认证请求 302 到 Vercel SSO；受保护页面和 `robots.txt` 均有 `x-robots-tag: noindex` |

### 8.2 Nova 环境变量名称存在性

只检查名称、scope 和类型，未读取任何值。

| 名称 | Preview | Production | 结论 |
|---|---:|---:|---|
| `NOVA_TUTOR_ENABLED` | 有 | 有 | 既有 |
| `NOVA_TUTOR_RELEASE_IDS` | **无** | **无** | 新实现必需；缺失会安全地发布零课程 |
| `NOVA_ALLOW_SPEECH_INPUT` | **无** | **无** | 缺失等价关闭；未来 speech gate 通过后才可显式添加/开启 |
| `NOVA_ALLOW_FRAME_CONTEXT` | 有 | 有 | 值未读；首次 canary 必须由授权人员确认保持 false |
| `OPENROUTER_API_KEY` | 有 | 有 | 仅确认 sensitive 名称存在，未读取值 |
| `OPENROUTER_BASE_URL` | 有 | 有 | 值未读 |
| `NOVA_MODEL` | 有 | 有 | 值未读；候选构建仍须 fail-closed 验证 exact Luna |
| `NOVA_TIMEOUT_MS` | 有 | 有 | 值未读 |
| `NOVA_MAX_OUTPUT_TOKENS` | 有 | 有 | 值未读 |
| `NOVA_TUTOR_RATE_LIMIT_PER_MINUTE` | 有 | 有 | 值未读 |

额外观察：Preview 和 Production 仍存在一组历史 `NOVA_QWEN_*` 名称，包括 server-only API key 名称；本审计未读取任何值。当前仓库范围的检索没有找到这些名称的运行时代码引用。它们不应被当作 Luna fallback。进入正式发布前，应先独立证明不再被任何部署引用，再由明确授权的人员安排退役/轮换；本次没有删除或修改这些远端变量。

### 8.3 Firewall 与 observability

- Firewall：Enabled；2 条 active、0 inactive；0 IP block；0 system bypass；Attack Mode off；system mitigations active；无 pending draft。
- Nova 规则：exact path `/api/nova` + method `POST`，IP fixed-window `12 requests / 60 seconds`，超限返回 rate limit。
- 观察项：规则说明仍写有 “Qwen-backed Nova endpoint”，与当前 exact Luna 契约不一致。规则动作本身正确，但应在另一次明确授权的远端维护中修正文案，避免事故响应混淆；本审计没有修改。
- Log drains：团队级 `/v1/drains` 返回 0。当前没有外部 drain 来承接 runtime/build/trace 观察。
- 仓库中存在 `@vercel/analytics` 并在 layout 使用；未观察到 Speed Insights 或 Sentry 代码证据。Analytics 不能代替 runtime error drain/日志扫描。

### 8.4 Preview 判定

`PASS_EIGHT_COURSE_FAIL_CLOSED_PROTECTED_PREVIEW / LIVE_PROVIDER_CANARY_NOT_RUN`。

两个受保护 Preview 都已实际构建并验收，不再只是 readiness 判断。初始 Preview 保留以下零 rollout 证据：

- G4 L3 和 G5 L4 的 EN/ES 课程页面均返回 200、`noindex`，HTML 中没有 Ask/Preguntar Nova control、Tutor panel 或 active Nova UI；
- EN/ES 首页均返回 200，只显示 disabled Nova availability copy，没有 active Talk/Hablar CTA；
- 对 G4 L3 构造一个格式与 canonical context 有效的同源 `POST /api/nova`，返回 409 `NOVA_COURSE_NOT_AVAILABLE`、`cache-control: no-store`、requestId `1bd81956-fec4-4118-ae67-034778315e2d`；
- 同一 requestId 的结构化 runtime log 记录 `status=409`、`failure=course-not-available`、`durationMs=209`、`attempts=null`、`upstreamStatus=null`、`framePresent=false`，且没有 message/history/reply/frame 或 secret；
- 部署后的 runtime error log 查询没有返回 error 记录；本次 Preview 验收没有调用 Provider。

为关闭最初六课 404 的表面验收缺口，又从同一代码 artifact 创建了八课 fail-closed Preview。它只通过 deployment-specific 非秘密 build/runtime overrides 打开八个 Current-JS showcase flag，并同时强制 `NOVA_TUTOR_ENABLED=false`、空 rollout、frame=false、speech=false；没有修改项目级 Vercel env：

- Vercel 构建机上的 production-only asset/publication suite 11/11 通过，随后 Next.js compile、TypeScript、28/28 static pages 与 deployment 全部通过；
- 八门课 × EN/ES 的 16 条 `/courses/{grade}/{lesson}?mode=focus` 路由全部返回 200，HTML 全部为 `data-host-presentation="modern-wide"` 且没有 Ask/Preguntar Nova；
- 已授权真实浏览器逐页访问同一 16 路由：URL/title 正常，Nova button=0、`input[type=file]`=0、warning/error=0；G4 L5 可见截图确认现代目录、动画与控制条正常，且无 Nova surface；
- 对 G4 L3 构造 canonical 同源 `POST /api/nova`，master gate 返回 503 `NOVA_NOT_CONFIGURED`、`cache-control:no-store`、requestId `061bce61-cd40-4777-b030-29403dbf2feb`；
- 同 requestId 结构化 runtime log 为 `status=503`、`durationMs=0`、`attempts=null`、`upstreamStatus=null`、`requestBytes=466`，且 release/context/content 均未在 master gate 前记录；Provider 调用为零；
- 未认证访问仍 302 到 Vercel SSO 且 `x-robots-tag:noindex`；`robots.txt` 通过保护访问返回 200 并带同一 noindex header；
- `www.helpmath.ai` 仍解析到旧 production deployment `dpl_6pj5sVFj7P1r7M7Cg12DJngSXhhj`，没有 alias/promote/Production 变更。

因此空/缺失 rollout 与 master-off 的全栈 fail-closed 契约，以及八课课程 surface，都已在真实 Vercel artifact 上通过；真实 Provider Preview canary 仍是 `BLOCKED_EXTERNAL_APPROVAL_AND_CONFIG`。要做首个 text-only Preview canary，必须由授权人员添加 Preview-scoped 最小 release list，证明 Preview key 与 Production key 隔离，并保持 speech/frame 为 false。当前任务没有进行这些项目级远端配置变更或任何 Preview Provider 调用。

0 drains 是发布风险警告而不是 Vercel 构建阻断。进入 staged Production 前至少要确定：由谁监控 Vercel runtime logs、观察多久、触发阈值、谁能推广/回滚；若不创建 drain，就必须有书面的 Dashboard/CLI fallback 值班流程。

## 9. 分阶段发布与真实 canary

### Gate A — 本地默认关闭

- 所有环境示例为 off/empty；无 secret 进入 Git。
- Tutor off、空 release list、无效 list、frame off、speech off 的测试都证明零 provider 请求。
- focused/full test、typecheck、lint、build、diff review 全部记录。

### Gate B — 本地真实 text canary

- 已在本地私有、Git ignored、mode `0600` 的配置中临时选择全部八个 release；frame=false。speech capability 为本地 UI 测试打开，但八次 canary 均使用 typed text，不使用麦克风。
- 八门课各一条合成英文首屏数学问题，经真实浏览器 → 本地真实 `/api/nova` → OpenRouter → exact Luna → UI；8/8 document/API 200、`cache-control:no-store`、exact model、UUID requestId、无 frame、无个人数据，API duration 2.0–5.6 秒。
- 八次 canary 的无内容收据在 `reports/nova-tutor-local-real-canary-2026-08-23.json`；只保存 requestId、状态、时延、model、reply hash 与安全断言。
- 所有页面出现同一个本地 Clerk dependency React key warning，因此严格 browser-clean 判定不是 8/8；该 warning 未阻断 Nova，也未出现在 API/Provider 路径。Preview 仍必须达到 console error/pageerror/failed request 全零。
- 精确 index 候选 production build 与 tracked tree 已完成 exact-key scan；3 个 server-sensitive 本地值在 15,483 个 tracked 文件和 1,664 个 `.next/static`/`.next/server` 文件中均为 0 match。

### Gate C — Vercel Preview 单课程

- `PASS`：exact code artifact 已部署；deployment ID/URL/build status/Git SHA 已记录；受 Deployment Protection 和 `noindex` 保护。
- `PASS`：empty release list 的 disabled/omitted 负面路径已在真实 Next UI/API 上通过；初始 Preview 的 409 与八课 master-off Preview 的 503 都发生在 Provider 前，runtime log 均证明 `attempts=null`/`upstreamStatus=null`。
- `PASS`：八课 Current-JS surface 已通过 deployment-specific overrides 在 protected Preview 中开放；EN/ES 16/16 路由为 200，Nova 与本地文件入口均隐藏，浏览器 warning/error 为 0。
- `PENDING`：只在明确授权后增加 Preview-scoped 最小 release list；不得读取或打印 secret 值；必须确认 Preview key 与 Production key 隔离。
- `PENDING`：先跑一次 G4 L3 text live canary；frame/speech 保持 off，并扫描 console/pageerror/failed requests、`/api/nova` 和 runtime logs。
- `PENDING`：G5 L4 作为第二个独立 Provider 批次验证原 422 修复；其余课程按发布批次执行 Preview live provider 矩阵。课程 surface 已通过不等于 Provider 矩阵已通过。

### Gate D — staged Production

- 普通 Preview→Production 会用 Production env 重新构建，不能宣称是相同 Preview artifact；若采用该路径，必须重新完整验证。
- 严格路径：在自动绑定正式域名关闭的条件下创建使用 Production env 的 staged Production deployment，测试 exact protected deployment URL，再经 Owner release 决定推广同一个 READY deployment，不重建。
- 保留上一 known-good deployment ID、环境变量名称清单（无值）、release list 的受控值 receipt 和回滚责任人。

### Gate E — 正式域名与观察窗

- `https://www.helpmath.ai` 最终 alias、裸域 308、EN/ES、课程页与 `/api/nova` 真实 smoke。
- 首次只检查已批准课程；omitted 课程必须没有控件和 provider 请求。
- A1（G4 L3 文字）与 A2（G4 L3 当前帧）各至少观察 2 小时；A3（语音）以及 B、C、D 每批至少观察 24 小时。下一批课程不得在本批观察窗结束前加入。
- 报告只保留无秘密/无内容的状态证据。

## 10. 监控、停止与回滚标准

### 10.1 立即停止/回滚（任一即触发）

- personal/sensitive data、raw audio、未显式 frame、本地文件/相机进入 Nova 请求或日志；
- omitted/unsupported 课程出现可发送 Nova，或 flag off 仍有 media 控件/网络请求；
- provider 返回非 allowlisted model 但被 UI 接受；
- assessment answer leakage、严重数学错误、儿童安全/自伤/虐待/性内容/引导离站等 P0/P1；
- 有效 canonical 请求出现 422；
- secret、provider response ID、prompt/reply、IP 或 learner data 出现在可持久化 receipt/log。

### 10.2 暂停扩批并调查

- 两次连续真实 canary 失败；
- 任一连续 10 分钟窗口内最终用户级请求不少于 20 个，成功率低于 95%；
- 同一 10 分钟窗口内 `502`、`503`、`504` 与 timeout 合计超过最终用户级请求的 5%；
- p95 超过 15 秒并连续两个 10 分钟窗口，或任一 10 分钟窗口 p95 超过 30 秒；
- 429 超过最终用户级请求的 2% 时先暂停扩批并检查应用层与 Firewall 限流，不把它直接记作 provider outage；
- provider spending/预算异常；
- EN/ES 行为、canonical page context、错误恢复不一致；
- runtime log 观察责任人或回滚权限不可用。

上述百分比只统计完成的用户级 `/api/nova` 请求，不按 provider retry attempt 扩大分母；预期负面测试、开发 fake-upstream 和人工故障注入必须从生产健康分母排除。所有窗口还必须能按 deployment、release batch、release ID 和 locale 下钻。阈值是首发保守门；Owner/运维可在真实基线形成后收紧，但不得为通过验收而临时放宽。

### 10.3 回滚动作

1. 停止继续扩批并保存无内容的时间、deployment、status/request ID 证据。
2. 将 production alias 恢复到上一 known-good deployment。
3. 创建新的 staged deployment，移除故障 release ID；若范围不明，使用 `NOVA_TUTOR_ENABLED=false`。
4. 注意：修改 Vercel 环境变量不会追溯改变已经构建的 deployment，必须完成并验证新的 deployment/alias 动作。
5. 确认正式域名不再显示受影响控件且 `/api/nova` 无非预期请求，再发布事故/回滚 receipt。

## 11. 最终签收页

| 签收 | 姓名/角色 | 日期 | Receipt | 决定 |
|---|---|---|---|---|
| 实现负责人 | `TODO` | `TODO` | `TODO` | `TODO` |
| 独立工程审核 | `TODO` | `TODO` | `TODO` | `TODO` |
| 数学教育评审 | `TODO` | `TODO` | `TODO` | `TODO` |
| K–12 安全/无障碍评审 | `TODO` | `TODO` | `TODO` | `TODO` |
| Privacy/法律 | `TODO` | `TODO` | `TODO` | `TODO` |
| Owner | `TODO` | `TODO` | `TODO` | `TODO` |
| Preview 运维 | `TODO` | `TODO` | `TODO` | `TODO` |
| Production 发布/回滚 | `TODO` | `TODO` | `TODO` | `TODO` |

只有当实现、自动测试、人审、Owner/法律、Preview、staged Production、正式 Production 与观察窗各自拥有独立 PASS receipt 时，才能把 Nova Tutor 写成“在已批准课程和已批准输入方式上正常运行”。即使那时，也不能扩展成“全部课程、图片、语音或 K–12 法律合规已普遍完成”。

## 12. 候选文件边界与收据

### 12.1 Nova 新增文件

以下文件是本修复新建的精确 Nova 实现、测试或验收文件：

```text
apps/web/e2e/nova-capability-gates.spec.ts
apps/web/e2e/nova-full-stack.spec.ts
apps/web/e2e/nova-speech-negative.spec.ts
apps/web/lib/nova-bounded-body.server.ts
apps/web/lib/nova-capabilities.server.ts
apps/web/lib/nova-capabilities.ts
apps/web/lib/nova-frame-normalization.server.ts
apps/web/lib/nova-full-stack-fake-transport.server.ts
apps/web/lib/nova-request-resolver.server.ts
apps/web/playwright.nova-full-stack.config.ts
apps/web/scripts/run-nova-full-stack-e2e.ts
apps/web/tests/nova-capabilities.server-test.ts
apps/web/tests/nova-fake-transport-build-guard.test.ts
apps/web/tests/nova-frame-normalization.server-test.ts
apps/web/tests/nova-full-stack-fake-transport.server-test.ts
apps/web/tests/nova-g4-l3-context-invariant.server-test.ts
apps/web/tests/nova-openrouter-route.server-test.ts
apps/web/tests/nova-production-eligibility.server-test.ts
apps/web/tests/nova-request-resolver.server-test.ts
apps/web/tests/nova-ui-capabilities.test.ts
reports/nova-tutor-remediation-acceptance-report-2026-08-23.md
```

原普通测试 `apps/web/tests/nova-openrouter-route.test.ts` 已迁移为 server-only 的 `nova-openrouter-route.server-test.ts`，确保只在 `--conditions=react-server` 下运行。

### 12.2 既有文件中的 Nova 精确 hunk

共享工作树在本任务开始前已经有大量并行修改。以下是含 Nova 修复 hunk 的既有文件；它们不是整文件独占所有权，提交时必须逐 hunk 审查，禁止把文件中的无关课程迁移改动一起归入 Nova：

```text
.github/workflows/ci.yml
.vercelignore
apps/web/.env.example
apps/web/app/[locale]/courses/[grade]/[lesson]/page.tsx
apps/web/app/[locale]/page.tsx
apps/web/app/api/nova/route.ts
apps/web/app/globals.css
apps/web/components/descriptor-driven-whole-lesson-player.tsx
apps/web/components/g4-l3-whole-lesson-player.tsx
apps/web/components/learning-platform-workspace.tsx
apps/web/components/legacy-responsive-lesson-shell.tsx
apps/web/components/lesson-nova-tutor.tsx
apps/web/components/whole-lesson-course-player.tsx
apps/web/content/en/index.ts
apps/web/content/es/index.ts
apps/web/e2e/prototype-acceptance.spec.ts
apps/web/eslint.config.mjs
apps/web/lib/nova-client.ts
apps/web/lib/nova-openrouter.server.ts
apps/web/lib/nova-request-schema.ts
apps/web/lib/current-js-asset-profile.ts
apps/web/lib/tutor-integration.ts
apps/web/next.config.ts
apps/web/package.json
apps/web/playwright.config.ts
apps/web/tests/descriptor-driven-whole-lesson-player.test.ts
apps/web/tests/current-js-asset-profiles.test.ts
apps/web/tests/nova-client.test.ts
apps/web/tests/nova-openrouter-route.test.ts
apps/web/tests/tutor-integration.test.ts
docs/NOVA_OPENROUTER.md
package-lock.json
scripts/current-js-candidate-paths.mjs
scripts/manage-current-js-asset-profiles.mjs
```

CI 已加入两个独立永久门：`test:nova:server` 与 `test:e2e:nova-full-stack`。`package.json`、lockfile、Next/Playwright 配置同时含其他并行工作 hunk；Nova 所有权只限 server test/full-stack scripts、Sharp 直接依赖、fake-transport production guard 和 capability test env 等明确差异。

### 12.3 保全与无秘密收据

- 本验收报告没有覆盖原问题报告 `reports/nova-tutor-runtime-problem-report-2026-08-23.md`；最终只读审计所见原报告 SHA-256 为 `d729f625f682462ce53a9b7b300e584158bac494a3e14286a98d810932e9e4a9`，自该哈希采样后未观察到变化。原报告当前没有 Git blob 或更早的固定哈希，因此不把这项证据扩展成“自创建以来从未变化”。
- 没有 reset、stash、clean、切换主工作树分支或 `git add -A`。修复通过精确 path 和逐 hunk 方式提交；共享工作树中的无关修改全部保留，index 为空。Nova 修复的受控提交已经推送到远端 draft PR #4；已创建并验收两个 protected Preview（初始空 rollout 与八课 master-off surface），没有推广、回滚、Production 部署或项目级远端配置修改。
- `apps/web/.env.local` 仍为 mode `0600`，由 `.gitignore` 的 `.env.*` 规则忽略；本报告没有记录其值。
- 本地 `.env.local` 为本次 canary 临时包含全部八个 release、speech=true、frame=false；这里只记录非秘密开关状态，不记录 release 字符串之外的任何值。它仍被 Git 忽略，且不会改变 `.env.example` 的 master/frame/speech=false、release list 为空默认值。
- 最终 production build 后，从 `.env.local` 识别 3 个非空 server-sensitive 值；扫描精确 index 的 15,483 个 tracked 文件和 1,664 个 `.next/static`/`.next/server` 文件，结果为 0 个 exact match。另一个匹配是明确可公开的 Clerk publishable-key 测试 fixture，不属于 server secret；其值未写入报告。
- `OPENROUTER_API_KEY`、rollout 与 fake-transport 等名称只出现在服务端 `/api/nova` route/chunk，不出现在 `.next/static` 学习者 bundle；没有把配置值或内部失败原因放入公开 capability DTO。

八课 asset/product 边界另有以下不可混写收据：

- `reports/current-js-g4-page-only-production-promotion-2026-08-23.json`：G4 L5/L10/L11 的 142 placements 进入候选 production profile；不授予 Flash fidelity、音频、人审、Owner 或 strict-completion 状态。
- `reports/current-js-production-asset-separation-freeze-2026-08-22.json` 及 `.sha256`、`reports/current-js-production-asset-separation-applied-2026-08-22.json`：production/candidate byte separation。
- `reports/current-js-candidate-evidence-relocation-applied-2026-08-22.json`：207 个 evidence path 的 relocation receipt；这些文件不进入 learner bundle。
- `.gitattributes` 只把 hash-bound candidate `canvas-renderer.js` 标记为 opaque binary，避免 Git whitespace normalization；没有改写冻结 bytes，candidate profile 3/3 runtime + 204/204 evidence hash 检查通过。

### 12.4 当前可交付状态

代码实现、受控 Git 提交、远端 draft PR、Site workspace CI、空 rollout protected Preview，以及八课 master-off protected Preview surface 验收已经完成；这仍不等于 Nova 整体发布完成。下一项外部动作是取得独立 Preview key/预算、Owner 对 Preview provider 调用与环境变量变更的明确授权，然后只为 G4 L3 添加 Preview-scoped release ID 并执行 text-only live canary。G5 L4 作为下一独立 Provider 批次；其余课程按既定 A–D 批次继续。图片和语音继续等待独立的 dated Privacy/法律、Owner 与真实设备收据，Production 开关保持关闭；staged Production、正式域名、监控观察窗和回滚演练均未执行。
