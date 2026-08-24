#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, readdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_RUN =
  "work/g3-l2-ffdec-canvas-pcode-factory/full/run-manifest.json";
const OUTPUT = "reports/g3-l2-cross-grade-factory-audit.json";

const ACCEPTANCE_EFFECTS = Object.freeze({
  currentJavaScriptRegisteredByFactoryAudit: false,
  avm1BehaviorCompiled: false,
  exactExternalAudioPlaybackCompiled: false,
  nestedAudioPlaybackCompiled: false,
  authoritativeOriginalRuntime: false,
  behaviorParityAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function resolveProject(relativePath, label) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    `${label}: project-relative path required`,
  );
  invariant(!path.isAbsolute(relativePath), `${label}: absolute path forbidden`);
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(
    relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `${label}: path escapes project`,
  );
  return resolved;
}

async function ordinaryFile(relativePath, label) {
  const absolutePath = resolveProject(relativePath, label);
  const info = await lstat(absolutePath);
  invariant(
    info.isFile() && !info.isSymbolicLink(),
    `${label}: expected an ordinary file`,
  );
  const bytes = await readFile(absolutePath);
  return Object.freeze({
    path: portable(relativePath),
    absolutePath,
    bytes,
    identity: Object.freeze({bytes: bytes.length, sha256: sha256(bytes)}),
  });
}

function parseAttributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([A-Za-z][A-Za-z0-9]*)="([^"]*)"/g)].map(
      (match) => [match[1], match[2]],
    ),
  );
}

/**
 * Resolve the exact direct root placement named `Animation`, including the
 * one-indexed root frame on which it is created. Nested placements are ignored
 * by maintaining the XML element stack rather than matching the whole file.
 */
export function parseDirectRootAnimationPlacement(xml) {
  const stack = [];
  const sprites = new Map();
  const rootLabels = [];
  const placements = [];
  let directShowFrameCount = 0;
  const tokens = xml.matchAll(/<\/?[A-Za-z][^>]*>/g);
  for (const match of tokens) {
    const tag = match[0];
    const closing = tag.startsWith("</");
    const name = tag.match(/^<\/?([A-Za-z][A-Za-z0-9]*)/)?.[1];
    invariant(name, "swfmill XML contains an invalid tag");
    if (closing) {
      invariant(
        stack.at(-1) === name,
        `swfmill XML stack mismatch: expected ${stack.at(-1)}, found ${name}`,
      );
      stack.pop();
      continue;
    }
    const selfClosing = /\/\s*>$/.test(tag);
    const parentPath = stack.join("/");
    const attributes = parseAttributes(tag);
    if (name === "DefineSprite") {
      const objectId = Number(attributes.objectID);
      const frameCount = Number(attributes.frames);
      invariant(
        Number.isSafeInteger(objectId) && objectId > 0 &&
          Number.isSafeInteger(frameCount) && frameCount > 0,
        "DefineSprite metadata is invalid",
      );
      invariant(!sprites.has(objectId), `duplicate DefineSprite ${objectId}`);
      sprites.set(objectId, frameCount);
    }
    if (parentPath === "swf/Header/tags") {
      if (name === "ShowFrame") directShowFrameCount += 1;
      if (name === "FrameLabel") {
        rootLabels.push(
          Object.freeze({frame: directShowFrameCount + 1, label: attributes.label}),
        );
      }
      if (
        name === "PlaceObject2" &&
        String(attributes.name ?? "").toLowerCase() === "animation"
      ) {
        const closingOffset = xml.indexOf("</PlaceObject2>", match.index);
        invariant(closingOffset > match.index, "root Animation placement is incomplete");
        const body = xml.slice(match.index, closingOffset + "</PlaceObject2>".length);
        const transformTag = body.match(/<Transform\b[^>]*\/>/)?.[0];
        invariant(transformTag, "root Animation placement has no transform");
        const transform = parseAttributes(transformTag);
        placements.push(
          Object.freeze({
            frame: directShowFrameCount + 1,
            objectId: Number(attributes.objectID),
            depth: Number(attributes.depth),
            instanceName: attributes.name,
            replace: attributes.replace,
            morph: attributes.morph ? Number(attributes.morph) : null,
            placementTwips: Object.freeze({
              x: Number(transform.transX ?? 0),
              y: Number(transform.transY ?? 0),
            }),
          }),
        );
      }
    }
    if (!selfClosing) stack.push(name);
  }
  invariant(stack.length === 0, "swfmill XML ended with unclosed tags");
  invariant(
    placements.length === 1,
    `expected one direct Animation placement, found ${placements.length}`,
  );
  const placement = placements[0];
  invariant(
    Number.isSafeInteger(placement.objectId) && placement.objectId > 0 &&
      Number.isSafeInteger(placement.depth) && placement.depth > 0 &&
      placement.replace === "0",
    "direct Animation placement metadata is invalid",
  );
  const frameCount = sprites.get(placement.objectId);
  invariant(frameCount, `direct Animation sprite ${placement.objectId} is undefined`);
  return Object.freeze({
    ...placement,
    placementPixels: Object.freeze({
      x: placement.placementTwips.x / 20,
      y: placement.placementTwips.y / 20,
    }),
    frameCount,
    rootFrameCount: directShowFrameCount,
    rootLabels: Object.freeze(rootLabels),
  });
}

async function recursiveTextRecords(directory) {
  const records = [];
  async function walk(current) {
    const entries = await readdir(current, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.isFile()) {
        const bytes = await readFile(target);
        records.push(
          Object.freeze({
            path: portable(path.relative(directory, target)),
            text: bytes.toString("utf8"),
            bytes: bytes.length,
            sha256: sha256(bytes),
          }),
        );
      } else throw new Error(`unsupported script output: ${target}`);
    }
  }
  await walk(directory);
  return Object.freeze(records);
}

function count(text, expression) {
  return [...text.matchAll(expression)].length;
}

export function analyzeBehaviorScripts({asRecords, pcodeRecords, targetObjectId}) {
  const pcode = pcodeRecords.map(({text}) => text).join("\n");
  const actionScript = asRecords.map(({text}) => text).join("\n");
  const targetPrefix = `DefineSprite_${targetObjectId}/`;
  const targetPcodeRecords = pcodeRecords.filter(({path: recordPath}) =>
    recordPath.startsWith(targetPrefix),
  );
  const keyAttributes = [...new Set(
    [...actionScript.matchAll(/KeyAttribute\s*=\s*"([^"]+)"/g)].map(
      (match) => match[1],
    ),
  )].sort();
  const rootMethodCalls = [...new Set(
    [...actionScript.matchAll(/_root\.([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)].map(
      (match) => match[1],
    ),
  )].sort();
  const signals = Object.freeze({
    pcodeFileCount: pcodeRecords.length,
    pcodeBytes: pcodeRecords.reduce((total, record) => total + record.bytes, 0),
    rootFrameScriptCount: pcodeRecords.filter(({path: recordPath}) =>
      /^frame_\d+\//.test(recordPath),
    ).length,
    targetFrameScriptCount: targetPcodeRecords.length,
    buttonActionCount: pcodeRecords.filter(({path: recordPath}) =>
      /BUTTONCONDACTION/.test(recordPath),
    ).length,
    clipActionCount: pcodeRecords.filter(({path: recordPath}) =>
      /CLIPACTION/.test(recordPath),
    ).length,
    randomOpcodeCount: count(pcode, /\bRandom\b/g),
    branchOpcodeCount: count(pcode, /\b(?:If|Jump)\b/g),
    externalOrNetworkOpcodeCount: count(
      pcode,
      /\b(?:GetUrl2|GetURL|FSCommand|LoadMovie|LoadVariables|XMLSocket)\b/g,
    ),
    soundControlOpcodeCount: count(pcode, /\b(?:StartSound|StopSounds)\b/g),
    keyAttributes: Object.freeze(keyAttributes),
    rootMethodCalls: Object.freeze(rootMethodCalls),
  });
  const machineTriageLane =
    signals.randomOpcodeCount > 0 ||
    signals.externalOrNetworkOpcodeCount > 0 ||
    rootMethodCalls.some((method) =>
      /^(?:doPlay|doGet|doClose|setBook|CheckAnswer|Submit|Report)/i.test(method),
    )
      ? "behavior-heavy-review"
      : signals.buttonActionCount > 0 ||
          signals.clipActionCount > 0 ||
          signals.keyAttributes.length > 0
        ? "interaction-contract-review"
        : "linear-timeline-review";
  return Object.freeze({
    ...signals,
    machineTriageLane,
    classificationAuthority: false,
  });
}

function sectionCode(animationId) {
  const match = animationId.match(
    /^course-g03-l02-([a-z]{2})-\d{3}(?:-[a-f0-9]+)?$/,
  );
  invariant(match, `${animationId}: unexpected G3 L2 animation ID`);
  return match[1].toUpperCase();
}

async function buildAudit(runManifestPath = DEFAULT_RUN) {
  const [runBinding, scriptBinding] = await Promise.all([
    ordinaryFile(runManifestPath, "factory run manifest"),
    ordinaryFile(portable(path.relative(ROOT, SCRIPT_PATH)), "audit generator"),
  ]);
  const run = JSON.parse(runBinding.bytes.toString("utf8"));
  invariant(
    run.schemaVersion === 1 && run.mode === "extend" &&
      run.factoryId === "g3-l2-ffdec-canvas-pcode-factory-v1" &&
      run.release?.expectedActivePageCount === 70 &&
      run.release?.legacyFlashCourseShellExcluded === true &&
      run.release?.modernMyLessonHostRetained === true,
    "factory run is not the exact G3 L2 page-only extension",
  );
  invariant(
    Array.isArray(run.members) && run.members.length === 70,
    "factory run must contain 70 members",
  );
  const runRoot = path.posix.dirname(runManifestPath);
  const members = [];
  for (const member of run.members) {
    const manifestPath = path.posix.join(runRoot, member.manifestPath);
    const manifestBinding = await ordinaryFile(
      manifestPath,
      `${member.animationId} manifest`,
    );
    invariant(
      manifestBinding.identity.sha256 === member.manifest?.sha256 &&
        manifestBinding.identity.bytes === member.manifest?.bytes,
      `${member.animationId}: manifest identity drifted`,
    );
    const manifest = JSON.parse(manifestBinding.bytes.toString("utf8"));
    const memberRoot = path.posix.dirname(manifestPath);
    const swfmillPath = path.posix.join(memberRoot, "swfmill/source.xml");
    const swfmillBinding = await ordinaryFile(
      swfmillPath,
      `${member.animationId} swfmill XML`,
    );
    const target = parseDirectRootAnimationPlacement(
      swfmillBinding.bytes.toString("utf8"),
    );
    const [pcodeRecords, asRecords] = await Promise.all([
      recursiveTextRecords(
        resolveProject(
          path.posix.join(memberRoot, "pcode/scripts"),
          `${member.animationId} P-code`,
        ),
      ),
      recursiveTextRecords(
        resolveProject(
          path.posix.join(memberRoot, "canvas/scripts"),
          `${member.animationId} ActionScript`,
        ),
      ),
    ]);
    const behavior = analyzeBehaviorScripts({
      asRecords,
      pcodeRecords,
      targetObjectId: target.objectId,
    });
    invariant(
      target.rootFrameCount === 10,
      `${member.animationId}: root frame count drifted`,
    );
    invariant(
      target.frame === 6,
      `${member.animationId}: direct Animation entry moved from root frame 6`,
    );
    members.push(
      Object.freeze({
        animationId: member.animationId,
        ordinal: member.ordinal,
        sectionCode: sectionCode(member.animationId),
        source: Object.freeze({
          path: manifest.source.path,
          bytes: manifest.source.before.bytes,
          sha256: manifest.source.before.sha256,
          pairedFla: manifest.pairedFla
            ? Object.freeze({
                path: manifest.pairedFla.path,
                bytes: manifest.pairedFla.bytes,
                sha256: manifest.pairedFla.sha256,
              })
            : null,
        }),
        exactExternalAudio: Object.freeze(
          manifest.exactExternalAudio.map((audio) =>
            Object.freeze({
              path: audio.path,
              bytes: audio.bytes,
              sha256: audio.sha256,
              language: audio.language,
              association: audio.association,
              playbackCompiled: false,
              listeningAccepted: false,
            }),
          ),
        ),
        target,
        behavior,
        structuralAudio: manifest.audio,
        evidence: Object.freeze({
          memberManifest: Object.freeze({path: manifestPath, ...manifestBinding.identity}),
          swfmillXml: Object.freeze({path: swfmillPath, ...swfmillBinding.identity}),
          pcodeChecksumSetSha256:
            manifest.compiler.outputInventory.pcode.checksumSetSha256,
          canvasChecksumSetSha256:
            manifest.compiler.outputInventory.canvas.checksumSetSha256,
        }),
      }),
    );
  }
  members.forEach((member, index) =>
    invariant(
      member.ordinal === index + 1,
      `source order drifted at ordinal ${index + 1}`,
    ),
  );
  const lanes = [
    "linear-timeline-review",
    "interaction-contract-review",
    "behavior-heavy-review",
  ];
  const laneCounts = Object.fromEntries(
    lanes.map((lane) => [
      lane,
      members.filter((member) => member.behavior.machineTriageLane === lane).length,
    ]),
  );
  const exactAudio = members.flatMap((member) => member.exactExternalAudio);
  invariant(
    exactAudio.length === 62,
    `expected 62 exact external-audio associations, found ${exactAudio.length}`,
  );
  invariant(
    members.filter((member) => member.source.pairedFla).length === 56,
    "paired FLA count drifted",
  );
  invariant(
    members.filter((member) => !member.source.pairedFla).length === 14,
    "SWF-only count drifted",
  );
  return Object.freeze({
    schemaVersion: 1,
    reportType: "g3-l2-page-only-cross-grade-factory-audit",
    factoryId: run.factoryId,
    release: run.release,
    inputs: Object.freeze({
      runManifest: Object.freeze({path: runManifestPath, ...runBinding.identity}),
      generator: Object.freeze({
        path: portable(path.relative(ROOT, SCRIPT_PATH)),
        ...scriptBinding.identity,
      }),
    }),
    summary: Object.freeze({
      activePageCount: members.length,
      pairedFlaSwfCount: members.filter((member) => member.source.pairedFla).length,
      swfOnlyCount: members.filter((member) => !member.source.pairedFla).length,
      exactExternalAudioPageCount: members.filter(
        (member) => member.exactExternalAudio.length > 0,
      ).length,
      exactExternalAudioAssociationCount: exactAudio.length,
      directAnimationRootFrame6Count: members.filter(
        (member) => member.target.frame === 6,
      ).length,
      machineTriageLaneCounts: Object.freeze(laneCounts),
      preCandidateFactoryRegisteredCount: 0,
    }),
    triageBoundary: Object.freeze({
      evidenceStage: "pre-registration-factory-audit",
      authority: "machine-review-prioritization-only",
      automaticRegistrationAuthorized: false,
      scaleOutAuthorized: false,
      reason:
        "P-code and placement signals select representative product slices; they do not prove natural reachability, behavior parity, audio timing, fidelity, or acceptance.",
    }),
    members: Object.freeze(members),
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });
}

function parseArguments(argv) {
  let mode = "check";
  let runManifestPath = DEFAULT_RUN;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--write") mode = "write";
    else if (argument === "--check") mode = "check";
    else if (argument === "--run") runManifestPath = argv[++index];
    else throw new Error(`unknown argument: ${argument}`);
  }
  invariant(runManifestPath, "--run requires a value");
  return Object.freeze({mode, runManifestPath});
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const audit = await buildAudit(options.runManifestPath);
  const output = resolveProject(OUTPUT, "audit report");
  const bytes = stableJson(audit);
  if (options.mode === "write") {
    await writeFile(output, bytes, {flag: "wx", mode: 0o644});
  } else {
    const existing = await readFile(output, "utf8").catch(() => "");
    invariant(existing === bytes, `${OUTPUT} is missing or stale; run with --write`);
  }
  process.stdout.write(
    `${stableJson({checked: true, mode: options.mode, report: OUTPUT, summary: audit.summary})}\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
