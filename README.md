# HELP Math G6–G8 v622 工程增量备份 · 2026-10-26

本分支在 [2026-10-24 备份提交](https://github.com/HUDongpin/help-math-2-0-workbench/tree/380156b57eb276dcc074c1226616f8ed779035e5) 上保存 G6–G8 的 v622 工程增量。旧分支 `codex/g3-g8-animation-backup-20261024` 保留；本分支不合并 `main`，不部署网站。

## 本次内容

- G6–G8 新增 **5,039** 个备份文件，更新 **21** 个已有文件，删除 **0** 个。
- G6–G8 快照合计 **47,547** 文件、**4,662,244,281** 字节（约 4.66 GB 逻辑体积）。文件数量和逻辑体积不代表新增页面或网络传输量。
- 内容包括转换模块、派生数据/媒体、共享 runtime/compiler、My Lesson 接入、v622 host/index、注册表、构建配置，以及选定的脚本和测试依赖。
- `snapshots/g3-g5/`、`snapshots/hfr-shell-variant/` 及它们的清单完全继承旧备份；本次没有修改这些内容。

逐文件 SHA-256 和大小见 `metadata/g6-g8-files.json`；增量成员见 `metadata/g6-g8-v622-delta.json`。整体索引是 `BACKUP.json`。

## v622 的来源

活动入口固定为 `catalog/g678-admission-v1/index-v622.json`，host 固定为 `host-v622.json`。本次从已冻结的 24,625 文件清单及本地 WIP 提交 `33015695ed210760dba835a645a040bd4ea1892c` 恢复准确字节，并按同一清单的 hashes 补齐必要共享文件。该来源提交仅用于标识本地恢复来源，开发仓库的提交历史没有导入此备份分支。

源工作区在备份时已有后续开发修改。本快照排除了这些修改、未激活的 v623 及无法证明属于 v622 的新候选，没有修改源工作区来配合备份。

## 已有证据的范围

| 项目 | 冻结状态 |
| --- | --- |
| 共用课程与登记成员 | 44 课、2,282 个页面位置 |
| 实现类型 | HFR TypeScript 1,658；Canvas 448；维护中的 DOM 176 |
| 方案 A 普通页累计通过 | 7 / 2,282 |
| 六配置完整样本 | 0 / 1 |
| 人工课审 | 0 / 44 |
| 请求门完整闭环 | 0 / 2,282 |

普通页为 NMS002 L7 的 P006/P007（v620 历史证据）以及 P010/P016/P017/P019/P021（v622）。这是既有证据的累计状态，本次备份没有重新执行课程验收。英/西路线检查使用已批准的英语可见正文回退及独立西语旁白，不能当作西语翻译验收。音频活动不能当作听音验收。44 课的正式年级映射仍待确认。

build08 `ua58kM2C5ZVqiZIwrLrEr` 有构建和完整类型检查通过记录。四个工具脚本在该 build 后、v622 冻结前又有修复，本快照保留其冻结版本；旧浏览器证据不自动覆盖这些新工具。六个 placement 的七处历史 artifact pin 差异原样保留，未为备份改写断言或验收。详细状态和外部证据引用见 `metadata/g6-g8-v622-state.json`。

## 下载与字节核验

```sh
git clone --single-branch --branch codex/g678-v622-incremental-backup-20261026 https://github.com/HUDongpin/help-math-2-0-workbench.git help-math-v622-backup
cd help-math-v622-backup
python3 verify-backup.py
```

验证器检查三份快照的文件大小与 SHA-256，并拒绝未列入清单的额外 payload。文件保存为普通 Git blob，没有 LFS 占位文件。恢复 G6–G8 时使用 `snapshots/g6-g8/`，先核验，再恢复到独立目录；不要覆盖正在开发的工作区。

## 排除内容与恢复限制

本分支不保存凭据、真实 `.env`、浏览器状态、学生/教师数据库、私有办公档案、原始 FLA/SWF/source-assets、`node_modules`、构建缓存、完整浏览器截图/录像或历史验收 proof。原始来源及部分历史依赖仍需从各自独立备份恢复。清单中的原始源/证据引用不表示它们的内容已包含。

这是工程文件备份，不是已验证的独立安装或部署包。没有在全新克隆中重跑完整应用构建或课程播放；[旧备份的恢复注意事项](https://github.com/HUDongpin/help-math-2-0-workbench/blob/380156b57eb276dcc074c1226616f8ed779035e5/README.md) 对继承的内容仍适用。构建生成类型需在恢复环境按项目流程重新生成。

根目录和 `apps/web/vercel.json` 均关闭 Git 自动部署，提交树没有 GitHub Actions workflows。备份不提升 Flash 保真、听音、人审、Owner 验收、strict completion 或课程发布状态。
