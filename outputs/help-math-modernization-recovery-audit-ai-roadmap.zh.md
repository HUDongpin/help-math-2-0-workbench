# HELP Math 1.5/2.0 现代化：恢复审计与 AI 路线图

供 Dr. Peter Hu 使用的草案 v0.2 中文版

## 已审阅的来源文件

本版本根据三份 HELP Math 附件更新路线图：

- `About HELP Math.pdf`
- `BoulderLearning.PhaseI.HMwithHTML5.pdf`
- `HELP Math 2.0 Scope.pdf`

这些来源文件表明，HELP Math 并不只是一个基于 Flash 的课程资源库。它是一个以研究为基础、面向英语学习者和其他数学学习困难学生的多媒体数学干预系统，内嵌 sheltered instruction、双语支持、诊断性分班/安置、教师控制、学习对象库，并且历史上已经规划过通过 HTML5、K-2 扩展、语音识别、阅读练习和虚拟导师技术进行现代化升级。

## 1. 执行摘要

HELP Math 1.5/2.0 的现代化应被定义为一个“产品恢复 + 学习平台现代化”项目，而不是一个简单的 Flash 转换项目。旧产品的核心价值在于其教学设计：Sheltered English Instruction、音频/视觉/文本/交互的同步、学术词汇支持、西班牙语翻译与音频、虚拟操作材料、诊断性安置、教师控制的学习路径，以及庞大的学习对象库。

附件材料确立了几个会影响现代化方案的重要事实：

- HELP Math 面向英语学习者、数学学习困难学生、有学习障碍的学生，以及 RtI 框架下需要补救教学的学生。
- 产品同时发展数学概念、学术语言和词汇能力。
- HELP Math 1.5 应被视为 HELP Math 2.0 动画和交互重设计的 storyboard 来源。
- 早期重建计划已经明确提出 HTML5 转换、K-2 扩展、阅读练习、语音识别、虚拟导师技术、标准对齐更新、教师/管理员功能改进，以及更多语言支持。
- 早期 Phase I 计划提出了 8 个月的 HTML5 更新和可用性测试流程；更广义的 2.0 范围则估计需要 6 个月产品审查/设计、1 年开发周期，以及 6 个月 QA/测试周期。

因此，本路线图建议采用分阶段推进：

1. 恢复审计冲刺：确认资产、范围、教学法和技术复杂度。
2. HTML5/Next.js MVP：重建一组有代表性的课程与平台外壳。
3. 数据和教师端基础：恢复进度监控、报告、诊断和功能控制。
4. AI v1：加入受约束的 AI 提示和教师洞察摘要。
5. Phase 2/3：扩展到语音识别、阅读练习、数学话语、适应性排序、虚拟导师对话和更多语言。

当前目标不是承诺在 90 天内完整重建 HELP Math 2.0。90 天计划应产出一个可试点的现代化包，以及一个可辩护的完整产品路线图。

## 2. 产品身份与教学核心

### 2.1 HELP Math 的原始价值主张

HELP Math 代表 Help with English Language Proficiency。它的核心目标是帮助学生发展数学能力，同时发展技术性/学术性英语和必要的先备数学知识。附件中的项目介绍将 HELP Math 定位为面向英语学习者和其他学习困难学生的网络数学干预系统，最初适用于 3-8 年级，也用于高中补救教学，以及代数和几何基础课程。

路线图应保留以下核心身份：

- 面向英语学习者和学习困难学生的数学干预系统。
- 将 Sheltered English Instruction 嵌入数字数学课程。
- 双语和多模态支持，尤其是英语/西班牙语。
- 将学术词汇和数学语言发展作为一等学习目标。
- 干净、聚焦、少干扰的屏幕设计。
- 自定步调、基于活动的课程结构。
- 教师控制的差异化教学和自定义课程路径。
- 诊断性评估和自动内容推荐。

### 2.2 需要保留的课程结构

来源文件描述了一致的课程流程：

1. Real-World Scenario and Game
2. Vocabulary
3. Instruction
4. Try-It
5. Problem-Solving Skills
6. Final Quiz

除非审计发现某一具体课程需要不同结构，否则现代化版本应将这个流程作为默认课程模型。这个结构应进入新的 lesson schema、内容编辑器、学生端运行时、教师报告和 AI 支持模型。

### 2.3 需要保留的教学支架

HELP Math 的差异化优势包括：

- Key Terms Dictionary，包含英语、西班牙语和图像示例。
- 上下文词汇超链接。
- 通过类似 “En Esta Pagina” 的页面级支持提供西班牙语翻译。
- 西班牙语音频和完整双语翻译。
- Calculator 工具，并支持教师控制。
- 虚拟操作材料，例如数轴、十进制积木、量角器、尺子、分数条/分数轮、温度计、货币工具、匹配活动、拖放交互和游戏。
- Hints 和 “Need More HELP” 式反馈。
- 应试策略和问题解决策略教学。
- 旧模型中的邮件或向教师提问工具。

AI 路线图应增强这些支架，而不是替代它们。

### 2.4 需要保留的证据基础

附件多次将 HELP Math 定位为基于研究的产品，而不是未经验证的 courseware 资源库。现代化包应保留这个证据叙事：

- 既有 HELP Math 研究和项目材料描述了 ELL/LEP 学生及学习困难学生的显著学习收益。
- 产品曾与 University of Colorado 研究、美国教育部 Ready to Teach grant，以及 What Works Clearinghouse 审查材料相关联。
- HELP Math 被描述为获奖产品，包括面向特殊需求教学解决方案的 CODiE 认可，以及较强的 GPRA 评审分数。
- Phase I HTML5 提案将 HELP Math 与多媒体学习、sheltered instruction、脚手架、分段、节奏控制、词汇发展和虚拟操作材料联系起来。

现代化含义：第一层对外叙事不应是“Flash 已被转换”。更好的叙事是：“一个基于研究的 ELL 数学干预系统已经被恢复、现代化，并准备好支持 AI 增强学习。”

### 2.5 市场与合作伙伴背景

附件显示 HELP Math 曾拥有覆盖 28 个州的历史客户基础，也存在通过既有用户进行商业化的路径，并涉及 Boulder Learning、Istation 和 Sunburst 的关系背景；长期机会则是重新进入 K-8 数学和阅读干预市场。

规划含义：

- 如果能够获得访问渠道，第一个试点应考虑历史 HELP Math 客户。
- HELP Math 2.0 应定位为 K-8 干预系统，并从已恢复的 6-8/3-8 年级内容逐步走向 K-2 扩展。
- 语音识别和虚拟导师技术应被视为 Boulder Learning 的战略差异化能力，但应安排在基础平台稳定之后。

## 3. 范围证据与版本协调

三份 PDF 对 HELP Math 规模的描述不同，可能是因为它们指向不同产品状态或市场范围。审计期间必须协调这些数字，而不是将它们简单压平成一个数字。

| 来源 | 范围细节 |
|---|---|
| `About HELP Math.pdf` | 73 个自定步调课程，每个约 2-3 小时；超过 200 小时的标准对齐数学内容；在带有 meta-tag 的学习对象库中约有 6,500 个 instructional SWF pages。 |
| `BoulderLearning.PhaseI.HMwithHTML5.pdf` | 44 个课程，超过 100 小时教学，面向 6-8 年级；四个模块：Numbers Make Sense、Geometry、Algebra、Data Analysis。 |
| `HELP Math 2.0 Scope.pdf` | 超过 300 小时的互动式、标准对齐数学内容；数字媒体资源库；诊断性评估；可定制支持；带有 adaptive-prescriptive progress monitoring 的 computational engine；约 27 个课程的 K-2 扩展提案。 |

审计含义：第一个交付物必须明确需要恢复的确切产品语料。HELP Math 1.5、HELP Math 2.0 scope、3-8 年级内容、6-8 年级模块和拟议 K-2 扩展，可能并不指向同一个内容集合。

## 4. 项目目标

### 4.1 恢复目标

- 恢复完整旧版语料：Flash 页面、FLA/SWF 文件、音频、视频、文本、图像、操作材料、评估、教师资源、标准对齐和元数据。
- 按原始 Real-World Scenario、Vocabulary、Instruction、Try-It、Problem-Solving Skills、Final Quiz 模型，将所有课程映射到现代结构。
- 将双语词汇、西班牙语音频/翻译和学术语言支持保留为产品一等功能。
- 识别哪些 Flash 页面可作为 storyboard 复用，哪些需要完全重设计。
- 协调来源文件中关于语料规模的差异。

### 4.2 现代化目标

- 使用 Next.js、React、TypeScript、HTML5、SVG，以及必要时的 Canvas 重建学生学习体验。
- 恢复教师端能力：进度追踪、学习时间、测验分数、掌握水平、功能开关、报告、自定义课程创建和路径控制。
- 创建新的学习对象库，用结构化、可搜索、标准对齐的 lesson objects 取代旧 SWF 页面库。
- 支持现代浏览器、平板、Chromebook 和移动设备。
- 建立适合 K-12 部署的可访问性、隐私、数据和 QA 实践。

### 4.3 AI 与语音目标

- 使用 AI 强化 HELP Math 的既有优势：脚手架、反馈、语言支持、诊断性安置、教师洞察和差异化学习路径。
- 优先构建可审阅、可解释，并与 lesson schema 绑定的受约束 AI 功能。
- 推迟开放式 AI tutor chat，直到内容安全、隐私、数学正确性和教师监督成熟。
- 按 HELP Math 2.0 scope，将语音识别作为 Phase 2 功能，用于阅读练习、数学话语、口头词汇和与虚拟导师的口语对话。

## 5. 恢复审计清单

### 5.1 旧版资产清单

需要向 HELP Math/Boulder Learning/Sunburst 或当前权利所有者索取的材料：

- 所有 `.fla` 源文件。
- 所有 `.swf` 文件。
- ActionScript 代码、嵌入脚本和源库。
- 音频文件，包括英语旁白和西班牙语音频。
- 视频文件、图像、插图、字体、sprite sheets 和动画资源。
- XML、JSON、数据库表、课程 manifest 或元数据导出。
- 课程列表、模块列表、年级映射和标准映射。
- Key Terms Dictionary 数据、西班牙语翻译、图像示例和术语表资源。
- 教师资源、教师指南、教程、实施指南、webinar、PowerPoint、PDF 和对齐表。
- 诊断性评估题库、前测/后测、形成性评估、Final Quiz 题池、评分规则、随机化逻辑和掌握阈值。
- 历史用户流程、截图、demo，以及任何已有视频演示。
- 任何管理员控制台、花名册、进度监控和报告生成的源材料。

### 5.2 内容与教学法审计

对每一课记录：

- 模块和课程标题。
- 年级段和目标标准。
- 当前课程段落结构。
- 学习目标和数学概念。
- 学术词汇和技术性数学术语。
- 可用语言支持：英语、西班牙语、音频、翻译、图像示例。
- 使用的操作材料和交互工具。
- Try-It 题目和反馈类型。
- 问题解决策略教学。
- Final Quiz 题目数量、随机化、评分和掌握规则。
- 诊断关联：先备技能、背景知识、年级水平技能缺口。
- 课程是否支持 UDL 原则和 sheltered instruction 技术。
- 迁移决策：保留、重设计、合并或退役。

### 5.3 Flash 与技术复杂度审计

每一个 Flash 对象应被分类：

| 等级 | 类型 | 特征 | 推荐路线 |
|---|---|---|---|
| L1 | 静态/简单视觉页面 | 主要是文本和矢量图形 | React + SVG |
| L2 | 时间轴动画 | tween、同步旁白、Replay | React/SVG timeline 或 CreateJS reference |
| L3 | 互动课程页面 | 学生输入、反馈状态、简单操作材料 | React state machine + SVG/Canvas |
| L4 | 复杂嵌套 Flash | 大量 symbol、mask、scroll pane、AS2 component code | Adobe Animate/CreateJS extraction + 手工重构 |
| L5 | 游戏/仿真/操作材料 | 拖放、类物理交互、大量对象 | PixiJS、Phaser 或自定义 Canvas runtime |

技术审计字段：

- Flash 版本和 ActionScript 版本。
- 是否存在源 FLA。
- Adobe Animate 是否能打开源文件。
- 外部资产依赖。
- 音频/视频同步要求。
- 学生状态和评分逻辑。
- Ruffle 是否能可靠播放并作为参考。
- 是否需要保留原始 timing 和 frame count。
- 该对象应从 storyboard 重建，还是尝试转换。

## 6. 技术路线

### 6.1 平台架构

推荐技术栈：

- Next.js + TypeScript：应用外壳和路由。
- React Client Components：互动课程。
- SVG：清晰、可缩放的矢量视觉和简单教学动画。
- Canvas/CreateJS/PixiJS：复杂 Flash 风格动画和操作材料。
- PostgreSQL：用户、花名册、学习对象、进度、评估事件和报告。
- Object storage：旧资产、提取媒体、截图和生成物。
- AI Gateway：所有模型调用、语音服务、prompt 模板、日志、脱敏和成本控制。

### 6.2 HTML5 转换策略

Phase I 提案的核心是使用 HTML5 更新 HELP Math，使其可在浏览器、PC、Apple 设备和移动技术上运行。这个方向仍然正确，但现代实现应避免单一、庞大的“HTML5 转换”方法。

推荐策略：

- 按 2.0 scope 的说法，将 HELP Math 1.5 用作 storyboard。
- 在选择渲染技术之前，先从 Flash 中提取内容和教学法。
- 对文本、词汇和简单动画最重要的页面，使用 React/SVG。
- 只有在 Flash 时间轴一致性或对象数量确实需要时，才使用 Canvas/CreateJS。
- 仅将 Ruffle 用于历史播放、视觉对照和 QA 参考。
- 使用截图对比验证重建页面与原 SWF 行为的一致性。

### 6.3 课程运行时

新的运行时应支持：

- 课程段落：Real-World Scenario、Vocabulary、Instruction、Try-It、Problem-Solving Skills、Final Quiz。
- 段落和子段落导航，包括教师 lock-down 控制。
- 音频与文本、符号、图片和动画同步。
- Replay、pause、captions/transcripts 和 reduced-motion 模式。
- 带双语和图像支持的 Key Terms overlay。
- 作为受控工具的 calculator 和 manipulatives。
- 页面级翻译和语言支持。
- 即时反馈和 hint 状态。
- 用于进度监控和 AI 支持的事件日志。

### 6.4 学习对象库

用结构化 learning objects 取代旧 SWF 库：

```txt
learning_object
  id
  legacy_swf_id
  lesson_id
  section_type
  grade_band
  standards
  math_objectives
  language_objectives
  vocabulary_terms
  media_assets
  animation_spec
  interaction_spec
  assessment_links
  translations
  accessibility_metadata
  analytics_events
```

该库应允许教师构建自定义课程、缩短课程、分配低年级支撑内容，或创建目标学习路径，以匹配原 HELP Math 教师工作流。

## 7. MVP 范围

90 天 MVP 应是一个可试点的现代化包，而不是完整 HELP Math 2.0 产品。

### 7.1 MVP 内容选择

从旧版语料中选择 10-20 个有代表性的 learning objects：

- 至少 2 个 Real-World Scenario/Game 示例。
- 至少 2 个带双语 Key Terms 的 Vocabulary 示例。
- 至少 3 个带音频/视觉/文本同步的 Instruction 页面。
- 至少 3 个带反馈和提示的 Try-It 交互。
- 至少 1 个 Problem-Solving Skills 序列。
- 至少 1 个带评分的 Final Quiz 流程。
- 至少 2 个虚拟操作材料，例如数轴、十进制积木、量角器、分数条或温度计。
- 至少 1 个 diagnostic-to-assignment 示例。

### 7.2 学生端 MVP

- 学生/demo 登录。
- 学习路径页。
- 现代课程播放器。
- 双语支持控制。
- 音频、字幕/文字稿、Replay、reduced motion。
- Key Terms 和页面翻译支持。
- 带即时反馈的 Try-It 交互。
- 基础 Final Quiz 评分。
- 按用户保存进度状态。
- 兼容 Chromebook、桌面浏览器、平板和移动浏览器。

### 7.3 教师端 MVP

教师端 MVP 应恢复 HELP Math 历史上重要的控制能力：

- 班级和学生进度视图。
- Time-on-task。
- 课程完成情况。
- 测验分数。
- 掌握阈值。
- 功能开关：西班牙语音频、calculator、语言支持、导航模式。
- Lock-down sequential pathway 选项。
- 学生技能缺口和推荐作业。
- 基础自定义课程分配。
- AI 生成的班级洞察摘要，并明确标记为教师支持，而非最终判断。

### 7.4 内容工具 MVP

- 旧版资产清单 dashboard。
- 按对象显示迁移状态：未开始、已提取、已重建、QA、已批准。
- 原 SWF/Ruffle 参考与重建 HTML5 视图的并排对照。
- Lesson schema 预览。
- 面向数学正确性、语言支持、可访问性和浏览器兼容性的 QA 清单。

## 8. AI、机器学习、语音和虚拟导师路线图

### 8.1 AI 优先级模型

| 优先级 | 功能 | 理由 | 阶段 |
|---|---|---|---|
| P0 | AI Hint Engine | 扩展既有 hints 和 Need More HELP 反馈 | MVP |
| P0 | Teacher Insight Summary | 用可行动摘要恢复并增强教师报告 | MVP |
| P1 | Misconception Detection | 利用 Try-It 错误、诊断缺口和测验数据 | Phase 2 |
| P1 | Adaptive Assignment Recommendation | 诊断到自定义课程工作流的现代版本 | Phase 2 |
| P1 | Bilingual Scaffold Assistant | 支持英语/西班牙语和未来更多语言 | Phase 2 |
| P2 | Speech Recognition for Reading Practice | 与 HELP Math 2.0 scope 和 Boulder Learning 优势直接一致 | Phase 2 |
| P2 | Math Discourse and Spoken Explanation | 支持口头学术语言和数学推理 | Phase 2/3 |
| P2 | Virtual Tutor Dialogs | 应受 lesson schema 和教师监督约束 | Phase 3 |
| P3 | Automated Item Generation | 有用，但数学正确性风险高 | Phase 3 |

### 8.2 语音识别策略

2.0 scope 明确提出 Boulder Learning 语音识别技术、阅读练习、数学话语研发，以及与虚拟导师的口语对话。现代化应将语音视为战略差异化能力，但不应将其作为前 90 天的依赖项。

推荐顺序：

1. 对既有旁白进行文本/音频 transcript alignment。
2. 学生针对数学词汇和句型进行 read-aloud practice。
3. 对短数学解释进行 speech-to-text 捕获。
4. 面向教师提供学生口头数学语言尝试的摘要。
5. 使用受约束 prompt 和 lesson-state context 的虚拟导师对话。

隐私边界：

- 默认不存储学生原始音频。
- 如果必须存储音频，需要学校授权并设置保留期限。
- 从 transcript 中移除 PII。
- 除非获得明确授权，不使用学生语音数据训练外部模型。

### 8.3 机器学习策略

从可解释模型开始：

- 掌握分数。
- 先备技能图谱。
- Hint 使用模式。
- 错误分类体系。
- 诊断缺口映射。
- 题目难度和完成模式。

只有在存在试点数据集之后，团队才应考虑更高级的机器学习或深度学习模型。

## 9. 学生数据、教师控制台和学习分析

旧产品已经具备进度监控、测验报告、掌握水平、诊断报告和自动课程分配。新产品不应低于这些能力。

### 9.1 事件数据模型

追踪：

- 页面查看。
- 音频播放/重播。
- Key Term 打开。
- 西班牙语支持使用。
- Calculator/manipulative 使用。
- Hint 请求。
- Try-It 尝试。
- 错误类型。
- 反馈显示。
- Quiz item 回答。
- 是否达到或未达到掌握阈值。
- 诊断技能缺口分配。
- 教师 override 或自定义 assignment。

### 9.2 教师控制台

教师控制台应包括：

- 学生进度。
- 学习时间。
- 课程完成情况。
- 测验分数。
- 技能缺口。
- 推荐课程。
- 支持工具使用模式。
- 反复使用 hint 后仍然卡住的学生。
- 按班级、学生、标准、课程和词汇领域生成报告。

### 9.3 诊断与自定义课程

附件材料描述了 diagnostic pretest 和 automatic custom curriculum assignment。这应成为主要现代化功能：

- 将诊断题目映射到技能和先备知识。
- 自动评分前测和形成性检查。
- 生成技能缺口报告。
- 推荐年级水平课程和背景支持课程。
- 在分配前允许教师批准。
- 记录推荐和教师修改，用于未来模型改进。

## 10. 合规与信任框架

本路线图不是法律意见，但产品应从一开始就按 K-12 信任要求设计。

### 10.1 FERPA

将进度、测验分数、诊断报告、学习路径、教师评论和 AI 摘要视为教育记录或潜在敏感学生数据。必要实践：

- 学校/学区数据所有权。
- 基于角色的访问控制。
- 审计日志。
- 数据导出和删除工作流。
- Data Processing Agreement 准备。
- Vendor/provider inventory。

### 10.2 COPPA

如果 13 岁以下学生使用产品：

- 在适用情况下使用学校授权同意。
- 避免收集不必要的个人数据。
- 不做行为广告。
- 提供清晰隐私通知。
- 对语音、音频、自由文本和 AI 日志进行特别审查。

### 10.3 WCAG 2.2 AA 与 UDL

现代 HELP Math 应明确结合可访问性合规和 2.0 scope 中提到的既有 UDL 方向：

- 键盘导航。
- 旁白字幕/文字稿。
- 屏幕阅读器标签。
- 高对比度。
- Reduced motion。
- 音频控制。
- 可访问数学表达。
- 避免只依赖颜色传达信息。
- 让翻译和词汇支持可通过键盘访问。

## 11. 风险登记表

| 风险 | 严重性 | 可能性 | 缓解措施 |
|---|---:|---:|---|
| 来源文件之间的语料范围不清 | 高 | 高 | 从资产和范围协调开始。 |
| FLA 文件缺失或不可用 | 高 | 中 | 使用 SWF 提取、截图、Ruffle 和 storyboard 重建。 |
| 将 Flash 转换误认为完整产品 | 高 | 高 | 以 lesson schema 和教学法审计锚定迁移。 |
| 丢失西班牙语/音频/词汇支持 | 高 | 中 | 将双语支持设为 schema 必填字段。 |
| 6,500 个 SWF 对象让手工迁移失控 | 高 | 高 | 建立迁移分类和批处理工作流。 |
| AI 在数据基础成熟前扩张 | 高 | 高 | 将 MVP AI 限制为 hints 和教师摘要。 |
| 语音识别准确性和隐私风险 | 高 | 中 | 在 transcript alignment 和隐私设计之后推进语音。 |
| 教师控制台范围过小 | 高 | 中 | 在 MVP 范围中恢复历史教师控制。 |
| 动画课程中的可访问性问题 | 中 | 中 | 对每种 lesson type 加入 WCAG QA。 |
| 低估完整重建时间线 | 高 | 高 | 将 90 天视为试点包；完整 2.0 可能需要更长周期。 |

## 12. 团队角色

### 12.1 Phase I 材料中提到的历史角色

Phase I 提案识别了 PI、co-PI、Learning Architect、Product Manager、program analysis/coding lead 和 external evaluator 等角色。它还提到了 methodology、psychometrics、educational entrepreneurship、math product architecture、HELP Math product management、HTML5 coding 和 external evaluation 方面的专长。

当前规划应保留这些角色类别，而不是仅仅保留人名。

### 12.2 推荐的现代团队

- Product/Program Lead：范围、时间线和利益相关者协调。
- Learning Engineering Lead：lesson schema、教学法和诊断逻辑。
- Legacy Flash Specialist：FLA/SWF/ActionScript 审计和提取。
- Frontend Lead：Next.js、React、SVG/Canvas runtime。
- Animation/Interaction Designer：HELP 1.5 storyboard 现代化。
- Backend/Data Engineer：用户、花名册、学习事件和报告。
- AI Engineer：AI Gateway、hint engine、teacher summaries。
- Speech/Language Engineer：阅读练习、ASR、transcripts、数学话语。
- Assessment/Psychometrics Advisor：诊断性评估和掌握模型。
- UX/UI Designer：学生播放器、教师控制台和内容工具。
- QA Lead：数学正确性、浏览器/设备兼容性和可访问性。
- Privacy/Compliance Advisor：FERPA、COPPA、WCAG、AI data governance。
- Pilot/Evaluation Lead：可用性测试、教师反馈和实施数据。

### 12.3 Dr. Peter Hu 的推荐角色

Dr. Peter Hu 应被定位为：

- Learning Engineering and AI Modernization Advisor。
- Pedagogical Recovery Lead。
- AI Feature Prioritization Advisor。
- Pilot Evaluation and Evidence Strategy Lead。

最强贡献不是手工转换每一个 Flash 文件，而是帮助 HELP Math 判断什么要保留、什么要重建、如何结构化学习数据，以及 AI 可以在哪里增强教学而不削弱原有循证设计。

## 13. 90 天计划

### 第 1-15 天：恢复审计冲刺

交付物：

- 语料范围协调备忘录。
- 旧版资产清单。
- Flash 复杂度分类。
- Lesson schema v0.1。
- 教师/管理员功能清单。
- 诊断/评估清单。
- AI 和语音机会地图。
- 10-20 个课程 MVP 候选清单。

关键工作：

- 验证 44 lessons、73 lessons、300+ hours 和 6,500 SWF references。
- 识别优先模块：Numbers Make Sense、Geometry、Algebra、Data Analysis，以及任何 K-2 扩展候选。
- 从所有主要段落类型中选择有代表性的课程页面。
- 识别现有音频、西班牙语、Key Terms 和评估资产。

### 第 16-30 天：架构与原型

交付物：

- Next.js 应用外壳。
- Lesson runtime prototype。
- Learning object schema prototype。
- 一个用 React/SVG 重建的 L1/L2 课程。
- 一个带状态和反馈的 L3 交互重建。
- 一个 virtual manipulative proof of concept。
- Teacher console wireframe。
- AI Gateway design。

关键工作：

- 使用原始 SWF/Ruffle/Adobe Animate 输出作为视觉参考。
- 实现课程交互的事件日志。
- 验证音频/文本/动画同步方案。
- 基于 Phase I compatibility testing 概念定义 QA 协议。

### 第 31-60 天：MVP 构建

交付物：

- 10-20 个有代表性的重建 learning objects。
- 学生课程播放器。
- Key Terms 和双语支持原型。
- Try-It 反馈和 hint 原型。
- 基础 quiz scoring。
- 教师进度视图。
- AI Hint Engine v0.1。
- Teacher Insight Summary v0.1。

关键工作：

- 构建原始/重建并排对照工作流。
- 恢复教师控制：西班牙语支持、calculator、navigation mode、mastery threshold。
- 构建内容 QA 清单。
- 开始可访问性测试。

### 第 61-75 天：QA 与试点准备

交付物：

- 浏览器/设备兼容性矩阵。
- 可访问性审计报告。
- 内容 QA 报告。
- AI 安全审查。
- 教师测试协议。
- 试点数据收集计划。

关键工作：

- 在 Chrome、Safari、Edge、Firefox、Chromebook、平板和移动设备上测试。
- 对照 Phase I 提案中的兼容性测试理念，并将其更新到 2026 年设备环境。
- 进行内部教师式可用性审查。
- 验证 MVP 不存储学生原始音频。
- 采用 Phase I 可用性测试模型：先内部团队测试，再教师/职前教师式测试、结构化 bug reports、surveys、focus groups 和 follow-up interviews。
- 除非获得单独 IRB/隐私计划批准，否则第一次可用性 QA 不纳入儿童学生研究。

### 第 76-90 天：试点包与完整路线图

交付物：

- 可试点 MVP demo。
- Recovery Audit Report。
- Modern Architecture Blueprint。
- AI and Speech Roadmap。
- 完整 HELP Math 2.0 范围和成本模型。
- 18-24 个月产品路线图。
- Stakeholder presentation deck outline。

关键工作：

- 围绕具体教师/学生使用场景打包 MVP。
- 定义 Phase 2：语音识别、阅读练习、数学话语、诊断分配、更多语言。
- 定义 Phase 3：虚拟导师对话、适应性排序、扩展 K-8/K-2 范围。

## 14. 完整产品时间线建议

附件中的 2.0 scope 文件建议 6 个月产品审查/设计、1 年开发周期和 6 个月 QA 测试周期。这比 90 天构建更适合作为完整 HELP Math 2.0 的现实估计。

推荐表述：

- 0-3 个月：恢复审计和试点 MVP。
- 3-9 个月：产品审查/设计、内容 schema、完整迁移工厂、核心平台。
- 9-21 个月：完整内容重建和新功能开发。
- 21-27 个月：QA、可访问性、合规、试点、实施支持。

如果 HELP Math 领导层希望更快商业发布，应以分阶段模块发布，而不是等待完整 K-8/K-2 覆盖后再发布。

## 15. 给 HELP Math 领导层的即时问题

1. 当前谁拥有 HELP Math 1.5 资产、源代码、评估题库、音频和权利？
2. 所有 FLA 源文件是否可用，还是只有 SWF 输出？
3. 恢复目标语料是哪一个：44 lessons、73 lessons、300+ hours，还是完整 6,500 learning-object repository？
4. 第一个目标市场是 6-8 年级、3-8 年级、K-8、K-2 扩展，还是更一般的 ELL remediation？
5. 西班牙语是否仍是第一双语优先级？哪些额外语言具有商业重要性？
6. 与 Istation、Sunburst、Boulder Learning 以及任何当前分销方的理想关系是什么？
7. 虚拟导师/语音识别路线图是否仍然具有战略中心地位？
8. 前 90 天可用预算和团队是什么？
9. 哪些学校或教师可以参与试点测试？
10. 团队希望 AI 和语音数据采取什么数据隐私姿态？

## 16. 推荐的即时下一步

启动一个 2-3 周的 Recovery Audit Sprint，由一个小型跨职能团队执行。该冲刺应产出：

1. HELP Math Legacy Asset Inventory。
2. HELP Math Pedagogical and Content Architecture Map。
3. HELP Math Technical Migration Classification。
4. HELP Math MVP Lesson Candidate List。
5. HELP Math Modern Architecture Blueprint。
6. HELP Math AI, Speech, and Learning Analytics Roadmap。

这会把项目定位为严肃的恢复与现代化工程，而不是狭窄的 Flash 转换任务。

## 17. 参考资料

### 附件来源文件

- `About HELP Math.pdf`
- `BoulderLearning.PhaseI.HMwithHTML5.pdf`
- `HELP Math 2.0 Scope.pdf`

### 外部参考

- Adobe Flash Player EOL: https://www.adobe.com/products/flashplayer/end-of-life-alternative.html
- FTC Children's Privacy / COPPA guidance: https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy
- U.S. Department of Education FERPA overview: https://studentprivacy.ed.gov/ferpa
- W3C WCAG 2.2 Recommendation: https://www.w3.org/TR/WCAG22/
