#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(packageDir, "../../..");
const replay = JSON.parse(readFileSync(join(packageDir, "replay-results.json"), "utf8"));

const sha256 = (filePath) => createHash("sha256").update(readFileSync(filePath)).digest("hex");
const size = (filePath) => statSync(filePath).size;
const rel = (filePath) => relative(repoRoot, filePath).split("/").join("/");
const packageRel = (filePath) => relative(packageDir, filePath).split("/").join("/");
const git = (...args) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();

const supportDefinitions = [
  ["apps/web/lib/whole-lesson-host-presentation.ts", "presentation-contract"],
  ["apps/web/lib/tutor-integration.ts", "nova-context-and-transport-contract"],
  ["apps/web/lib/reviewer-instrumentation.ts", "reviewer-boundary-contract"],
  ["apps/web/e2e/modern-wide-geometry.spec.ts", "geometry-browser-specification"],
  ["apps/web/e2e/prototype-acceptance.spec.ts", "interaction-browser-specification"],
  ["apps/web/e2e/canvas-sharpness.spec.ts", "canvas-sharpness-specification"],
  ["apps/web/tests/whole-lesson-host-presentation.test.ts", "presentation-unit-specification"],
  ["apps/web/tests/tutor-integration.test.ts", "nova-unit-specification"],
  ["apps/web/tests/reviewer-instrumentation.test.ts", "reviewer-unit-specification"],
];

const supportInputs = supportDefinitions.map(([repoPath, role]) => {
  const filePath = join(repoRoot, repoPath);
  const status = git("status", "--short", "--untracked-files=all", "--", repoPath) || "clean";
  return {
    path: repoPath,
    role,
    bytes: size(filePath),
    sha256: sha256(filePath),
    gitState: status.slice(0, 2).trim() || "clean",
    provenanceWarning: "Current untracked contents may include post-session work; hash is a dated reconstruction input, not authenticated Claude authorship.",
  };
});

const sessionDefinitions = [
  ["cbc8e710-7ea3-4ebd-8762-52ab1dbe9ff1", "g4-ui-review"],
  ["6108448b-a94e-4ca2-80b4-8c4ce4aafa01", "geometry-and-lesson-player"],
  ["4bf1a363-505f-4317-9701-b9e52a6b1cad", "platform-kids-soft"],
  ["7d8795f3-8832-4a06-bb35-357338b120ec", "identity"],
];
const claudeDir = join(homedir(), ".claude/projects/-Volumes-WestWorld-HELP-MATH-2-0");
const sessionLedgers = sessionDefinitions.map(([sessionId, role]) => {
  const filePath = join(claudeDir, `${sessionId}.jsonl`);
  return {
    sessionId,
    role,
    sourceLocation: `~/.claude/projects/-Volumes-WestWorld-HELP-MATH-2-0/${sessionId}.jsonl`,
    bytes: size(filePath),
    sha256: sha256(filePath),
    copiedIntoPackage: false,
  };
});

const replayById = Object.fromEntries(replay.results.map((item) => [item.id, item]));
const artifactDefinitions = [
  {
    id: "help-math-player-support-contract",
    title: "Lesson player current-support-contract derivative",
    originalScratchFilename: null,
    artifactUrl: null,
    artifactVersion: null,
    output: "pages/help-math-player-support-contract.html",
    status: "DERIVED_FROM_CURRENT_SUPPORT_FILES",
    basis: ["pages/help-math-player.html", ...supportDefinitions.map(([file]) => file)],
    knownDifferences: ["Not a historical Claude artifact", "Provider behavior changed to offline fail-closed", "Adds current mobile modal and keyboard behavior"],
  },
  {
    id: "help-math-player",
    title: "HELP Math 2.0 Lesson Player with Nova Tutor",
    originalScratchFilename: "help-math-player.html",
    artifactUrl: "https://claude.ai/code/artifact/2e0e81e3-78eb-485f-9bd0-43881bf9bf25",
    artifactVersion: "1786123442-521f",
    output: "pages/help-math-player.html",
    status: "DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE",
    basis: [sessionLedgers[1].sourceLocation, "apps/web/public/flash-assets/courses/shell-course-g04-l03-index-local/root-frames/frame-0049.png"],
    knownDifferences: ["No final published-artifact SHA-256 survives for comparison", "Historical tutor replies are local scripted simulation"],
  },
  {
    id: "helpmath-2-ui",
    title: "HELP Math 2.0 Whole-platform UI",
    originalScratchFilename: "helpmath-2-ui.html",
    artifactUrl: "https://claude.ai/code/artifact/deee5744-d302-4667-8d4c-4a074d53bc6b",
    artifactVersion: "1786242412-6395",
    output: "pages/helpmath-2-ui.html",
    status: "DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE",
    basis: [sessionLedgers[2].sourceLocation],
    knownDifferences: ["No final published-artifact SHA-256 survives for comparison"],
  },
  {
    id: "helpmath-2-kids",
    title: "HELP Math 2.0 Kid-first UI direction",
    originalScratchFilename: "helpmath-2-kids.html",
    artifactUrl: "https://claude.ai/code/artifact/da8b6d63-3ee8-46a1-97f6-03aeaa14534d",
    artifactVersion: "1786375306-1db1",
    output: "pages/helpmath-2-kids.html",
    status: "DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE",
    basis: [sessionLedgers[2].sourceLocation],
    knownDifferences: ["No final published-artifact SHA-256 survives for comparison"],
  },
  {
    id: "helpmath-2-soft",
    title: "HELP Math 2.0 Soft UI direction",
    originalScratchFilename: "helpmath-2-soft.html",
    artifactUrl: "https://claude.ai/code/artifact/5eba322d-47d5-485e-b038-35376bc03090",
    artifactVersion: "1786381772-3f53",
    output: "pages/helpmath-2-soft.html",
    status: "DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE",
    basis: [sessionLedgers[2].sourceLocation],
    knownDifferences: ["No final published-artifact SHA-256 survives for comparison"],
  },
  {
    id: "helpmath-identity",
    title: "HELP Math 2.0 Identity",
    originalScratchFilename: "helpmath-identity.html",
    artifactUrl: "https://claude.ai/code/artifact/f5d75bd4-cfb5-4391-bc63-93f6965cde51",
    artifactVersion: "1786415175-f87c",
    output: "pages/helpmath-identity.html",
    status: "DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE",
    basis: [sessionLedgers[3].sourceLocation, "design/brand/*.svg (ten hash-bound inputs)"],
    knownDifferences: ["Regenerated from recovered builder and surviving inputs", "No final published-artifact SHA-256 survives for comparison"],
  },
  {
    id: "g4-ui-review",
    title: "Grade 4 control-surface review",
    originalScratchFilename: "g4-ui-review.html",
    artifactUrl: "https://claude.ai/code/artifact/3fda4104-1afb-4852-a5f1-2ccd018e30f8",
    artifactVersion: "1786031894-656e",
    output: "pages/g4-ui-review.html",
    status: "STRUCTURALLY_RECOVERED_WITH_REPLACED_EMBED",
    basis: [sessionLedgers[0].sourceLocation, "output/playwright/whole-lesson-responsive-transport-2026-07-29/g4-l3-desktop-1366x768.png"],
    knownDifferences: ["Original 263146-byte small-chromebook.png is missing", "Replacement screenshot changes candidate bytes and does not align perfectly with historical annotations"],
  },
  {
    id: "help-math-ui-geometry",
    title: "HELP Math lesson-player geometry study",
    originalScratchFilename: "help-math-ui-geometry.html",
    artifactUrl: null,
    artifactVersion: null,
    output: "pages/help-math-ui-geometry.html",
    status: "DETERMINISTIC_TRANSCRIPT_REPLAY_CANDIDATE",
    basis: [sessionLedgers[1].sourceLocation],
    knownDifferences: ["Intermediate study was not published as a Claude artifact"],
  },
];

const artifacts = artifactDefinitions.map((item) => {
  const result = replayById[item.id];
  const outputPath = join(packageDir, item.output);
  return {
    ...item,
    candidateBytes: result?.bytes ?? size(outputPath),
    candidateSha256: result?.sha256 ?? sha256(outputPath),
    publishedArtifactSha256: null,
    remoteCurrentCheck: item.artifactUrl ? "unavailable-in-active-claude-organization-2026-08-12" : "not-applicable",
    productionIntegrated: false,
    qaDisposition: "see-QA.md",
  };
});

const dependencyDefinitions = [
  ["apps/web/public/flash-assets/courses/shell-course-g04-l03-index-local/root-frames/frame-0049.png", "tracked lesson chrome embedded by the player"],
  ["output/playwright/whole-lesson-responsive-transport-2026-07-29/g4-l3-desktop-1366x768.png", "replacement image for the missing Grade 4 review screenshot"],
  ...[
    "helpmath2-logo-primary.svg",
    "helpmath2-mark.svg",
    "helpmath2-mark-small.svg",
    "helpmath2-favicon.svg",
    "helpmath2-mark-mono-ink.svg",
    "helpmath2-mark-mono-knockout.svg",
    "helpmath2-lockup-horizontal.svg",
    "helpmath2-lockup-horizontal-dark.svg",
    "helpmath2-concept-b-open-palm.svg",
    "helpmath2-concept-c-counting-constellation.svg",
  ].map((name) => [`design/brand/${name}`, "identity-page SVG input"]),
];
const dependencies = dependencyDefinitions.map(([repoPath, role]) => {
  const filePath = join(repoRoot, repoPath);
  return { path: repoPath, role, bytes: size(filePath), sha256: sha256(filePath) };
});

function collectFiles(dir) {
  const found = [];
  for (const name of readdirSync(dir).sort()) {
    const filePath = join(dir, name);
    const info = statSync(filePath);
    if (info.isDirectory()) found.push(...collectFiles(filePath));
    else if (name !== ".DS_Store" && name !== "reconstruction-manifest.json") found.push(filePath);
  }
  return found;
}

const mediaTypes = {
  ".html": "text/html",
  ".md": "text/markdown",
  ".mjs": "text/javascript",
  ".json": "application/json",
};
const files = collectFiles(packageDir).map((filePath) => ({
  path: packageRel(filePath),
  mediaType: mediaTypes[extname(filePath)] ?? "application/octet-stream",
  bytes: size(filePath),
  sha256: sha256(filePath),
  generated: ["pages/", "replay-results.json"].some((prefix) => packageRel(filePath).startsWith(prefix)),
}));

const manifest = {
  schemaVersion: 1,
  packageId: "helpmath-claude-ui-reconstructions-2026-08-08",
  title: "HELP Math 2.0 Claude UI Reconstructions",
  authoredRange: "2026-08-06/2026-08-11",
  reconstructedAt: new Date().toISOString(),
  authority: "reconstruction-only",
  reconstructionCheckout: {
    cwd: repoRoot,
    branch: git("branch", "--show-current"),
    head: git("rev-parse", "HEAD"),
    dirty: Boolean(git("status", "--short")),
  },
  claimBoundary: {
    originalPublishedBytesConfirmed: false,
    productionIntegrated: false,
    deployed: false,
    flashFidelityEstablished: false,
    audioAccepted: false,
    novaProviderConnected: false,
    privacyOrDataGovernanceApproved: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictCompletion: false,
    releaseAuthorized: false,
    published: false,
  },
  supportInputs,
  sessionLedgers,
  dependencies,
  artifacts,
  files,
  manifestSelfHash: null,
  manifestSelfHashReason: "The manifest is excluded from its own file inventory to avoid a self-referential digest.",
};

writeFileSync(join(packageDir, "reconstruction-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
process.stdout.write(`reconstruction-manifest.json\t${artifacts.length} artifacts\t${files.length} payload files\n`);
