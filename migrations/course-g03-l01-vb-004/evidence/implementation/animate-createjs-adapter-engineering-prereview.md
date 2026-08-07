# course-g03-l01-vb-004 Animate/CreateJS 工程预审

结论：这个候选通过了本地安全和确定帧冒烟，但**不构成忠实迁移验收**，也没有接入产品 registry；migration 状态仍为 `preserved`。

已证明的范围：

- Adobe Animate 工作副本导出被净化并固定为本地 EaselJS/TweenJS 1.0.2；无 CDN、无 Stage、无自动 Ticker、无 body 改写。
- `?frame=` 使用 `sprite-231` 的一索引帧；默认场景只允许 1–56，57–222 只能用 `authoring-frame-inspection` 查看，并明确标注运行可达性未证明。
- `lang=es`、默认场景的 57 帧、音频和互动均 fail closed。
- 浏览器检查帧 1、6、55、56、57、222 时，根和子时间轴均暂停，Ticker 未初始化，无活动 Tween、控制台错误、警告或跨域请求。
- 初始 place-value chart 使用 shipped SWF 的 Bauhaus Md BT 矢量字形替换 Animate 的错误字体。对 standalone root-frame-6 的非验收性 sanity check，RMSE 从 `0.0645797503` 降为 `0.0325943666`。
- 56 帧至少间隔 1 秒的两次捕获像素完全一致，RMSE 为 0；390×844 视口无水平溢出。
- 生成器 check、适配器测试 9/9、全量 Node 测试 125/125、7,919 个来源文件校验均通过。

仍阻塞 strict acceptance：权威 local timeline baseline、全部 AS1/2 分支/计分/Replay、11 条内嵌音流和西语 MP3 的听审与 cue、Host 语言选择、后续文本/反馈字形、全帧 RMSE、无障碍、人工审核和 owner 签署。

共享仓库门禁仍有两项与本候选无关的失败：completion ledger 在并发 pilot 证据变更后已陈旧；Next.js 构建无法下载现有 Fredoka/Nunito Sans Google 字体并因此在 Turbopack font module 处失败。候选未接入产品，所以不能据此声明 build gate 通过。

机器可读细节见同目录的 `animate-createjs-adapter-engineering-prereview.json`。
