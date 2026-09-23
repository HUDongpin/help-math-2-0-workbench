#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants, createReadStream} from "node:fs";
import {access, chmod, copyFile, lstat, mkdtemp, mkdir, readFile, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {finalizeOne} from "./finalize-animate-authoring-audit.mjs";
import {buildGeneratedAuditScript, sha256} from "./probe-animate-jsfl-cli.mjs";
import {stageAnimateFlaCopies} from "./stage-animate-pilot-fla-copies.mjs";
import {
  assertConsumedG5L4Authorization,
  assertReplayLockStillBound,
} from "./lib/g5-l4-per-session-authorization-consumer.mjs";
import {
  buildAssistedControllerJsfl,
  buildDependencyGeneratedAuditScript,
  decodeFileUri,
  materializeDependencyLibraryShards,
  runAuthorizedLessonG4L10OneRowAudit as coreRunAuthorizedLessonG4L10OneRowAudit,
  runningAnimate,
  runChild,
  validateAssistedArtifacts,
} from "./lib/lesson-animate-authoring-audit-core.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_ANIMATE_BINARY =
  "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021";
const DEFAULT_WORK_ROOT = path.join(ROOT, "work", "animate", "human-assisted-fla-runs");
const DEFAULT_WORKING_COPY_ROOT = path.join(ROOT, "work", "animate", "read-only-fla-copies");
const DEFAULT_DEPENDENCY_ROOT = path.join(ROOT, "work", "animate", "dependency-authoring-audits");
const AUDIT_SCRIPT = path.join(ROOT, "scripts", "animate-audit-current-document.jsfl");
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const EVIDENCE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
const PROTECTED_G5_RELEASE_MANAGED_ID_PATTERN = /^(?:course|shell)-g05-l0[45]-/u;
const PROTECTED_G4_L10_RELEASE_MANAGED_ID_PATTERN = /^(?:course|shell)-g04-l10-/u;
const PROTECTED_G5_RELEASE_PER_SESSION_AUTHORIZATION_ERROR =
  "必须先实现并验证 hash-bound per-session authorization";
const PROTECTED_G4_L10_DEDICATED_RUNNER_ERROR =
  "G4 L10 full Animate execution requires the dedicated owner-authorized one-row runner";
const PROTECTED_G4_L10_SOURCE_ROOT_RELATIVE =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10";
const PROTECTED_G4_L10_SOURCE_SHA256 = new Set([
  "004d8dead784f263ee73417cbde2ee68206b338acba9d5dd7db420bff55af873",
  "06c69a007c8c9cd2d5b6a928a9a67e34774b4f0cfec7892bfc7c709a91bf1e03",
  "06ddeacfd5eb764f8b6f19c612fd6cfaee9d3661a2a4ea90579409ab6dc24c21",
  "08f5890a1175c72db509ce697d6aa0ec8e2e93e1ab8814cc3d021134aa64db14",
  "1eccb733544de8eb0fa718cac6a1792e2e58145c737f6170e56268fc212003f7",
  "2286f867a166f82fcd17382df7d4800c3d996d671f629d6ffec103fb9ce878fc",
  "235081c52ea65826abddf9691aa3af6af5bb38944755ff20d2c1040b279cccec",
  "2c809b81dedda337e6273197eaa29dcdd8275d16b250ed9a48837c3d1e0583e6",
  "2cd5470dacbf75e1a0799cb265a4cc6b4dd262db830abb5008cb0f689cf701d1",
  "2dcad2e8fa1bc6908ee6ebe555ceccf85b5fe7ac170b652aa092c74b14740722",
  "30a91bf0b0180ec312a59f4c21e033d45cebbb344a2ce2fee6c2a063943b80cd",
  "32a2905e40071d302cd350f09b0df8b4017550cbd93cac48648f5716dec4222d",
  "3c2895d3a6c80fa7968e124af398658c8b8cdf69e0453f6e85c231992a7fc4bb",
  "3eb3d315f9ff22ba08138ef6fdf64e7c64bcc66402afc5630a9c14a1c9c8b6f3",
  "4991dd4d87468d7c9162a88c94a15b8c7d251bc240e4c855b7b470976e887eb8",
  "4a5fc3b270f1222f336e80a08250fb7e347da6f498b0e00a374fecaee5ea92f1",
  "4a7f53072734b294da3df0dcbf8005779e5827ce393be814878ea7440cababaa",
  "4bd6c332318774ca1f4d1adeb7057733d96bc4287e9230901103930ac5fa55b8",
  "57830bd6780ce5a2caa320042c80238ad54eaa019f65ff07a1c2471dcae9caf4",
  "61c2b91cc84de4bb4a9a732e6c087512dc93785b28abdd1cb6b9cdd8595f1098",
  "6ab0100d0db4f3460fe71f836325cc821a5285b82ce470bfc961314a69ce7ef2",
  "6c39e74f67b6b1c678f5836fb204d750675118a46254facfae89c2455d66d726",
  "6c4261ad96af697f605d979f326db72617a139fbfa4b60474c6a211e7615059b",
  "6fc6b139221628b7035d42e404fe4de7420f9b487d2e64e63431ac096297a51b",
  "6ff6b55a0f97bdc333caa1d813619cf10ba8d7f07f265e325ccd191f8e0c58d1",
  "7ea410df6be541b7b3e2ad1632966c4c6fdab559a9a98ffe5478e8d8e89ad4fa",
  "7f089cf7aa466477a103341fca1bd87fde93fbb94eab32fdaac10f7b08a94d2c",
  "80cf93ffec52c4952d59ba6de46b7ed964eef65bdb35b0cc37bf80efa837d201",
  "8480ad793b8f1f02caea83bea16b9fb4f2e08f573df4f4d22d6362366fe657c1",
  "850ddbc1aeda20aa782d614a4ad44aae7e2ac8242b47fc27882860208c99d9ea",
  "852ef6a6f24e0666fe4d14d3bce63d0170f01c255c5f61e147db559895db032f",
  "8f05b9b8d81208b2e41cfca7eec979bab6995853ec9bc8f9a9db730d88eec33a",
  "8f0fe3a78ad9757b4388e0fd1f79e5e275914e5377d5e7be184ffa1779b63f95",
  "943ffc9f32773a0cde3063308cad86a206e992334ca9db8a908d71d573229795",
  "947bdac74507d8f1aa6903b90d7c7827d8a2a4aac04dbc97ad51a21ddcc8072c",
  "9630242fa590cfa2000fd5e68a329a5f48a935f216abb478f3922c74aa094aed",
  "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d",
  "96b00648f79801c9be8fed6ab422c6b6235c494b75533d80bd4a31e8b7ad3544",
  "96b4d947d94d89c9273dc96806cf93b38b5df0e2e78304cde540f89ce6a93759",
  "a46fa315148118d58a379a2d7b921684f5a0a210c72cae9433550e755ae42a81",
  "a75e16f8707676152626d272643820076316029f9b1aa2e5b9938cf5f853e1d3",
  "ad41ce348f5412f090598ef73154cec82aa54877c4f95af65495129f1309321f",
  "afa03a2a134bb5b1fe91fd3b2847b751cc65a07b0250940fca3a01e215976c39",
  "aff70f494bafa30e5d4b4fd9275126b5a731c0454e290e631816af72541911d4",
  "b0ad832f7d755e2f94dddc53e3267414c5d8430ed0e8c28d498cc5ec3c05160e",
  "b4f502e6b6d891ed6dfd39d345800e5e44f91524d0ebdd795530f52aadfb98fd",
  "b561dd6e3e1a7ea154094c9d4d58495c7b84111204394d5c97a5e87f362d68fa",
  "c0a5c9a6c4664dc8f077b92bfdc489aad6ea213811e85c3f6bba903b2d41ffc0",
  "c73eaa76438956aaac0aafd013e10ae7f3911b9a18b94047bf6b8bf4e27e229a",
  "c74b02b496c913d7d60cdad2c0667b426c582078b2a4fc7fc7a880a44209e2d5",
  "cb9881b4c6b790e4c1b13fa99ee3457b2d5438c261811d22d431b1fc0cefdaa4",
  "cd6aab7cfef2cc147778aea491b7a65744536396eec0908ef4b84fd1a0cf00b9",
  "cea922485510af755674585250b4b93a7433dd347828df2fe77d7db331014dd1",
  "cec688e616ec5005ae333edf2c90d3d64e4feb189c19369238aade7c62007409",
  "d022be7f26b8fccade8945527a7aa63bfb252414dcd31a0dbeccbd1ee694ef77",
  "d1ba8716790dcec21a5a54990e165c7ac555ad901418ac10d20a3eaaf2b74cf0",
  "d413bb3380a0db033f162205e69d43cbb910ec5ae6607270bde201ec4ea6d072",
  "d41477d7dbb6b728f83b8df7a8325cc66cad9a04c290bb52da64628a97735de4",
  "d62e103871123717762bc7e8dc8a72a2902ef6a69c1752f8a42e83f1f2419994",
  "db6b21bd2a39807bb91cb87393171e2e1f4e8227d20fb0da0bca32fbe0299fc2",
  "dbbf0e7c4a38a7628320b0b6cbd315aab08f628b6357fec79c67a9a7693aaafa",
  "dd12bb87cffa76948020b1cfc34163f67fa4062bd286ea571bf4b08473709ba0",
  "e61c2020d7f0b37ba9975c9981aa745cc8a21fb0f36f9581e32e6ebb711dde65",
  "e6c02646dc0b170442375d96f2a98b27a08112478d7a31519bedd451b60926c0",
  "e758451b1b756e0cb1c0801eb3b0b61515c2baa2017f053b2d816ee3aa8f302a",
  "f0d0ebfc9abebcfb13e6fb150a8663503330f1fbc2289713a678d64df307e500",
  "f0ec8f168ec7de0f20dc058730b02c880d9c8e81940b966e0bd2da2f3684d905",
  "f507e189b08f26eb6f4b3be6c8650abd5ba315d935d6b73c7ff53f44d212ec01",
]);

const PILOT_CAPTURE_FRAMES = Object.freeze({
  "formula-elementary-conversion-01-01": 94,
  "formula-elementary-conversion-01-02": 109,
  "formula-elementary-conversion-01-03": 170,
  "formula-elementary-conversion-01-04": 67,
  "keyterm-elementary-acute-angle": 60,
  "keyterm-elementary-computeghgh": 35,
  "course-g03-l01-vb-004": 10,
  "course-g04-l01-ir-001": 10,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function parseArguments(argv) {
  const options = {
    animationId: null,
    animateBinary: DEFAULT_ANIMATE_BINARY,
    workRoot: DEFAULT_WORK_ROOT,
    workingCopyRoot: DEFAULT_WORKING_COPY_ROOT,
    timeoutMs: 900_000,
  };
  let workRootWasSet = false;
  let workingCopyRootWasSet = false;
  const dependency = {
    dependencyFla: null,
    pairedSwf: null,
    pairedSwfSha256: null,
    evidenceId: null,
    sourceSha256: null,
    captureFrame: 1,
    dialogOperator: null,
    prepareOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--animate-binary") {
      options.animateBinary = path.resolve(argv[++index] || invariant(false, "--animate-binary requires a path"));
    } else if (value === "--work-root") {
      options.workRoot = path.resolve(argv[++index] || invariant(false, "--work-root requires a path"));
      workRootWasSet = true;
    } else if (value === "--working-copy-root") {
      options.workingCopyRoot = path.resolve(argv[++index] || invariant(false, "--working-copy-root requires a path"));
      workingCopyRootWasSet = true;
    } else if (value === "--dependency-fla") {
      dependency.dependencyFla = argv[++index] || invariant(false, "--dependency-fla requires a path");
    } else if (value === "--paired-swf") {
      dependency.pairedSwf = argv[++index] || invariant(false, "--paired-swf requires a path");
    } else if (value === "--paired-swf-sha256") {
      dependency.pairedSwfSha256 = argv[++index] || invariant(false, "--paired-swf-sha256 requires a value");
    } else if (value === "--evidence-id") {
      dependency.evidenceId = argv[++index] || invariant(false, "--evidence-id requires a value");
    } else if (value === "--source-sha256") {
      dependency.sourceSha256 = argv[++index] || invariant(false, "--source-sha256 requires a value");
    } else if (value === "--capture-frame") {
      const captureFrame = Number(argv[++index]);
      invariant(Number.isInteger(captureFrame) && captureFrame >= 1,
        "--capture-frame must be a positive one-indexed integer");
      dependency.captureFrame = captureFrame;
    } else if (value === "--dialog-operator") {
      dependency.dialogOperator = argv[++index] || invariant(false, "--dialog-operator requires a named human");
    } else if (value === "--prepare-only") {
      dependency.prepareOnly = true;
    } else if (value === "--timeout-ms") {
      const timeoutMs = Number(argv[++index]);
      invariant(Number.isInteger(timeoutMs) && timeoutMs >= 30_000 && timeoutMs <= 1_800_000,
        "--timeout-ms must be an integer from 30000 through 1800000");
      options.timeoutMs = timeoutMs;
    } else if (value === "--help" || value === "-h") {
      options.help = true;
    } else if (value.startsWith("-")) {
      throw new Error(`Unknown option: ${value}`);
    } else {
      invariant(!options.animationId, "Exactly one animation-id is allowed per cold-start Animate process");
      options.animationId = value;
    }
  }

  const dependencyModeRequested = dependency.dependencyFla != null
    || dependency.pairedSwf != null
    || dependency.pairedSwfSha256 != null
    || dependency.evidenceId != null
    || dependency.sourceSha256 != null
    || dependency.captureFrame !== 1
    || dependency.dialogOperator != null
    || dependency.prepareOnly;
  if (!dependencyModeRequested) return options;

  invariant(dependency.dependencyFla, "--dependency-fla is required for dependency mode");
  invariant(!options.animationId, "Dependency mode cannot be combined with a pilot animation-id");
  invariant(!workRootWasSet && !workingCopyRootWasSet,
    "Dependency mode uses its fixed work-only root; --work-root and --working-copy-root are not allowed");
  invariant(EVIDENCE_ID_PATTERN.test(dependency.evidenceId || ""),
    "--evidence-id must be a lowercase, path-safe identifier (letters, digits, and hyphens)");
  invariant(SHA256_PATTERN.test(dependency.sourceSha256 || ""),
    "--source-sha256 must be an exact lowercase SHA-256");
  const pairedSwfRequested = dependency.pairedSwf != null || dependency.pairedSwfSha256 != null;
  invariant(!pairedSwfRequested || (dependency.pairedSwf && dependency.pairedSwfSha256),
    "--paired-swf and --paired-swf-sha256 must be supplied together");
  if (pairedSwfRequested) {
    invariant(SHA256_PATTERN.test(dependency.pairedSwfSha256),
      "--paired-swf-sha256 must be an exact lowercase SHA-256");
  }
  if (!dependency.prepareOnly) validateDialogOperator(dependency.dialogOperator);
  else invariant(!dependency.dialogOperator,
    "--dialog-operator is accepted only by the full cold-start run, not --prepare-only");
  return {
    mode: "dependency-fla",
    evidenceSourceKind: pairedSwfRequested ? "paired-fla-swf" : "fla-only",
    ...dependency,
    animateBinary: options.animateBinary,
    timeoutMs: options.timeoutMs,
    ...(options.help ? {help: true} : {}),
  };
}

function validateDialogOperator(value) {
  const name = typeof value === "string" ? value.trim() : "";
  invariant(name.length >= 2 && name.length <= 128 && /\p{L}/u.test(name) && !/[\u0000-\u001f\u007f]/u.test(name),
    "--dialog-operator must name the human who will acknowledge the legacy conversion warning");
  invariant(!/^(?:codex|automation|automated|bot|agent|unknown|none|n\/?a)$/iu.test(name),
    "--dialog-operator must be a named human, not Codex or automation");
  return name;
}

function isInsideOrEqual(base, candidate) {
  const relative = path.relative(path.resolve(base), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function rejectGenericG4L10FullExecution(options, root) {
  const managedId = options?.mode === "dependency-fla"
    ? options.evidenceId
    : options?.animationId;
  const sourceRoot = path.join(root, ...PROTECTED_G4_L10_SOURCE_ROOT_RELATIVE.split("/"));
  const dependencyFla = options?.mode === "dependency-fla" && options.dependencyFla
    ? path.resolve(root, options.dependencyFla) : null;
  const pairedSwf = options?.mode === "dependency-fla" && options.pairedSwf
    ? path.resolve(root, options.pairedSwf) : null;
  const protectedIdentity = PROTECTED_G4_L10_RELEASE_MANAGED_ID_PATTERN.test(managedId || "")
    || (dependencyFla && isInsideOrEqual(sourceRoot, dependencyFla))
    || (pairedSwf && isInsideOrEqual(sourceRoot, pairedSwf))
    || PROTECTED_G4_L10_SOURCE_SHA256.has(options?.sourceSha256)
    || PROTECTED_G4_L10_SOURCE_SHA256.has(options?.pairedSwfSha256);
  invariant(!protectedIdentity,
    PROTECTED_G4_L10_DEDICATED_RUNNER_ERROR);
}

async function authorizeProtectedG5ReleaseExecution(options, authorizationToken = null, root = ROOT) {
  const managedId = options?.mode === "dependency-fla"
    ? options.evidenceId
    : options?.animationId;
  if (!PROTECTED_G5_RELEASE_MANAGED_ID_PATTERN.test(managedId || "")) return null;
  invariant(/^((?:course|shell)-g05-l04-)/u.test(managedId || "") && authorizationToken,
    PROTECTED_G5_RELEASE_PER_SESSION_AUTHORIZATION_ERROR);
  assertConsumedG5L4Authorization(authorizationToken, {
    purpose: "animate-authoring",
    actionId: "animate.read-only-authoring-audit",
    animationId: managedId,
    language: null,
    sourceAbsolutePath: options.mode === "dependency-fla"
      ? path.resolve(root, options.dependencyFla)
      : null,
    sourceSha256: options.mode === "dependency-fla" ? options.sourceSha256 : null,
    toolPath: options.animateBinary,
  });
  invariant(await sha256File(options.animateBinary) === authorizationToken.tool.sha256,
    "G5 L4 Animate executable hash differs from the consumed authorization");
  await assertReplayLockStillBound(authorizationToken);
  return authorizationToken;
}

function help() {
  return [
    "Usage: node scripts/run-assisted-animate-authoring-audit.mjs <animation-id> [options]",
    "       node scripts/run-assisted-animate-authoring-audit.mjs --dependency-fla <source.fla> --evidence-id <id> --source-sha256 <sha256> [--capture-frame <n>] --dialog-operator <human-name>",
    "       node scripts/run-assisted-animate-authoring-audit.mjs --dependency-fla <source.fla> --evidence-id <id> --source-sha256 <sha256> [--capture-frame <n>] --prepare-only",
    "       Add --paired-swf <source.swf> --paired-swf-sha256 <sha256> to either dependency form when a shipped SWF exists.",
    "",
    "Cold-starts Adobe Animate for exactly one registered read-only pilot FLA.",
    "When Animate shows the legacy ActionScript conversion warning, a human must",
    "acknowledge it. The controller then selects the pinned authoring frame, runs",
    "the current recursive JSFL audit, closes without saving, quits Animate, and",
    "finalizes schema-v2 evidence. It never writes under source-assets/.",
    "Dependency/paired-source mode instead retains acceptance-neutral evidence only under",
    "work/animate/dependency-authoring-audits/<evidence-id>/ and never invokes",
    "the migration finalizer. Its one allowed human action is the named operator",
    "acknowledging the legacy conversion warning; any other dialog must be left alone.",
    "",
    "Options:",
    `  --animate-binary <path>    Animate executable (default: ${DEFAULT_ANIMATE_BINARY})`,
    `  --work-root <path>         Append-only run parent (default: ${DEFAULT_WORK_ROOT})`,
    `  --working-copy-root <path> Staged read-only FLA root (default: ${DEFAULT_WORKING_COPY_ROOT})`,
    "  --dependency-fla <path>    FLA source under this repository's source-assets/",
    "  --paired-swf <path>        Optional shipped SWF paired with --dependency-fla",
    "  --paired-swf-sha256 <hash> Required immutable hash when --paired-swf is supplied",
    "  --evidence-id <id>         Lowercase work-only evidence identity",
    "  --source-sha256 <sha256>   Required immutable source hash pin",
    "  --capture-frame <n>        One-indexed authoring frame (default: 1)",
    "  --dialog-operator <name>   Named human who will acknowledge only the legacy warning",
    "  --prepare-only             Stage/verify the read-only copy; do not launch Animate",
    "  --timeout-ms <ms>          30000-1800000 (default: 900000)",
    "  -h, --help                 Show this help",
  ].join("\n");
}

async function sha256File(file) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(file);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

function portable(root, file) {
  const relative = path.relative(root, file);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    `Path escapes the project root: ${file}`);
  return relative.split(path.sep).join("/");
}

function isInside(base, candidate) {
  const relative = path.relative(path.resolve(base), path.resolve(candidate));
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function pathExists(file) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function ensurePlainDirectory(file, label) {
  if (!(await pathExists(file))) await mkdir(file);
  const info = await lstat(file);
  invariant(info.isDirectory() && !info.isSymbolicLink(), `${label} must be a non-symbolic-link directory`);
}

async function ensureDependencyDirectoryTree(root, evidenceId) {
  const paths = [
    [path.join(root, "work"), "work root"],
    [path.join(root, "work", "animate"), "Animate work root"],
    [path.join(root, "work", "animate", "dependency-authoring-audits"), "dependency audit root"],
    [path.join(root, "work", "animate", "dependency-authoring-audits", evidenceId), `${evidenceId}: evidence root`],
    [path.join(root, "work", "animate", "dependency-authoring-audits", evidenceId, "working-copy"), `${evidenceId}: working-copy root`],
    [path.join(root, "work", "animate", "dependency-authoring-audits", evidenceId, "runs"), `${evidenceId}: run root`],
  ];
  for (const [directory, label] of paths) await ensurePlainDirectory(directory, label);
  return path.join(root, "work", "animate", "dependency-authoring-audits", evidenceId);
}

async function readRegularFileIdentity(file, label) {
  const info = await lstat(file);
  invariant(info.isFile() && !info.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  return {
    sha256: await sha256File(file),
    bytes: info.size,
    mode: info.mode & 0o777,
    mtimeMs: info.mtimeMs,
    dev: info.dev,
    ino: info.ino,
    nlink: info.nlink,
  };
}

async function writeOnceOrVerify(file, bytes, label) {
  if (await pathExists(file)) {
    const existing = await readFile(file);
    invariant(existing.equals(bytes), `${label} already exists with different bytes`);
    return "verified-existing";
  }
  await writeFile(file, bytes, {flag: "wx"});
  return "created";
}

async function verifyDependencyContext(context) {
  const sourceIdentity = await readRegularFileIdentity(context.sourceFile, `${context.evidenceId}: source FLA`);
  invariant(sourceIdentity.sha256 === context.entry.source.sha256,
    `${context.evidenceId}: source FLA hash changed`);
  invariant(sourceIdentity.bytes === context.entry.source.bytes,
    `${context.evidenceId}: source FLA byte length changed`);
  invariant(sourceIdentity.mode === context.sourceIdentity.mode && sourceIdentity.mtimeMs === context.sourceIdentity.mtimeMs,
    `${context.evidenceId}: source FLA metadata changed during the work-only audit`);
  const sourceReal = await realpath(context.sourceFile);
  invariant(sourceReal === context.sourceReal, `${context.evidenceId}: source FLA real path changed`);

  const copyIdentity = await readRegularFileIdentity(context.workingCopy, `${context.evidenceId}: working copy`);
  invariant((copyIdentity.mode & 0o222) === 0, `${context.evidenceId}: working copy is writable`);
  invariant(copyIdentity.sha256 === context.entry.source.sha256 && copyIdentity.bytes === context.entry.source.bytes,
    `${context.evidenceId}: working copy is not byte-identical to the source FLA`);
  invariant(copyIdentity.nlink === 1, `${context.evidenceId}: working copy must have exactly one hard link`);
  invariant(copyIdentity.dev !== sourceIdentity.dev || copyIdentity.ino !== sourceIdentity.ino,
    `${context.evidenceId}: working copy aliases the source FLA inode`);
  if (!context.shippedSwfFile) return {source: sourceIdentity, workingCopy: copyIdentity};

  const shippedSourceIdentity = await readRegularFileIdentity(
    context.shippedSwfFile,
    `${context.evidenceId}: source SWF`,
  );
  invariant(shippedSourceIdentity.sha256 === context.entry.shippedSwf.source.sha256,
    `${context.evidenceId}: source SWF hash changed`);
  invariant(shippedSourceIdentity.bytes === context.entry.shippedSwf.source.bytes,
    `${context.evidenceId}: source SWF byte length changed`);
  invariant(
    shippedSourceIdentity.mode === context.shippedSwfIdentity.mode
      && shippedSourceIdentity.mtimeMs === context.shippedSwfIdentity.mtimeMs,
    `${context.evidenceId}: source SWF metadata changed during the work-only audit`,
  );
  invariant(await realpath(context.shippedSwfFile) === context.shippedSwfReal,
    `${context.evidenceId}: source SWF real path changed`);

  const stagedSwfIdentity = await readRegularFileIdentity(
    context.stagedSwf,
    `${context.evidenceId}: staged SWF`,
  );
  invariant((stagedSwfIdentity.mode & 0o222) === 0, `${context.evidenceId}: staged SWF is writable`);
  invariant(
    stagedSwfIdentity.sha256 === context.entry.shippedSwf.source.sha256
      && stagedSwfIdentity.bytes === context.entry.shippedSwf.source.bytes,
    `${context.evidenceId}: staged SWF is not byte-identical to the source SWF`,
  );
  invariant(stagedSwfIdentity.nlink === 1, `${context.evidenceId}: staged SWF must have exactly one hard link`);
  invariant(
    stagedSwfIdentity.dev !== shippedSourceIdentity.dev || stagedSwfIdentity.ino !== shippedSourceIdentity.ino,
    `${context.evidenceId}: staged SWF aliases the source SWF inode`,
  );
  return {
    source: sourceIdentity,
    workingCopy: copyIdentity,
    shippedSwfSource: shippedSourceIdentity,
    stagedSwf: stagedSwfIdentity,
  };
}

async function stageDependencyFla(options, {root = ROOT} = {}) {
  invariant(options.mode === "dependency-fla", "stageDependencyFla requires dependency mode");
  invariant(EVIDENCE_ID_PATTERN.test(options.evidenceId || ""), "Invalid dependency evidence ID");
  invariant(SHA256_PATTERN.test(options.sourceSha256 || ""), "Invalid dependency source SHA-256 pin");

  const sourceRoot = path.join(root, "source-assets");
  const sourceFile = path.isAbsolute(options.dependencyFla)
    ? path.resolve(options.dependencyFla)
    : path.resolve(root, options.dependencyFla);
  invariant(isInside(sourceRoot, sourceFile), `${options.evidenceId}: dependency FLA must be under source-assets/`);
  invariant(path.extname(sourceFile).toLowerCase() === ".fla", `${options.evidenceId}: dependency source must be a .fla file`);
  const sourceInfo = await lstat(sourceFile);
  invariant(sourceInfo.isFile() && !sourceInfo.isSymbolicLink(),
    `${options.evidenceId}: source FLA must be a regular non-symbolic-link file`);
  const sourceRootReal = await realpath(sourceRoot);
  const sourceReal = await realpath(sourceFile);
  invariant(isInside(sourceRootReal, sourceReal), `${options.evidenceId}: source FLA resolves outside source-assets/`);
  const sourceIdentity = await readRegularFileIdentity(sourceFile, `${options.evidenceId}: source FLA`);
  invariant(sourceIdentity.sha256 === options.sourceSha256,
    `${options.evidenceId}: source FLA hash mismatch (${sourceIdentity.sha256} != ${options.sourceSha256})`);

  let shippedSwfFile = null;
  let shippedSwfReal = null;
  let shippedSwfIdentity = null;
  if (options.evidenceSourceKind === "paired-fla-swf") {
    shippedSwfFile = path.isAbsolute(options.pairedSwf)
      ? path.resolve(options.pairedSwf)
      : path.resolve(root, options.pairedSwf);
    invariant(isInside(sourceRoot, shippedSwfFile), `${options.evidenceId}: paired SWF must be under source-assets/`);
    invariant(path.extname(shippedSwfFile).toLowerCase() === ".swf",
      `${options.evidenceId}: paired runtime source must be a .swf file`);
    invariant(
      path.basename(shippedSwfFile, path.extname(shippedSwfFile)).toLowerCase()
        === path.basename(sourceFile, path.extname(sourceFile)).toLowerCase(),
      `${options.evidenceId}: paired FLA and SWF basenames differ`,
    );
    const shippedInfo = await lstat(shippedSwfFile);
    invariant(shippedInfo.isFile() && !shippedInfo.isSymbolicLink(),
      `${options.evidenceId}: source SWF must be a regular non-symbolic-link file`);
    shippedSwfReal = await realpath(shippedSwfFile);
    invariant(isInside(sourceRootReal, shippedSwfReal), `${options.evidenceId}: source SWF resolves outside source-assets/`);
    shippedSwfIdentity = await readRegularFileIdentity(shippedSwfFile, `${options.evidenceId}: source SWF`);
    invariant(shippedSwfIdentity.sha256 === options.pairedSwfSha256,
      `${options.evidenceId}: source SWF hash mismatch (${shippedSwfIdentity.sha256} != ${options.pairedSwfSha256})`);
  }

  const evidenceDir = await ensureDependencyDirectoryTree(root, options.evidenceId);
  const workingCopy = path.join(evidenceDir, "working-copy", path.basename(sourceFile));
  if (!(await pathExists(workingCopy))) {
    try {
      await copyFile(sourceFile, workingCopy, fsConstants.COPYFILE_EXCL);
      await chmod(workingCopy, 0o444);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
  const workingInfo = await lstat(workingCopy);
  invariant(workingInfo.isFile() && !workingInfo.isSymbolicLink(),
    `${options.evidenceId}: staged working copy must be a regular non-symbolic-link file`);
  const workingIdentity = await readRegularFileIdentity(workingCopy, `${options.evidenceId}: staged working copy`);
  invariant((workingIdentity.mode & 0o222) === 0, `${options.evidenceId}: staged working copy is writable`);
  invariant(workingIdentity.sha256 === sourceIdentity.sha256 && workingIdentity.bytes === sourceIdentity.bytes,
    `${options.evidenceId}: staged working copy differs from the source FLA`);
  invariant(workingIdentity.nlink === 1, `${options.evidenceId}: staged working copy must have exactly one hard link`);
  invariant(workingIdentity.dev !== sourceIdentity.dev || workingIdentity.ino !== sourceIdentity.ino,
    `${options.evidenceId}: staged working copy aliases the source FLA inode`);

  let stagedSwf = null;
  let stagedSwfIdentity = null;
  if (shippedSwfFile) {
    const runtimeSourceDir = path.join(evidenceDir, "runtime-source");
    await ensurePlainDirectory(runtimeSourceDir, `${options.evidenceId}: runtime-source root`);
    stagedSwf = path.join(runtimeSourceDir, path.basename(shippedSwfFile));
    if (!(await pathExists(stagedSwf))) {
      try {
        await copyFile(shippedSwfFile, stagedSwf, fsConstants.COPYFILE_EXCL);
        await chmod(stagedSwf, 0o444);
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
    }
    stagedSwfIdentity = await readRegularFileIdentity(stagedSwf, `${options.evidenceId}: staged SWF`);
    invariant((stagedSwfIdentity.mode & 0o222) === 0, `${options.evidenceId}: staged SWF is writable`);
    invariant(
      stagedSwfIdentity.sha256 === shippedSwfIdentity.sha256
        && stagedSwfIdentity.bytes === shippedSwfIdentity.bytes,
      `${options.evidenceId}: staged SWF differs from the source SWF`,
    );
    invariant(stagedSwfIdentity.nlink === 1, `${options.evidenceId}: staged SWF must have exactly one hard link`);
    invariant(stagedSwfIdentity.dev !== shippedSwfIdentity.dev || stagedSwfIdentity.ino !== shippedSwfIdentity.ino,
      `${options.evidenceId}: staged SWF aliases the source SWF inode`);
  }

  const scriptBytes = await readFile(path.join(root, "scripts", path.basename(SCRIPT_PATH)));
  const entry = {
    source: {
      file: portable(root, sourceFile),
      sha256: sourceIdentity.sha256,
      bytes: sourceIdentity.bytes,
    },
    workingCopy: {
      file: portable(root, workingCopy),
      sha256: workingIdentity.sha256,
      bytes: workingIdentity.bytes,
      mode: "0444",
      readOnly: true,
      byteIdenticalToSource: true,
      separateRegularFile: true,
    },
    ...(shippedSwfFile ? {
      shippedSwf: {
        source: {
          file: portable(root, shippedSwfFile),
          sha256: shippedSwfIdentity.sha256,
          bytes: shippedSwfIdentity.bytes,
        },
        workingCopy: {
          file: portable(root, stagedSwf),
          sha256: stagedSwfIdentity.sha256,
          bytes: stagedSwfIdentity.bytes,
          mode: "0444",
          readOnly: true,
          byteIdenticalToSource: true,
          separateRegularFile: true,
        },
      },
    } : {}),
  };
  const binding = {
    schemaVersion: 1,
    evidenceKind: shippedSwfFile
      ? "adobe-animate-read-only-paired-fla-swf-binding"
      : "adobe-animate-read-only-dependency-fla-binding",
    evidenceId: options.evidenceId,
    sourceKind: shippedSwfFile ? "paired-fla-swf" : "fla-only",
    acceptanceEffect: "none; work-only authoring evidence preparation",
    source: entry.source,
    workingCopy: entry.workingCopy,
    ...(entry.shippedSwf ? {shippedSwf: entry.shippedSwf} : {}),
    intendedAudit: {
      captureFrame: options.captureFrame,
      recursiveRootAndLibraryTimelines: true,
      frameAndInstanceScriptInventory: true,
      nativeStagePng: true,
      saveOrPublishAllowed: false,
    },
    generatedBy: {
      file: "scripts/run-assisted-animate-authoring-audit.mjs",
      sha256: sha256(scriptBytes),
    },
  };
  const bindingFile = path.join(evidenceDir, "source-binding.json");
  let bindingBytes;
  let bindingDisposition;
  if (await pathExists(bindingFile)) {
    bindingBytes = await readFile(bindingFile);
    let existingBinding;
    try {
      existingBinding = JSON.parse(bindingBytes.toString("utf8"));
    } catch (error) {
      throw new Error(`${options.evidenceId}: existing source binding is invalid JSON (${error.message})`);
    }
    invariant(existingBinding.generatedBy?.file === binding.generatedBy.file,
      `${options.evidenceId}: existing source binding has an unexpected generator path`);
    invariant(SHA256_PATTERN.test(existingBinding.generatedBy?.sha256 || ""),
      `${options.evidenceId}: existing source binding has an invalid historical generator hash`);
    const existingSemantic = {...existingBinding, generatedBy: {file: existingBinding.generatedBy.file}};
    const expectedSemantic = {...binding, generatedBy: {file: binding.generatedBy.file}};
    invariant(JSON.stringify(existingSemantic) === JSON.stringify(expectedSemantic),
      `${options.evidenceId}: existing source binding differs from the immutable source/audit contract`);
    bindingDisposition = existingBinding.generatedBy.sha256 === binding.generatedBy.sha256
      ? "verified-existing"
      : "verified-existing-historical-generator";
  } else {
    bindingBytes = Buffer.from(`${JSON.stringify(binding, null, 2)}\n`);
    bindingDisposition = await writeOnceOrVerify(bindingFile, bindingBytes, `${options.evidenceId}: source binding`);
  }
  await chmod(bindingFile, 0o444);
  const bindingIdentity = await readRegularFileIdentity(bindingFile, `${options.evidenceId}: source binding`);
  invariant(bindingIdentity.mode === 0o444, `${options.evidenceId}: source binding mode is not exactly 0444`);
  const context = {
    evidenceId: options.evidenceId,
    captureFrame: options.captureFrame,
    evidenceDir,
    sourceFile,
    sourceReal,
    sourceIdentity,
    workingCopy,
    entry,
    shippedSwfFile,
    shippedSwfReal,
    shippedSwfIdentity,
    stagedSwf,
    binding: {
      file: bindingFile,
      sha256: sha256(bindingBytes),
      disposition: bindingDisposition,
      mode: "0444",
      readOnly: true,
    },
  };
  await verifyDependencyContext(context);
  return context;
}

async function loadPilotContext({root, workingCopyRoot, animationId}) {
  const captureFrame = PILOT_CAPTURE_FRAMES[animationId];
  invariant(captureFrame, `Unknown FLA-backed pilot animation-id: ${animationId}`);
  const manifest = JSON.parse(await readFile(path.join(workingCopyRoot, "manifest.json"), "utf8"));
  const entry = manifest.entries?.find((candidate) => candidate.animationId === animationId);
  invariant(entry, `${animationId}: staged working-copy manifest entry is missing`);
  const migration = JSON.parse(await readFile(path.join(root, "migrations", animationId, "migration.json"), "utf8"));
  invariant(migration.source?.fla === entry.source.file && migration.source?.flaSha256 === entry.source.sha256,
    `${animationId}: migration and staged source identity differ`);
  const workingCopy = path.join(root, entry.workingCopy.file);
  const info = await lstat(workingCopy);
  invariant(info.isFile() && !info.isSymbolicLink(), `${animationId}: working copy is not a regular file`);
  invariant((info.mode & 0o222) === 0, `${animationId}: working copy is writable`);
  invariant(await sha256File(workingCopy) === entry.workingCopy.sha256, `${animationId}: working-copy hash mismatch`);
  return {captureFrame, entry, migration, workingCopy};
}

async function writeDependencyEvidence({
  root,
  options,
  context,
  runDir,
  artifacts,
  templateBytes,
  generatedAudit,
  generatedAuditFile,
  controller,
  controllerFile,
}) {
  const verifiedAfter = await verifyDependencyContext(context);
  const pairedSource = Boolean(context.entry.shippedSwf);
  const evidence = {
    schemaVersion: 1,
    evidenceKind: pairedSource
      ? "adobe-animate-paired-fla-swf-authoring-audit"
      : "adobe-animate-fla-only-dependency-authoring-audit",
    status: "verified-work-only-authoring-audit",
    evidenceId: options.evidenceId,
    sourceKind: pairedSource ? "paired-fla-swf" : "fla-only",
    authority: pairedSource
      ? "Original owner-provided FLA inspected through a byte-identical read-only working copy in Adobe Animate, with the shipped SWF independently hash-bound but not executed by this audit"
      : "Original owner-provided FLA inspected through a byte-identical read-only working copy in Adobe Animate",
    acceptanceEffect: "none; not migration status, human review, owner acceptance, runtime behavior, audio, fidelity, or completion evidence",
    sourceBinding: {
      file: portable(root, context.binding.file),
      sha256: context.binding.sha256,
      source: context.entry.source,
      sourceUnchangedAfterAudit: verifiedAfter.source.sha256 === context.entry.source.sha256,
    },
    workingCopy: {
      ...context.entry.workingCopy,
      readOnlyAfterAudit: (verifiedAfter.workingCopy.mode & 0o222) === 0,
      byteIdenticalToSourceAfterAudit: verifiedAfter.workingCopy.sha256 === context.entry.source.sha256,
    },
    ...(pairedSource ? {
      shippedSwfBinding: {
        source: context.entry.shippedSwf.source,
        stagedCopy: context.entry.shippedSwf.workingCopy,
        sourceUnchangedAfterAudit:
          verifiedAfter.shippedSwfSource.sha256 === context.entry.shippedSwf.source.sha256,
        stagedCopyReadOnlyAfterAudit: (verifiedAfter.stagedSwf.mode & 0o222) === 0,
        stagedCopyByteIdenticalAfterAudit:
          verifiedAfter.stagedSwf.sha256 === context.entry.shippedSwf.source.sha256,
        executedByThisAuthoringAudit: false,
      },
    } : {}),
    humanDialogBoundary: {
      required: true,
      designatedOperator: validateDialogOperator(options.dialogOperator),
      allowedAction: "Acknowledge only Adobe Animate's legacy ActionScript conversion warning.",
      allOtherDialogs: "Do not acknowledge; allow the bounded run to fail closed.",
      operatorNameIsNotReviewOrApproval: true,
      automatedDialogInteractionUsed: false,
    },
    protocol: {
      oneFlaPerColdStartProcess: true,
      openedOnlyWorkingCopy: true,
      openedSourceDirectly: false,
      saveAllowed: false,
      publishAllowed: false,
      closeWithoutSaving: true,
      recursiveRootAndLibraryTimelines: true,
      frameAndInstanceScriptsAsExposedAfterConversion: true,
      nativeStagePng: true,
      shippedSwfExecuted: false,
    },
    animateVersion: artifacts.animateVersion,
    scripts: {
      auditTemplate: {
        file: "scripts/animate-audit-current-document.jsfl",
        sha256: sha256(templateBytes),
      },
      generatedDependencyAudit: {
        file: portable(root, generatedAuditFile),
        sha256: sha256(generatedAudit),
        addsFrameAndAttachedInstanceScriptBodies: true,
      },
      controller: {
        file: portable(root, controllerFile),
        sha256: sha256(controller),
      },
    },
    nativeMovie: artifacts.reportSummary,
    capturedAuthoringFrame: {
      flashFrame: context.captureFrame,
      file: portable(root, artifacts.png.file),
      sha256: artifacts.png.sha256,
      width: artifacts.png.width,
      height: artifacts.png.height,
    },
    rawAudit: {
      file: portable(root, artifacts.report.file),
      sha256: artifacts.report.sha256,
    },
    controllerMarker: {
      file: portable(root, artifacts.marker.file),
      sha256: artifacts.marker.sha256,
    },
    writeBoundary: {
      root: portable(root, context.evidenceDir),
      workOnly: true,
      migrationFilesWritten: false,
      statusFilesWritten: false,
      approvalFilesWritten: false,
    },
    limitations: [
      "Animate 2021 converts this unsupported legacy ActionScript document in memory and may remove or alter ActionScript before the JSFL can inventory it.",
      pairedSource
        ? "The shipped SWF is independently hash-bound and staged, but this authoring audit neither executes it nor proves FLA/SWF script, timeline, asset, or runtime equivalence; those comparisons remain separate evidence obligations."
        : "Because this dependency is FLA-only, no shipped SWF exists for bytecode or original-runtime corroboration; script and behavior confidence remains reduced.",
      "The PNG is an authoring-stage capture, not original-runtime branch, localization, audio, scoring, navigation, or Replay evidence.",
      "The named operator is a dialog operator only and is not a human reviewer or owner approver.",
    ],
  };
  const bytes = Buffer.from(`${JSON.stringify(evidence, null, 2)}\n`);
  const file = path.join(runDir, "dependency-authoring-audit-evidence.json");
  await writeFile(file, bytes, {flag: "wx"});
  return {file, sha256: sha256(bytes), evidence};
}

async function runDependencyAssistedAuditCore(options, {
  root,
  context,
  findRunning,
  runProcess,
}) {
  const operator = validateDialogOperator(options.dialogOperator);
  const auditScript = path.join(root, "scripts", "animate-audit-current-document.jsfl");
  await access(options.animateBinary, fsConstants.X_OK);
  await access(auditScript, fsConstants.R_OK);
  const active = await findRunning(options.animateBinary);
  invariant(active.length === 0,
    `Adobe Animate is already running (${active.map(({pid}) => pid).join(", ")}); quit it before the one-FLA cold-start audit`);

  const runDir = await mkdtemp(path.join(context.evidenceDir, "runs", "run-"));
  const outputRootUri = pathToFileURL(runDir).href;
  const templateBytes = await readFile(auditScript);
  const generatedAudit = buildDependencyGeneratedAuditScript(templateBytes.toString("utf8"), outputRootUri);
  const generatedAuditFile = path.join(runDir, "animate-audit-current-document.dependency.generated.jsfl");
  const controllerFile = path.join(runDir, "controller.jsfl");
  const markerFile = path.join(runDir, "controller-result.json");
  const controller = buildAssistedControllerJsfl({
    flaUri: pathToFileURL(context.workingCopy).href,
    auditScriptUri: pathToFileURL(generatedAuditFile).href,
    outputRootUri,
    markerUri: pathToFileURL(markerFile).href,
    captureFrame: context.captureFrame,
  });
  await writeFile(generatedAuditFile, generatedAudit, {flag: "wx"});
  await writeFile(controllerFile, controller, {flag: "wx"});

  const args = ["--run-jsfl", "-o", controllerFile];
  process.stderr.write(
    `ACTION REQUIRED FOR ${operator}: Adobe Animate will open ${path.basename(context.workingCopy)}. ` +
    "Acknowledge the legacy ActionScript conversion warning only; do not acknowledge any other dialog, save, or publish.\n",
  );
  let processResult;
  let processLaunchFailure = null;
  try {
    processResult = await runProcess(options.animateBinary, args, options.timeoutMs);
  } catch (error) {
    processLaunchFailure = error instanceof Error ? error.message : String(error);
    processResult = {
      exitCode: null,
      signal: null,
      timedOut: false,
      outputLimitExceeded: false,
      killUnconfirmed: false,
      detachedProcessGroup: false,
      durationMs: 0,
      stdout: Buffer.alloc(0),
      stderr: Buffer.from(processLaunchFailure),
    };
  }
  const stdoutFile = path.join(runDir, "stdout.log");
  const stderrFile = path.join(runDir, "stderr.log");
  await writeFile(stdoutFile, processResult.stdout, {flag: "wx"});
  await writeFile(stderrFile, processResult.stderr, {flag: "wx"});

  let artifacts = null;
  let workEvidence = null;
  const failures = [];
  if (processLaunchFailure) failures.push(`Animate launch failed: ${processLaunchFailure}`);
  try {
    invariant(!processResult.timedOut, `${options.evidenceId}: Animate timed out waiting for the named human/dialog audit`);
    invariant(processResult.outputLimitExceeded !== true,
      `${options.evidenceId}: Animate output exceeded the fixed capture limit`);
    invariant(processResult.killUnconfirmed !== true,
      `${options.evidenceId}: Animate process-group termination was not confirmed within the bounded deadline`);
    invariant(processResult.exitCode === 0,
      `${options.evidenceId}: Animate exited with code ${processResult.exitCode}${processResult.signal ? ` (${processResult.signal})` : ""}`);
    artifacts = await validateAssistedArtifacts({
      runDir,
      evidenceId: options.evidenceId,
      workingCopy: context.workingCopy,
      captureFrame: context.captureFrame,
      requireScriptBodies: true,
    });
    workEvidence = await writeDependencyEvidence({
      root,
      options,
      context,
      runDir,
      artifacts,
      templateBytes,
      generatedAudit,
      generatedAuditFile,
      controller,
      controllerFile,
    });
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  let postRunVerification = null;
  try {
    postRunVerification = await verifyDependencyContext(context);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  const failure = failures.length > 0 ? [...new Set(failures)].join("; ") : null;
  const result = {
    schemaVersion: 1,
    evidenceKind: "human-assisted-adobe-animate-dependency-authoring-audit-run",
    status: failure ? "failed" : "passed",
    evidenceId: options.evidenceId,
    acceptanceEffect: "none; work-only dependency/paired-source authoring audit",
    sourceKind: context.entry.shippedSwf ? "paired-fla-swf" : "fla-only",
    humanActionBoundary: {
      required: true,
      designatedOperator: operator,
      action: "Acknowledge only the Adobe Animate legacy ActionScript conversion warning.",
      automatedDialogInteractionUsed: false,
      reviewOrOwnerDecisionRecorded: false,
    },
    source: context.entry.source,
    workingCopy: context.entry.workingCopy,
    ...(context.entry.shippedSwf ? {shippedSwf: context.entry.shippedSwf} : {}),
    sourceBinding: {file: portable(root, context.binding.file), sha256: context.binding.sha256},
    captureFrame: context.captureFrame,
    command: {
      executable: options.animateBinary,
      executableSha256: await sha256File(options.animateBinary),
      args: ["--run-jsfl", "-o", portable(root, controllerFile)],
      spawnedAnimateProcessCount: 1,
      intentionallyOmitsQuitFlag: true,
    },
    scripts: {
      auditTemplate: {file: "scripts/animate-audit-current-document.jsfl", sha256: sha256(templateBytes)},
      generatedAudit: {file: portable(root, generatedAuditFile), sha256: sha256(generatedAudit)},
      controller: {file: portable(root, controllerFile), sha256: sha256(controller)},
    },
    process: {
      exitCode: processResult.exitCode,
      signal: processResult.signal,
      timedOut: processResult.timedOut,
      outputLimitExceeded: processResult.outputLimitExceeded === true,
      killUnconfirmed: processResult.killUnconfirmed === true,
      detachedProcessGroup: processResult.detachedProcessGroup === true,
      durationMs: processResult.durationMs,
      stdout: {file: portable(root, stdoutFile), sha256: sha256(processResult.stdout)},
      stderr: {file: portable(root, stderrFile), sha256: sha256(processResult.stderr)},
    },
    artifacts: artifacts
      ? Object.fromEntries(Object.entries(artifacts).map(([key, value]) => [key,
        value && typeof value === "object" && value.file
          ? {...value, file: portable(root, value.file)}
          : value]))
      : null,
    workEvidence: workEvidence
      ? {file: portable(root, workEvidence.file), sha256: workEvidence.sha256}
      : null,
    postRunVerification: postRunVerification ? {
      sourceSha256: postRunVerification.source.sha256,
      workingCopySha256: postRunVerification.workingCopy.sha256,
      workingCopyReadOnly: (postRunVerification.workingCopy.mode & 0o222) === 0,
      ...(postRunVerification.shippedSwfSource ? {
        sourceSwfSha256: postRunVerification.shippedSwfSource.sha256,
        stagedSwfSha256: postRunVerification.stagedSwf.sha256,
        stagedSwfReadOnly: (postRunVerification.stagedSwf.mode & 0o222) === 0,
      } : {}),
    } : null,
    migrationOrApprovalWrites: false,
    failure,
  };
  const resultFile = path.join(runDir, "assisted-run-result.json");
  await writeFile(resultFile, `${JSON.stringify(result, null, 2)}\n`, {flag: "wx"});
  if (failure) throw new Error(`${failure}; run receipt: ${portable(root, resultFile)}`);
  return {...result, resultFile};
}

async function runDependencyAssistedAudit(options, {
  root = ROOT,
  findRunning = runningAnimate,
  runProcess = runChild,
  authorizationToken = null,
} = {}) {
  invariant(options.mode === "dependency-fla" && !options.prepareOnly,
    "A full dependency audit requires dependency mode without --prepare-only");
  rejectGenericG4L10FullExecution(options, root);
  const protectedAuthorization = await authorizeProtectedG5ReleaseExecution(
    options,
    authorizationToken,
    root,
  );
  const context = await stageDependencyFla(options, {root});
  if (protectedAuthorization) {
    invariant(context.sourceReal === protectedAuthorization.sourceAbsolutePath
      && context.entry.source.sha256 === protectedAuthorization.member.sourceSha256,
    "G5 L4 Animate source path/hash differs from the consumed authorization");
  }
  return runDependencyAssistedAuditCore(options, {
    root,
    context,
    findRunning,
    runProcess,
  });
}

async function runAuthorizedLessonG4L10OneRowAudit(claimToken) {
  invariant(arguments.length === 1,
    "dedicated L10 runner accepts exactly one opaque v2 claim token");
  return coreRunAuthorizedLessonG4L10OneRowAudit(claimToken);
}

async function runAssistedAudit(options, {
  root = ROOT,
  performStageCheck = true,
  finalize = finalizeOne,
  authorizationToken = null,
} = {}) {
  rejectGenericG4L10FullExecution(options, root);
  if (options.mode === "dependency-fla") {
    return runDependencyAssistedAudit(options, {root, authorizationToken});
  }
  const protectedAuthorization = await authorizeProtectedG5ReleaseExecution(options, authorizationToken, root);
  invariant(options.animationId, "Exactly one animation-id is required");
  await access(options.animateBinary, fsConstants.X_OK);
  await access(AUDIT_SCRIPT, fsConstants.R_OK);
  if (performStageCheck && root === ROOT && options.workingCopyRoot === DEFAULT_WORKING_COPY_ROOT) {
    await stageAnimateFlaCopies({check: true});
  }
  const context = await loadPilotContext({root, workingCopyRoot: options.workingCopyRoot, animationId: options.animationId});
  if (protectedAuthorization) {
    invariant(path.resolve(root, context.entry.source.file) === protectedAuthorization.sourceAbsolutePath
      && context.entry.source.sha256 === protectedAuthorization.member.sourceSha256,
    "G5 L4 Animate pilot source path/hash differs from the consumed authorization");
  }
  const active = await runningAnimate(options.animateBinary);
  invariant(active.length === 0,
    `Adobe Animate is already running (${active.map(({pid}) => pid).join(", ")}); quit it before the one-FLA cold-start audit`);

  await mkdir(options.workRoot, {recursive: true});
  const runDir = await mkdtemp(path.join(options.workRoot, `${options.animationId}-`));
  const outputRootUri = pathToFileURL(runDir).href;
  const templateBytes = await readFile(AUDIT_SCRIPT);
  const generatedAudit = buildGeneratedAuditScript(templateBytes.toString("utf8"), outputRootUri);
  const generatedAuditFile = path.join(runDir, "animate-audit-current-document.generated.jsfl");
  const controllerFile = path.join(runDir, "controller.jsfl");
  const markerFile = path.join(runDir, "controller-result.json");
  const controller = buildAssistedControllerJsfl({
    flaUri: pathToFileURL(context.workingCopy).href,
    auditScriptUri: pathToFileURL(generatedAuditFile).href,
    outputRootUri,
    markerUri: pathToFileURL(markerFile).href,
    captureFrame: context.captureFrame,
  });
  await writeFile(generatedAuditFile, generatedAudit, {flag: "wx"});
  await writeFile(controllerFile, controller, {flag: "wx"});

  const args = ["--run-jsfl", "-o", controllerFile];
  process.stderr.write(
    `ACTION REQUIRED: Adobe Animate will open ${path.basename(context.workingCopy)}. ` +
    "Acknowledge the legacy ActionScript conversion warning only; do not save or publish.\n",
  );
  const processResult = await runChild(options.animateBinary, args, options.timeoutMs);
  const stdoutFile = path.join(runDir, "stdout.log");
  const stderrFile = path.join(runDir, "stderr.log");
  await writeFile(stdoutFile, processResult.stdout, {flag: "wx"});
  await writeFile(stderrFile, processResult.stderr, {flag: "wx"});

  let artifacts = null;
  let finalized = null;
  let failure = null;
  try {
    invariant(!processResult.timedOut, `${options.animationId}: Animate timed out waiting for the legacy dialog/audit`);
    invariant(processResult.exitCode === 0,
      `${options.animationId}: Animate exited with code ${processResult.exitCode}${processResult.signal ? ` (${processResult.signal})` : ""}`);
    artifacts = await validateAssistedArtifacts({
      runDir,
      animationId: options.animationId,
      workingCopy: context.workingCopy,
      captureFrame: context.captureFrame,
    });
    finalized = await finalize(options.animationId, runDir, root, options.workingCopyRoot);
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }

  const result = {
    schemaVersion: 1,
    evidenceKind: "human-assisted-adobe-animate-authoring-audit-run",
    status: failure ? "failed" : "passed",
    animationId: options.animationId,
    acceptanceEffect: "authoring-audit-only; never human-review, owner-acceptance, runtime, audio, or fidelity approval",
    humanActionBoundary: {
      required: true,
      action: "A human acknowledges only the Adobe Animate legacy ActionScript conversion warning.",
      identityAttestationRecorded: false,
      reviewOrOwnerDecisionRecorded: false,
    },
    source: context.entry.source,
    workingCopy: context.entry.workingCopy,
    captureFrame: context.captureFrame,
    command: {
      executable: options.animateBinary,
      executableSha256: await sha256File(options.animateBinary),
      args: ["--run-jsfl", "-o", path.relative(root, controllerFile).split(path.sep).join("/")],
      intentionallyOmitsQuitFlag: true,
    },
    scripts: {
      auditTemplate: {file: path.relative(root, AUDIT_SCRIPT).split(path.sep).join("/"), sha256: sha256(templateBytes)},
      generatedAudit: {file: path.relative(root, generatedAuditFile).split(path.sep).join("/"), sha256: sha256(generatedAudit)},
      controller: {file: path.relative(root, controllerFile).split(path.sep).join("/"), sha256: sha256(controller)},
    },
    process: {
      exitCode: processResult.exitCode,
      signal: processResult.signal,
      timedOut: processResult.timedOut,
      durationMs: processResult.durationMs,
      stdout: {file: path.relative(root, stdoutFile).split(path.sep).join("/"), sha256: sha256(processResult.stdout)},
      stderr: {file: path.relative(root, stderrFile).split(path.sep).join("/"), sha256: sha256(processResult.stderr)},
    },
    artifacts: artifacts
      ? Object.fromEntries(Object.entries(artifacts).map(([key, value]) => [key,
        value && typeof value === "object" && value.file
          ? {...value, file: path.relative(root, value.file).split(path.sep).join("/")}
          : value]))
      : null,
    finalized,
    failure,
  };
  const resultFile = path.join(runDir, "assisted-run-result.json");
  await writeFile(resultFile, `${JSON.stringify(result, null, 2)}\n`, {flag: "wx"});
  if (failure) throw new Error(`${failure}; run receipt: ${path.relative(root, resultFile)}`);
  return {...result, resultFile};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  if (options.mode === "dependency-fla" && options.prepareOnly) {
    const context = await stageDependencyFla(options);
    console.log(JSON.stringify({
      status: "prepared",
      evidenceId: context.evidenceId,
      source: context.entry.source,
      workingCopy: context.entry.workingCopy,
      ...(context.entry.shippedSwf ? {shippedSwf: context.entry.shippedSwf} : {}),
      sourceBinding: {
        file: portable(ROOT, context.binding.file),
        sha256: context.binding.sha256,
        disposition: context.binding.disposition,
      },
      animateLaunched: false,
      acceptanceEffect: "none",
    }, null, 2));
    return;
  }
  const result = await runAssistedAudit(options);
  if (options.mode === "dependency-fla") {
    console.log(JSON.stringify({
      status: result.status,
      evidenceId: result.evidenceId,
      workEvidence: result.workEvidence,
      runReceipt: portable(ROOT, result.resultFile),
      migrationOrApprovalWrites: false,
    }, null, 2));
    return;
  }
  console.log(JSON.stringify({
    status: result.status,
    animationId: result.animationId,
    canonicalSha256: result.finalized.canonicalSha256,
    authoringFrameSha256: result.finalized.frameSha256,
    runReceipt: path.relative(ROOT, result.resultFile).split(path.sep).join("/"),
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export {
  DEFAULT_DEPENDENCY_ROOT,
  PILOT_CAPTURE_FRAMES,
  buildAssistedControllerJsfl,
  buildDependencyGeneratedAuditScript,
  decodeFileUri,
  loadPilotContext,
  materializeDependencyLibraryShards,
  parseArguments,
  runningAnimate,
  runAuthorizedLessonG4L10OneRowAudit,
  runAssistedAudit,
  runDependencyAssistedAudit,
  stageDependencyFla,
  validateDialogOperator,
  validateAssistedArtifacts,
  verifyDependencyContext,
};
