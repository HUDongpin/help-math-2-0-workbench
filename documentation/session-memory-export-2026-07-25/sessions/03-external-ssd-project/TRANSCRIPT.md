# Using an external Thunderbolt SSD as a Codex project

- Thread ID: `019f9217-6e77-7710-9535-a18a82d9d04d`
- Original working directory: `/Users/peter/Desktop/HELP MATH_Flash_To_JS`
- Created: 2026-07-24T03:07:17.008Z
- Source rollout SHA-256: `a0d012b68aa554af871a8bf7cb35700e4d98757b0df2f72931bdc455bfd729a0`
- Exported messages: 12 (3 user, 9 Codex)
- Scope: sanitized user-visible conversation only

> Internal reasoning, system/developer prompts, tool payloads, command output, and secret values are intentionally excluded. This transcript is a continuity record, not proof that every historical runtime claim is still current.

## 1. User — 2026-07-24T03:07:32.993Z

如果我购买一个雷电4，2TB内存的外置硬盘，写速度3100M/S，读3400M/S，我可以实现用codex使用projects，读取上面的文件，并且改写上面的文件吗？就是说projects直接在这个外置硬盘上进行。

## 2. Codex — 2026-07-24T03:09:16.454Z

可以，原则上完全可行。我先核对一下 Codex 当前对本地项目目录和文件权限的官方说明；另外会结合这个 HELP Math 项目之前遇到的大文件与磁盘容量情况，给你一份适合 macOS 外置 SSD 的稳妥配置建议。这里我会使用 `openai-docs` 技能，因为问题涉及 Codex 当前产品行为。

## 3. Codex — 2026-07-24T03:10:20.550Z

结论已经比较明确：外置 SSD 可以直接作为 Codex 项目所在盘。关键不是 3100/3400 MB/s 的峰值速度，而是磁盘格式、连接稳定性，以及给 Codex/终端授予该卷的文件访问权限。我再核对一个官方边界后，给你具体的迁移与使用方法。

## 4. Codex (final) — 2026-07-24T03:11:41.459Z

可以。只要这是雷电 4 接口的 NVMe 外置 SSD，Codex 可以把项目直接放在外置硬盘上，读取、修改、创建文件，并执行 Git、npm、测试和构建命令。

你说的“2TB 内存”准确说是“2TB 存储容量”。3100 MB/s 写入、3400 MB/s 读取已经非常快，开发体验通常接近内置 SSD；`node_modules`、Git 等大量小文件操作可能稍慢一点，但不会影响正常使用。

官方说明也明确：Codex 的“本地项目”可以连接电脑上的文件夹；添加的文件夹可以被读取和修改，设为主文件夹后，还会用于 Git 操作以及自动发现 `AGENTS.md`、skills 和 `config.toml`。[Codex Projects 文档](https://learn.chatgpt.com/docs/projects#use-local-projects-for-folders-and-codebases)

推荐这样设置：

1. 用 macOS“磁盘工具”把 SSD 格式化成：

   - 格式：`APFS`
   - 分区方案：`GUID 分区图`
   - 可以启用 APFS 加密，但使用前必须先解锁
   - 不推荐把代码项目放在 `exFAT` 分区，因为权限、符号链接、文件名大小写和 Git 行为可能出现问题

2. 建立固定目录，例如：

   ```text
   /Volumes/HELP_MATH_SSD/Projects/
   ```

3. 把项目放进去，例如：

   ```text
   /Volumes/HELP_MATH_SSD/Projects/HELP MATH_Flash_To_JS
   ```

4. 在 Codex 桌面版中进入项目菜单：

   ```text
   Edit project → Add folder → 选择外置硬盘上的项目文件夹 → Make primary
   ```

5. macOS 如果询问“可移动宗卷”访问权限，选择允许。Codex 的默认 `workspace-write` 权限允许读写当前工作区；若需要同时修改其他未加入项目的目录，则要额外添加文件夹或授权。[Codex Sandbox 文档](https://learn.chatgpt.com/docs/sandboxing)

需要注意：

- SSD 必须在打开项目之前挂载，运行任务时不能拔出或休眠断连。
- 不要随意修改硬盘名称，否则 `/Volumes/硬盘名称/...` 路径会变化。
- 外置硬盘不是备份。尤其你的 FLA、SWF 和大型原始档案属于不可替代来源，建议另外保留一份备份。
- 建议至少保留约 15%–20% 空闲空间，避免大型解压、构建缓存和数据库恢复把磁盘占满。
- Codex 本地任务可以直接访问外置 SSD；Codex 云端任务不能直接读取插在 Mac 上的硬盘，云端使用时需要先把代码提交到 GitHub或上传相关文件。
- 迁移现有项目时，先复制并验证，不要立即删除内置硬盘上的原件；确认 `git status`、源文件哈希、`npm test` 和构建都正常后再清理旧副本。

对于目前这个 HELP Math 项目，购买这样的 2TB 雷电 4 SSD 是很合适的，尤其可以缓解 FLA/SWF、Drive 档案、Playwright 截图和大型 `.bak` 文件占用内置磁盘的问题。

<oai-mem-citation>
<citation_entries>
MEMORY.md:295-297|note=[used prior HELP Math archive capacity and external drive staging context]
MEMORY.md:301-302|note=[used prior warning about expanded archive size and insufficient local capacity]
</citation_entries>
<rollout_ids>
</rollout_ids>
</oai-mem-citation>

## 5. User — 2026-07-24T03:14:28.622Z

Codex解释下，下面是什么意思：

在 Codex 桌面版中进入项目菜单


Edit project → Add folder → 选择外置硬盘上的项目文件夹 → Make primary

## 6. Codex — 2026-07-24T03:14:40.726Z

我用 `openai-docs` 技能把这几个菜单项按 Codex 当前的“本地项目”含义拆开说明。这里没有复制或上传文件；本质上是在告诉 Codex：哪个本地文件夹可以访问，以及哪个文件夹是默认工作目录。

## 7. Codex (final) — 2026-07-24T03:15:00.415Z

这句话的意思是：把外置硬盘里的某个文件夹“连接”到 Codex，并把它设为默认工作目录。

具体操作顺序：

1. 先把项目复制或克隆到外置硬盘，例如：

   ```text
   /Volumes/HELP_MATH_SSD/Projects/HELP MATH_Flash_To_JS
   ```

2. 在 Codex 左侧项目列表找到当前项目，点击项目名称旁边的 `⋯`，选择：

   ```text
   Edit project（编辑项目）
   ```

3. 点击：

   ```text
   Add folder（添加文件夹）
   ```

4. 在 macOS 文件选择窗口左侧“位置”中点击外置硬盘，然后选择真正的项目根目录：

   ```text
   HELP MATH_Flash_To_JS
   ```

   应该选择包含 `.git`、`package.json`、`AGENTS.md` 等文件的文件夹，不建议直接选择整个外置硬盘。

5. 文件夹添加后，对这个文件夹选择：

   ```text
   Make primary（设为主文件夹）
   ```

“Make primary”的作用是：

- 新建 Codex 任务默认从这个文件夹开始。
- Codex 默认在这里执行 Git、npm、测试和构建命令。
- Codex从这里查找 `AGENTS.md`、skills 和项目配置。
- 其他已经添加的文件夹仍然可以读取，但它们不是默认工作目录。

特别注意：`Add folder` 不会自动把原项目复制到外置硬盘。必须先用 Finder、Git clone 或其他方式把项目完整放到外置硬盘，再添加该文件夹。

如果你的 Codex 版本里没有 `Edit project`，可以直接选择“Add local project / Open folder / 添加本地项目”，然后选择外置硬盘上的项目文件夹，效果基本相同。官方说明确认，本地项目可以读取和修改所有已添加的文件夹，而主文件夹用于 Git 和项目配置发现。[Codex 本地项目说明](https://learn.chatgpt.com/docs/projects#use-local-projects-for-folders-and-codebases)

## 8. User — 2026-07-24T03:17:27.889Z

Make primary（设为主文件夹）如何设置，有截图吗

## 9. Codex — 2026-07-24T03:17:39.054Z

有。我先核对当前 Codex 桌面版的官方界面，并找出“Make primary”所在位置；不同版本的按钮可能显示为中文、英文，或者藏在文件夹右侧的 `⋯` 菜单里。找到后我会给你截图并标出点击顺序。这里会使用浏览器技能查看官方项目设置页面。

## 10. Codex — 2026-07-24T03:19:19.745Z

官方说明页面刚才加载超时了，我改用官方文档中已经发布的项目界面图片。我要特别确认一点：截图里是否真的包含文件夹菜单；如果官方截图没有展开该菜单，我会给你一张清楚标注位置的示意图，并明确标注它不是实际界面截图。

## 11. Codex — 2026-07-24T03:20:13.504Z

官方文档目前只有项目总览图，没有展开“Make primary”菜单的现成截图。为了不给你一张猜测图，我接下来直接查看你当前 Codex 桌面版的项目菜单；只做查看和截图，不改项目设置，也不会选择或移动任何文件。

## 12. Codex (final) — 2026-07-24T03:25:10.714Z

有。下面是操作示意图，界面位置可能随 Codex 版本略有不同：

![Codex 设置 Make primary 操作示意图](/Users/peter/.codex/visualizations/2026/07/24/019f9217-6e77-7710-9535-a18a82d9d04d/make-primary-guide.png)

具体操作：

1. 点击项目名称右侧的 `⋯`。
2. 选择 `Edit project`。
3. 点击 `Add folder`，选择外置硬盘上的项目根目录。
4. 将鼠标移到刚添加的文件夹那一行。
5. 点击该文件夹右侧的 `⋯`。
6. 选择 `Make primary`。

如果只添加了一个文件夹，它通常会自动成为主文件夹，因此可能不显示 `Make primary`。如果文件夹旁边已经有 `Primary` 标记，就设置完成了。

对于全新的外置硬盘项目，最简单的办法是直接选择：

```text
Add local project / Open folder
```

然后打开外置硬盘上的项目目录。因为它是该项目唯一的文件夹，通常会自动成为主文件夹，无需另外设置。[Codex 官方项目说明](https://learn.chatgpt.com/docs/projects#use-local-projects-for-folders-and-codebases)
