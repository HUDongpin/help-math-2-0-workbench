#!/usr/bin/env node

import {
  constants as fsConstants,
} from "node:fs";
import {
  chmod,
  lstat,
  open,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import {createHash, randomUUID} from "node:crypto";
import {execFile} from "node:child_process";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

const RELEASE_ID = "lesson-g05-l04-number-lines";
const SOURCE_SCOPE_PATH = "reports/g5-l4-source-scope-freeze.json";
const SOURCE_SCOPE_BYTES = 168839;
const SOURCE_SCOPE_SHA256 =
  "a46a673014d1934415ed0a5327bfc1ada40e23ca3d5b6d3c58159141384b8d20";
const RELEASE_CATALOG_PATH = "catalog/lesson-releases.json";
const JSON_OUTPUT_PATH = "reports/g5-l4-workspace-readiness.json";
const MARKDOWN_OUTPUT_PATH = "reports/g5-l4-workspace-readiness.md";
const SOURCE_BINDING_SUFFIX =
  "audit/machine/g5-l4-source-scope-binding.json";
const VALIDATOR_PATH =
  "skills/flash-to-js/scripts/validate_migration.mjs";
const SHA256 = /^[a-f0-9]{64}$/u;
const SOURCE_STATIC_CANDIDATE_IDS = Object.freeze([
  "course-g05-l04-rw-002",
  "course-g05-l04-rw-003",
  "course-g05-l04-rw-004",
  "course-g05-l04-vb-002",
  "course-g05-l04-vb-005",
  "course-g05-l04-vb-006",
  "course-g05-l04-vb-007",
  "course-g05-l04-vb-008",
  "course-g05-l04-vb-009",
  "course-g05-l04-vb-010",
  "course-g05-l04-vb-011",
  "course-g05-l04-in-002",
  "course-g05-l04-in-003",
  "course-g05-l04-in-004",
  "course-g05-l04-in-005",
  "course-g05-l04-in-007",
  "course-g05-l04-in-009",
  "course-g05-l04-in-010",
  "course-g05-l04-in-012",
  "course-g05-l04-in-013",
  "course-g05-l04-in-014",
  "course-g05-l04-in-015",
  "course-g05-l04-in-016",
  "course-g05-l04-in-017",
  "course-g05-l04-in-018",
  "course-g05-l04-in-020",
  "course-g05-l04-ts-002",
  "course-g05-l04-ts-003",
  "course-g05-l04-ts-004",
  "course-g05-l04-ts-005",
  "course-g05-l04-ts-006",
  "course-g05-l04-ts-007",
  "course-g05-l04-ts-008",
  "course-g05-l04-vb-003",
  "course-g05-l04-vb-004",
  "course-g05-l04-in-006",
  "course-g05-l04-in-008",
  "course-g05-l04-in-011",
  "course-g05-l04-in-019",
  "course-g05-l04-in-021",
  "course-g05-l04-in-022",
  "course-g05-l04-ti-002",
  "course-g05-l04-ti-003",
  "course-g05-l04-ti-004",
  "course-g05-l04-ti-005",
  "course-g05-l04-ti-006",
  "course-g05-l04-ti-007",
  "course-g05-l04-ti-008",
  "course-g05-l04-ti-009",
  "course-g05-l04-gs-002",
  "course-g05-l04-ir-001-a662633d",
  "course-g05-l04-fq-001",
]);
const FQ001_COMPOSITE_ID = "course-g05-l04-fq-001";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function hasExactSourceStaticFrameBoundary(candidate, nested) {
  if (
    !Number.isSafeInteger(candidate?.renderedFrameCount) ||
    candidate.renderedFrameCount <= 0 ||
    candidate.renderedFrameCount > nested?.frameCount
  ) {
    return false;
  }
  if (candidate.renderedFrameCount === nested.frameCount) {
    return candidate.sourceStaticRenderableFrames === undefined &&
      candidate.blockedLocalFrameRanges === undefined;
  }
  const renderable = candidate.sourceStaticRenderableFrames;
  const blocked = candidate.blockedLocalFrameRanges;
  return renderable?.firstFrame === 1 &&
    renderable.lastFrame === candidate.renderedFrameCount &&
    renderable.frameCount === candidate.renderedFrameCount &&
    Array.isArray(blocked) &&
    blocked.length === 1 &&
    blocked[0]?.firstFrame === candidate.renderedFrameCount + 1 &&
    blocked[0]?.lastFrame === nested.frameCount;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function portable(candidate) {
  return candidate.split(path.sep).join("/");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

function statIdentity(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
    nlink: String(information.nlink),
    size: String(information.size),
    mtimeNs: String(information.mtimeNs),
    ctimeNs: String(information.ctimeNs),
  };
}

function sameIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function assertRealDirectoryTree(root, candidate, label) {
  const resolvedRoot = path.resolve(root);
  const canonicalRoot = await realpath(resolvedRoot);
  invariant(
    resolvedRoot === canonicalRoot,
    `${label}: containment root must be canonical`,
  );
  const resolvedCandidate = path.resolve(candidate);
  invariant(
    contained(resolvedRoot, resolvedCandidate),
    `${label}: path escapes project root`,
  );
  let cursor = resolvedRoot;
  const parentRelative = path.relative(
    resolvedRoot,
    path.dirname(resolvedCandidate),
  );
  for (const segment of parentRelative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const information = await lstat(cursor, {bigint: true});
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label}: parent must be a real directory`,
    );
    invariant(
      contained(canonicalRoot, await realpath(cursor)),
      `${label}: parent resolves outside project root`,
    );
  }
  return resolvedCandidate;
}

export async function readStableSingleLinkFile(
  root,
  relativePath,
  label = relativePath,
) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      portable(relativePath) === relativePath &&
      !path.posix.isAbsolute(relativePath) &&
      !relativePath.split("/").includes(".."),
    `${label}: unsafe relative path`,
  );
  const absolute = await assertRealDirectoryTree(
    root,
    path.join(root, relativePath),
    label,
  );
  const before = await lstat(absolute, {bigint: true});
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1n,
    `${label}: expected one ordinary single-link file`,
  );
  const canonicalRoot = await realpath(root);
  const canonicalFile = await realpath(absolute);
  invariant(
    contained(canonicalRoot, canonicalFile),
    `${label}: file resolves outside project root`,
  );
  const handle = await open(
    absolute,
    fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0),
  );
  let descriptorBefore;
  let descriptorAfter;
  let bytes;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    invariant(
      descriptorBefore.isFile() &&
        descriptorBefore.nlink === 1n &&
        sameIdentity(
          statIdentity(before),
          statIdentity(descriptorBefore),
        ),
      `${label}: file changed before read`,
    );
    bytes = await handle.readFile();
    descriptorAfter = await handle.stat({bigint: true});
    invariant(
      sameIdentity(
        statIdentity(descriptorBefore),
        statIdentity(descriptorAfter),
      ),
      `${label}: file changed during read`,
    );
  } finally {
    await handle.close();
  }
  const after = await lstat(absolute, {bigint: true});
  invariant(
    sameIdentity(
      statIdentity(descriptorAfter),
      statIdentity(after),
    ) &&
      (await realpath(absolute)) === canonicalFile &&
      bytes.length === Number(after.size),
    `${label}: file changed after read`,
  );
  return {
    relativePath,
    absolute,
    bytes,
    sha256: sha256(bytes),
    identity: statIdentity(after),
    canonicalFile,
  };
}

async function assertSnapshotCurrent(root, snapshot, label) {
  const current = await readStableSingleLinkFile(
    root,
    snapshot.relativePath,
    label,
  );
  invariant(
    current.sha256 === snapshot.sha256 &&
      current.bytes.length === snapshot.bytes.length &&
      sameIdentity(current.identity, snapshot.identity) &&
      current.canonicalFile === snapshot.canonicalFile,
    `${label}: input changed after preflight`,
  );
}

function descriptor(record) {
  return {
    path: record.relativePath,
    bytes: record.bytes.length,
    sha256: record.sha256,
  };
}

function allFalse(value, keys) {
  return keys.every((key) => value?.[key] === false);
}

function selectRelease(catalog) {
  invariant(
    catalog?.schemaVersion === 1 &&
      Array.isArray(catalog.releases),
    "lesson-release catalog is malformed",
  );
  const matches = catalog.releases.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(matches.length === 1, "exact G5 L4 release is missing");
  const release = matches[0];
  invariant(
    release.publicationMode === "atomic" &&
      release.expectedCounts?.members === 55 &&
      release.expectedCounts?.activeXmlReferencedPages === 54 &&
      release.expectedCounts?.courseShells === 1 &&
      release.members?.length === 55 &&
      release.members.every(
        ({ordinal}, index) => ordinal === index + 1,
      ),
    "G5 L4 release scope drifted",
  );
  return release;
}

function validateScope(scope, release) {
  invariant(
    scope?.schemaVersion === 1 &&
      scope.reportType === "g5-l4-source-scope-freeze" &&
      scope.releaseId === RELEASE_ID &&
      scope.summary?.memberCount === 55 &&
      scope.summary.pairedFlaSwfCount === 44 &&
      scope.summary.swfOnlyCount === 11 &&
      scope.summary.strictCompleteCount === 0 &&
      scope.summary.publishedCount === 0 &&
      scope.members?.length === 55 &&
      allFalse(scope.acceptanceEffects, [
        "authoringAuditComplete",
        "reachableFrameDomainsComplete",
        "authoritativeOriginalRuntime",
        "currentJavaScriptCandidate",
        "fullFrameComparison",
        "audioAccepted",
        "humanVisualAccepted",
        "ownerAccepted",
        "strictComplete",
        "published",
      ]),
    "frozen G5 L4 scope crossed its evidence boundary",
  );
  for (const [index, member] of scope.members.entries()) {
    const releaseMember = release.members[index];
    invariant(
      member.ordinal === releaseMember.ordinal &&
        member.animationId === releaseMember.animationId &&
        member.assetId === releaseMember.assetId &&
        member.shardId === releaseMember.shardId &&
        member.source?.swf?.path === releaseMember.source.path &&
        member.source.swf.sha256 === releaseMember.source.sha256 &&
        member.workspacePath ===
          `migrations/${releaseMember.animationId}` &&
        member.strictComplete === false,
      `${member.animationId}: frozen scope/release identity drifted`,
    );
  }
}

function validateManifest(manifest, member, compositeRecords = null) {
  const sourceStaticCandidate =
    SOURCE_STATIC_CANDIDATE_IDS.includes(member.animationId);
  invariant(
    manifest?.id === member.animationId &&
      manifest.animationId === member.animationId &&
      manifest.assetId === member.assetId &&
      manifest.status === "preserved" &&
      manifest.source?.swfSha256 === member.source.swf.sha256 &&
      manifest.source?.flaSha256 ===
        (member.source.fla?.sha256 || "") &&
      manifest.source?.pairedFlaStatus ===
        (member.source.fla ? "present" : "missing") &&
      manifest.classification?.status !== "unresolved" &&
      manifest.acceptance?.engineeringReview?.decision === "pending" &&
      manifest.acceptance?.humanVisualReview?.decision === "pending" &&
      manifest.acceptance?.ownerReview?.decision === "pending",
    `${member.animationId}: workspace identity or draft boundary drifted`,
  );
  if (!sourceStaticCandidate) {
    invariant(
      manifest.implementation?.rendering === "undecided" &&
        manifest.implementation?.route === "" &&
        manifest.implementation?.component === "",
      `${member.animationId}: non-candidate workspace crossed its draft boundary`,
    );
    return "not-started";
  }
  if (member.animationId === FQ001_COMPOSITE_ID) {
    const report = compositeRecords?.report &&
      JSON.parse(compositeRecords.report.bytes);
    const spec = compositeRecords?.spec &&
      JSON.parse(compositeRecords.spec.bytes);
    const disposition = compositeRecords?.disposition &&
      JSON.parse(compositeRecords.disposition.bytes);
    const maturity = manifest.implementation?.candidateMaturity;
    invariant(
      manifest.implementation?.rendering === "undecided" &&
        manifest.implementation.route === "" &&
        manifest.implementation.component === "" &&
        manifest.implementation.defaultFrameDomainId === "root" &&
        manifest.implementation.frameDomains?.length === 1 &&
        manifest.implementation.frameDomains[0]?.id === "root" &&
        manifest.implementation.candidateState === undefined &&
        maturity?.status ===
          "current-javascript-engineering-candidate-only" &&
        maturity.candidateKind === "dual-sprite-composite-prefix" &&
        maturity.bindingAuthority ===
          "independent-fq001-composite-evidence-only" &&
        maturity.route === `/animations/${FQ001_COMPOSITE_ID}` &&
        maturity.component ===
          `packages/demos/src/modules/${FQ001_COMPOSITE_ID}.tsx` &&
        maturity.registryModule === `./modules/${FQ001_COMPOSITE_ID}` &&
        maturity.timelineModule ===
          `packages/demos/src/timelines/${FQ001_COMPOSITE_ID}.ts` &&
        maturity.publicComposite?.frameDomain === "sprite-145" &&
        maturity.publicComposite.firstFrame === 1 &&
        maturity.publicComposite.lastFrame === 52 &&
        maturity.publicComposite.openFrameCount === 52 &&
        maturity.publicComposite.fixedCompanionFrameDomain === "sprite-100" &&
        maturity.publicComposite.fixedCompanionFrame === 1 &&
        maturity.canonicalDefaultFrameDomainId === "root" &&
        maturity.canonicalFrameDomainsChanged === false &&
        maturity.canonicalFrameDomainDisposition === "unresolved" &&
        maturity.canonicalNestedCoverageDeclared === false &&
        maturity.implementationAuthorized === false &&
        maturity.strictAcceptanceEffect === "none" &&
        spec?.animationId === FQ001_COMPOSITE_ID &&
        spec.classification ===
          "source-static-dual-sprite-composite-current-javascript-engineering-candidate-only" &&
        spec.timeline?.public?.frameDomain === "sprite-145" &&
        spec.timeline.public.frameCount === 52 &&
        spec.timeline.fixedCompanion?.frameDomain === "sprite-100" &&
        spec.timeline.fixedCompanion.frameCount === 1 &&
        spec.runtimeContract?.rootRequestsEnabled === false &&
        spec.runtimeContract.companionStandaloneRequestsEnabled === false &&
        spec.strictAcceptanceEffect === "none" &&
        report?.animationId === FQ001_COMPOSITE_ID &&
        report.status === "current-javascript-engineering-candidate-only" &&
        report.renderer?.primaryFrameDomain === "sprite-145" &&
        report.renderer.primaryFirstFrame === 1 &&
        report.renderer.primaryLastFrame === 52 &&
        report.renderer.fixedCompanionFrameDomain === "sprite-100" &&
        report.renderer.fixedCompanionFrame === 1 &&
        report.renderer.rootEnabled === false &&
        report.renderer.companionStandaloneEnabled === false &&
        report.browserQa?.renderedFrameCount === 52 &&
        report.evidenceBoundary?.canonicalFrameDomainDispositionChanged ===
          false &&
        report.evidenceBoundary.canonicalFrameDomainDispositionAccepted ===
          false &&
        report.strictAcceptanceEffect === "none" &&
        allFalse(
          report.acceptanceEffects,
          Object.keys(report.acceptanceEffects || {}),
        ) &&
        disposition?.animationId === FQ001_COMPOSITE_ID &&
        disposition.status ===
          "structurally-enumerated-dispositions-unresolved" &&
        disposition.summary?.dispositionCounts?.unresolved === 2 &&
        disposition.timelines?.find(
          ({timelineId}) => timelineId === "sprite-145",
        )?.disposition === "unresolved" &&
        compositeRecords.registry.bytes.toString("utf8").includes(
          `'${FQ001_COMPOSITE_ID}': () => import('./modules/${FQ001_COMPOSITE_ID}')`,
        ),
      `${member.animationId}: dual-sprite composite candidate boundary drifted`,
    );
    return "dual-sprite-composite-engineering-candidate";
  }
  const candidate = manifest.implementation?.candidateState;
  const domains = manifest.implementation?.frameDomains;
  const nested = domains?.find(({kind}) => kind === "nested");
  invariant(
    typeof manifest.implementation?.rendering === "string" &&
      manifest.implementation.rendering.startsWith(
        "source-static Canvas engineering candidate;",
      ) &&
      manifest.implementation.route ===
        `/animations/${member.animationId}` &&
      manifest.implementation.component ===
        `packages/demos/src/modules/${member.animationId}.tsx` &&
      Array.isArray(domains) &&
      domains.length === 2 &&
      domains.some(
        ({id, kind, frameCount}) =>
          id === "root" &&
          kind === "root" &&
          frameCount === manifest.runtime.frameCount,
      ) &&
      Number.isSafeInteger(nested?.frameCount) &&
      nested.frameCount > 0 &&
      candidate?.status ===
        "current-javascript-engineering-candidate-only" &&
      candidate.sourceStaticFrameDomain === nested.id &&
      hasExactSourceStaticFrameBoundary(candidate, nested) &&
      candidate.rootEnabled === false &&
      candidate.spanishEnabled === false &&
      candidate.audioEnabled === false &&
      candidate.sourceControlsEnabled === false &&
      candidate.replayParityEstablished === false &&
      candidate.originalRuntimeBaselineUsed === false &&
      candidate.rmseComputed === false &&
      candidate.humanVisualReviewPerformed === false &&
      candidate.ownerReviewPerformed === false &&
      candidate.strictAcceptanceEffect === "none",
    `${member.animationId}: source-static candidate boundary drifted`,
  );
  return "source-static-engineering-candidate";
}

function validateScopeBinding(binding, member, scopeDescriptor) {
  invariant(
    binding?.schemaVersion === 1 &&
      binding.artifactType === "g5-l4-source-scope-binding" &&
      binding.releaseId === RELEASE_ID &&
      JSON.stringify(binding.scope) ===
        JSON.stringify(scopeDescriptor) &&
      binding.member?.ordinal === member.ordinal &&
      binding.member?.animationId === member.animationId &&
      binding.member?.assetId === member.assetId &&
      binding.member?.shardId === member.shardId &&
      binding.member?.source?.swf?.sha256 ===
        member.source.swf.sha256 &&
      binding.acceptanceEffects?.draftWorkspaceShapeOnly === true &&
      allFalse(binding.acceptanceEffects, [
        "authoritativeOriginalRuntime",
        "currentJavaScriptCandidate",
        "fullFrameComparison",
        "audioAccepted",
        "humanVisualAccepted",
        "ownerAccepted",
        "strictComplete",
        "published",
      ]),
    `${member.animationId}: source-scope binding drifted or was promoted`,
  );
}

async function runDraftValidator(root, member, runner = execFileAsync) {
  const workspace = path.join(root, member.workspacePath);
  const validator = path.join(root, VALIDATOR_PATH);
  const {stdout = "", stderr = ""} = await runner(
    process.execPath,
    [validator, workspace, "--allow-draft"],
    {
      cwd: root,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  invariant(
    `${stdout}\n${stderr}`.includes("PASS: draft validation"),
    `${member.animationId}: draft validator did not report PASS`,
  );
  return {
    mode: "allow-draft",
    passed: true,
    acceptanceEffect: "portable-schema-and-intake-shape-only",
  };
}

async function mapLimited(items, limit, callback) {
  const results = [];
  for (let index = 0; index < items.length; index += limit) {
    results.push(
      ...(await Promise.all(
        items.slice(index, index + limit).map(callback),
      )),
    );
  }
  return results;
}

function buildReport(scopeDescriptor, workspaces) {
  return {
    schemaVersion: 1,
    reportType: "g5-l4-workspace-readiness",
    releaseId: RELEASE_ID,
    scope: scopeDescriptor,
    summary: {
      expectedWorkspaceCount: 55,
      presentWorkspaceCount: workspaces.length,
      draftValidationPassCount: workspaces.filter(
        ({draftValidation}) => draftValidation.passed,
      ).length,
      pairedWorkspaceCount: workspaces.filter(
        ({sourceModel}) =>
          sourceModel === "paired-fla-and-shipped-swf",
      ).length,
      swfOnlyWorkspaceCount: workspaces.filter(
        ({sourceModel}) => sourceModel === "shipped-swf-only",
      ).length,
      implementationStartedCount: workspaces.filter(
        ({implementationStatus}) => implementationStatus !== "not-started",
      ).length,
      strictCompleteCount: 0,
      publishedCount: 0,
    },
    workspaces,
    blockers: [
      "active-course-xml-versus-legacy-main-script-page-set",
      "missing-lesson-keyterm-localization-xml",
      "audio-runtime-language-cue-and-listening-disposition",
      "root-reachable-frame-domain-audit-not-complete",
      "authoritative-original-runtime-evidence-not-present",
      "human-and-owner-decisions-not-present",
    ],
    acceptanceEffects: {
      workspaceIntakeReady:
        workspaces.length === 55 &&
        workspaces.every(
          ({draftValidation}) => draftValidation.passed,
        ),
      authoringAuditComplete: false,
      strictComplete: false,
      published: false,
    },
  };
}

function renderMarkdown(report, reportDescriptor) {
  return (
    "# G5 L4 Workspace Readiness\n\n" +
    `- Canonical workspaces present: **${report.summary.presentWorkspaceCount}/${report.summary.expectedWorkspaceCount}**.\n` +
    `- Draft validation: **${report.summary.draftValidationPassCount}/${report.summary.expectedWorkspaceCount}**.\n` +
    `- Paired FLA/SWF: **${report.summary.pairedWorkspaceCount}**; SWF-only: **${report.summary.swfOnlyWorkspaceCount}**.\n` +
    `- Implementation candidates / strict / published: **${report.summary.implementationStartedCount} / 0 / 0**.\n` +
    `- JSON descriptor: \`${reportDescriptor.sha256}\` (${reportDescriptor.bytes} bytes).\n\n` +
    "Draft validation proves only portable workspace schema and intake shape. Fifty-two bounded canonical current-JavaScript engineering candidates are tracked separately: 51 manifest-bound single-sprite candidates and one independently evidenced FQ001 dual-sprite composite whose canonical frame-domain disposition remains unresolved. The product-only FQ002/FQ003 inspection atlases are not canonical migration-workspace promotions and are not counted here. These candidates do not establish original-runtime reachability, bilingual parity, RMSE, audio, human, owner, strict-completion, or publication acceptance.\n"
  );
}

export function parseArguments(argv) {
  invariant(Array.isArray(argv), "arguments must be an array");
  let mode = null;
  let help = false;
  for (const argument of argv) {
    if (argument === "--help" || argument === "-h") {
      invariant(!help && mode === null, "--help must be used alone");
      help = true;
      continue;
    }
    const candidate =
      argument === "--dry-run"
        ? "dry-run"
        : argument === "--check"
          ? "check"
          : argument === "--write"
            ? "write"
            : null;
    invariant(candidate, `unknown argument: ${argument}`);
    invariant(mode === null && !help, "choose exactly one mode");
    mode = candidate;
  }
  invariant(help || mode !== null, "choose --dry-run, --check, or --write");
  return {mode, help};
}

async function captureOutput(root, relativePath) {
  return readStableSingleLinkFile(root, relativePath, relativePath);
}

async function writeReportPair(root, outputs, priorOutputs, inputSnapshots) {
  const nonce = `${process.pid}-${randomUUID()}`;
  const states = [];
  try {
    for (let index = 0; index < outputs.length; index += 1) {
      const output = outputs[index];
      const prior = priorOutputs[index];
      const temporary = `${prior.absolute}.${nonce}.tmp`;
      const backup = `${prior.absolute}.${nonce}.bak`;
      await writeFile(temporary, output.bytes, {
        flag: "wx",
        mode: 0o644,
      });
      const handle = await open(temporary, fsConstants.O_RDONLY);
      try {
        await handle.sync();
      } finally {
        await handle.close();
      }
      await writeFile(backup, prior.bytes, {
        flag: "wx",
        mode: 0o600,
      });
      await chmod(backup, 0o644);
      states.push({output, prior, temporary, backup, installed: false});
    }
    for (const snapshot of inputSnapshots) {
      await assertSnapshotCurrent(root, snapshot, snapshot.relativePath);
    }
    for (const state of states) {
      await assertSnapshotCurrent(
        root,
        state.prior,
        `${state.prior.relativePath}: output CAS`,
      );
    }
    for (const state of states) {
      await rename(state.temporary, state.prior.absolute);
      state.installed = true;
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const state of [...states].reverse()) {
      try {
        if (state.installed) {
          await rename(state.backup, state.prior.absolute);
          state.installed = false;
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
      await unlink(state.temporary).catch(() => {});
      await unlink(state.backup).catch(() => {});
    }
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "workspace-readiness refresh failed and rollback was incomplete",
      );
    }
    throw error;
  }
  for (const state of states) {
    await unlink(state.backup);
  }
}

export async function buildG5L4WorkspaceReadinessRefresh({
  root = projectRoot,
  mode,
  validatorRunner = execFileAsync,
} = {}) {
  invariant(
    ["dry-run", "check", "write"].includes(mode),
    "mode must be dry-run, check, or write",
  );
  const [scopeRecord, releaseRecord] = await Promise.all([
    readStableSingleLinkFile(root, SOURCE_SCOPE_PATH, "frozen source scope"),
    readStableSingleLinkFile(
      root,
      RELEASE_CATALOG_PATH,
      "lesson-release catalog",
    ),
  ]);
  invariant(
    scopeRecord.bytes.length === SOURCE_SCOPE_BYTES &&
      scopeRecord.sha256 === SOURCE_SCOPE_SHA256,
    "frozen source-scope descriptor drifted",
  );
  const scope = JSON.parse(scopeRecord.bytes);
  const release = selectRelease(JSON.parse(releaseRecord.bytes));
  validateScope(scope, release);
  const scopeDescriptor = descriptor(scopeRecord);

  const inputSnapshots = [scopeRecord, releaseRecord];
  const workspaces = await mapLimited(
    scope.members,
    8,
    async (member) => {
      const manifestPath = `${member.workspacePath}/migration.json`;
      const bindingPath =
        `${member.workspacePath}/${SOURCE_BINDING_SUFFIX}`;
      const [manifestRecord, bindingRecord] = await Promise.all([
        readStableSingleLinkFile(
          root,
          manifestPath,
          `${member.animationId}: migration manifest`,
        ),
        readStableSingleLinkFile(
          root,
          bindingPath,
          `${member.animationId}: source-scope binding`,
        ),
      ]);
      let compositeRecords = null;
      if (member.animationId === FQ001_COMPOSITE_ID) {
        const base = member.workspacePath;
        const [spec, report, disposition, registry] = await Promise.all([
          readStableSingleLinkFile(
            root,
            `${base}/audit/dual-sprite-composite-current-js-candidate-spec.json`,
            `${member.animationId}: composite candidate spec`,
          ),
          readStableSingleLinkFile(
            root,
            `${base}/evidence/dual-sprite-composite-current-js-candidate.json`,
            `${member.animationId}: composite candidate report`,
          ),
          readStableSingleLinkFile(
            root,
            `${base}/audit/frame-domain-disposition.json`,
            `${member.animationId}: frame-domain disposition`,
          ),
          readStableSingleLinkFile(
            root,
            "packages/demos/src/registry.generated.ts",
            `${member.animationId}: generated registry`,
          ),
        ]);
        compositeRecords = {spec, report, disposition, registry};
      }
      const implementationStatus = validateManifest(
        JSON.parse(manifestRecord.bytes),
        member,
        compositeRecords,
      );
      validateScopeBinding(
        JSON.parse(bindingRecord.bytes),
        member,
        scopeDescriptor,
      );
      const draftValidation = await runDraftValidator(
        root,
        member,
        validatorRunner,
      );
      inputSnapshots.push(
        manifestRecord,
        bindingRecord,
        ...Object.values(compositeRecords || {}),
      );
      return {
        ordinal: member.ordinal,
        animationId: member.animationId,
        assetId: member.assetId,
        shardId: member.shardId,
        sourceModel: member.source.sourceModel,
        workspacePath: member.workspacePath,
        manifest: descriptor(manifestRecord),
        sourceScopeBinding: descriptor(bindingRecord),
        ...(compositeRecords
          ? {
              engineeringCandidateEvidence: {
                specification: descriptor(compositeRecords.spec),
                report: descriptor(compositeRecords.report),
                canonicalFrameDomainDisposition:
                  descriptor(compositeRecords.disposition),
                registry: descriptor(compositeRecords.registry),
              },
            }
          : {}),
        draftValidation,
        implementationStatus,
        strictComplete: false,
      };
    },
  );
  const report = buildReport(scopeDescriptor, workspaces);
  invariant(
    report.summary.presentWorkspaceCount === 55 &&
      report.summary.draftValidationPassCount === 55 &&
      report.summary.pairedWorkspaceCount === 44 &&
      report.summary.swfOnlyWorkspaceCount === 11 &&
      report.summary.implementationStartedCount ===
        SOURCE_STATIC_CANDIDATE_IDS.length &&
      report.summary.strictCompleteCount === 0 &&
      report.summary.publishedCount === 0 &&
      report.acceptanceEffects.workspaceIntakeReady === true &&
      report.acceptanceEffects.authoringAuditComplete === false &&
      report.acceptanceEffects.strictComplete === false &&
      report.acceptanceEffects.published === false,
    "workspace-readiness aggregate crossed its draft-only boundary",
  );
  const json = jsonBytes(report);
  const jsonDescriptor = {
    path: JSON_OUTPUT_PATH,
    bytes: json.length,
    sha256: sha256(json),
  };
  const markdown = Buffer.from(renderMarkdown(report, jsonDescriptor));
  const outputs = [
    {relativePath: JSON_OUTPUT_PATH, bytes: json},
    {relativePath: MARKDOWN_OUTPUT_PATH, bytes: markdown},
  ];
  const priorOutputs = await Promise.all(
    outputs.map(({relativePath}) => captureOutput(root, relativePath)),
  );

  if (mode === "check") {
    for (let index = 0; index < outputs.length; index += 1) {
      invariant(
        priorOutputs[index].bytes.equals(outputs[index].bytes),
        `${outputs[index].relativePath} is stale`,
      );
    }
  } else if (mode === "write") {
    await writeReportPair(root, outputs, priorOutputs, inputSnapshots);
  }
  return {
    action:
      mode === "dry-run"
        ? "planned"
        : mode === "check"
          ? "verified"
          : "written",
    releaseId: RELEASE_ID,
    memberCount: 55,
    draftValidationPassCount: 55,
    workspaceFilesWritten: 0,
    reportFilesWritten: mode === "write" ? 2 : 0,
    implementationStarted: SOURCE_STATIC_CANDIDATE_IDS.length,
    strictComplete: 0,
    published: 0,
    outputs: [
      jsonDescriptor,
      {
        path: MARKDOWN_OUTPUT_PATH,
        bytes: markdown.length,
        sha256: sha256(markdown),
      },
    ],
  };
}

function usage() {
  return `Usage:
  node scripts/refresh-g5-l4-workspace-readiness.mjs --dry-run
  node scripts/refresh-g5-l4-workspace-readiness.mjs --check
  node scripts/refresh-g5-l4-workspace-readiness.mjs --write

This fixed-path command re-inspects the exact frozen G5 L4 scope and all 55
current draft workspaces. It writes only the two derived workspace-readiness
reports. It never scaffolds, synchronizes, or edits a workspace or source.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const result = await buildG5L4WorkspaceReadinessRefresh({
      mode: options.mode,
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
