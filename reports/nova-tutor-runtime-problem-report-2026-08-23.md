# Nova Tutor 运行问题报告（线上 helpmath.ai + 本地 HELP MATH 2.0）

- 检查时间：2026-08-23 15:20 CST（UTC+08:00）
- 总体状态：`FAIL — PARTIAL_FUNCTION_ONLY`
- 线上验收面：`https://www.helpmath.ai`
- 本地验收面：`http://127.0.0.1:3211`，工作目录 `/Volumes/WestWorld/HELP MATH 2.0/apps/web`
- 本地代码来源：分支 `codex/help-math-learning-platform-nova-fq`，提交 `93fb79aa16e68d32edb43b864a1c8972d59b219f`
- 测试方式：真实浏览器 UI、真实同源 `/api/nova` 请求、浏览器控制台与网络记录、聚焦代码/测试审计
- 数据边界：仅使用无个人信息的合成数学问题和 HELP Math 页面截图；未登录、未使用真实学生数据、未读取或在本报告中记录密钥值、未修改线上配置或产品代码
- 证据隐私：Playwright trace 可能包含临时浏览器请求元数据、开发会话标识和压缩后的测试图片；它们保存在 Git 排除的 `output/` 下，只能作为本机私有证据，不得提交、上传或公开分享

## 1. 结论

Nova Tutor **不能被认定为整体正常运行**。

已确认的可用范围是：

- 线上 G4 L3（Negative Numbers）纯文字问答成功；
- 本地 G4 L3 纯文字问答成功；
- 两边都返回 `openai/gpt-5.6-luna`，页面显示 `Last reply verified`。

已确认的阻断故障是：

1. 线上和本地的 G5 L4（Number Lines）都显示可用的 Nova Tutor，但任何正常纯文字问题都会被 `/api/nova` 以 HTTP `422 VALIDATION_ERROR` 拒绝。
2. 线上和本地的 G4 L3 都显示并允许使用“Attach an image or take a photo”，浏览器也能完成图片预处理并显示“Image attached for the next question”，但发送时都被 `/api/nova` 以 HTTP `503 NOVA_NOT_CONFIGURED` 拒绝。
3. 当前通用课程壳会在多个课程上显示 Nova，但服务端请求 schema 和上游系统提示仍硬编码为 G4 L3 / Negative Numbers。这是确定性的前后端范围断裂，不是偶发 OpenRouter 故障。
4. `NOVA_TUTOR_ENABLED` 和 `NOVA_ALLOW_FRAME_CONTEXT` 只在 API 侧执行，前端入口没有使用同一能力判断；因此用户会看到实际上不能工作的按钮、麦克风和图片入口。

因此，当前准确产品描述应为：**G4 L3 的纯文字 Nova pilot 可运行；Nova Tutor 在所有可见课程和可见输入方式上的完整运行不成立。**

## 2. 实测矩阵

| 环境 | 真实页面 | 测试能力 | `/api/nova` 结果 | 页面结果 | 判定 |
|---|---|---|---|---|---|
| 线上 | `/en/courses/4/3` | 纯文字 | `200`, `ok:true`, model=`openai/gpt-5.6-luna`, requestId=`09e57555-db2f-455f-94bc-08555f83bd5f` | 正确显示数轴提示和 `Last reply verified` | PASS（限定 G4 L3 文字） |
| 本地 | `/en/courses/4/3` | 纯文字 | `200`, `ok:true`, model=`openai/gpt-5.6-luna`, requestId=`643732da-3b37-49f1-a6f6-35a428a0519c` | 正确显示数轴提示和 `Last reply verified` | PASS（限定 G4 L3 文字） |
| 线上 | `/en/courses/5/4` | 纯文字 | `422 VALIDATION_ERROR`, requestId=`8ee4d8f0-7f8c-428c-9ff3-01331095f75b` | `Nova could not respond`；误导性提示“Shorten it or remove the image” | FAIL |
| 本地 | `/en/courses/5/4` | 纯文字 | `422 VALIDATION_ERROR`, requestId=`5e01df65-837c-40cc-806f-eb6e08ffdcd7` | 与线上相同 | FAIL |
| 线上 | `/en/courses/4/3` | PNG 图片 + 文字 | `503 NOVA_NOT_CONFIGURED`, requestId=`ded32582-3d70-421b-9bc2-e7c92c5c4b60` | 图片仍显示为已附加，但 Nova 报未配置 | FAIL |
| 本地 | `/en/courses/4/3` | PNG 图片 + 文字 | `503 NOVA_NOT_CONFIGURED`, requestId=`a4449689-51bf-4129-9ac7-03d37e295f09` | 与线上相同 | FAIL |

线上裸域重定向不是故障：`https://helpmath.ai` 正常以 HTTP `308` 转到 `https://www.helpmath.ai`，课程路径和查询参数被保留。

## 3. 问题一：非 G4 L3 课程显示 Nova，但服务端只接受 G4 L3

### 严重度

`P1 / High`：公开学习流程阻断，且 UI 明确表示功能可用。

### 复现步骤

线上：

1. 打开 `https://www.helpmath.ai/en/courses/5/4`。
2. 确认 G5 L4 Number Lines 页面显示 `Ask Nova`。
3. 打开 Nova Tutor。
4. 输入正常、短小、无图片的问题：`Can you give me one hint about what a number line shows?`
5. 点击 Send。

本地：

1. 从当前 HELP MATH 2.0 checkout 在 `127.0.0.1:3211` 启动 `@helpmath/web`。
2. 打开 `http://127.0.0.1:3211/en/courses/5/4`。
3. 重复同样操作。

### 实际结果

- 线上和本地均发送了结构正确的 G5 L4 页面上下文；
- 线上返回 HTTP `422`：

```json
{"ok":false,"error":{"code":"VALIDATION_ERROR","message":"The Nova Tutor request contains invalid lesson data."},"requestId":"8ee4d8f0-7f8c-428c-9ff3-01331095f75b"}
```

- 本地返回相同错误，requestId 为 `5e01df65-837c-40cc-806f-eb6e08ffdcd7`；
- 页面把 schema 不支持的问题翻译成“Shorten it or remove the image”，但测试问题既不长也没有图片，用户无法据此恢复。

### 预期结果

只能二选一：

- 如果该课程受 Nova 支持，正常问题必须得到当前课程上下文正确的 Tutor 回复；
- 如果该课程尚未受支持，页面不得显示可点击、可输入、可发送的 Nova 入口。

### 根因证据

1. 当前课程注册表包含八门现代课程，包括 G5 L4：
   - `apps/web/lib/whole-lesson-course-registry.ts:204-240`
2. 通用课程 player 为 descriptor-driven 课程生成通用 `tutorContext`：
   - `apps/web/components/descriptor-driven-whole-lesson-player.tsx:783-799`
3. 共享壳只检查 `modern-wide` 和 `tutorContext`，就显示 `Ask Nova`：
   - `apps/web/components/legacy-responsive-lesson-shell.tsx:882-894`
   - `apps/web/components/legacy-responsive-lesson-shell.tsx:3123-3137`
4. `/api/nova` 的 schema 却硬编码为：
   - `releaseId = lesson-g04-l03-negative-numbers`
   - `grade = 4`
   - `lesson = 3`
   - `activePageCount = 39`
   - G4 L3 固定 section/page 导航
   - 证据：`apps/web/lib/nova-request-schema.ts:36-53, 143-169`
5. 上游系统提示同样固定写成 Grade 4 和 Negative Numbers：
   - `apps/web/lib/nova-openrouter.server.ts:113-157`

当前注册的八门课程中，只有 G4 L3 能通过现有 Nova schema；其余七门都会在调用 OpenRouter 之前被拒绝。生产环境本次已直接确认 G5 L4 也暴露并发生该故障。

### 为什么现有测试没有发现

- 浏览器 E2E 通过 `page.route('**/api/nova', ...)` mock 成功响应，没有走真实 route schema：
  - `apps/web/e2e/prototype-acceptance.spec.ts:97-126`
- G5 L4 的现有测试只检查 Nova 按钮可见，没有发送真实问题：
  - `apps/web/e2e/prototype-acceptance.spec.ts:1146-1168`
- 本次聚焦单元测试 `47/47 PASS`，但这些测试验证的是已知 G4 L3 契约和 provider stub，不能覆盖“通用 UI + 课程专用 API”断裂。

## 4. 问题二：图片入口公开可用，但线上和本地都拒绝图片请求

### 严重度

`P1 / High`：用户可见功能确定失败；同时涉及 K–12 图片数据和隐私说明一致性。

### 复现步骤

1. 打开线上或本地 G4 L3。
2. 打开 Nova Tutor。
3. 点击 `Attach an image or take a photo`，选择一张无个人信息的 PNG。
4. 等待 UI 显示 `Image attached for the next question`。
5. 输入 `What math idea should I notice in this image?` 并发送。

### 实际结果

- 浏览器成功读取、缩放和压缩图片；
- UI 明确显示图片已附加；
- 线上和本地 `/api/nova` 都返回 HTTP `503 NOVA_NOT_CONFIGURED`；
- UI 保留已附加状态，并提示 Nova 未配置，用户无法从界面判断是图片能力被关闭，而不是整个 Tutor 未配置。

### 预期结果

只能二选一：

- 图片能力关闭时，不显示/禁用图片和相机入口，并提供真实的能力说明；
- 图片能力开启时，在明确用户动作、大小/格式限制和治理条件通过后，图片请求应获得正常响应。

### 根因证据

- API 对任何包含 `frame` 的请求要求独立的 `NOVA_ALLOW_FRAME_CONTEXT=true`；否则直接返回 503：
  - `apps/web/app/api/nova/route.ts:175-183`
- 当前本地配置的非秘密状态是 `NOVA_ALLOW_FRAME_CONTEXT=false`；生产环境未读取私有变量，但线上实测 503 与同一 gate 的响应完全一致。
- 前端仍无条件渲染图片按钮和文件输入：
  - `apps/web/components/lesson-nova-tutor.tsx:747-770`
- UI 还写明设备可能提供相机：
  - `apps/web/components/lesson-nova-tutor.tsx:750-758`
- 实际 `setAttachedFrame(prepared)` 只来自用户选择的本地 PNG/JPEG：
  - `apps/web/components/lesson-nova-tutor.tsx:482-530`
- 当前课程 frame 只是预览，并不会自动成为附件：
  - `apps/web/components/lesson-nova-tutor.tsx:630-650`

此外，英文/西班牙文 Privacy/Terms 当前声称附件只来自已显示的课程 frame，并称设备相机被禁用；这与实际本地文件/相机入口不一致：

- `apps/web/content/en/index.ts:1103-1108, 1211-1216`
- `apps/web/content/es/index.ts:1103-1108`

## 5. 问题三：Nova 总开关没有同步门控前端 UI

### 严重度

`P1 / High`：配置关闭或损坏时形成“看起来可用、提交后失败”的产品状态。

### 代码级事实

- `NOVA_TUTOR_ENABLED` 只有精确值 `true` 才允许 API：
  - `apps/web/lib/nova-route-support.server.ts:3-7`
- 关闭时 `/api/nova` 返回 503：
  - `apps/web/app/api/nova/route.ts:93-103`
- 但前端 `tutorAvailable` 和 `Ask Nova` 入口不检查该 flag：
  - `apps/web/components/legacy-responsive-lesson-shell.tsx:882-894`
  - `apps/web/components/legacy-responsive-lesson-shell.tsx:3123-3137`
- 默认 `.env.example` 仍把 Nova 设为关闭：
  - `apps/web/.env.example:23-32`

本次没有为了制造故障而修改线上或本地开关；该项是由当前执行路径直接得出的确定性代码问题。相同断裂已经在图片 gate 和非 G4 L3 schema 上以真实浏览器复现。

## 6. 非阻断观察项

### 6.1 线上 Canvas 性能 warning

线上成功和失败流程均出现一个 warning：Canvas 多次 `getImageData` 时建议使用 `willReadFrequently: true`。线上没有 page error 或失败的静态资源；该 warning 未阻断 Nova，不是本次主故障。

### 6.2 本地开发环境控制台噪声

本地 Next dev 页面出现：

- Clerk `__experimental_CheckoutProvider` 列表 key warning；
- Clerk development-key warning；
- Clerk telemetry 请求被当前 CSP 阻止；
- Canvas `willReadFrequently` warning。

这些本地问题未阻断 G4 L3 文字 Tutor，但会污染浏览器验收信号。生产页面没有对应 Clerk 错误。

### 6.3 语音未获得运行 PASS

本次没有录制或提交真实语音，因此不能把麦克风功能写成 PASS。代码显示浏览器一旦产生 final transcript，会立即调用 `onFinal` 发送，而不是先让学习者确认：

- `apps/web/components/lesson-nova-tutor.tsx:337-343`

这是一项独立的 K–12 同意/安全缺口，不影响本次文字键盘路径的判定。

## 7. 建议修复顺序

### 第一阶段：立即止损

1. 由服务端生成一个明确的 Nova capability 对象，并传给课程壳，至少包含：
   - Tutor 是否启用；
   - 当前 release/course 是否受支持；
   - 文字、图片、麦克风是否分别可用。
2. 当前 schema 仍只支持 G4 L3 时，只在 G4 L3 显示文字 Nova；在 G5 L4 及其他未支持课程隐藏 Nova 入口。
3. `NOVA_ALLOW_FRAME_CONTEXT !== true` 时，隐藏或明确禁用图片/相机入口，不能等发送后再用“Nova 未配置”失败。
4. `NOVA_TUTOR_ENABLED !== true` 或 server config 不合法时，隐藏所有 Nova 入口；不要只保护 API。
5. 把 `422 VALIDATION_ERROR` 的 UI 文案从“缩短问题或移除图片”改成能够区分课程不受支持、字段不合法和请求过大的真实文案。

### 第二阶段：扩展为真正的多课程 Nova

1. 不要直接信任客户端课程元数据；由服务端根据 `releaseId + animationId` 查询受信任的课程 registry/descriptor，再验证 grade、lesson、ordinal、section 和 assessment 状态。
2. 把 G4 L3 literal schema 改成基于已发布/明确允许的课程集合，同时保持 fail-closed。
3. 把 `Grade 4 / Negative Numbers` 硬编码系统提示改为来自受信任课程 descriptor 的动态上下文。
4. 为每个公开显示 Nova 的课程增加至少一条不 mock `/api/nova` 的部署前 smoke：浏览器 → route schema → provider → exact model → UI。
5. 测试必须同时覆盖：
   - EN/ES；
   - 普通学习页和 assessment 页；
   - 多轮 history；
   - 每个受支持 course 的第一页和一个后续 section；
   - `NOVA_TUTOR_ENABLED=false` 时 UI 完全不可见；
   - frame gate 开/关两种状态；
   - 不受支持课程不显示入口。
6. 在启用图片/相机或语音前，统一真实实现、Privacy/Terms、同意、保留/删除、教师控制和安全验收边界。

## 8. 修复验收条件

只有同时满足以下条件，才能把 Nova Tutor 报告为“正常运行”：

1. 所有公开显示 `Ask Nova` 的课程，使用该页面真实上下文提交普通文字问题都返回 HTTP 200、`ok:true` 和 exact model `openai/gpt-5.6-luna`。
2. 没有公开课程出现当前 `422 VALIDATION_ERROR`；不受支持课程不显示 Nova。
3. 图片 gate 关闭时，图片/相机入口不可见或明确禁用；开启时，显式附图请求成功且不发生静默上传。
4. Nova 总开关关闭或 provider 配置不合法时，所有学生可见 Nova 控件同步关闭。
5. UI 错误文案能准确区分课程不支持、图片能力关闭、超时、限流、上游不可用和请求格式错误。
6. 线上至少完成一次 G4 L3 以外受支持课程的真实端到端 smoke，并保存无秘密的状态、模型、请求 ID、截图和 trace。
7. 独立报告 K–12 安全、隐私/法律、语音确认、分布式防滥用和教师审核；运行成功不能替代这些发布门。

## 9. 证据索引与 SHA-256

### 线上截图

| 证据 | 路径 | SHA-256 |
|---|---|---|
| G4 L3 文字成功 | `output/playwright/nova-tutor-production-2026-08-23/.playwright-cli/page-2026-08-23T07-12-23-769Z.png` | `20280eb690b1586acee83de18e944207947fc5a7760d9559daa7498da903dca8` |
| G5 L4 文字 422 | `output/playwright/nova-tutor-production-2026-08-23/.playwright-cli/page-2026-08-23T07-15-05-563Z.png` | `645e90ca68fd67220895b9eca4e9771f7dcadd9b26ec7c80fd683ba47589d5bb` |
| G4 L3 图片 503 | `output/playwright/nova-tutor-production-2026-08-23/.playwright-cli/page-2026-08-23T07-19-44-652Z.png` | `8f7f7ca981213affde713574bcc7bbbc7eb4668f68841659566fc6204a7b6aab` |

### 线上 traces

| 证据 | 路径 | SHA-256 |
|---|---|---|
| G4 L3 文字成功 | `output/playwright/nova-tutor-production-2026-08-23/.playwright-cli/traces/trace-1787469088842.trace` | `36d99f04a13038b3b09bcc58d7edd3c45cef155cbbb0234d0806489ec3ff00fd` |
| G5 L4 文字 422 | `output/playwright/nova-tutor-production-2026-08-23/.playwright-cli/traces/trace-1787469256436.trace` | `929f3e845570f8236dd6ccbfd73d613fc0446cd000932b60457370808a76e2ee` |
| G4 L3 图片 503 | `output/playwright/nova-tutor-production-2026-08-23/.playwright-cli/traces/trace-1787469567782.trace` | `619663862e988720f88a30943ef14cbd72630ead77e97f42aec343791e516fa9` |

### 本地截图

| 证据 | 路径 | SHA-256 |
|---|---|---|
| G4 L3 文字成功 | `output/playwright/nova-tutor-local-2026-08-23/.playwright-cli/page-2026-08-23T07-10-30-990Z.png` | `63f131571f68e0d2fcefeb2a33023fe7cf63057ba4fa6e2991e9555091c305fe` |
| G5 L4 文字 422 | `output/playwright/nova-tutor-local-2026-08-23/.playwright-cli/page-2026-08-23T07-16-36-294Z.png` | `a35beec7f8a9a9eadc7706d8cbafecc8f5e9c2fc81e79d33d25ccb93bd2315b8` |
| G4 L3 图片 503 | `output/playwright/nova-tutor-local-2026-08-23/.playwright-cli/page-2026-08-23T07-18-35-950Z.png` | `9c610baf1fc31a1e846fb5dca9579af5e4533093b5ffeffdc793471218474d07` |

### 本地 traces

| 证据 | 路径 | SHA-256 |
|---|---|---|
| G4 L3 文字成功 | `output/playwright/nova-tutor-local-2026-08-23/.playwright-cli/traces/trace-1787468973021.trace` | `bcd140ecb4259e4eca243dfe0f803e744ffcf25809bf9f5bb6dcabe3a2e5cae5` |
| G5 L4 文字 422 | `output/playwright/nova-tutor-local-2026-08-23/.playwright-cli/traces/trace-1787469353339.trace` | `dd026682182c5b4edf04f3bae98985da4599c2cc1fef78061e886736e6c15c28` |
| G4 L3 图片 503 | `output/playwright/nova-tutor-local-2026-08-23/.playwright-cli/traces/trace-1787469498726.trace` | `4939d6dc48177d301598ba8119acd4a958944fd2e0e86a9cd6244428b3c39c55` |

## 10. 状态边界

- 本报告证明的是 2026-08-23 的真实运行行为和当前代码根因。
- G4 L3 文字成功不等于所有课程、图片、语音、多轮、K–12 安全、法律/隐私、Owner acceptance 或发布准备全部通过。
- 当前本地 checkout 原本就有大量与本任务无关的未提交改动和候选资产；本次没有重置、清理、暂存、提交或改写它们。
- 本任务只新增浏览器证据和本问题报告，没有实施修复。
