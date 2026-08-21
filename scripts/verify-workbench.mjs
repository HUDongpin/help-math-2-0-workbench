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
  "skills/flash-to-js/references/source-intake.md",
  "skills/flash-to-js/references/swf-audit.md",
  "skills/flash-to-js/references/original-runtime-evidence.md",
  "skills/flash-to-js/references/fidelity-validation.md",
  "skills/flash-to-js/references/audio-and-review.md",
  "skills/flash-to-js/references/lesson-release.md",
  "skills/flash-to-js/references/factory-scaleout.md",
  "skills/flash-to-js/scripts/validate_migration.mjs",
  "scripts/build-completion-ledger.mjs",
  "scripts/build-lesson-release-ledger.mjs",
  "catalog/completion-ledger.json",
  "catalog/lesson-releases.json",
  "catalog/lesson-release-ledger.json",
  "templates/flash-migration/migration.json",
  "templates/flash-migration/MIGRATION_BRIEF.md",
  "templates/flash-migration/asset-inventory.csv",
  "templates/flash-migration/audio-inventory.csv",
  "templates/flash-migration/keyframes.csv",
  "templates/flash-migration/evidence/full-frame-coverage.json",
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

function requireText(content, expected, label) {
  if (!content.includes(expected)) errors.push(`${label} is missing required semantic contract: ${expected}`);
}

function rejectText(content, forbidden, label) {
  if (content.includes(forbidden)) errors.push(`${label} contains obsolete semantic contract: ${forbidden}`);
}

if (!errors.length) {
  const skill = read("skills/flash-to-js/SKILL.md");
  if (!/^---\nname: flash-to-js\ndescription: .+\n---/s.test(skill)) errors.push("SKILL.md frontmatter is invalid");
  if (/\bTODO\b|\[TODO/i.test(skill)) errors.push("SKILL.md still contains TODO placeholders");
  for (const reference of [
    "references/source-intake.md",
    "references/swf-audit.md",
    "references/original-runtime-evidence.md",
    "references/fidelity-validation.md",
    "references/audio-and-review.md",
    "references/lesson-release.md",
    "references/factory-scaleout.md",
  ]) {
    if (!skill.includes(reference)) errors.push(`SKILL.md does not route Codex to ${reference}`);
  }
  for (const contract of [
    "unregistered engineering candidate",
    "registered Current-JS product integration",
    "Count a page toward page-level Current-JS coverage only at state 3",
    "externally anchored production-trust path",
    "Ruffle is a versioned forensic reference",
    "assetId = swf-<full-sha256>",
    "audio-inventory.csv",
    "Keyframes are spot checks",
    "human visual review",
    "owner acceptance",
    "atomic lesson-release ledger",
    "Confirm the destination volume is writable and has safe free capacity",
    "npm run verify:sources",
    "never scaffold a second workspace from a filename alias",
  ]) requireText(skill, contract, "SKILL.md");
  for (const obsolete of [
    "establish Ruffle or Adobe baselines",
    "With FLA only, publish an untouched test SWF",
    "Host the untouched SWF on a dedicated Ruffle reference route",
  ]) rejectText(skill, obsolete, "SKILL.md");

  const agentMetadata = read("skills/flash-to-js/agents/openai.yaml");
  if (!agentMetadata.includes("$flash-to-js")) errors.push("agents/openai.yaml default prompt must mention $flash-to-js");
  requireText(agentMetadata, "Evidence-gated Flash migration to HTML5 JavaScript", "Canonical skill metadata");
  const shortDescription = agentMetadata.match(/short_description:\s+"([^"]+)"/)?.[1] || "";
  if (shortDescription.length < 25 || shortDescription.length > 64) errors.push("Canonical skill metadata short_description must contain 25-64 characters");
  for (const obsolete of ["faithful HTML5 builds", "rebuild it faithfully"]) rejectText(agentMetadata, obsolete, "Canonical skill metadata");
  const discoverySkill = read(".agents/skills/flash-to-js/SKILL.md");
  if (!discoverySkill.includes("../../../skills/flash-to-js/SKILL.md")) errors.push("Project discovery skill does not route to the canonical skill");
  rejectText(discoverySkill, "Ruffle baselines", "Project discovery skill");
  const discoveryAgentMetadata = read(".agents/skills/flash-to-js/agents/openai.yaml");
  if (discoveryAgentMetadata !== agentMetadata) errors.push("Canonical and discovery skill metadata must remain byte-identical");

  const tooling = read("docs/TOOLING.md");
  requireText(tooling, "## Supported Toolchain", "docs/TOOLING.md");
  requireText(tooling, "versioned forensic reference", "docs/TOOLING.md");
  rejectText(tooling, "Use Ruffle to observe legacy behavior and capture a versioned baseline.", "docs/TOOLING.md");

  const sourceIntake = read("skills/flash-to-js/references/source-intake.md");
  requireText(sourceIntake, "cannot replace a preserved shipped SWF", "Source-intake reference");
  requireText(sourceIntake, "Reuse the matching canonical workspace", "Source-intake reference");
  requireText(sourceIntake, "hash-bound, rollback-safe project intake transaction", "Source-intake reference");
  const runtimeEvidence = read("skills/flash-to-js/references/original-runtime-evidence.md");
  for (const contract of ["outbound networking is denied", "empty Flash SharedObject store", "one SWF in one fresh player process", "fresh storage-capacity preflight", "explicit owner approval"]) requireText(runtimeEvidence, contract, "Original-runtime reference");
  const audioAndReview = read("skills/flash-to-js/references/audio-and-review.md");
  requireText(audioAndReview, "all-keyframe-and-full-frame-diffs", "Audio and review reference");
  requireText(audioAndReview, "Keep audio listening, behavior, and product/accessibility evidence as separately bound gates", "Audio and review reference");
  const factoryScaleout = read("skills/flash-to-js/references/factory-scaleout.md");
  for (const contract of [
    "CONDITIONAL-GO-product",
    "registered-current-js",
    "every frozen slice page",
    "Do not convert the funnel into one ordinal status",
    "Candidate-to-registration yield",
    "authorized project-specific license review",
    "Do not hand-edit generated files",
  ]) requireText(factoryScaleout, contract, "Factory scale-out reference");

  const forwardTest = read("documentation/skill-forward-test.md");
  for (const contract of [
    "2026-07-26",
    "forensic reference",
    "current-JS",
    "original-runtime",
    "full-frame",
    "audio",
    "human visual",
    "owner",
    "strict complete",
    "lesson release",
  ]) requireText(forwardTest, contract, "Current skill forward test");
  rejectText(forwardTest, "Proposed the correct scaffold, draft validator, swfmill audit, Ruffle baseline", "Current skill forward test");

  const agents = read("AGENTS.md");
  for (const required of ["skills/flash-to-js/SKILL.md", "npm run doctor", "npm run scaffold:migration", "normalized RMSE"]) {
    if (!agents.includes(required)) errors.push(`AGENTS.md is missing required instruction: ${required}`);
  }

  const template = read("templates/flash-migration/migration.json");
  const parsedTemplate = JSON.parse(template);
  for (const token of ["{{ANIMATION_ID}}", "{{CREATED_DATE}}", "{{FLA_PATH}}", "{{SWF_PATH}}"] ) {
    if (!template.includes(token)) errors.push(`Migration template is missing token: ${token}`);
  }
  if (parsedTemplate.forensicReference?.authority !== "forensic-only" || parsedTemplate.forensicReference?.renderer !== "Ruffle") {
    errors.push("Migration template must classify Ruffle as a forensic-only reference");
  }
  if (parsedTemplate.baseline?.renderer === "Ruffle") errors.push("Migration template must not preselect Ruffle as the authoritative baseline renderer");
  if (parsedTemplate.evidence?.audioInventory !== "audio-inventory.csv") errors.push("Migration template must bind audio-inventory.csv");
  if (parsedTemplate.evidence?.fullFrameCoverageFile !== "evidence/full-frame-coverage.json") errors.push("Migration template must bind coverage-v2 full-frame evidence");
  const coverageTemplate = JSON.parse(read("templates/flash-migration/evidence/full-frame-coverage.json"));
  if (coverageTemplate.schemaVersion !== 2 || !Array.isArray(coverageTemplate.requirements) || !coverageTemplate.requirements.length) {
    errors.push("Full-frame coverage template must contain coverage-v2 requirements");
  }
  const allowedAuthorityRequirements = new Set(["original-runtime-frame-accurate", "original-runtime-natural-trace"]);
  const templateDomains = new Map((parsedTemplate.implementation?.frameDomains || []).map((domain) => [domain.id, domain]));
  const templateScenarios = new Map((parsedTemplate.scenarios || []).map((scenario) => [scenario.id, scenario]));
  for (const requirement of coverageTemplate.requirements || []) {
    if (!allowedAuthorityRequirements.has(requirement.baselineAuthorityRequirement)) errors.push(`Coverage template requirement ${requirement.requirementId || "<missing>"} must fail closed on original-runtime authority`);
    const domain = templateDomains.get(requirement.frameDomainId);
    const scenario = templateScenarios.get(requirement.scenario);
    if ((domain?.kind === "nested" || scenario?.kind === "interactive") && requirement.baselineAuthorityRequirement !== "original-runtime-natural-trace") errors.push(`Coverage template requirement ${requirement.requirementId || "<missing>"} must use natural-trace authority for nested or interactive coverage`);
    if (requirement.baselineAuthority !== "unresolved" || requirement.status !== "pending") errors.push(`Coverage template requirement ${requirement.requirementId || "<missing>"} must start unresolved and pending`);
  }

  const brief = read("templates/flash-migration/MIGRATION_BRIEF.md");
  requireText(brief, "Separate Ruffle forensic-reference", "Migration brief template");
  requireText(brief, "Complete authoritative original-runtime and current-JS capture manifests", "Migration brief template");
  requireText(brief, "Owner accepted decision", "Migration brief template");
  const checklist = read("templates/flash-migration/ACCEPTANCE_CHECKLIST.md");
  requireText(checklist, "Ruffle capture is labeled forensic-only", "Acceptance checklist template");
  requireText(checklist, "named-human authorized-original-runtime listening", "Acceptance checklist template");
  requireText(checklist, "static keyframe and static full-frame metric", "Acceptance checklist template");
  requireText(checklist, "transition keyframe and transition full-frame metric", "Acceptance checklist template");
  rejectText(checklist, "original/Ruffle/Animate baseline", "Acceptance checklist template");
  rejectText(checklist, "lesson publication passes the atomic lesson-release ledger", "Acceptance checklist template");
  rejectText(checklist, "Owner review is hash-bound and accepted, or explicitly marked not required", "Acceptance checklist template");

  const packageJson = JSON.parse(read("package.json"));
  for (const script of ["doctor", "verify:workbench", "scaffold:migration", "capture:keyframes", "capture:coverage-v2", "compare:frames", "compare:full-frames", "ledger:build", "ledger:check", "release-ledger:build", "release-ledger:check"]) {
    if (!packageJson.scripts?.[script]) errors.push(`package.json is missing script: ${script}`);
  }
  for (const dependency of ["@playwright/test", "pixelmatch", "pngjs"]) {
    if (!packageJson.devDependencies?.[dependency]) errors.push(`package.json is missing devDependency: ${dependency}`);
  }

  const validator = read("skills/flash-to-js/scripts/validate_migration.mjs");
  requireText(validator, 'MIGRATION_VALIDATOR_VERSION = "3.1.0"', "Strict migration validator");
  requireText(validator, "${label}.decision must be accepted", "Strict migration validator");
  rejectText(validator, "allowNotRequired", "Strict migration validator");
  rejectText(validator, 'validateReview(manifest.acceptance?.ownerReview, "acceptance.ownerReview", { allowNotRequired: true }, errors);', "Strict migration validator");
  const templateValidation = spawnSync(
    process.execPath,
    [path.join(projectRoot, "skills", "flash-to-js", "scripts", "validate_migration.mjs"), path.join(projectRoot, "templates", "flash-migration"), "--allow-draft"],
    {cwd: projectRoot, encoding: "utf8"},
  );
  if (templateValidation.status !== 0) errors.push((templateValidation.stdout || templateValidation.stderr || "Migration template draft validation failed").trim());
  else notes.push("migration template passes validator 3.1.0 draft validation");

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

  const lessonReleases = JSON.parse(read("catalog/lesson-releases.json"));
  if (lessonReleases.schemaVersion !== 1 || !Array.isArray(lessonReleases.releases) || lessonReleases.releases.length < 1) {
    errors.push("catalog/lesson-releases.json is malformed");
  }
  const releaseLedger = JSON.parse(read("catalog/lesson-release-ledger.json"));
  if (
    releaseLedger.schemaVersion !== 1 ||
    !Array.isArray(releaseLedger.releases) ||
    !Number.isInteger(releaseLedger.summary?.publishedReleaseCount)
  ) {
    errors.push("catalog/lesson-release-ledger.json is malformed");
  }
  const releaseLedgerCheck = spawnSync(
    process.execPath,
    [path.join(projectRoot, "scripts", "build-lesson-release-ledger.mjs"), "--check"],
    {cwd: projectRoot, encoding: "utf8"},
  );
  if (releaseLedgerCheck.status !== 0) {
    errors.push((releaseLedgerCheck.stdout || releaseLedgerCheck.stderr || "Lesson release ledger check failed").trim());
  } else notes.push("atomic lesson release ledger is current");
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
