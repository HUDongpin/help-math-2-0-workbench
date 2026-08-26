#!/usr/bin/env node

/**
 * Deterministically reconstruct the surviving Claude UI scratch files from the
 * local Claude Code JSONL history. This script is deliberately narrow:
 *
 * - it replays only successful Write/Edit calls for explicitly listed files;
 * - it executes only recorded local Python/Node text transforms for those files;
 * - it never replays copy, delete, server, browser, network, or Git commands;
 * - all replay work happens in a newly-created temporary directory;
 * - the only persistent outputs are the seven files under ./pages/.
 *
 * Six outputs have all recorded dependencies available. g4-ui-review.html is
 * the exception: its original 263,146-byte small-chromebook.png disappeared
 * with Claude's scratch directory. The script uses a clearly documented,
 * same-project 1366x768 historical screenshot in its place.
 */

import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(packageDir, "pages");
const repoRoot = resolve(packageDir, "../../..");
const claudeProjectDir = join(
  homedir(),
  ".claude/projects/-Volumes-WestWorld-HELP-MATH-2-0",
);

const sessions = {
  review: "cbc8e710-7ea3-4ebd-8762-52ab1dbe9ff1",
  player: "6108448b-a94e-4ca2-80b4-8c4ce4aafa01",
  platform: "4bf1a363-505f-4317-9701-b9e52a6b1cad",
  identity: "7d8795f3-8832-4a06-bb35-357338b120ec",
};

const configs = [
  {
    id: "g4-ui-review",
    session: sessions.review,
    target: "g4-ui-review.html",
    managed: ["g4-ui-review.html"],
    startToolId: "toolu_01TyxaFcgXMSFD7KLvYxdCNn",
    stopToolId: "toolu_01Pe5MF81vLsztM6rdVKVmCU",
    prepare(stageDir) {
      const substitute = join(
        repoRoot,
        "output/playwright/whole-lesson-responsive-transport-2026-07-29/g4-l3-desktop-1366x768.png",
      );
      requireFile(substitute);
      copyFileSync(substitute, join(stageDir, "small-chromebook.png"));
    },
    dependencyStatus: "missing-original-image-substituted",
  },
  {
    id: "help-math-ui-geometry",
    session: sessions.player,
    target: "help-math-ui-geometry.html",
    managed: ["help-math-ui-geometry.html"],
    startToolId: "toolu_01XjkVESVr4Dxd6qhezWnQJU",
    stopToolId: "toolu_01QuTmd63REYYFrdkFMLCmE1",
    dependencyStatus: "complete-recorded-inputs",
  },
  {
    id: "help-math-player",
    session: sessions.player,
    target: "help-math-player.html",
    managed: ["help-math-player.html", "chrome-uri.txt"],
    startToolId: "toolu_01Kht3QXXXtUHkQYkF8X2eCR",
    stopToolId: "toolu_01NJTpWBvnLgZTCJXkVbjxjU",
    prepare(stageDir) {
      const chromePng = join(
        repoRoot,
        "apps/web/public/flash-assets/courses/shell-course-g04-l03-index-local/root-frames/frame-0049.png",
      );
      requireFile(chromePng);
      const actual = sha256File(chromePng);
      const expected = "32787a9cccfa2f5d167c5377f2a169fe2d4393ab7a08047536c7695ef60832a9";
      if (actual !== expected) {
        throw new Error(`Tracked chrome image drift: expected ${expected}, received ${actual}`);
      }
      const base64 = readFileSync(chromePng).toString("base64");
      writeFileSync(
        join(stageDir, "chrome-uri.txt"),
        `--chrome:url(\"data:image/png;base64,${base64}\");`,
        "ascii",
      );
    },
    dependencyStatus: "complete-recorded-inputs",
  },
  {
    id: "helpmath-2-ui",
    session: sessions.platform,
    target: "helpmath-2-ui.html",
    managed: ["helpmath-2-ui.html"],
    startToolId: "toolu_01PuU9aD1kFaG9fi73RDzLWw",
    stopToolId: "toolu_01CLtv461se1oH4noqPZpm6M",
    dependencyStatus: "complete-recorded-inputs",
  },
  {
    id: "helpmath-2-kids",
    session: sessions.platform,
    target: "helpmath-2-kids.html",
    managed: ["helpmath-2-kids.html"],
    startToolId: "toolu_01RQxoCf3LBrzF75DBNpvkFs",
    stopToolId: "toolu_015SdfU9HNNYCAcTLCgQnbiC",
    dependencyStatus: "complete-recorded-inputs",
  },
  {
    id: "helpmath-2-soft",
    session: sessions.platform,
    target: "helpmath-2-soft.html",
    managed: ["helpmath-2-soft.html"],
    startToolId: "toolu_01PEVctL916nct4R7WGBRssj",
    stopToolId: "toolu_016UyHRJ9LNfL9zKXinsT5b2",
    dependencyStatus: "complete-recorded-inputs",
  },
  {
    id: "helpmath-identity",
    session: sessions.identity,
    target: "helpmath-identity.html",
    managed: ["build-page.mjs", "helpmath-identity.html"],
    startToolId: "toolu_01VgyBNEWMwyx2BUWAMck4KT",
    stopToolId: "toolu_01GoK3s6FQezT6HtXVwNzws8",
    prepare(stageDir) {
      // One recorded copy-edit touched both the presentation builder and the
      // package README. Give that unrelated README a temporary sandbox copy so
      // the original multi-file script can run without touching the checkout.
      const stagedBrandDir = join(stageDir, "design/brand");
      mkdirSync(stagedBrandDir, { recursive: true });
      copyFileSync(
        join(repoRoot, "design/brand/README.md"),
        join(stagedBrandDir, "README.md"),
      );
    },
    dependencyStatus: "complete-recorded-inputs",
  },
];

function requireFile(filePath) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    throw new Error(`Required file is missing: ${filePath}`);
  }
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function parseSession(logPath) {
  requireFile(logPath);
  const rows = readFileSync(logPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL at ${logPath}:${index + 1}: ${error.message}`);
      }
    });

  const resultState = new Map();
  const toolUses = [];
  for (const row of rows) {
    const content = row?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const item of content) {
      if (item?.type === "tool_result" && item.tool_use_id) {
        resultState.set(item.tool_use_id, { isError: item.is_error === true });
      }
      if (item?.type === "tool_use") {
        toolUses.push({ ...item, timestamp: row.timestamp ?? null });
      }
    }
  }
  return { resultState, toolUses };
}

function applyEdit(stageDir, input, toolId) {
  const fileName = basename(input.file_path);
  const filePath = join(stageDir, fileName);
  requireFile(filePath);
  const source = readFileSync(filePath, "utf8");
  const oldString = input.old_string;
  const newString = input.new_string;
  if (typeof oldString !== "string" || typeof newString !== "string") {
    throw new Error(`Malformed recorded Edit for ${fileName}`);
  }
  if (!source.includes(oldString)) {
    const currentHash = createHash("sha256").update(source).digest("hex");
    throw new Error(
      `Recorded Edit ${toolId} no longer matches ${fileName}; current chars=${source.length} sha256=${currentHash}`,
    );
  }
  const occurrences = source.split(oldString).length - 1;
  if (!input.replace_all && occurrences !== 1) {
    throw new Error(
      `Recorded non-replace-all Edit ${toolId} expected one match in ${fileName}, found ${occurrences}`,
    );
  }
  const updated = input.replace_all
    ? source.split(oldString).join(newString)
    : source.replace(oldString, () => newString);
  writeFileSync(filePath, updated, "utf8");
}

function safePython(stageDir, sourceCode, scratchDir) {
  const forbidden = [
    /\bsubprocess\b/,
    /\bos\.system\b/,
    /\bshutil\.rmtree\b/,
    /\brequests\b/,
    /\burllib\b/,
    /\bsocket\b/,
    /\bunlink\s*\(/,
    /\bremove\s*\(/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(sourceCode)) {
      throw new Error(`Rejected recorded Python transform containing ${pattern}`);
    }
  }
  const stagedCode = sourceCode.split(scratchDir).join(stageDir);
  execFileSync("python3", ["-c", stagedCode], {
    cwd: stageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function safeNodeEval(stageDir, command, scratchDir) {
  const forbidden = [
    /\brm\s/,
    /\bmv\s/,
    /\bcp\s/,
    /child_process/,
    /unlinkSync/,
    /rmSync/,
    /https?:\/\//,
    /http\.server/,
    /playwright/i,
    /Google Chrome/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(command)) {
      throw new Error(`Rejected recorded Node transform containing ${pattern}`);
    }
  }
  const staged = command
    .split(scratchDir)
    .join(stageDir)
    .replace(/^cd\s+(?:"[^"]+"|'[^']+'|[^&]+?)\s*&&\s*/, "");
  execFileSync("/bin/zsh", ["-lc", staged], {
    cwd: stageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runIdentityBuilder(stageDir) {
  const builderPath = join(stageDir, "build-page.mjs");
  requireFile(builderPath);
  const outputPath = join(stageDir, "helpmath-identity.html");
  let builder = readFileSync(builderPath, "utf8");
  builder = builder.replace(
    /const OUT\s*=\s*(?:\n\s*)?"[^"]*helpmath-identity\.html";/,
    `const OUT = ${JSON.stringify(outputPath)};`,
  );
  writeFileSync(builderPath, builder, "utf8");
  execFileSync(process.execPath, [builderPath], {
    cwd: stageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function replayRecordedBash(config, stageDir, input, scratchDir) {
  const command = input.command ?? "";
  const referencesManaged = config.managed.some((name) => command.includes(name));
  if (!referencesManaged) return { kind: "skipped" };

  let ran = false;
  const pythonHeredoc = command.match(/python3\s+-\s+<<'PY'\n([\s\S]*?)\nPY(?:\n|$)/);
  if (pythonHeredoc) {
    safePython(stageDir, pythonHeredoc[1], scratchDir);
    ran = true;
  } else if (/python3\s+-c\s+"/.test(command)) {
    // Only the pre-final help-math-player history uses this form. The replay
    // starts after it and prepares chrome-uri.txt deterministically instead.
    return { kind: "skipped-python-c" };
  }

  if (/\bnode\s+-e\s+"/.test(command)) {
    safeNodeEval(stageDir, command, scratchDir);
    ran = true;
  }

  if (/\bnode\s+build-page\.mjs\b/.test(command)) {
    runIdentityBuilder(stageDir);
    ran = true;
  }

  return { kind: ran ? "replayed" : "skipped-nonmutation" };
}

function replay(config) {
  const logPath = join(claudeProjectDir, `${config.session}.jsonl`);
  const { resultState, toolUses } = parseSession(logPath);
  const stageDir = mkdtempSync(join(tmpdir(), `helpmath-${config.id}-`));
  let started = false;
  let stopped = false;
  const stats = { writes: 0, edits: 0, bashTransforms: 0, skippedBash: 0 };

  try {
    config.prepare?.(stageDir);
    const scratchDir = `/private/tmp/claude-501/-Volumes-WestWorld-HELP-MATH-2-0/${config.session}/scratchpad`;

    for (const tool of toolUses) {
      if (tool.id === config.startToolId) started = true;
      if (!started) continue;
      if (resultState.get(tool.id)?.isError === true) {
        if (tool.id === config.stopToolId) stopped = true;
        if (stopped) break;
        continue;
      }

      if (tool.name === "Write") {
        const fileName = basename(tool.input?.file_path ?? "");
        if (config.managed.includes(fileName)) {
          writeFileSync(join(stageDir, fileName), tool.input.content, "utf8");
          stats.writes += 1;
        }
      } else if (tool.name === "Edit") {
        const fileName = basename(tool.input?.file_path ?? "");
        if (config.managed.includes(fileName)) {
          applyEdit(stageDir, tool.input, tool.id);
          stats.edits += 1;
        }
      } else if (tool.name === "Bash") {
        const result = replayRecordedBash(config, stageDir, tool.input ?? {}, scratchDir);
        if (result.kind === "replayed") stats.bashTransforms += 1;
        else stats.skippedBash += 1;
      }

      if (tool.id === config.stopToolId) {
        stopped = true;
        break;
      }
    }

    if (!started) throw new Error(`Start tool not found for ${config.id}`);
    if (!stopped) throw new Error(`Stop tool not found for ${config.id}`);
    const stagedTarget = join(stageDir, config.target);
    requireFile(stagedTarget);
    const outputPath = join(pagesDir, config.target);
    copyFileSync(stagedTarget, outputPath);
    return {
      id: config.id,
      target: `pages/${config.target}`,
      bytes: statSync(outputPath).size,
      sha256: sha256File(outputPath),
      dependencyStatus: config.dependencyStatus,
      sessionId: config.session,
      startToolId: config.startToolId,
      stopToolId: config.stopToolId,
      replayStats: stats,
    };
  } finally {
    rmSync(stageDir, { recursive: true, force: true });
  }
}

function createSupportContractPlayer() {
  const sourcePath = join(pagesDir, "help-math-player.html");
  requireFile(sourcePath);
  let source = readFileSync(sourcePath, "utf8");
  source = source.replace(
    "<title>HELP Math 2.0 &#x2014; Lesson Player with Nova Tutor</title>",
    "<title>HELP Math 2.0 &#x2014; Claude lesson-player support-contract reconstruction</title>",
  );
  source = source.replace('<div class="shell">', '<main class="shell">');
  source = source.replace('\n</div>\n\n<script>\n(function(){', '\n</main>\n\n<script>\n(function(){');
  source = source.replace('<aside class="side" aria-label="Support">', '<div class="side" aria-label="Support">');
  source = source.replace('          </aside>', '          </div>');
  source = source.replace(
    '<div class="tablewrap">',
    '<div class="tablewrap" role="region" aria-label="Responsive layout measurements" tabindex="0">',
  );
  source = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23413db0'/%3E%3Cpath d='M8 9h4v5h8V9h4v14h-4v-5h-8v5H8z' fill='white'/%3E%3C/svg%3E">\n${source}`;
  source = source.replace('<header class="mast">', '</head>\n<body>\n<header class="mast">');

  const overlay = String.raw`
<!--
  CURRENT SUPPORT-CONTRACT OVERLAY — reconstructed 2026-08-12.
  This block is not part of Claude's published August 7 artifact. It adapts the
  recovered visual design to the later fail-closed contracts preserved in
  whole-lesson-host-presentation.ts, tutor-integration.ts,
  reviewer-instrumentation.ts, and their focused browser/unit specifications.
-->
<style id="support-contract-overlay">
  .mode[data-set="legacy"]{display:none}
  .mode:not([aria-pressed="true"]) small{opacity:1;color:#4c627c}
  .mode[aria-pressed="true"] small{opacity:1;color:#fff}
  .spine-mark{color:#d9e9ff}
  .spine .tick{color:#fff}
  .nans{color:#07583f}
  .contract-ribbon{
    margin:0 0 20px;padding:13px 16px;border:1px solid #b8c9df;border-left:5px solid #413db0;
    border-radius:10px;background:#f5f5ff;color:#253455;font:600 14px/1.5 var(--f-body)
  }
  .contract-ribbon strong{color:#282270}
  .support-close{
    align-self:flex-end;margin:.55cqw .65cqw 0;border:1px solid var(--line);background:var(--card);
    color:var(--ink);border-radius:999px;min-width:34px;min-height:34px;cursor:pointer;
    font:800 17px/1 var(--f-body);display:grid;place-items:center;z-index:3
  }
  .support-close:hover{border-color:var(--nova);color:var(--nova)}
  .provider-state{
    border:1px solid #cbc9f3;background:#efefff;color:#302b84;border-radius:7px;
    padding:.65em .75em;font-size:clamp(7px,.96cqw,12px);line-height:1.45
  }
  .provider-state b{display:block;font-family:var(--f-data);font-size:.82em;letter-spacing:.09em;text-transform:uppercase}
  .offline-empty{
    border:1px dashed var(--line);border-radius:7px;padding:.85em;color:var(--mist);
    font-size:clamp(7px,1cqw,12px);line-height:1.5;background:var(--card)
  }
  .draft-state{min-height:1.4em;color:var(--nova-ink);font-size:clamp(6px,.85cqw,10px);line-height:1.4}
  .nova-send{
    border:0;border-radius:999px;background:var(--nova-fill);color:#fff;font:800 11px/1 var(--f-body);
    min-width:48px;min-height:32px;padding:0 11px
  }
  .nova-input button:disabled,.novaband button:disabled,.nova-send:disabled{
    opacity:.42;cursor:not-allowed;filter:grayscale(.2)
  }
  .assessment-boundary{
    margin:0;padding:.65em .75em;border-left:3px solid var(--amber);background:#fff6df;
    color:#603d00;font-size:clamp(6.5px,.9cqw,11px);line-height:1.45
  }
  .support-scrim{display:none}
  :where(button,input,[role="tab"]):focus-visible{outline:3px solid #2fa3d7;outline-offset:3px}
  @media (prefers-color-scheme:dark){
    .mode:not([aria-pressed="true"]) small{color:#b1c4dd}
    .contract-ribbon{background:#171a38;border-color:#444987;color:#d9dcff}
    .contract-ribbon strong{color:#fff}
    .provider-state{background:#211f4b;border-color:#5450a4;color:#e7e6ff}
    .assessment-boundary{background:#3c2c0b;color:#ffe2a0}
  }
  @media (max-width:640px){
    body.contract-modal-open{overflow:hidden}
    .viewport[data-mode="study"][data-nova="closed"] .player{
      grid-template-columns:clamp(42px,13cqw,58px) minmax(0,1fr) 0
    }
    .viewport[data-mode="study"][data-nova="closed"] .side{display:none}
    .viewport[data-mode="focus"][data-nova="open"] .player,
    .viewport[data-mode="study"][data-nova="open"] .player{
      grid-template-columns:clamp(42px,13cqw,58px) minmax(0,1fr) 0
    }
    .viewport[data-nova="open"] .side{
      position:fixed;left:0;right:0;bottom:0;top:auto;width:100vw;height:min(78dvh,640px);
      z-index:1002;border:0;border-radius:20px 20px 0 0;background:var(--paper);
      box-shadow:0 -24px 60px rgb(5 20 50 / 35%);overflow:hidden
    }
    .viewport[data-nova="open"] .side-in{width:100%;height:100%}
    .viewport[data-nova="open"] .tabs button{font-size:13px;min-height:44px}
    .viewport[data-nova="open"] .panel{padding:14px 16px 22px;gap:14px}
    .viewport[data-nova="open"] .provider-state,
    .viewport[data-nova="open"] .offline-empty,
    .viewport[data-nova="open"] .assessment-boundary{font-size:13px}
    .viewport[data-nova="open"] .nova-text{font-size:16px;min-height:44px}
    .viewport[data-nova="open"] .nova-input button{min-width:44px;min-height:44px}
    .support-close{margin:10px 12px 0;min-width:44px;min-height:44px;font-size:21px}
    .support-scrim{
      display:block;position:fixed;inset:0;z-index:1001;background:rgb(4 17 42 / 68%);
      border:0;width:100%;height:100%;padding:0;cursor:pointer
    }
    .support-scrim[hidden]{display:none}
  }
</style>
<script id="support-contract-behavior">
(function(){
  "use strict";
  var vp = document.querySelector("#vp");
  var player = vp && vp.querySelector(".player");
  var side = vp && vp.querySelector(".side");
  var sideIn = side && side.querySelector(".side-in");
  var askNova = document.querySelector("#askNova");
  var thread = document.querySelector("#thread");
  var input = document.querySelector("#novaText");
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  if (!vp || !player || !side || !sideIn || !askNova || !thread || !input) return;

  var mast = document.querySelector(".mast");
  var ribbon = document.createElement("p");
  ribbon.className = "contract-ribbon";
  ribbon.innerHTML = '<strong>Current-contract reconstruction.</strong> The visual composition is recovered from Claude’s prototype; provider behavior is deliberately offline and fail-closed. No question, frame, voice, photo, or draft leaves this page.';
  mast.parentNode.insertBefore(ribbon, mast.nextSibling);

  var close = document.createElement("button");
  close.type = "button";
  close.className = "support-close";
  close.setAttribute("aria-label", "Close Nova Tutor");
  close.textContent = "×";
  sideIn.insertBefore(close, sideIn.firstChild);

  var scrim = document.createElement("button");
  scrim.type = "button";
  scrim.className = "support-scrim";
  scrim.setAttribute("aria-label", "Close Nova Tutor");
  scrim.hidden = true;
  document.body.appendChild(scrim);

  var panel = document.querySelector("#novaPanel");
  var provider = document.createElement("div");
  provider.className = "provider-state";
  provider.setAttribute("role", "status");
  provider.innerHTML = '<b>Provider not configured</b>Nova is shown as an interface contract only. Nothing can be sent.';
  panel.insertBefore(provider, panel.firstChild);

  var ctx = panel.querySelector(".nova-ctx p b");
  if (ctx) ctx.textContent = "Local page context";
  var ctxText = document.querySelector("#novaCtx");
  if (ctxText) ctxText.insertAdjacentText("afterend", " · not sent");

  thread.innerHTML = "";
  var empty = document.createElement("p");
  empty.className = "offline-empty";
  empty.textContent = "No conversation yet. Choose a question starter to prepare a local draft.";
  thread.appendChild(empty);

  var assessment = document.createElement("p");
  assessment.className = "assessment-boundary";
  assessment.textContent = "Assessment support scaffolds the learner’s thinking; it does not provide the answer.";
  panel.insertBefore(assessment, document.querySelector("#novaChips"));

  var send = document.createElement("button");
  send.type = "button";
  send.className = "nova-send";
  send.textContent = "Send";
  send.disabled = true;
  send.setAttribute("aria-label", "Send unavailable — provider not configured");
  document.querySelector(".nova-input").appendChild(send);

  var draft = document.createElement("p");
  draft.className = "draft-state";
  draft.id = "draftState";
  draft.setAttribute("role", "status");
  draft.textContent = "Draft stays on this page. Nothing has been sent.";
  document.querySelector(".nova-input").insertAdjacentElement("afterend", draft);

  ["mic","cam","bandMic"].forEach(function(id){
    var control = document.getElementById(id);
    if (!control) return;
    control.disabled = true;
    control.setAttribute("aria-disabled", "true");
    control.title = "Unavailable — provider not configured";
  });
  var bandQ = document.querySelector("#bandQ"), bandA = document.querySelector("#bandA");
  if (bandQ) bandQ.textContent = "Voice is unavailable — provider not configured";
  if (bandA) bandA.textContent = "No question has been sent and no answer exists.";

  function prepareDraft(text){
    input.value = text || input.value;
    draft.textContent = "Local draft prepared. Nothing has been sent.";
    input.focus();
  }

  document.addEventListener("click", function(event){
    var starter = event.target.closest(".chips button");
    if (starter){
      event.preventDefault();
      event.stopImmediatePropagation();
      prepareDraft(starter.dataset.ask || starter.textContent.trim());
      return;
    }
    if (event.target.closest("#askNova,.mode,#dtoggle,[role=tab]")) {
      window.setTimeout(syncPlacement, 0);
    }
  }, true);

  document.addEventListener("keydown", function(event){
    if (event.target === input && event.key === "Enter"){
      event.preventDefault();
      event.stopImmediatePropagation();
      draft.textContent = "Draft kept locally. Send is unavailable; nothing was sent.";
      return;
    }
    var tab = event.target.closest && event.target.closest('[role="tab"]');
    if (tab && ["ArrowLeft","ArrowRight","Home","End"].indexOf(event.key) >= 0){
      event.preventDefault();
      var index = tabs.indexOf(tab);
      if (event.key === "Home") index = 0;
      else if (event.key === "End") index = tabs.length - 1;
      else index = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[index].click(); tabs[index].focus(); syncTabs();
    }
  }, true);

  function syncTabs(){
    tabs.forEach(function(tab){ tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1; });
  }

  function isMobile(){ return window.matchMedia("(max-width:640px)").matches; }
  var lastInvoker = askNova;
  function closeSupport(){
    if (vp.dataset.nova === "open") askNova.click();
    syncPlacement();
    window.setTimeout(function(){ lastInvoker.focus(); }, 0);
  }
  close.addEventListener("click", closeSupport);
  scrim.addEventListener("click", closeSupport);

  function focusables(){
    return Array.prototype.slice.call(side.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]'))
      .filter(function(el){ return !el.hidden && el.getClientRects().length; });
  }
  document.addEventListener("keydown", function(event){
    if (!isMobile() || vp.dataset.nova !== "open") return;
    if (event.key === "Escape"){
      event.preventDefault(); closeSupport(); return;
    }
    if (event.key !== "Tab") return;
    var items = focusables(); if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first){ event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last){ event.preventDefault(); first.focus(); }
  });

  var wasModal = false;
  function syncPlacement(){
    var open = vp.dataset.nova === "open";
    var modal = open && isMobile();
    var supportVisible = (open && vp.dataset.mode !== "class")
      || (vp.dataset.mode === "study" && !isMobile());
    scrim.hidden = !modal;
    document.body.classList.toggle("contract-modal-open", modal);
    side.setAttribute("role", modal ? "dialog" : "complementary");
    if (modal) side.setAttribute("aria-modal", "true"); else side.removeAttribute("aria-modal");
    side.inert = !supportVisible;
    side.setAttribute("aria-hidden", supportVisible ? "false" : "true");
    [vp.querySelector(".spine"), vp.querySelector(".stagecol")].forEach(function(el){
      if (el) el.inert = modal;
    });
    if (modal && !wasModal) window.setTimeout(function(){ close.focus(); }, 0);
    wasModal = modal;
    syncTabs();
  }
  new MutationObserver(syncPlacement).observe(vp, {attributes:true,attributeFilter:["data-mode","data-nova"]});
  window.addEventListener("resize", syncPlacement);
  syncTabs(); syncPlacement();
})();
</script>
`;

  const outputPath = join(pagesDir, "help-math-player-support-contract.html");
  writeFileSync(outputPath, `${source}\n${overlay}\n</body>\n</html>\n`, "utf8");
  return {
    id: "help-math-player-support-contract",
    target: "pages/help-math-player-support-contract.html",
    bytes: statSync(outputPath).size,
    sha256: sha256File(outputPath),
    dependencyStatus: "derived-from-current-support-files",
    sourceCandidate: "pages/help-math-player.html",
  };
}

mkdirSync(pagesDir, { recursive: true });
const results = configs.map(replay);
results.push(createSupportContractPlayer());
writeFileSync(
  join(packageDir, "replay-results.json"),
  `${JSON.stringify({ schemaVersion: 1, results }, null, 2)}\n`,
  "utf8",
);
for (const result of results) {
  process.stdout.write(`${result.target}\t${result.bytes}\t${result.sha256}\n`);
}
