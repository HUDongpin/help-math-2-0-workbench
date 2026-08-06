# HELP Math 全库迁移实施状态（2026-07-21）

## 结论

本轮已完成全库来源冻结、目录与分类工厂、批量迁移脚手架、严格验收门禁、
16 项试点机审，以及 Next.js 产品目录/课程/播放器/内部状态/本地审计路由。
这建立了可以继续批量施工的迁移工厂，但不等于 1,873 个 canonical 动画已经
忠实迁移。

当前严格完成数为 **0**。公开目录由 `catalog/completion-ledger.json` fail-closed
控制，不会把两个可运行原型或仅完成机审的试点发布为完成项。

## 来源冻结与目录

- Canonical 档案：`source-assets/flash/HELP MATH_ORIGINAL FILES/`
- 原路径：只保留兼容符号链接
- 文件：7,919
- 字节：2,779,928,841
- 来源 manifest SHA-256：
  `a9625fb4a99e026fea09e4a1929edc2fa9d47ccf6cdbca7de4ba9ca75adf211e`
- SWF placements：1,894
- canonical SWF：1,873
- 重复 placements：21
- 原始根时间轴帧：32,149，全部 12 FPS
- paired FLA：1,181；SWF-only：713；FLA-only：217
- 课程缺失引用：591；术语缺失引用：317
- 批次：77，每批不超过 25 个 canonical 动画

全部 1,398 个 FLA 均识别为旧式 OLE compound binary。目录生成器不会写入
原始档案，并通过已确认总数和 12 FPS 不变量门禁。

## 已落地能力

- 递归 intake、SHA-256、FWS/CWS 头解析、FLA/SWF 配对、去重、异常/缺失引用、
  音频关联、课程与批次目录。
- 容错解析 29 份课程 XML 与 2 份术语 XML；原 XML 保持不变。
- schema v2 migration 包、单动画和批次脚手架、catalog 同步、机审同步。
- strict validator：来源身份、原生 PNG、场景×语言×种子逐帧覆盖、RMSE、
  音频、真实代码/路由/测试、浏览器错误/网络副作用、人工与 owner review。
- completion ledger：只有真实 strict pass 才能进入公开 registry。
- manifest/ledger 生成的异步动态 import registry，无需手写 1,873 个页面。
- 统一现代 runtime：一索引帧、Replay、reduced motion、语言、scenario、seed、
  audio cues 与 `data-flash-frame`。
- Next.js 路由：`/library`、`/courses/[grade]/[lesson]`、
  `/animations/[animationId]`、开发环境 `/migration-status` 与
  `/reference/[animationId]`。
- Ruffle 仅在本地审计环境工作；生产 reference/API/WASM 权限全部关闭。

## 16 项试点

批准的 16 个试点均已建立独立 migration workspace，状态均为 `preserved`。
FFDec、swfmill 与 streaming XML 机审 16/16 成功，来源哈希前后相同；
15 项识别为 AS1/2，`acute_angle` 未检测到 ActionScript。外部 API 仅记录候选，
从未执行。

其中 8 项有 paired FLA，但本机无 Adobe Animate，不能完成权威 authoring
timeline/library/font/script 检查；另 8 项没有 FLA。所有试点均缺少完整权威运行
遍历、双语音频时序、全场景逐帧基线、RMSE 与人工/owner 签署，因此不得升级为
`complete`，也不得实际展开 `batch-001`。

## 最终验证

- `npm ci`：通过；0 个 npm audit vulnerabilities
- `npm run doctor`：0 failures，1 warning（Adobe Animate 未安装）
- `npm run verify:archive`：通过；7,919 文件/2,779,928,841 字节保持一致
- 16 个 migration：draft validator 全部通过
- completion ledger：current；strict complete 0，未准入 16
- workbench 单测：44/44
- shared demos/runtime 单测：14/14；typecheck 与 registry stale check 通过
- web 单测：19/19；lint 与 typecheck 通过
- Next.js 产品构建：通过
- 旧工作台构建：通过
- production Playwright：20/20，包括移动端、英西文、无障碍与生产隔离
- 开发审计浏览器：状态页显示 1,894/1,873/21/0/908；无 console error
- 原生捕获：两个 legacy prototype 各 3 帧，均报告正确一索引帧，
  780×379、deviceScaleFactor 1，且无 console/HTTP/外部网络错误

两个 legacy prototype 的捕获只能证明现代捕获合同可运行，不能代替原 SWF
逐帧 RMSE 或严格迁移验收。

## 下一道施工门

下一步必须先把全部 16 项试点完成到 strict：权威 baseline、所有可达场景、
英西语言与音频同步、完整逐帧 diff/RMSE、Replay/键盘/移动端、人工审核和 owner
签署。16 项全部通过后，才执行：

```bash
npm run scaffold:batch -- --batch batch-001
```

在此之前只能使用 `--dry-run` 预览批次，不能宣称“当前所提供 SWF 已全部迁移”。
