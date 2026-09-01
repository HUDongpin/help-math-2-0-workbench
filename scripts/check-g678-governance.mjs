#!/usr/bin/env node

/** Check the G6-G8 named-human capacity gate without inventing identities. */
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_INPUT = "catalog/g678-review-governance.v1.json";
const EXPECTED_ROLES = new Set([
  "product-owner", "migration-lead", "factory-toolchain-engineer", "integration-engineer",
  "qa-strict-authority", "authorized-original-runtime-operator", "math-ccss-reviewer",
  "spanish-reviewer", "audio-reviewer", "independent-visual-reviewer", "owner-approver",
  "release-custodian",
]);

function parseArgs(argv) {
  const options = {input: DEFAULT_INPUT};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") return {help: true};
    if (arg === "--input") {
      if (++index >= argv.length) throw new Error("--input requires a value");
      options.input = argv[index];
      continue;
    }
    if (arg === "--check") continue;
    throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

export function evaluateGovernance(value) {
  const errors = [];
  if (value?.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (value?.artifactType !== "help-math-g678-review-governance") errors.push("artifactType mismatch");
  if (value?.governanceId !== "g678-review-governance-v1") errors.push("governanceId mismatch");
  if (value?.scope?.profileId !== "g678-shared-source-profile-v1" ||
    value?.scope?.mappingVersion !== "ccss-math-2010-v1" ||
    value?.scope?.lessonCount !== 44 ||
    value?.scope?.activePagePlacementCount !== 2282 ||
    value?.scope?.legacyCourseShellExcluded !== true) {
    errors.push("governance scope is not bound to the G6-G8 page-only contract");
  }
  const roles = Array.isArray(value?.requiredRoles) ? value.requiredRoles : [];
  const roleNames = new Set(roles.map((role) => role?.role));
  for (const role of EXPECTED_ROLES) if (!roleNames.has(role)) errors.push(`missing role: ${role}`);
  if (roleNames.size !== EXPECTED_ROLES.size) errors.push("unexpected duplicate or extra role");
  const assignmentBlockers = [];
  const byRole = new Map(roles.map((role) => [role?.role, role]));
  const minimumHours = {
    "product-owner": [4, 0],
    "migration-lead": [8, 4],
    "factory-toolchain-engineer": [8, 4],
    "integration-engineer": [8, 4],
    "qa-strict-authority": [8, 4],
    "authorized-original-runtime-operator": [20, 8],
    "math-ccss-reviewer": [8, 4],
    "spanish-reviewer": [8, 4],
    "audio-reviewer": [8, 4],
    "independent-visual-reviewer": [8, 4],
    "owner-approver": [4, 2],
    "release-custodian": [4, 2],
  };
  for (const role of roles) {
    if (!role?.primary) assignmentBlockers.push(`${role?.role ?? "unknown"}:primary-missing`);
    if (!role?.backup && Number(role?.minimumHoursPerWeek?.backup ?? 0) > 0) assignmentBlockers.push(`${role?.role ?? "unknown"}:backup-missing`);
    if (role?.primary && role?.backup && role.primary === role.backup) assignmentBlockers.push(`${role.role}:primary-backup-must-differ`);
    const expectedHours = minimumHours[role?.role];
    const actualHours = role?.minimumHoursPerWeek;
    if (expectedHours && (!actualHours || Number(actualHours.primary) !== expectedHours[0] ||
      Number(actualHours.backup) !== expectedHours[1])) {
      errors.push(`${role?.role ?? "unknown"}:minimum-hours-contract-drift`);
    }
  }
  const assignment = (roleName, person) => byRole.get(roleName)?.[person] ?? null;
  const implementationRoles = ['migration-lead', 'factory-toolchain-engineer', 'integration-engineer'];
  const independenceSensitiveRoles = [
    ['qa-strict-authority', 'qa-strict-authority-must-be-independent-from-implementation'],
    ['authorized-original-runtime-operator', 'authorized-original-runtime-operator-cannot-self-sign-implementation'],
    ['spanish-reviewer', 'spanish-reviewer-must-be-separate-from-implementation-author'],
    ['independent-visual-reviewer', 'independent-visual-reviewer-must-not-be-implementation-author'],
  ];
  for (const [reviewRole, blocker] of independenceSensitiveRoles) {
    const reviewer = assignment(reviewRole, 'primary');
    if (reviewer && implementationRoles.some((implementationRole) =>
      reviewer === assignment(implementationRole, 'primary'))) {
      assignmentBlockers.push(blocker);
    }
  }
  const owner = assignment('owner-approver', 'primary');
  for (const professionalRole of ['math-ccss-reviewer', 'spanish-reviewer', 'audio-reviewer', 'independent-visual-reviewer']) {
    if (owner && owner === assignment(professionalRole, 'primary')) {
      assignmentBlockers.push('owner-approver-must-be-separate-from-professional-reviewers');
    }
  }
  if (value?.budget?.currency !== "USD" ||
    value?.budget?.weeklyCap === null ||
    !Number.isFinite(Number(value?.budget?.weeklyCap)) || Number(value?.budget?.weeklyCap) <= 0 ||
    typeof value?.budget?.procurementOwner !== "string" || !value.budget.procurementOwner.trim()) {
    assignmentBlockers.push("budget-or-procurement-cap-missing");
  }
  for (const blocker of Array.isArray(value?.blockers) ? value.blockers : []) {
    if (typeof blocker === "string" && blocker.trim() && !assignmentBlockers.includes(blocker.trim())) {
      assignmentBlockers.push(blocker.trim());
    }
  }
  if (value?.m0Exit !== false) errors.push("m0Exit must remain false until assignments and controls are verified");
  const acceptanceEffects = value?.acceptanceEffects;
  if (!acceptanceEffects || Object.values(acceptanceEffects).some((entry) => entry !== false)) {
    errors.push("governance acceptance effects must remain false");
  }
  return {
    status: errors.length ? "invalid" : assignmentBlockers.length ? "blocked" : "ready-for-m0",
    errors,
    blockers: [...new Set(assignmentBlockers)],
    roleCount: roles.length,
    m0Exit: Boolean(value?.m0Exit),
  };
}

export async function run(input = DEFAULT_INPUT) {
  const filePath = path.isAbsolute(input) ? input : path.resolve(PROJECT_ROOT, input);
  const value = JSON.parse(await readFile(filePath, "utf8"));
  const result = evaluateGovernance(value);
  if (result.errors.length) throw new Error(result.errors.join("; "));
  return { ...result, input: path.relative(PROJECT_ROOT, filePath).split(path.sep).join("/") };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log("Usage: node scripts/check-g678-governance.mjs --check [--input <file>]");
    else console.log(JSON.stringify(await run(options.input), null, 2));
  } catch (error) {
    console.error(JSON.stringify({status: "error", message: error.message}, null, 2));
    process.exitCode = 1;
  }
}
