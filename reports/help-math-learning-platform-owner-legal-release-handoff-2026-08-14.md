# DRAFT FOR OWNER/LEGAL REVIEW — HELP Math 2.0 Release Handoff

## Executive Summary / 执行摘要

- **这是一份事实型发布交接，不是法律意见。** 本文件不判断 HELP Math 是否符合 FERPA、COPPA 或其他法律，不证明权利已经清理，也不授权公开发布。当前 EN/ES Privacy Notice 与 Terms of Use 仍是 `DRAFT / BORRADOR`。
- **公开域名仍在旧部署。** 本次实时 Vercel 检查确认，`www.helpmath.ai` 与 `helpmath.ai` 都解析到旧公开部署 `dpl_6kho5qk5Xyr98jnwypKs7mHfgG42`；它不是本次学习平台候选。旧部署的 EN/ES Privacy 与 Terms 页面目前公开显示发布前审阅提示。
- **学习平台候选已处于受保护的技术 Ready 状态，但没有获得发布授权。** 精确候选为 `dpl_H8AfxcvrPGjKLNMdCLv7hW393DX9`，状态 `READY`，受 Vercel 身份验证保护，尚未提升到 HELP Math 自定义域名。v2 收据没有记录 owner approval、legal approval 或旧公开别名的 owner containment direction。
- **课程边界必须保持原样。** Grade 4 Lesson 3「Negative Numbers」有 39 个 current-JavaScript 页面和 1 个功能课程 shell，但严格迁移账本仍为 **0/40**，`published=false`。这不是原始 Flash 运行时、视觉或音频保真结论，也不是人工、owner、权利或正式发布验收。
- **真实物理麦克风链路尚未验收。** 浏览器 SpeechRecognition 的模拟流程通过，真实浏览器的权限拒绝后备路径通过，原始音频不发送给 HELP Math 或 Qwen；但是 `physical microphone provider acceptance` 明确为 **not accepted / not claimed**。

## 1. 当前部署与草案暴露状态

本节区分“现在公众访问到的旧部署”和“等待决定的受保护候选”。`READY` 只表示 Vercel 部署状态，不等于 owner、legal、rights、strict-migration 或 publication approval。

| 项目 | 当前事实 |
|---|---|
| 公开域名 | `https://www.helpmath.ai` 与 `https://helpmath.ai` |
| 当前公开部署 | `dpl_6kho5qk5Xyr98jnwypKs7mHfgG42` |
| 当前公开部署 URL | `https://helpmath-37teehnoa-peter-dongpin-hu-s-projects.vercel.app` |
| 当前公开部署状态 | `READY`；本次 Vercel inspect 再确认两个自定义域名都解析到该旧部署 |
| 受保护学习平台候选 | `dpl_H8AfxcvrPGjKLNMdCLv7hW393DX9` |
| 候选 URL | `https://helpmath-j8lbmterq-peter-dongpin-hu-s-projects.vercel.app` |
| 候选状态 | `READY`；Vercel-authenticated；未提升到公开自定义域名 |
| 候选收据 | `reports/help-math-learning-platform-candidate-2026-08-14-v2.json` |
| 候选收据 SHA-256 | `5da32836cff20c04fa8d3f37ff1162ccdccbe900189ebc6d96036351246ba91a` |
| 自定义域名切换 | 尚未执行 |

### 旧公开部署正在公开展示的草案提示

本次实时 HTTP 检查确认下列四个路由均返回 `200`：

- `/privacy`：English Privacy 页面写明发布前需要 owner review，并称其为 draft。
- `/terms`：English Terms 页面写明发布前需要 owner 与 legal review，并列出 governing entity、jurisdiction、contact address 与 demo-specific license terms 等待确认项。
- `/es/privacy`：Spanish Privacy 页面写明发布前需要 titular/owner review，并称其为 borrador。
- `/es/terms`：Spanish Terms 页面写明发布前需要 titular/owner 与 legal review，并列出 entidad responsable、jurisdicción、dirección de contacto 与 licencias 等待确认项。

因此，当前状态并不是“草案只存在于受保护候选”：旧公开部署本身已经对公众暴露草案审阅提示。此处只记录可观察状态，不判断应采取哪一种法律处置。

### 受保护候选中的当前 EN/ES 文本

候选的 English 与 Spanish Privacy/Terms 均更新于 2026 年 8 月 14 日，并明确标注：

- `DRAFT / BORRADOR`；
- 发布前需要 owner 与 legal review；
- 文本描述当前技术设计，但不是法律判断，也不保证 FERPA、COPPA 或其他法规合规；
- Terms 在批准并发布最终版本前不形成合同、不约束访客、也不授予许可；
- publishing entity、jurisdiction、contact address、vendor terms、child-user terms 与 showcase-specific license 仍待确认。

## 2. 当前数据流与保留边界

下表记录候选当前实现和 EN/ES Privacy/Terms 所描述的数据路径。它说明“系统现在做什么”，不构成对该路径合法性、充分性或合规性的判断。

| 表面 | 当前输入与路径 | 当前保存或保留边界 | 明确不包含／未完成 |
|---|---|---|---|
| 本地课程状态 | 当前页、已访问页、已完成页、界面语言、Replay 次数以及由此派生的进度留在浏览器 `localStorage` | 保留到用户或浏览器清除；不是账户、云端进度、正式成绩或跨设备记录 | 不建立具名学生/教师账户，不连接学校记录 |
| 事件会话状态 | 随机 lesson-event session UUID 与 sequence counter 留在当前标签页的 `sessionStorage` | 当前标签页会话范围；清除 session storage 后移除 | 不是具名学习者账户 |
| Nova Tutor / Qwen | 用户键入的文本，或浏览器语音识别返回的文字 transcript，经 HELP Math 同源服务器发送到 Alibaba Model Studio `qwen3.8-max`；只有用户主动附加时，当前课程画面才随该次请求发送 | HELP Math 请求使用 `store:false`，平台不持久化 Nova 对话；Alibaba 仍可能按其条款处理请求、瞬时日志或安全信号 | 原始麦克风音频不发送给 HELP Math 或 Qwen；设备相机和文件选择器禁用；不应输入个人或敏感信息；真实物理麦克风到 provider 的端到端验收尚未完成 |
| 浏览器语音识别 | 麦克风音频可能先由浏览器、操作系统或其 speech-recognition provider 处理，再向页面返回 transcript | 受浏览器、操作系统或相应提供商的条款和设置影响 | 候选收据只证明模拟识别流程与权限拒绝后的文字后备；不证明真实物理麦克风 provider acceptance |
| LRS / xAPI | 课程生命周期、页面浏览、页面完成和支持工具使用事件，经 HELP Math 同源 API 发送到 Learning Locker，协议为 xAPI 1.0.3 | 已投递事件遵循 LRS operator 的配置保留期；当前文本没有给出一个已批准的固定 LRS 删除期限 | 事件不含姓名、邮箱、Nova prompt/reply、自由文本答案、原始语音、照片或课程画面；当前播放器不发 practice-result events，也不形成教师 dashboard、成绩、placement 或自动教育决策 |
| Pseudonymous Actor | 服务器在 `hm_lrs_anon_v1` cookie 中保存随机 seed，再用服务器端 HMAC secret 生成单向 pseudonymous Actor account identifier | Cookie 为 `HttpOnly`、`SameSite=Strict`，生产 HTTPS 加 `Secure`，`Max-Age=180 days`；清 cookie 只重置未来事件的 pseudonym，不删除已投递的 LRS 事件 | Actor 无 human display name、无 `mbox`；pseudonymous identifier 不等于匿名，在某些地区仍可能属于个人数据；实际 Actor 值和 HMAC secret 不记录在收据中 |
| Offline outbox | LRS 暂时不可达时，浏览器 `localStorage` 最多保存 200 个 closed-format events，并在恢复在线后重试 | 7 天是逻辑 retry-validity window；超过 7 天的记录在下一次 app load 时忽略并删除。若应用从未再次打开，已过期序列化字节可能在本地物理保留超过 7 天，直到浏览器或用户清除站点数据 | Outbox 不保存 Nova 对话、自由文本答案、语音录音、照片或课程画面 |
| Contact | `/contact` 与 `/es/contact` 目前只是 availability/status pages；没有表单、input、textarea 或 Turnstile；未满足精确 gate 与完整配置时，`/api/contact` 在解析 body 或调用 provider 前返回 `503 CONTACT_DISABLED` | 当前不产生 contact message，因此没有 contact message retention | 当前不接受、收集、验证或发送姓名、邮箱、组织、角色、主题或消息；Cloudflare Turnstile 与 Resend 当前未使用。未来 adult contact flow 需要另行 owner、legal、production-credential 和 privacy authorization |
| Hosting / network | Vercel 与相关网络服务可能为交付和保护网站处理 request time、page、browser/device information、approximate network location 和 IP address 等有限技术信息 | 遵循启用服务各自适用的配置与保留期 | 候选收据不记录 IP、API key、密码、LRS endpoint、Nova response、课程画面或 Actor account value |

## 3. 尚未形成的 owner / legal 决策记录

技术候选收据明确记录：`explicitOwnerApprovalRecorded=false`、`explicitLegalApprovalRecorded=false`、`explicitOwnerDirectionForExistingPublicAliasRecorded=false`。下列事项需要由有权人员形成可留存记录；Codex 不能替代这些决定。

### Owner 需要决定或确认

1. 对当前 `www` 与 apex 旧公开别名选择下节 A、B 或 C 之一，并明确授权该处置。
2. 是否批准精确候选 `dpl_H8AfxcvrPGjKLNMdCLv7hW393DX9` 作为公开学习平台候选；该批准范围是否仅限 current-JavaScript 产品层。
3. 是否确认对 Grade 4 Lesson 3、网站品牌、文本、图像、历史材料和课堂使用场景具有公开展示所需的权利或已获得相应权利人的许可。
4. 是否保持 Contact submission paused。未来启用 Contact 必须是独立授权，不应由本次候选批准自动推导。
5. 当前 Privacy 中“技术设计不出售个人信息”的陈述是否与真实组织运营一致。

### Legal reviewer 需要决定或确认

1. 负责发布的法律实体、适用 jurisdiction、正式联系地址以及可履行的 privacy/contact request channel。
2. 面向儿童或可能由儿童使用的服务条款、parent/guardian/school role、consent/notice、适用 rights handling，以及 FERPA/COPPA 或其他司法辖区表述。
3. EN/ES Privacy Notice 与 Terms of Use 是否在含义上等效、准确反映实际运行，并可作为最终公开文本。
4. Qwen、Vercel、Learning Locker 以及浏览器/语音识别提供商的数据处理、跨境处理、transient/security logs 与适用保留期是否被准确披露。
5. 180-day pseudonymous Actor cookie、HMAC-derived identifier、已投递 LRS 事件和当前不存在 access/correction/deletion channel 的处理方式是否需要修改。
6. 最终 visitor obligations、acceptable-use、免责声明、license、classroom use、rights clearance 与 historical content 条款。
7. `DRAFT / BORRADOR` 标签应当保留、移除还是替换，以及批准后应发布哪一个精确文本版本。

### 共同的发布一致性决定

若 owner/legal 要求修改政策文字或将 `DRAFT / BORRADOR` 转为最终文本，现有部署 ID 将不再代表最终发布字节；届时需要新 build、新 deployment ID、新候选收据与相应回归。下面的 10–20 分钟估算只适用于：不需要代码或文案改动，并且有权人员明确批准这个精确候选及其公开处置。

## 4. 现有公开域名的三个 containment 选项

以下是候选 v2 收据列出的三个操作方向。它们是发布选择，不按法律风险排序，也不是 Codex 的法律建议。

### A. 暂时保留旧公开部署

由 owner 明确授权 `www.helpmath.ai` 与 `helpmath.ai` 暂时继续指向 `dpl_6kho5qk5Xyr98jnwypKs7mHfgG42`，同时记录该部署仍公开展示 draft review notices。此选项不会发布新学习平台候选。

### B. 限制旧部署或替换为不收集数据的 holding surface

由 owner 授权将当前公开别名限制访问，或替换为不提交表单、不调用 Nova、不写入 LRS 的 holding page，等待政策、权利和发布文本完成。该 holding surface 是另一个部署状态，不能被说成学习平台已经发布。

### C. 在完成明确 owner 与 legal 批准后，提升精确候选

由 owner 选择以 `dpl_H8AfxcvrPGjKLNMdCLv7hW393DX9` 替换旧公开部署，并由 legal reviewer 对 EN/ES Privacy/Terms 形成明确批准记录。只有满足相应批准和文本一致性要求后，才执行自定义域名切换与发布后 smoke。

## 5. 可留存的批准语句模板

下列模板用于记录决定，不是批准本身。应由具备相应权限的人填写真实姓名、职务、日期和选择；不要由 Codex 代签或推断。

### 5.1 Owner 对旧公开别名的 containment direction

```text
我，[姓名]，以 [组织与职务] 身份，于 [日期和时区] 对
www.helpmath.ai 与 helpmath.ai 选择 containment Option [A / B / C]。

我明确授权的动作是：[保留旧部署 / 切换至指定 holding deployment /
在下列 owner 与 legal 批准均完成后提升精确候选]。

本决定针对当前公开部署 dpl_6kho5qk5Xyr98jnwypKs7mHfgG42；
不得扩展解释为未写明的 rights、strict migration、legal 或 publication approval。
```

### 5.2 Owner 对精确学习平台候选的批准

```text
我，[姓名]，以 HELP Math 项目 owner / 授权代表身份，于 [日期和时区]
批准受保护候选 dpl_H8AfxcvrPGjKLNMdCLv7hW393DX9
用于 [明确写明的公开发布范围]。

我已确认负责发布的实体为 [实体]，公开展示和拟议使用范围内的权利依据为
[权利或书面许可记录]，Contact 继续保持 submission-paused，除非另有独立书面授权。

我理解本批准不把 39 个 current-JavaScript 页面 + 1 个功能 shell
改写为严格迁移完成；账本仍为 0/40，published=false，除非相应独立证据门已完成。
```

### 5.3 Legal review 记录

```text
我，[姓名]，以 [法律顾问身份/组织] 身份，于 [日期和时区] 已审阅
候选 dpl_H8AfxcvrPGjKLNMdCLv7hW393DX9 所显示的 English/Español
Privacy Notice 与 Terms of Use（页面版本日期：2026-08-14）。

我的明确处置为：[批准当前精确文本用于公开发布 / 要求附件列明的修订后再审]。

已确认的 publishing entity、jurisdiction、contact address、child-user terms、
provider/data-retention disclosures、visitor obligations 与 license/rights terms 为：
[逐项填写或引用已批准、可留存的附件]。

关于 DRAFT / BORRADOR 标签的处置为：[保留 / 移除 / 以批准文本替换]。
本记录只覆盖明确列出的文本与部署，不扩展到未审阅的功能、数据流或材料。
```

## 6. Option C 批准后的 10–20 分钟发布 smoke checklist

**估算边界：** 下列 checklist 只适用于 Option C，并且 10–20 分钟只覆盖“已有精确候选、无需修改代码/文案、批准记录完整”的别名切换和发布后快速验证。Option A 或 B 应各自形成独立 containment verification，不运行本节的新学习平台发布 smoke。任何政策改写、新 holding page、新 build、新候选收据、DNS 故障修复或真实物理麦克风验收都不包含在此时间内。

### Alias、TLS 与部署身份

- [ ] 用 Vercel inspect 确认 `www.helpmath.ai` 和 `helpmath.ai` 都指向批准的部署 ID。
- [ ] 确认 HTTPS/TLS 正常，apex/`www` redirect 或 canonical 行为符合批准的域名决定。
- [ ] 确认旧部署 `dpl_6kho5qk5Xyr98jnwypKs7mHfgG42` 不再承载已切换的自定义别名。
- [ ] 保存切换时间、执行人、deployment ID、别名 readback 与 smoke 结果；不在收据中写入 secret。

### 公开路由与双语政策

- [ ] `/`、`/courses/4/3`、`/es/courses/4/3` 返回预期页面且不是 Vercel auth/challenge。
- [ ] `/privacy`、`/es/privacy`、`/terms`、`/es/terms` 返回与批准记录一致的精确版本；检查 `DRAFT / BORRADOR` 标签处置是否与 legal record 相同。
- [ ] `/contact` 与 `/es/contact` 仍为 submission-paused status pages，无 form、input、textarea、Turnstile 或发送动作。
- [ ] `/api/contact` 在未另行授权时仍于 body parsing/provider call 前返回 `503 CONTACT_DISABLED`。
- [ ] 生产 forensic/reference 路由保持不公开，例如既定的 `/reference/course-g04-l03-in-003` 仍返回 `404`。

### Grade 4 Lesson 3 与移动端

- [ ] EN/ES Grade 4 Lesson 3 可进入、前后导航、课程地图、Replay 与本地恢复可用。
- [ ] 390×844 快速检查 Ask Nova、Next 和课程内容可见，页面没有水平溢出。
- [ ] 对外状态仍准确写为 39 current-JavaScript pages + 1 functional shell；不出现 strict complete、Flash fidelity、rights cleared 或 published curriculum 的扩大声明。

### Nova Tutor / Qwen

- [ ] 从真实自定义域名发出一条 English 文字题和一条 Spanish 文字题，确认成功后 provider label 为 exact `qwen3.8-max`，没有 silent fallback。
- [ ] 验证 Quick Prompt、Words、Focus/Study/Classroom placement 与 Classroom text fallback。
- [ ] 用户主动附加当前课程画面后只用于下一次问题，发送完成后 attachment 清除；不使用 camera 或 file picker。
- [ ] assessment safeguard 的观察用例仍只提供提示，不在该用例中直接给出答案；不得把单一观察扩大为通用安全保证。
- [ ] 跨域 Nova POST 继续拒绝，同源和 rate-limit 配置仍有效。
- [ ] 语音按钮权限拒绝时保留文字输入。除非另行使用获准的真实设备和权限完成测试，否则继续记录：`physical microphone provider acceptance = not accepted / not claimed`。

### LRS、Actor 与 outbox

- [ ] 从真实自定义域名提交一个新的、可追踪的 `lesson.initialized` xAPI statement，并以相同 statement UUID 从 Learning Locker GET 回读。
- [ ] 核对 registration、verb、lesson activity 与 `HELP Math 2.0` platform；只在测试收据中记录必要元数据，不记录 Actor account value 或 LRS credential/endpoint。
- [ ] 确认 Actor 是 pseudonymous Agent，存在 opaque account name，但无 human display name、无 `mbox`。
- [ ] 检查 `hm_lrs_anon_v1` 的 `HttpOnly`、`SameSite=Strict`、production `Secure` 与 180-day Max-Age。
- [ ] 快速验证 offline outbox 能入队并在恢复在线时同步，队列上限和 7-day expiry 仍由既有测试覆盖；不要把短 smoke 写成真实等待七天的验收。
- [ ] 跨域 learning-event POST 继续拒绝；确认当前播放器没有 practice-result emission 的扩大声明。

### Contact、数据最小化与结案状态

- [ ] 复核 Contact 无收集/发送路径，Cloudflare Turnstile 与 Resend 没有被本次别名切换意外启用。
- [ ] 复核公开响应、浏览器控制台和新增收据不暴露 API key、LRS endpoint/credentials、HMAC secret、Actor value、Nova prompt/reply、课程画面或学生数据。
- [ ] 将最终状态记录为实际观察结果；若任一必需 smoke 失败，停止扩大发布声明并记录准确 failure/rollback/containment 状态。
- [ ] 即使全部 smoke 通过，也继续保留 `strict 0/40`、`published=false` 和 `physical mic not accepted`，除非各自独立验收门另有新证据。

## 7. 当前可作出的唯一事实结论

```text
PROTECTED TECHNICAL CANDIDATE: READY
PUBLIC CUSTOM DOMAIN: STILL ON OLD DEPLOYMENT
OWNER CONTAINMENT DIRECTION: NOT RECORDED
OWNER RELEASE APPROVAL: NOT RECORDED
LEGAL APPROVAL: NOT RECORDED
EN/ES PRIVACY AND TERMS: DRAFT / BORRADOR
STRICT MIGRATION: 0/40
PUBLICATION LEDGER: published=false
PHYSICAL MICROPHONE PROVIDER ACCEPTANCE: NOT ACCEPTED / NOT CLAIMED
```

在形成所需决定之前，本文件不授权 promote、alias change、policy finalization、Contact activation、rights use 或任何合规声明。

## Evidence basis

- Current English policy source: `apps/web/content/en/index.ts` (`privacy`, `terms`).
- Current Spanish policy source: `apps/web/content/es/index.ts` (`privacy`, `terms`).
- Candidate evidence: `reports/help-math-learning-platform-candidate-2026-08-14-v2.json`, SHA-256 `5da32836cff20c04fa8d3f37ff1162ccdccbe900189ebc6d96036351246ba91a`.
- Deployment state: live Vercel inspect of `www.helpmath.ai`, `helpmath.ai`, and candidate URL during preparation of this handoff; live HTTP checks of `/privacy`, `/terms`, `/es/privacy`, and `/es/terms` on the old public deployment.
