#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {PILOT_MIGRATIONS} from "./scaffold-pilot-migrations.mjs";
import {
  CANONICAL_PROJECTION_ENCODING,
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256 as projectTechnicalManifestSha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
const defaultIndexPath = path.join(defaultMigrationsRoot, "course-shell-pilot-renderer-frame-domain-support-index.json");
const probeScriptPath = path.join(projectRoot, "scripts", "probe-renderer-frame-domain-support.ts");
const tsxPath = path.join(projectRoot, "node_modules", ".bin", "tsx");

export const PILOT_RENDERER_AUDIT_IDS = Object.freeze(PILOT_MIGRATIONS.map(({id}) => id));

function portable(value) {
  return value.split(path.sep).join("/");
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(filePath) {
  return digest(await readFile(filePath));
}

async function exists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function assertNonemptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
}

function normalizeDomains(manifest, animationId) {
  const domains = manifest.implementation?.frameDomains;
  if (!Array.isArray(domains) || domains.length === 0) {
    throw new Error(`${animationId}: implementation.frameDomains must be a non-empty array`);
  }
  const ids = new Set();
  return domains.map((domain) => {
    assertNonemptyString(domain?.id, `${animationId}: frame-domain id`);
    if (ids.has(domain.id)) throw new Error(`${animationId}: duplicate frame domain ${domain.id}`);
    ids.add(domain.id);
    if (!Number.isSafeInteger(domain.frameCount) || domain.frameCount < 1) {
      throw new Error(`${animationId}: ${domain.id} has an invalid frameCount`);
    }
    if (!Array.isArray(domain.scenarioIds) || domain.scenarioIds.length === 0) {
      throw new Error(`${animationId}: ${domain.id} must declare scenarioIds`);
    }
    const scenarioIds = [...new Set(domain.scenarioIds)];
    if (scenarioIds.length !== domain.scenarioIds.length || scenarioIds.some((id) => typeof id !== "string" || !id)) {
      throw new Error(`${animationId}: ${domain.id} has invalid or duplicate scenarioIds`);
    }
    return {id: domain.id, frameCount: domain.frameCount, scenarioIds};
  });
}

export function buildProbeRequests(manifest, animationId = manifest.animationId) {
  const requests = [];
  for (const domain of normalizeDomains(manifest, animationId)) {
    const frames = domain.frameCount === 1 ? [1] : [1, domain.frameCount];
    for (const scenario of domain.scenarioIds) {
      for (const language of ["en", "es"]) {
        for (const frame of frames) {
          requests.push({
            requestId: `${domain.id}::${scenario}::${language}::${frame}`,
            frameDomain: domain.id,
            frame,
            scenario,
            language,
            seed: 0,
          });
        }
      }
    }
  }
  return requests;
}

function prototypeDomains(runtime) {
  return [
    {id: "root", frameCount: runtime.frameCount},
    ...((runtime.frameDomains || []).filter(({id}) => id !== "root").map(({id, frameCount}) => ({id, frameCount}))),
  ];
}

function probeOutcome(request, raw) {
  const actual = raw.actual;
  const checks = {
    frameDomain: actual?.frameDomain === request.frameDomain,
    frame: actual?.frame === request.frame,
    scenario: actual?.scenario === request.scenario,
    language: actual?.language === request.language,
  };
  const identityExact = Object.values(checks).every(Boolean);
  const blocked = actual?.status === "blocked" || Boolean(actual?.blocker);
  const renderable = !raw.error && raw.moduleScenarioDeclared && identityExact && !blocked;
  const outcome = raw.error
    ? "probe-error"
    : !identityExact
      ? "identity-mismatch"
      : !raw.moduleScenarioDeclared
        ? "scenario-undeclared-by-module"
        : blocked
          ? "blocked-not-renderable"
          : "renderable-exact";
  return {
    request,
    moduleScenarioDeclared: raw.moduleScenarioDeclared,
    actual,
    identityChecks: checks,
    identityExact,
    blocked,
    renderable,
    outcome,
    error: raw.error,
  };
}

export function buildRendererSupportReport({
  animationId,
  manifest,
  technicalManifestSha256,
  probe,
  sourceHashes,
}) {
  if (manifest.animationId !== animationId) throw new Error(`${animationId}: migration manifest identity mismatch`);
  if (probe.animationId !== animationId) throw new Error(`${animationId}: renderer probe identity mismatch`);
  if (probe.module?.key !== probe.prototypeKey) throw new Error(`${animationId}: loaded animation-module key mismatch`);
  const domains = normalizeDomains(manifest, animationId);
  const requests = buildProbeRequests(manifest, animationId);
  const rawById = new Map(probe.results.map((result) => [result.requestId, result]));
  if (rawById.size !== requests.length || probe.results.length !== requests.length) {
    throw new Error(`${animationId}: renderer probe result count does not match the request count`);
  }
  const probes = requests.map((request) => {
    const raw = rawById.get(request.requestId);
    if (!raw) throw new Error(`${animationId}: renderer probe omitted ${request.requestId}`);
    return probeOutcome(request, raw);
  });
  const runtimeDomains = prototypeDomains(probe.prototypeRuntime);
  const domainSupport = domains.map((domain) => {
    const runtimeDomain = runtimeDomains.find(({id}) => id === domain.id);
    const domainProbes = probes.filter(({request}) => request.frameDomain === domain.id);
    const prototypeRuntimeStatus = !runtimeDomain
      ? "missing"
      : runtimeDomain.frameCount === domain.frameCount
        ? "exact"
        : "frame-count-mismatch";
    return {
      frameDomain: domain.id,
      frameCount: domain.frameCount,
      scenarioIds: domain.scenarioIds,
      prototypeRuntime: {
        status: prototypeRuntimeStatus,
        reportedFrameCount: runtimeDomain?.frameCount ?? null,
      },
      probeCount: domainProbes.length,
      exactIdentityCount: domainProbes.filter(({identityExact}) => identityExact).length,
      blockedCount: domainProbes.filter(({blocked}) => blocked).length,
      renderableCount: domainProbes.filter(({renderable}) => renderable).length,
      fullyRenderable:
        prototypeRuntimeStatus === "exact" &&
        domainProbes.length > 0 &&
        domainProbes.every(({renderable}) => renderable),
    };
  });
  const outcomeCounts = Object.fromEntries(
    ["renderable-exact", "blocked-not-renderable", "scenario-undeclared-by-module", "identity-mismatch", "probe-error"]
      .map((outcome) => [outcome, probes.filter((probeResult) => probeResult.outcome === outcome).length])
  );
  const report = {
    schemaVersion: 1,
    evidenceType: "renderer-frame-domain-support-audit",
    animationId,
    status: domainSupport.every(({fullyRenderable}) => fullyRenderable)
      ? "fully-renderable"
      : "renderer-frame-domain-support-incomplete",
    migrationStatusAtGeneration: null,
    migrationStatusBinding: "excluded-from-technical-projection-and-deterministic-audit-output",
    migrationStatusChanged: false,
    authorityStatement: [
      "This deterministic engineering audit calls the registered animation module's pure getFrameState function directly; host DOM attributes and capture wrappers are not consulted.",
      "For every manifest implementation.frameDomains × scenarioIds × en/es combination, the first and last one-indexed frames are requested and the returned frameDomain, frame, scenario, and language must match exactly.",
      "A state whose status is blocked or whose blocker is non-null is recorded but never counted as renderable, even when all identity fields match.",
      "This audit does not prove visual fidelity, natural-runtime reachability, ActionScript behavior, audio synchronization, accessibility, human review, or owner acceptance.",
    ],
    generatedFrom: {
      migrationManifest: {
        path: "migration.json",
        hashMode: CANONICAL_PROJECTION_ENCODING,
        technicalProjection: TECHNICAL_MANIFEST_PROJECTION.id,
        technicalProjectionSha256: technicalManifestSha256,
        excludedPaths: TECHNICAL_MANIFEST_PROJECTION.excludedPaths,
      },
      prototypeRuntime: {path: "packages/demos/src/prototype-manifest.ts", sha256: sourceHashes.prototypeManifest},
      animationRegistry: {path: "packages/demos/src/animation-registry.ts", sha256: sourceHashes.animationRegistry},
      animationModule: {path: sourceHashes.module.path, sha256: sourceHashes.module.sha256},
      pureTimeline: {path: sourceHashes.timeline.path, sha256: sourceHashes.timeline.sha256},
      runtimeContract: {path: "packages/demos/src/contract.ts", sha256: sourceHashes.contract},
      auditContract: {path: "scripts/evidence-projections.mjs", sha256: sourceHashes.auditContract},
      auditBuilder: {path: "scripts/build-renderer-frame-domain-support.mjs", sha256: sourceHashes.builder},
      auditProbe: {path: "scripts/probe-renderer-frame-domain-support.ts", sha256: sourceHashes.probe},
    },
    loadedRuntime: {
      prototypeKey: probe.prototypeKey,
      rootFrameCount: probe.prototypeRuntime.frameCount,
      defaultFrameDomain: probe.prototypeRuntime.defaultFrameDomain ?? null,
      frameDomains: runtimeDomains,
      moduleMaturity: probe.module.maturity,
      moduleScenarioIds: probe.module.scenarios,
    },
    summary: {
      declaredFrameDomainCount: domains.length,
      fullyRenderableFrameDomainCount: domainSupport.filter(({fullyRenderable}) => fullyRenderable).length,
      probeCount: probes.length,
      exactIdentityCount: probes.filter(({identityExact}) => identityExact).length,
      blockedCount: probes.filter(({blocked}) => blocked).length,
      renderableCount: probes.filter(({renderable}) => renderable).length,
      outcomeCounts,
    },
    domainSupport,
    probes,
    strictAcceptanceEffect: "none; this audit only exposes renderer-addressability gaps and does not advance migration status or satisfy strict acceptance",
  };
  return report;
}

async function runProbe(animationId, requests, runner = undefined) {
  if (runner) return runner({animationId, requests});
  const temporary = await mkdtemp(path.join(tmpdir(), "help-math-renderer-audit-"));
  const inputPath = path.join(temporary, "probe-input.json");
  await writeFile(inputPath, `${JSON.stringify({animationId, requests})}\n`, "utf8");
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(tsxPath, [probeScriptPath, inputPath], {
        cwd: projectRoot,
        env: {...process.env, NO_COLOR: "1"},
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== 0) reject(new Error(`${animationId}: renderer probe failed (${code}): ${stderr.trim()}`));
        else {
          try { resolve(JSON.parse(stdout)); }
          catch (error) { reject(new Error(`${animationId}: renderer probe returned invalid JSON: ${error.message}`)); }
        }
      });
    });
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
}

function resolveProjectSource(relativePath, label) {
  assertNonemptyString(relativePath, label);
  if (path.isAbsolute(relativePath)) throw new Error(`${label} must be project-relative`);
  const resolved = path.resolve(projectRoot, relativePath);
  if (resolved !== projectRoot && !resolved.startsWith(`${projectRoot}${path.sep}`)) {
    throw new Error(`${label} escapes the project root`);
  }
  return resolved;
}

function animationModulePath(manifest, animationId) {
  const registryModule = manifest.implementation?.registryModule;
  assertNonemptyString(registryModule, `${animationId}: implementation.registryModule`);
  const match = /^\.\/modules\/([a-z0-9][a-z0-9-]*)$/.exec(registryModule);
  if (!match) throw new Error(`${animationId}: implementation.registryModule must be a canonical ./modules/<name> reference`);
  return path.join(projectRoot, "packages", "demos", "src", "modules", `${match[1]}.tsx`);
}

async function sourceHashesFor(animationId, manifest) {
  const paths = {
    prototypeManifest: path.join(projectRoot, "packages/demos/src/prototype-manifest.ts"),
    animationRegistry: path.join(projectRoot, "packages/demos/src/animation-registry.ts"),
    contract: path.join(projectRoot, "packages/demos/src/contract.ts"),
    builder: scriptPath,
    auditContract: path.join(projectRoot, "scripts", "evidence-projections.mjs"),
    probe: probeScriptPath,
    module: animationModulePath(manifest, animationId),
    timeline: resolveProjectSource(
      manifest.implementation?.timelineModule,
      `${animationId}: implementation.timelineModule`,
    ),
  };
  for (const [name, filePath] of Object.entries(paths)) {
    if (!(await exists(filePath))) throw new Error(`${animationId}: ${name} source is missing: ${portable(path.relative(projectRoot, filePath))}`);
  }
  return {
    prototypeManifest: await sha256File(paths.prototypeManifest),
    animationRegistry: await sha256File(paths.animationRegistry),
    contract: await sha256File(paths.contract),
    builder: await sha256File(paths.builder),
    auditContract: await sha256File(paths.auditContract),
    probe: await sha256File(paths.probe),
    module: {path: portable(path.relative(projectRoot, paths.module)), sha256: await sha256File(paths.module)},
    timeline: {path: portable(path.relative(projectRoot, paths.timeline)), sha256: await sha256File(paths.timeline)},
  };
}

export function parseArguments(argv) {
  const options = {check: false, migrationsRoot: defaultMigrationsRoot, indexPath: defaultIndexPath, ids: []};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--id") {
      const value = argv[++index];
      if (!value) throw new Error("--id requires a value");
      if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) throw new Error(`--id is not a safe animation ID: ${value}`);
      options.ids.push(value);
    }
    else if (argument === "--migrations") {
      const value = argv[++index];
      if (!value) throw new Error("--migrations requires a value");
      options.migrationsRoot = path.resolve(value);
      options.indexPath = path.join(options.migrationsRoot, path.basename(defaultIndexPath));
    } else if (argument === "--index") {
      const value = argv[++index];
      if (!value) throw new Error("--index requires a value");
      options.indexPath = path.resolve(value);
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

export async function buildRendererFrameDomainSupport(options = {}) {
  const migrationsRoot = path.resolve(options.migrationsRoot || defaultMigrationsRoot);
  const indexPath = path.resolve(options.indexPath || path.join(migrationsRoot, path.basename(defaultIndexPath)));
  const animationIds = options.ids?.length ? [...options.ids] : [...PILOT_RENDERER_AUDIT_IDS];
  if (new Set(animationIds).size !== animationIds.length) throw new Error("Renderer frame-domain audit IDs must not repeat");
  const results = [];
  for (const animationId of animationIds) {
    const workspace = path.join(migrationsRoot, animationId);
    const manifestPath = path.join(workspace, "migration.json");
    if (!(await exists(manifestPath))) throw new Error(`${animationId}: migration manifest is missing`);
    const manifestText = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestText);
    const requests = buildProbeRequests(manifest, animationId);
    const probe = await runProbe(animationId, requests, options.runner);
    const report = buildRendererSupportReport({
      animationId,
      manifest,
      technicalManifestSha256: projectTechnicalManifestSha256(manifest),
      probe,
      sourceHashes: options.sourceHashes?.[animationId] || await sourceHashesFor(animationId, manifest),
    });
    const outputPath = path.join(workspace, "audit", "renderer-frame-domain-support.json");
    const rendered = `${JSON.stringify(report, null, 2)}\n`;
    if (options.check) {
      if (!(await exists(outputPath))) throw new Error(`${animationId}: renderer frame-domain support audit is missing`);
      if (await readFile(outputPath, "utf8") !== rendered) throw new Error(`${animationId}: renderer frame-domain support audit is stale`);
    } else {
      await writeFile(outputPath, rendered, "utf8");
    }
    results.push({animationId, report, outputPath, reportSha256: digest(rendered)});
  }

  const index = {
    schemaVersion: 1,
    evidenceType: "course-shell-pilot-renderer-frame-domain-support-index",
    scope: options.ids?.length ? "explicit-animation-id-selection" : "all-16-pilots",
    status: results.every(({report}) => report.status === "fully-renderable")
      ? "all-fully-renderable"
      : "renderer-frame-domain-support-incomplete",
    pilotCount: results.length,
    fullyRenderablePilotCount: results.filter(({report}) => report.status === "fully-renderable").length,
    totalProbeCount: results.reduce((sum, {report}) => sum + report.summary.probeCount, 0),
    totalRenderableCount: results.reduce((sum, {report}) => sum + report.summary.renderableCount, 0),
    totalBlockedCount: results.reduce((sum, {report}) => sum + report.summary.blockedCount, 0),
    reports: results.map(({animationId, report, outputPath, reportSha256}) => ({
      animationId,
      path: portable(path.relative(projectRoot, outputPath)),
      sha256: reportSha256,
      status: report.status,
      declaredFrameDomainCount: report.summary.declaredFrameDomainCount,
      fullyRenderableFrameDomainCount: report.summary.fullyRenderableFrameDomainCount,
      probeCount: report.summary.probeCount,
      renderableCount: report.summary.renderableCount,
      blockedCount: report.summary.blockedCount,
    })),
    strictAcceptanceEffect: "none; index status is an engineering audit result, not a fidelity or acceptance claim",
  };
  const renderedIndex = `${JSON.stringify(index, null, 2)}\n`;
  if (options.check) {
    if (!(await exists(indexPath))) throw new Error("renderer frame-domain support index is missing");
    if (await readFile(indexPath, "utf8") !== renderedIndex) throw new Error("renderer frame-domain support index is stale");
  } else {
    await writeFile(indexPath, renderedIndex, "utf8");
  }
  return {index, indexPath, results, action: options.check ? "verified" : "written"};
}

function usage() {
  return `Usage: node scripts/build-renderer-frame-domain-support.mjs [options]\n\nOptions:\n  --id <animation-id>       Audit only this animation; repeatable\n  --migrations <directory>  Migration root (default: migrations)\n  --index <path>            Global index output path\n  --check                   Verify checked-in reports without writing\n  --help                    Show this help\n\nThe command audits pure renderer state only. It never changes manifests,\nsource assets, implementation modules, migration status, or review records.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(`${usage()}\n`);
  else {
    const result = await buildRendererFrameDomainSupport(options);
    process.stdout.write(`${result.action}: ${portable(path.relative(projectRoot, result.indexPath))} (${result.index.fullyRenderablePilotCount}/${result.index.pilotCount} pilots fully renderable; ${result.index.totalRenderableCount}/${result.index.totalProbeCount} probes renderable)\n`);
  }
}
