# HELP Math 已转化动画备份 · 2026-10-24

此分支保存 G3–G5 和整个 G6–G8 共用动画库的转换成果、维护源码及所选运行依赖。每个快照目录保留原项目相对路径；逐文件字节数和 SHA-256 记录在 `metadata/*-files.json`。

原开发工作树包含未提交内容，因此这里保存的是采集时的实际文件。元数据中的 `sourceHead` 用于识别来源基线，不能代替本次逐文件清单。此分支以独立的初始提交开始，不携带其他开发分支的历史。

| 快照 | 内容及范围 |
| --- | --- |
| `snapshots/g3-g5/` | 29 个课程；当前 descriptor/registry 中 1,751 个 active page placements（G3 546、G4 645、G5 560，1,750 个唯一 animationId）。保留现代排版实现、共享组件、生成 renderer、图像、字体、MP3/PCM 及 My Lesson 相关源码。 |
| `snapshots/g6-g8/` | 44 个共用课程；当前 registry/catalog 交集 2,282 个 placements，其中 HFR 1,658、Canvas 448、维护中的 DOM 实现 176。包括生成 TypeScript、data、派生媒体、维护中的编译器/runtime 和当前产品 host 依赖。44 个课程的独立年级映射仍待确认，因此不把该总数称为 G6 页数。 |
| `snapshots/hfr-shell-variant/` | 单独保留的历史 HFR shell 集成变体，包含 52 个 NMS L7 模块及其实际 data/媒体。它与当前 G6–G8 实现存在重叠，不加入页面总数，也不覆盖当前版本。 |

页面登记、My Lesson 集成、真实播放、技术闭合、原始 Flash 保真、听音、人审、Owner 验收和发布是不同状态。上述数量描述备份来源中的成员关系；此次文件备份没有重新执行或提升这些验收状态。历史失败、旧元数据和待确认事项没有被改写为通过。

## 下载与完整性核对

```sh
git clone --single-branch --branch codex/g3-g8-animation-backup-20261024 https://github.com/HUDongpin/help-math-2-0-workbench.git help-math-animation-backup
cd help-math-animation-backup
python3 verify-backup.py
```

验证器检查每个已捕获文件的大小和 SHA-256，并拒绝未列入清单的额外 payload 文件。文件以普通 Git blob 保存，没有仅包含地址的 LFS 占位文件。重复路径保留各自位置，Git 复用相同内容的 blob。目录展开后的逻辑体积大于实际上传数据量。

## 恢复方式和边界

先通过完整性核对，再把所需 `snapshots/<版本>/` 内容恢复到新的独立目录或与来源相容的恢复工作树。三个版本分别保存，不应互相覆盖。需要原应用完整环境时，以各版本元数据中的来源基线和当前项目流程补齐环境与独立保存的源档案；不要把这个动画成果快照当作已验证的完整站点部署包。

没有备份 `.env` 或凭据、浏览器状态、学生/教师数据库、私有办公档案、原始 FLA/SWF 档案、`node_modules`、构建缓存、完整浏览器截图/录像和历史验收证据。原始来源及这些证据仍需依赖各自的独立备份。本快照中的历史 manifest 可能继续引用未收入公开备份的原始资产或 proof。

已知恢复注意事项：

- G3 L1 TS008 的旧 controlled-preview supplement 仍记载旧 hash；本快照保留后续实际文件，SHA-256 为 `863191baf3afc666cdd0ad5db837fe79fdc8892e502137ed75bde9e95f15f090`，没有回退文件或重写历史 manifest。
- 某些旧 G4 L12 calibration、typography 诊断和保留测试引用本地外盘资源或历史 evidence；这些引用不是新增验收，也不保证在独立克隆中可重跑。
- Next.js 构建类型由本地 `next dev` / `next build` 生成；没有复制 `.next*` 缓存。原 `next-env.d.ts` 的历史生成类型引用需随恢复环境重新生成。
- 原应用构建和 admission 流程可能要求另行保存的部署压缩包、原始资产或历史 proof。不要在恢复目录里盲目运行旧 materializer 并覆盖已核对的文件；此次验证仅覆盖备份字节完整性，没有声明 fresh clone 的完整构建或端到端播放已通过。

本分支未包含 GitHub Actions workflows；根目录和项目默认 `apps/web` 路径的 Vercel 配置关闭 Git 自动部署。此备份不改变课程公开发布、生产网站或验收门槛。
