# HELP Math Flash compiler pilot v1

## 直接结论

正式五页 pilot 的主 backend 应选 **FFDec Canvas + P-code**。它是三个候选中唯一在 5/5 页上直接生成并通过 headless Chromium 执行的 Canvas 绘图代码；Next2D 应保留为第二结构解析器，OpenFL 应保留为可确定化的第二视觉/时间轴 IR。三者都没有自动完成 AVM1 行为或流式音频，所以生产路线应是 FFDec 主生成，加共享 AVM1 lowering、嵌套帧域音频层和现代 My Lesson host adapter。

本 pilot 严格包含 5 个 active lesson pages，0 个 legacy course shell。HELP Math 2.0 现有课程 UI 保留不变；1,751 是 active page occurrence 分母，不把旧 shell 加入转换范围。

## Backend 实测

| Backend | 定位 | 解析 | 可执行视觉产物 | 结构无阻断 | 行为 | 流式音频 |
| --- | --- | --- | --- | --- | --- | --- |
| FFDec Canvas + P-code | recommended-primary-visual-code-generator-and-avm1-front-end | 5/5 | 5/5 | 5/5 | 0/5 | 0/5 |
| Next2D legacy SWF worker | recommended-secondary-structure-parser-only | 5/5 | 0/5 | 5/5 | 0/5 | 0/5 |
| OpenFL SWF Animate IR | recommended-secondary-normalized-visual-timeline-ir | 5/5 | 0/5 | 3/5 | 0/5 | 0/5 |

- FFDec：5/5 生成 Canvas drawing/timeline HTML，并完成 root 与最长 nested timeline 的确定帧 headless capture；但脚本只导出为 source/P-code，未执行。
- Next2D：5/5 产生稳定 event IR，但没有可用的完整 consumer；AVM1、按钮动作、背景与 996 个 stream blocks 未进入 IR。
- OpenFL：5/5 产生可确定化 Animate IR；3/5 结构无 dangling reference，另 2/5 因 Morph Shape 缺失而 fail closed；5/5 AVM1 与音频缺失。

## AVM1 还剩多少需要 Codex

这个五页静态分母共有 **50 个脚本位置**。互斥分类为：

- 4 个空脚本；
- 26 个纯 `stop();`；
- 5 个同构 legacy preloader 调用，可由一个共享 policy 处理，而且不重建旧 shell；
- 9 个同构 button binding，可由一个现代 My Lesson host adapter 加 9 个文字 payload 处理；
- 4 个组件副本，实际只有两个 unique hash-bound 文件：`FScrollBarSymbol` 与 `FUIComponentSymbol`，实现一次即可复用；
- **2 个真正 page-specific dynamic locations**，都是 G5 L4 同一对 random/eval 音频选择逻辑。

因此，就这五页而言，Codex 不再需要逐页手写 50 段 AVM1：需要完成的实现单元约为 **1 个 preloader policy + 1 个 button host adapter + 1 个共享 Flash-v2 component adapter package（含两个冻结组件）+ 1 个 G5 L4 seeded-RNG/explicit-clip-map adapter**。真正 page-specific AVM1 是 **2/50 locations**。这个比例只适用于 pilot，不能直接外推到全部 1,751 页；下一步应先对全部 active SWF 做同一静态分类扫描，得到真正课程级分母。

P-code 总量为 5,779 occurrences，其中 5,512（95.38%）来自两份共享组件在两页中的重复嵌入。ActionScript source 共 49,558 bytes，去重后只有 25,267 bytes / 16 种内容。

## 音频是独立长尾

四页含嵌套时间轴流式音频：共 5 个 SoundStreamHead、996 个 SoundStreamBlock。它们属于 193、203、135/135 和 339 帧的 nested domains，不能用每页共同的 root 10 frames 当音频时钟。三候选 backend 都没有交付完整的 nested-frame audio playback，因此音频层仍需专门实现和验收。

## 推荐 factory

1. Catalog gate：只允许 `referenced=true`、`shell=false` 的 active lesson page，并核 SWF/FLA/外部音频 SHA-256。
2. FFDec：生成 Canvas visual code、ActionScript source 与 P-code；未知脚本和未知共享组件 hash fail closed。
3. Next2D + OpenFL：独立交叉核 root/nested frame domains、placements、symbols；OpenFL dangling Morph references 阻断。
4. AVM1 lowering：只编译冻结的六类位置合同，不执行任意反编译 ActionScript；任意其他 `eval` 拒绝。
5. Host bridge：把九个词汇按钮变成 HELP Math 2.0 My Lesson 的结构化事件，不重建 legacy course shell。
6. Audio：提取并绑定 nested stream frame clock；外部 MP3 仍按 catalog identity 处理。
7. QA：全帧视觉 diff、交互 trace、音频、EN/ES、人类和 Owner gates逐层验收。

## 证据边界

本报告证明的是 compiler/parser 的机器输出和 fail-closed 缺口，不证明 Flash fidelity、原始运行时、音频同步、人类视觉、Owner 接受、strict completion、发布或上线。所有 acceptance effects 仍为 false；本 pilot 没有注册新的 current-JavaScript 页面，也没有修改现代课程 UI 或 `source-assets`。
