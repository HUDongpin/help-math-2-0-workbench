#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const notes = [];

const requiredFiles = [
  "AGENTS.md",
  "README.md",
  "docs/TOOLING.md",
  "documentation/skill-forward-test.md",
  "skills/flash-to-js/SKILL.md",
  "skills/flash-to-js/agents/openai.yaml",
  ".agents/skills/flash-to-js/SKILL.md",
  ".agents/skills/flash-to-js/agents/openai.yaml",
  "skills/flash-to-js/references/swf-audit.md",
  "skills/flash-to-js/references/fidelity-validation.md",
  "skills/flash-to-js/scripts/validate_migration.mjs",
  "scripts/build-completion-ledger.mjs",
  "catalog/completion-ledger.json",
  "templates/flash-migration/migration.json",
  "templates/flash-migration/MIGRATION_BRIEF.md",
  "templates/flash-migration/asset-inventory.csv",
  "templates/flash-migration/keyframes.csv",
  "templates/flash-migration/ACCEPTANCE_CHECKLIST.md",
  "scripts/create-flash-migration.mjs",
  "scripts/capture-animation-keyframes.mjs",
  "scripts/compare-images.mjs",
  ".nvmrc",
];

for (const file of requiredFiles) {
  if (!existsSync(path.join(projectRoot, file))) errors.push(`Missing required workbench file: ${file}`);
}

function read(relative) {
  return readFileSync(path.join(projectRoot, relative), "utf8");
}

if (!errors.length) {
  const skill = read("skills/flash-to-js/SKILL.md");
  if (!/^---\nname: flash-to-js\ndescription: .+\n---/s.test(skill)) errors.push("SKILL.md frontmatter is invalid");
  if (/\bTODO\b|\[TODO/i.test(skill)) errors.push("SKILL.md still contains TODO placeholders");
  for (const reference of ["references/swf-audit.md", "references/fidelity-validation.md"]) {
    if (!skill.includes(reference)) errors.push(`SKILL.md does not route Codex to ${reference}`);
  }

  const agentMetadata = read("skills/flash-to-js/agents/openai.yaml");
  if (!agentMetadata.includes("$flash-to-js")) errors.push("agents/openai.yaml default prompt must mention $flash-to-js");
  const discoverySkill = read(".agents/skills/flash-to-js/SKILL.md");
  if (!discoverySkill.includes("../../../skills/flash-to-js/SKILL.md")) errors.push("Project discovery skill does not route to the canonical skill");

  const agents = read("AGENTS.md");
  for (const required of ["skills/flash-to-js/SKILL.md", "npm run doctor", "npm run scaffold:migration", "normalized RMSE"]) {
    if (!agents.includes(required)) errors.push(`AGENTS.md is missing required instruction: ${required}`);
  }

  const template = read("templates/flash-migration/migration.json");
  JSON.parse(template);
  for (const token of ["{{ANIMATION_ID}}", "{{CREATED_DATE}}", "{{FLA_PATH}}", "{{SWF_PATH}}"] ) {
    if (!template.includes(token)) errors.push(`Migration template is missing token: ${token}`);
  }

  const packageJson = JSON.parse(read("package.json"));
  for (const script of ["doctor", "verify:workbench", "scaffold:migration", "capture:keyframes", "compare:frames", "ledger:build", "ledger:check"]) {
    if (!packageJson.scripts?.[script]) errors.push(`package.json is missing script: ${script}`);
  }
  for (const dependency of ["@playwright/test", "pixelmatch", "pngjs"]) {
    if (!packageJson.devDependencies?.[dependency]) errors.push(`package.json is missing devDependency: ${dependency}`);
  }

  const flashAssets = path.join(projectRoot, "source-assets", "flash");
  const sourceFiles = existsSync(flashAssets) ? readdirSync(flashAssets) : [];
  if (!sourceFiles.some((name) => name.toLowerCase().endsWith(".fla"))) errors.push("No preserved FLA source found");
  if (!sourceFiles.some((name) => name.toLowerCase().endsWith(".swf"))) errors.push("No preserved SWF source found");
  notes.push(`${sourceFiles.filter((name) => /\.(fla|swf)$/i.test(name)).length} preserved Flash source file(s)`);

  const ledger = JSON.parse(read("catalog/completion-ledger.json"));
  if (ledger.schemaVersion !== 1 || !Array.isArray(ledger.entries) || !Number.isInteger(ledger.summary?.strictComplete)) {
    errors.push("catalog/completion-ledger.json is malformed");
  }
  const ledgerCheck = spawnSync(process.execPath, [path.join(projectRoot, "scripts", "build-completion-ledger.mjs"), "--check"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (ledgerCheck.status !== 0) {
    errors.push((ledgerCheck.stdout || ledgerCheck.stderr || "Completion ledger check failed").trim());
  } else notes.push("strict completion ledger is current");
}

if (errors.length) {
  console.error("Flash-to-JavaScript workbench verification failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Flash-to-JavaScript workbench verification passed.");
  for (const note of notes) console.log(`- ${note}`);
  console.log(`- ${requiredFiles.length} required workbench artifact(s) present`);
}
