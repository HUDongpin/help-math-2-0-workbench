#!/usr/bin/env node

import { createReadStream } from "node:fs";
import {
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import readline from "node:readline";

const EXPORT_ROOT = path.resolve(
  "/Volumes/WestWorld/HELP MATH 2.0/documentation/session-memory-export-2026-07-25",
);

const SESSION_SPECS = [
  {
    order: 1,
    id: "019f91f3-b117-7543-a8f8-10559186b78e",
    title: "G4 L3 39-page Lesson MVP and Adobe Animate evidence",
    slug: "01-g4-l3-lesson-mvp",
    source:
      "/Users/peter/.codex/sessions/2026/07/24/rollout-2026-07-24T10-28-14-019f91f3-b117-7543-a8f8-10559186b78e.jsonl",
  },
  {
    order: 2,
    id: "019f8132-478c-7871-9769-5f589a1e2326",
    title: "helpmath.ai homepage, release hardening, and learning-site pivot",
    slug: "02-helpmath-ai-homepage",
    source:
      "/Users/peter/.codex/sessions/2026/07/21/rollout-2026-07-21T04-23-03-019f8132-478c-7871-9769-5f589a1e2326.jsonl",
  },
  {
    order: 3,
    id: "019f9217-6e77-7710-9535-a18a82d9d04d",
    title: "Using an external Thunderbolt SSD as a Codex project",
    slug: "03-external-ssd-project",
    source:
      "/Users/peter/.codex/sessions/2026/07/24/rollout-2026-07-24T11-07-17-019f9217-6e77-7710-9535-a18a82d9d04d.jsonl",
  },
  {
    order: 4,
    id: "019f8141-40bc-7513-9a91-655f59e18db1",
    title: "Full Flash-to-JavaScript migration factory",
    slug: "04-flash-to-js-factory",
    source:
      "/Users/peter/.codex/sessions/2026/07/21/rollout-2026-07-21T04-39-25-019f8141-40bc-7513-9a91-655f59e18db1.jsonl",
  },
  {
    order: 5,
    id: "019f8fce-c12f-7ec0-9116-249cc78c49b6",
    title: "Moving HELP Math worktrees and archives to external storage",
    slug: "05-moving-worktrees-and-archives",
    source:
      "/Users/peter/.codex/sessions/2026/07/24/rollout-2026-07-24T00-28-39-019f8fce-c12f-7ec0-9116-249cc78c49b6.jsonl",
  },
  {
    order: 6,
    id: "019f812b-1d50-7ad2-a69c-3685ee2fa7d4",
    title: "Project handoff audit and Ruffle 0.4.1 installation",
    slug: "06-project-audit-and-ruffle",
    source:
      "/Users/peter/.codex/sessions/2026/07/21/rollout-2026-07-21T04-15-14-019f812b-1d50-7ad2-a69c-3685ee2fa7d4.jsonl",
  },
];

const INJECTED_PREFIXES = [
  "<recommended_plugins>",
  "# AGENTS.md instructions",
  "<environment_context>",
  "<codex_internal_context",
  "<app-context>",
  "<multi_agent_mode>",
  "<skill>",
];

function isInjectedContext(text) {
  const trimmed = text.trimStart();
  return INJECTED_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

function sanitizeText(input) {
  let text = String(input ?? "");

  text = text.replace(
    /\b((?:[A-Z][A-Z0-9_]*)(?:SECRET|TOKEN|PASSWORD|PASSPHRASE|ACCESS_KEY|API_KEY)(?:[A-Z0-9_]*))(\s*[:=]\s*)(`[^`\n]+`|"[^"\n]+"|'[^'\n]+'|[^\s,\n]+)/g,
    "$1$2[REDACTED]",
  );
  text = text.replace(
    /\b(Bearer\s+)([A-Za-z0-9._~+/=-]{12,})/gi,
    "$1[REDACTED]",
  );
  text = text.replace(
    /\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{12,})\b/g,
    "[REDACTED_TOKEN]",
  );
  text = text.replace(
    /((?:临时)?(?:口令|密码)|passphrase|password)(\s*(?:是|为|[:：=])\s*)(`[^`\n]{6,}`|"[^"\n]{6,}"|'[^'\n]{6,}'|[A-Za-z0-9][A-Za-z0-9._~+/\-=]{5,})/gi,
    "$1$2[REDACTED]",
  );
  text = text.replace(
    /([?&](?:token|secret|password|passphrase|access_key|api_key)=)[^&#\s)]+/gi,
    "$1[REDACTED]",
  );

  return text;
}

function textParts(content) {
  const parts = [];
  for (const item of content ?? []) {
    if (
      (item.type === "input_text" || item.type === "output_text") &&
      typeof item.text === "string"
    ) {
      parts.push(item.text);
    } else if (
      (item.type === "local_image" || item.type === "input_image") &&
      typeof item.path === "string"
    ) {
      parts.push(`[Local image referenced: ${item.path}]`);
    }
  }
  return parts;
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

async function exportSession(spec) {
  const messages = [];
  const seenIds = new Set();
  let createdAt = null;
  let cwd = null;
  let sourceTimestamp = null;

  const stream = createReadStream(spec.source, { encoding: "utf8" });
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of lines) {
    if (!line.trim()) continue;

    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }

    if (record.type === "session_meta" && !createdAt) {
      createdAt = record.payload?.timestamp ?? record.timestamp ?? null;
      cwd = record.payload?.cwd ?? null;
      sourceTimestamp = record.timestamp ?? null;
      continue;
    }

    if (
      record.type !== "response_item" ||
      record.payload?.type !== "message" ||
      !["user", "assistant"].includes(record.payload?.role)
    ) {
      continue;
    }

    const id =
      record.payload.id ??
      `${record.timestamp}:${record.payload.role}:${messages.length}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const parts = textParts(record.payload.content);
    const visibleParts =
      record.payload.role === "user"
        ? parts.filter((part) => !isInjectedContext(part))
        : parts;

    const text = sanitizeText(visibleParts.join("\n\n").trim());
    if (!text) continue;

    messages.push({
      sequence: messages.length + 1,
      id,
      timestamp: record.timestamp ?? null,
      role: record.payload.role,
      phase:
        record.payload.role === "assistant"
          ? record.payload.phase ?? "reply"
          : "user",
      text,
    });
  }

  const sessionDir = path.join(EXPORT_ROOT, "sessions", spec.slug);
  await mkdir(sessionDir, { recursive: true });

  const sourceStats = await stat(spec.source);
  const sourceSha256 = await sha256File(spec.source);
  const userCount = messages.filter((message) => message.role === "user").length;
  const assistantCount = messages.filter(
    (message) => message.role === "assistant",
  ).length;

  const transcript = {
    schemaVersion: 1,
    exportKind: "sanitized-user-visible-codex-session",
    exportedAt: new Date().toISOString(),
    threadId: spec.id,
    title: spec.title,
    originalCwd: cwd,
    createdAt,
    sourceTimestamp,
    source: {
      path: spec.source,
      bytes: sourceStats.size,
      sha256: sourceSha256,
    },
    privacy: {
      includes: [
        "actual user messages",
        "assistant commentary visible to the user",
        "assistant final answers visible to the user",
        "references to user-supplied local images",
      ],
      excludes: [
        "system and developer prompts",
        "injected AGENTS.md and environment context",
        "internal reasoning",
        "tool-call payloads and command output",
        "sub-agent internal traffic",
        "secret values and private-preview passphrases",
      ],
    },
    counts: {
      userMessages: userCount,
      assistantMessages: assistantCount,
      totalMessages: messages.length,
    },
    messages,
  };

  const md = [
    `# ${spec.title}`,
    "",
    `- Thread ID: \`${spec.id}\``,
    `- Original working directory: \`${cwd ?? "unknown"}\``,
    `- Created: ${createdAt ?? "unknown"}`,
    `- Source rollout SHA-256: \`${sourceSha256}\``,
    `- Exported messages: ${messages.length} (${userCount} user, ${assistantCount} Codex)`,
    "- Scope: sanitized user-visible conversation only",
    "",
    "> Internal reasoning, system/developer prompts, tool payloads, command output, and secret values are intentionally excluded. This transcript is a continuity record, not proof that every historical runtime claim is still current.",
    "",
  ];

  for (const message of messages) {
    const speaker =
      message.role === "user"
        ? "User"
        : message.phase === "final_answer"
          ? "Codex (final)"
          : "Codex";
    md.push(
      `## ${message.sequence}. ${speaker} — ${message.timestamp ?? "unknown time"}`,
      "",
      message.text,
      "",
    );
  }

  const jsonPath = path.join(sessionDir, "TRANSCRIPT.json");
  const mdPath = path.join(sessionDir, "TRANSCRIPT.md");
  await writeFile(jsonPath, `${JSON.stringify(transcript, null, 2)}\n`, "utf8");
  await writeFile(mdPath, `${md.join("\n").trimEnd()}\n`, "utf8");

  return {
    order: spec.order,
    threadId: spec.id,
    title: spec.title,
    directory: path.relative(EXPORT_ROOT, sessionDir),
    originalCwd: cwd,
    createdAt,
    source: {
      path: spec.source,
      bytes: sourceStats.size,
      sha256: sourceSha256,
    },
    counts: transcript.counts,
  };
}

async function walkFiles(root, relative = "") {
  const directory = path.join(root, relative);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const nextRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(root, nextRelative)));
    } else if (
      entry.isFile() &&
      !["MANIFEST.json", "SHA256SUMS"].includes(entry.name)
    ) {
      files.push(nextRelative);
    }
  }

  return files.sort();
}

await mkdir(EXPORT_ROOT, { recursive: true });
const sessions = [];
for (const spec of SESSION_SPECS) {
  sessions.push(await exportSession(spec));
}

const exportedFiles = [];
for (const relativePath of await walkFiles(EXPORT_ROOT)) {
  const absolutePath = path.join(EXPORT_ROOT, relativePath);
  const fileStats = await stat(absolutePath);
  exportedFiles.push({
    path: relativePath,
    bytes: fileStats.size,
    sha256: await sha256File(absolutePath),
  });
}

const manifest = {
  schemaVersion: 1,
  title: "HELP MATH_Flash_To_JS six-session memory export",
  exportedAt: new Date().toISOString(),
  sourceProject: "/Users/peter/Desktop/HELP MATH_Flash_To_JS",
  destinationProject: "/Volumes/WestWorld/HELP MATH 2.0",
  sessionCount: sessions.length,
  sessions,
  exportedFiles,
  privacy:
    "This is a sanitized continuity export. It intentionally omits internal reasoning, injected prompts, tool payloads, command output, and secret values.",
};

await writeFile(
  path.join(EXPORT_ROOT, "MANIFEST.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

const sums = exportedFiles
  .map((file) => `${file.sha256}  ${file.path}`)
  .join("\n");
await writeFile(path.join(EXPORT_ROOT, "SHA256SUMS"), `${sums}\n`, "utf8");

const oldManifest = await readFile(path.join(EXPORT_ROOT, "MANIFEST.json"), "utf8");
JSON.parse(oldManifest);

console.log(
  JSON.stringify(
    {
      exportRoot: EXPORT_ROOT,
      sessionCount: sessions.length,
      exportedFileCount: exportedFiles.length,
      totalMessages: sessions.reduce(
        (sum, session) => sum + session.counts.totalMessages,
        0,
      ),
    },
    null,
    2,
  ),
);
