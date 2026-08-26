#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {createServer} from "node:net";
import {fileURLToPath} from "node:url";

import {
  probeFixtureToolchain,
  renderBaseSwfXml,
  renderSandboxProfile,
} from "./build-adobe-course-host-fixtures.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const supportScriptPath = path.join(projectRoot, "scripts", "build-adobe-course-host-fixtures.mjs");
const defaultSpecPath = path.join(
  projectRoot,
  "migrations",
  "course-g03-l06-ti-001",
  "audit",
  "adobe-frame-controller-spec.json",
);
const defaultReportPath = path.join(
  projectRoot,
  "migrations",
  "course-g03-l06-ti-001",
  "audit",
  "adobe-frame-controller-engineering-report.json",
);
const defaultOutputRoot = path.join(projectRoot, "work", "adobe-course-host-fixtures-frame-controller");
const flashPlayerPath = "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/Flash Player";

const BLOCKED_SOURCE_PRIMITIVES = /\b(?:ExternalInterface|LocalConnection|SharedObject|XMLSocket|fscommand|getURL|loadVariables(?:Num)?|navigateToURL|sendAndLoad)\b|javascript:|https?:\/\//i;
const REQUIRED_MARKERS = Object.freeze([
  "HELP_TI_FRAME_CONTROLLER",
  "__controllerTargetFrame",
  "__controllerConsecutiveStableChecks",
  "__controllerFail",
  "__controllerTryPin",
]);

export const CONTROLLER_ANIMATION_ID = "course-g03-l06-ti-001";

function portable(value) {
  return value.split(path.sep).join("/");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/.test(value || "");
}

function assertRelative(candidate, label) {
  invariant(typeof candidate === "string" && candidate.length > 0, `${label} must be non-empty`);
  invariant(!path.isAbsolute(candidate), `${label} must be relative`);
  const normalized = portable(path.normalize(candidate));
  invariant(normalized !== ".." && !normalized.startsWith("../"), `${label} escapes its fixture root`);
  invariant(!/^[a-z]+:/i.test(normalized), `${label} cannot be a URL`);
  return normalized;
}

function run(command, argumentsList, {cwd = projectRoot, timeoutMs = 120_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, {
      cwd,
      env: {...process.env, LC_ALL: "C"},
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve({stdout, stderr});
      else reject(new Error(`${command} exited ${code ?? signal}: ${(stderr || stdout).trim()}`));
    });
  });
}

export function parseArguments(argumentsList) {
  const options = {
    specPath: defaultSpecPath,
    reportPath: defaultReportPath,
    outputRoot: defaultOutputRoot,
    frame: null,
    compile: true,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (value === "--no-compile") options.compile = false;
    else if (["--frame", "--spec", "--report", "--output", "--verify", "--verify-launch"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--frame") {
        invariant(/^\d+$/.test(next), "--frame must be a positive integer");
        options.frame = Number(next);
      } else if (value === "--spec") options.specPath = path.resolve(next);
      else if (value === "--report") options.reportPath = path.resolve(next);
      else if (value === "--output") options.outputRoot = path.resolve(next);
      else if (value === "--verify") options.verifyManifest = path.resolve(next);
      else options.verifyLaunch = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  const modes = [options.check, Boolean(options.verifyManifest), Boolean(options.verifyLaunch)].filter(Boolean).length;
  invariant(modes <= 1, "--check, --verify, and --verify-launch are mutually exclusive");
  return options;
}

export function validateControllerSpecification(specification) {
  invariant(specification?.schemaVersion === 1, "controller spec: unsupported schemaVersion");
  invariant(specification.animationId === CONTROLLER_ANIMATION_ID, "controller spec: animationId mismatch");
  invariant(specification.fixtureKind === "hash-pinned-adobe-avm1-local-frame-controller", "controller spec: fixtureKind mismatch");
  invariant(Number.isSafeInteger(specification.canonicalTargetFrame), "controller spec: canonicalTargetFrame is required");
  invariant(specification.source?.actionScriptVersion === "AS1/2", "controller spec: AVM1 source is required");
  invariant(isSha256(specification.source?.sha256), "controller spec: invalid source hash");
  invariant(specification.source?.stage?.width === 800 && specification.source?.stage?.height === 600, "controller spec: native stage must remain 800x600");
  invariant(specification.source?.fps === 12, "controller spec: source FPS must remain 12");
  invariant(Array.isArray(specification.evidencePins) && specification.evidencePins.length >= 5, "controller spec: evidence pins are incomplete");
  const pinIds = new Set();
  for (const pin of specification.evidencePins) {
    invariant(pin?.id && !pinIds.has(pin.id), `controller spec: duplicate evidence pin ${pin?.id}`);
    pinIds.add(pin.id);
    assertRelative(pin.path, `controller spec evidence pin ${pin.id}`);
    invariant(isSha256(pin.sha256), `controller spec: invalid hash for ${pin.id}`);
  }
  for (const required of ["scenario-inventory", "audio-runtime-evidence", "host-binding-resolution", "ffdec-scripts", "swfmill-xml"]) {
    invariant(pinIds.has(required), `controller spec: missing ${required} evidence pin`);
  }
  const root = specification.timelineContract?.root;
  const local = specification.timelineContract?.local;
  invariant(root?.frameCount === 10 && root.entryLabel === "begin" && root.entryFrame === 6, "controller spec: root begin contract changed");
  invariant(root.placementName === "animation" && root.placementObjectId === 21, "controller spec: root child placement changed");
  invariant(local?.timelineId === "sprite-21" && local.frameCount === 142, "controller spec: local timeline contract changed");
  invariant(local.indexing === "one-indexed" && local.selectionFrame === 1 && local.audioStartFrame === 5 && local.terminalStopFrame === 142, "controller spec: local control frames changed");
  invariant(JSON.stringify(local.nestedAudioClipNames) === JSON.stringify(["Mc_Sound_0", "Mc_Sound_1"]), "controller spec: nested audio clips changed");
  invariant(Number.isSafeInteger(specification.timelineContract.consecutiveStableChecksBeforeReveal) && specification.timelineContract.consecutiveStableChecksBeforeReveal >= 2, "controller spec: at least two stable checks are required");
  invariant(specification.safetyPolicy?.lazyExplicitClick === true, "controller spec: fixture must remain lazy");
  invariant(specification.safetyPolicy?.networkDeniedBySandbox === true, "controller spec: network denial is required");
  invariant(specification.safetyPolicy?.sourceChildModified === false, "controller spec: source child cannot be modified");
  invariant(specification.safetyPolicy?.captureMode === "visual-only-audio-muted-and-stopped", "controller spec: visual-only audio policy changed");
  invariant(specification.authorityBoundary?.strictBaselineClaimed === false, "controller spec: cannot claim a strict baseline");
  invariant(specification.authorityBoundary?.humanReviewClaimed === false, "controller spec: cannot claim human review");
  invariant(specification.authorityBoundary?.ownerAcceptanceClaimed === false, "controller spec: cannot claim owner acceptance");
  invariant(specification.strictAcceptanceEffect?.startsWith("none"), "controller spec: strictAcceptanceEffect must remain none");
  invariant(specification.canonicalTargetFrame >= 1 && specification.canonicalTargetFrame <= local.frameCount, "controller spec: canonical target frame is outside the local timeline");
  return specification;
}

async function readPinnedJson(pin) {
  const absolutePath = path.resolve(projectRoot, assertRelative(pin.path, `evidence ${pin.id}`));
  const text = await readFile(absolutePath, "utf8");
  const observed = sha256Text(text);
  invariant(observed === pin.sha256, `${pin.id}: expected ${pin.sha256}, observed ${observed}`);
  return {absolutePath, text, value: JSON.parse(text), sha256: observed};
}

async function verifyEvidencePins(specification) {
  const verified = [];
  for (const pin of specification.evidencePins) {
    const absolutePath = path.resolve(projectRoot, assertRelative(pin.path, `evidence ${pin.id}`));
    const observed = await sha256File(absolutePath);
    invariant(observed === pin.sha256, `${pin.id}: expected ${pin.sha256}, observed ${observed}`);
    verified.push({...pin, observedSha256: observed});
  }
  return verified;
}

function validateScenarioEvidence(specification, inventory, audioAudit, bindingResolution, shellTexts) {
  invariant(inventory.animationId === specification.animationId, "scenario inventory: animationId mismatch");
  invariant(inventory.source?.swf === specification.source.path, "scenario inventory: source path changed");
  invariant(inventory.source?.swfSha256 === specification.source.sha256, "scenario inventory: source hash changed");
  invariant(inventory.source?.stage?.width === 800 && inventory.source?.stage?.height === 600, "scenario inventory: stage changed");
  invariant(inventory.source?.fps === 12 && inventory.source?.rootFrameCount === 10, "scenario inventory: root timing changed");
  const root = inventory.timelineInventory?.find((item) => item.timelineId === "root");
  const local = inventory.timelineInventory?.find((item) => item.timelineId === "sprite-21");
  invariant(root?.frameCount === specification.timelineContract.root.frameCount, "scenario inventory: root frame count changed");
  invariant(root.frameLabels?.some((item) => item.frame === 6 && item.label === "begin"), "scenario inventory: begin label is missing");
  invariant(root.namedPlacements?.some((item) => item.frame === 6 && item.name === "animation" && Number(item.objectId) === 21), "scenario inventory: sprite-21 root placement is missing");
  invariant(local?.frameCount === specification.timelineContract.local.frameCount, "scenario inventory: sprite-21 frame count changed");
  invariant(local.frameDomain?.indexing === "one-indexed" && local.frameDomain.start === 1 && local.frameDomain.endInclusive === 142, "scenario inventory: sprite-21 frame domain changed");
  invariant(local.controlStates?.some((item) => item.frame === 1), "scenario inventory: random-selection frame is missing");
  invariant(local.controlStates?.some((item) => item.frame === 5), "scenario inventory: audio-start frame is missing");
  invariant(local.controlStates?.some((item) => item.frame === 142), "scenario inventory: terminal frame is missing");
  for (const clipName of specification.timelineContract.local.nestedAudioClipNames) {
    invariant(local.namedPlacements?.some((item) => item.frame === 1 && item.name === clipName), `scenario inventory: ${clipName} placement is missing`);
  }
  invariant(audioAudit.animationId === specification.animationId, "audio audit: animationId mismatch");
  invariant(audioAudit.source?.expectedSha256 === specification.source.sha256 && audioAudit.source?.hashMatches === true, "audio audit: source hash is not verified");
  invariant(bindingResolution.animationId === specification.animationId, "host binding resolution: animationId mismatch");
  invariant(bindingResolution.unresolvedBindingCountAfterStaticResolution === 0, "host binding resolution: unresolved binding count is non-zero");
  invariant(shellTexts.length === 2 && shellTexts.every((text) => /_root\.animation_mc\.gotoAndPlay\("begin"\)/.test(text)), "same-lesson shell evidence no longer proves the begin handoff");
}

export async function loadControllerSpecification(specPath = defaultSpecPath) {
  const specText = await readFile(specPath, "utf8");
  const specification = validateControllerSpecification(JSON.parse(specText));
  const verifiedPins = await verifyEvidencePins(specification);
  const sourceHash = await sha256File(path.resolve(projectRoot, specification.source.path));
  invariant(sourceHash === specification.source.sha256, `source SWF: expected ${specification.source.sha256}, observed ${sourceHash}`);

  const pinById = new Map(specification.evidencePins.map((pin) => [pin.id, pin]));
  const [inventoryRecord, audioRecord, bindingRecord] = await Promise.all([
    readPinnedJson(pinById.get("scenario-inventory")),
    readPinnedJson(pinById.get("audio-runtime-evidence")),
    readPinnedJson(pinById.get("host-binding-resolution")),
  ]);
  const shellPins = specification.evidencePins.filter((pin) => pin.id.startsWith("same-lesson-shell-"));
  const shellTexts = await Promise.all(shellPins.map(async (pin) => readFile(path.resolve(projectRoot, pin.path), "utf8")));
  validateScenarioEvidence(specification, inventoryRecord.value, audioRecord.value, bindingRecord.value, shellTexts);

  return {
    specification,
    specPath,
    specSha256: sha256Text(specText),
    sourceSha256: sourceHash,
    verifiedPins,
  };
}

export function buildControllerInput({specification, specPath, specSha256, verifiedPins, targetFrame, generatorSha256, supportSha256}) {
  invariant(Number.isSafeInteger(targetFrame), "target frame must be an integer");
  invariant(targetFrame >= 1 && targetFrame <= specification.timelineContract.local.frameCount, `target frame must be in 1..${specification.timelineContract.local.frameCount}`);
  invariant(isSha256(generatorSha256) && isSha256(supportSha256), "generator/support hashes are required");
  return {
    schemaVersion: 1,
    animationId: specification.animationId,
    fixtureKind: specification.fixtureKind,
    targetFrame,
    source: specification.source,
    timelineContract: specification.timelineContract,
    safetyPolicy: specification.safetyPolicy,
    authorityBoundary: specification.authorityBoundary,
    specification: {
      path: portable(path.relative(projectRoot, specPath)),
      sha256: specSha256,
    },
    evidencePins: verifiedPins.map(({id, path: pinPath, sha256}) => ({id, path: pinPath, sha256})),
    generator: {
      path: portable(path.relative(projectRoot, scriptPath)),
      sha256: generatorSha256,
    },
    supportModule: {
      path: portable(path.relative(projectRoot, supportScriptPath)),
      sha256: supportSha256,
    },
    strictAcceptanceEffect: specification.strictAcceptanceEffect,
  };
}

function asString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n")}"`;
}

export function renderControllerActionScript(input, fixtureDigest) {
  const root = input.timelineContract.root;
  const local = input.timelineContract.local;
  const childRelative = `lesson/TI/${path.basename(input.source.path)}`;
  return `// HELP_TI_FRAME_CONTROLLER generated visual-engineering fixture. Not an original host.
Stage.scaleMode = "noScale";
Stage.align = "TL";
_global.__controllerId = ${asString(input.animationId)};
_global.__controllerDigest = ${asString(fixtureDigest)};
_global.__controllerChildPath = ${asString(childRelative)};
_global.__controllerChildSha256 = ${asString(input.source.sha256)};
_global.__controllerEntryLabel = ${asString(root.entryLabel)};
_global.__controllerEntryFrame = ${root.entryFrame};
_global.__controllerPlacementName = ${asString(root.placementName)};
_global.__controllerTargetFrame = ${input.targetFrame};
_global.__controllerExpectedLocalFrames = ${local.frameCount};
_global.__controllerConsecutiveStableChecks = ${input.timelineContract.consecutiveStableChecksBeforeReveal};
_global.__controllerState = "preload";
_global.__controllerStableCount = 0;
_global.__controllerPinAttempts = 0;
_global.__controllerEvents = new Array();
_global.__controllerLoadStarted = false;

function __controllerRecord(kind, detail)
{
   var item = new Object();
   item.sequence = _global.__controllerEvents.length + 1;
   item.timerMs = getTimer();
   item.kind = kind;
   item.detail = detail;
   _global.__controllerEvents.push(item);
   trace("HELP_TI_FRAME_CONTROLLER|" + item.sequence + "|" + item.timerMs + "|" + kind + "|" + detail);
}

_root.createEmptyMovieClip("InternalPreloader",1);
_root.createEmptyMovieClip("animation_mc",10);
_root.createEmptyMovieClip("__controllerCover",100000);
_root.__controllerCover.beginFill(16777215,100);
_root.__controllerCover.moveTo(0,0);
_root.__controllerCover.lineTo(${input.source.stage.width},0);
_root.__controllerCover.lineTo(${input.source.stage.width},${input.source.stage.height});
_root.__controllerCover.lineTo(0,${input.source.stage.height});
_root.__controllerCover.lineTo(0,0);
_root.__controllerCover.endFill();
_root.createTextField("__controllerStatus",100001,20,20,${input.source.stage.width - 40},${input.source.stage.height - 40});
_root.__controllerStatus.selectable = false;
_root.__controllerStatus.multiline = true;
_root.__controllerStatus.wordWrap = true;
_root.__controllerStatus.text = "SAFE VISUAL FRAME CONTROLLER\\n" + _global.__controllerId + "\\ntarget local frame " + _global.__controllerTargetFrame + " of " + _global.__controllerExpectedLocalFrames + "\\nclick once to load the exact hash-pinned child";

function __controllerFail(code, detail)
{
   _global.__controllerState = "failed";
   _root.animation_mc._visible = false;
   _root.__controllerCover._visible = true;
   _root.__controllerStatus._visible = true;
   _root.__controllerStatus.text = "FRAME CONTROL FAILED CLOSED\\n" + code + "\\n" + detail + "\\nno baseline capture is eligible";
   delete _root.onMouseDown;
   __controllerRecord("failed",code + ":" + detail);
}

function __controllerStopNestedAudio(clip)
{
   if(clip.Mc_Sound_0 != undefined)
   {
      clip.Mc_Sound_0.stop();
   }
   if(clip.Mc_Sound_1 != undefined)
   {
      clip.Mc_Sound_1.stop();
   }
   stopAllSounds();
}

function __controllerInstallInputShield()
{
   if(_root.__controllerInputShield != undefined)
   {
      return;
   }
   _root.createEmptyMovieClip("__controllerInputShield",99999);
   _root.__controllerInputShield.beginFill(16777215,0);
   _root.__controllerInputShield.moveTo(0,0);
   _root.__controllerInputShield.lineTo(${input.source.stage.width},0);
   _root.__controllerInputShield.lineTo(${input.source.stage.width},${input.source.stage.height});
   _root.__controllerInputShield.lineTo(0,${input.source.stage.height});
   _root.__controllerInputShield.lineTo(0,0);
   _root.__controllerInputShield.endFill();
   _root.__controllerInputShield.useHandCursor = false;
   _root.__controllerInputShield.onPress = function()
   {
      __controllerRecord("blocked-input","capture fixture is read-only after pinning");
   };
}

function __controllerTryPin(target)
{
   _global.__controllerPinAttempts++;
   target._visible = false;
   target.gotoAndStop(_global.__controllerEntryLabel);
   target.stop();
   if(target._currentframe != _global.__controllerEntryFrame)
   {
      __controllerFail("root-frame-mismatch","expected " + _global.__controllerEntryFrame + ", observed " + target._currentframe);
      return false;
   }
   var clip = target[_global.__controllerPlacementName];
   if(clip == undefined)
   {
      if(_global.__controllerPinAttempts >= 3)
      {
         __controllerFail("local-instance-missing",_global.__controllerPlacementName);
      }
      return false;
   }
   _global.__controllerScopedSound = new Sound(target);
   _global.__controllerScopedSound.setVolume(0);
   clip.gotoAndStop(1);
   clip.stop();
   if(clip._totalframes != _global.__controllerExpectedLocalFrames)
   {
      __controllerFail("local-frame-count-mismatch","expected " + _global.__controllerExpectedLocalFrames + ", observed " + clip._totalframes);
      return false;
   }
   if(clip._currentframe != 1)
   {
      __controllerFail("local-frame-one-unreachable","observed " + clip._currentframe);
      return false;
   }
   clip.gotoAndStop(_global.__controllerTargetFrame);
   clip.stop();
   __controllerStopNestedAudio(clip);
   if(clip._currentframe != _global.__controllerTargetFrame)
   {
      __controllerFail("target-frame-mismatch","expected " + _global.__controllerTargetFrame + ", observed " + clip._currentframe);
      return false;
   }
   _global.__controllerTargetClip = clip;
   _global.__controllerState = "verifying";
   _global.__controllerStableCount = 0;
   __controllerRecord("target-pinned","root=" + target._currentframe + ",local=" + clip._currentframe);
   return true;
}

_root.__controllerStart = function()
{
   if(_global.__controllerLoadStarted)
   {
      return;
   }
   _global.__controllerLoadStarted = true;
   _global.__controllerState = "loading";
   _root.__controllerStatus.text = "LOADING HASH-PINNED CHILD\\n" + _global.__controllerChildSha256 + "\\ntarget local frame " + _global.__controllerTargetFrame;
   __controllerRecord("child-load-request",_global.__controllerChildPath);
   var listener = new Object();
   listener.onLoadError = function(target,errorCode,httpStatus)
   {
      __controllerFail("child-load-error",errorCode + ":" + httpStatus);
   };
   listener.onLoadInit = function(target)
   {
      _global.__controllerLoadedTarget = target;
      _global.__controllerState = "pinning";
      __controllerRecord("child-load-init",_global.__controllerChildPath);
      __controllerTryPin(target);
   };
   _global.__controllerLoader = new MovieClipLoader();
   _global.__controllerLoader.addListener(listener);
   _global.__controllerLoader.loadClip(_global.__controllerChildPath,_root.animation_mc);
};

_root.onMouseDown = function()
{
   _root.__controllerStart();
};

_root.onEnterFrame = function()
{
   if(_global.__controllerState == "pinning")
   {
      __controllerTryPin(_global.__controllerLoadedTarget);
      return;
   }
   if(_global.__controllerState != "verifying" && _global.__controllerState != "ready")
   {
      return;
   }
   var target = _global.__controllerLoadedTarget;
   var clip = _global.__controllerTargetClip;
   if(target == undefined || clip == undefined)
   {
      __controllerFail("monitor-target-missing","loaded target or local clip disappeared");
      return;
   }
   target.stop();
   clip.stop();
   __controllerStopNestedAudio(clip);
   if(target._currentframe != _global.__controllerEntryFrame)
   {
      __controllerFail("root-frame-drift","expected " + _global.__controllerEntryFrame + ", observed " + target._currentframe);
      return;
   }
   if(clip._totalframes != _global.__controllerExpectedLocalFrames)
   {
      __controllerFail("local-frame-count-drift","expected " + _global.__controllerExpectedLocalFrames + ", observed " + clip._totalframes);
      return;
   }
   if(clip._currentframe != _global.__controllerTargetFrame)
   {
      __controllerFail("local-frame-drift","expected " + _global.__controllerTargetFrame + ", observed " + clip._currentframe);
      return;
   }
   if(_global.__controllerState == "verifying")
   {
      _global.__controllerStableCount++;
      if(_global.__controllerStableCount >= _global.__controllerConsecutiveStableChecks)
      {
         _global.__controllerState = "ready";
         __controllerInstallInputShield();
         target._visible = true;
         _root.__controllerCover._visible = false;
         _root.__controllerStatus._visible = false;
         delete _root.onMouseDown;
         __controllerRecord("capture-ready","root=" + target._currentframe + ",local=" + clip._currentframe + ",stable=" + _global.__controllerStableCount);
      }
   }
};

__controllerRecord("fixture-ready",_global.__controllerDigest + ":frame=" + _global.__controllerTargetFrame);
stop();
`;
}

function assertSafeControllerSource(source, label) {
  invariant(!BLOCKED_SOURCE_PRIMITIVES.test(source), `${label}: blocked legacy primitive found`);
  for (const marker of REQUIRED_MARKERS) invariant(source.includes(marker), `${label}: missing ${marker}`);
  invariant(source.includes("MovieClipLoader"), `${label}: exact local child loader is missing`);
  invariant(source.includes("gotoAndStop"), `${label}: local frame controller is missing`);
  invariant(source.includes("stopAllSounds"), `${label}: visual-only audio suppression is missing`);
}

async function compileHost({directory, hostSource, baseXml, toolchain}) {
  invariant(toolchain.canCompileFixture, "swfmill and FFDec importScript are required to compile the controller fixture");
  assertSafeControllerSource(hostSource, "controller source");
  const baseXmlPath = path.join(directory, "host-base.xml");
  const baseSwfPath = path.join(directory, "host-base.swf");
  const importRoot = path.join(directory, "as-import");
  const scriptsRoot = path.join(importRoot, "scripts");
  const actionPath = path.join(scriptsRoot, "frame_1", "DoAction.as");
  const firstPath = path.join(directory, "host-build-a.swf");
  const secondPath = path.join(directory, "host-build-b.swf");
  const finalPath = path.join(directory, "host.swf");
  const decompileRoot = path.join(directory, "compiled-host-export");
  const decompiledPath = path.join(directory, "compiled-host-decompiled.as");
  await mkdir(path.dirname(actionPath), {recursive: true});
  await Promise.all([
    writeFile(baseXmlPath, baseXml, "utf8"),
    writeFile(actionPath, hostSource, "utf8"),
  ]);
  await run(toolchain.swfmill.path, ["xml2swf", baseXmlPath, baseSwfPath]);
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-importScript", baseSwfPath, firstPath, scriptsRoot]);
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-importScript", baseSwfPath, secondPath, scriptsRoot]);
  const [firstHash, secondHash] = await Promise.all([sha256File(firstPath), sha256File(secondPath)]);
  invariant(firstHash === secondHash, `controller compilation is not deterministic: ${firstHash} != ${secondHash}`);
  await copyFile(firstPath, finalPath);
  const dump = await run(toolchain.ffdec.path, ["-dumpAS2", finalPath]);
  invariant(`${dump.stdout}\n${dump.stderr}`.includes("/frame 1 - DoAction"), "compiled controller is missing its frame-1 DoAction");
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-export", "script", decompileRoot, finalPath]);
  const exportedScriptPath = path.join(decompileRoot, "scripts", "frame_1", "DoAction.as");
  const decompiledText = await readFile(exportedScriptPath, "utf8");
  assertSafeControllerSource(decompiledText, "decompiled controller");
  await writeFile(decompiledPath, decompiledText, "utf8");
  return {
    hostPath: finalPath,
    hostSha256: firstHash,
    deterministicDoubleBuild: true,
    baseXmlPath,
    baseSwfPath,
    actionPath,
    firstPath,
    secondPath,
    decompiledPath,
    exportedScriptPath,
  };
}

async function copyVerified(source, destination, expectedSha256) {
  const observed = await sha256File(source);
  invariant(observed === expectedSha256, `${source}: expected ${expectedSha256}, observed ${observed}`);
  await mkdir(path.dirname(destination), {recursive: true});
  if (await exists(destination)) {
    const existing = await sha256File(destination);
    invariant(existing === expectedSha256, `${destination}: existing content does not match its pinned source`);
    return destination;
  }
  await copyFile(source, destination);
  invariant(await sha256File(destination) === expectedSha256, `${destination}: copied hash mismatch`);
  return destination;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function probeSandboxProfile(profilePath, directory) {
  await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/usr/bin/true"]);
  const insidePath = path.join(directory, "sandbox-write-probe.txt");
  await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/bin/sh", "-c", "printf controller-write-allowed > \"$1\"", "controller-probe", insidePath]);
  invariant(await readFile(insidePath, "utf8") === "controller-write-allowed", "sandbox did not permit its fixture-local write probe");
  const outsidePath = `${directory}-sandbox-outside-write-must-not-exist`;
  invariant(!(await exists(outsidePath)), `sandbox outside-write probe path already exists: ${outsidePath}`);
  let outsideWriteDenied = false;
  try {
    await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/bin/sh", "-c", "printf forbidden > \"$1\"", "controller-probe", outsidePath]);
  } catch {
    outsideWriteDenied = true;
  }
  invariant(outsideWriteDenied && !(await exists(outsidePath)), "sandbox allowed a write outside fixture/temp roots");
  let connected = false;
  const server = createServer((socket) => {
    connected = true;
    socket.end();
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  let localTcpDenied = false;
  try {
    await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/usr/bin/nc", "-w", "1", "127.0.0.1", String(server.address().port)], {timeoutMs: 5_000});
  } catch {
    localTcpDenied = true;
  } finally {
    await closeServer(server);
  }
  invariant(localTcpDenied && !connected, "sandbox allowed a local TCP connection");
  return {
    syntaxSmokeTest: "passed-with-/usr/bin/true",
    insideWriteAllowed: true,
    outsideWriteDenied: true,
    localTcpDenied: true,
    probeFilePath: insidePath,
  };
}

function renderLauncher(manifestPath, profilePath, hostPath, smokeOnly) {
  const command = smokeOnly
    ? `echo "GUI sandbox smoke only: verify the pre-load controller screen and DO NOT CLICK the stage."\nnode ${JSON.stringify(scriptPath)} --verify ${JSON.stringify(manifestPath)}`
    : `node ${JSON.stringify(scriptPath)} --verify-launch ${JSON.stringify(manifestPath)}`;
  return `#!/bin/sh
set -eu
${command}
exec /usr/bin/sandbox-exec -f ${JSON.stringify(profilePath)} ${JSON.stringify(flashPlayerPath)} ${JSON.stringify(hostPath)}
`;
}

function renderSmokeTemplate(input, fixtureDigest) {
  return stableJson({
    schemaVersion: 1,
    animationId: input.animationId,
    fixtureDigest,
    targetFrame: input.targetFrame,
    status: "replace-with-passed-after-observed-sandboxed-pre-load-smoke",
    reviewer: "",
    reviewedAt: "",
    evidenceFile: "capture/replace-with-app-window-smoke-evidence.png",
    evidenceMimeType: "image/png",
    evidenceSha256: "",
    observation: "Flash Player opened through smoke-sandboxed.sh and showed only the opaque pre-load controller screen. The stage was not clicked and the child was not loaded. This safety smoke is not a visual-fidelity baseline.",
  });
}

function renderReadme(input) {
  return `# ${input.animationId} Adobe local-frame controller candidate

This generated AVM1 host loads one exact, hash-pinned child only after an explicit click. It then holds the child root at \`${input.timelineContract.root.entryLabel}\` (root frame ${input.timelineContract.root.entryFrame}) and directly seeks the nested \`${input.timelineContract.root.placementName}\` instance (sprite 21) to one-indexed local frame ${input.targetFrame}.

The opaque cover is removed only after the host observes root frame ${input.timelineContract.root.entryFrame}, local frame ${input.targetFrame}, and local frame count ${input.timelineContract.local.frameCount} for ${input.timelineContract.consecutiveStableChecksBeforeReveal} consecutive monitor ticks. Any mismatch hides the child and displays \`FRAME CONTROL FAILED CLOSED\`.

Safety and authority boundaries:

- Run only \`smoke-sandboxed.sh\` first, do not click, and record the separate GUI safety approval. Normal launch remains blocked until that approval verifies.
- Run normal probes only through \`launch-sandboxed.sh\`. Network, Apple Events, LaunchServices open/database operations, and writes outside the fixture/temp roots are denied.
- The controller mutes the loaded movie and repeatedly stops both embedded sound clips. It is visual-only and cannot be used for audio identity or synchronization evidence.
- Direct \`gotoAndStop\` does not prove natural playback timing, random(2), interaction branches, Replay, Spanish behavior, or original-shell defaults.
- This factory does not perform the Adobe GUI probe. Until the opaque cover is observed to disappear in the authorized Player and a lossless native-stage capture is recorded, the exact-frame behavior remains a candidate.
- No strict, human-review, or owner-acceptance field is changed by this fixture.
`;
}

async function hashGeneratedFiles(directory, files) {
  const records = [];
  for (const candidate of files) {
    records.push({
      path: assertRelative(portable(path.relative(directory, candidate)), "generated file"),
      sha256: await sha256File(candidate),
    });
  }
  records.sort((left, right) => compareText(left.path, right.path));
  const duplicates = records.filter((item, index) => records.findIndex((candidate) => candidate.path === item.path) !== index);
  invariant(duplicates.length === 0, "generated file list contains duplicates");
  return records;
}

export function buildEngineeringReport({manifestPath, manifestSha256, manifest, generatorSha256, supportSha256, specPath, specSha256}) {
  return {
    schemaVersion: 1,
    animationId: manifest.animationId,
    reportKind: "adobe-avm1-local-frame-controller-engineering-candidate",
    decision: "static-and-compiled-factory-passed-runtime-frame-control-not-yet-proven",
    migrationStatusChanged: false,
    authority: {
      sourceChildUntouched: true,
      originalCourseShellExecuted: false,
      originalHostBehaviorClaimed: false,
      naturalPlaybackClaimed: false,
      audioClaimed: false,
      strictBaselineClaimed: false,
      humanReviewClaimed: false,
      ownerAcceptanceClaimed: false,
    },
    factory: {
      specification: {path: portable(path.relative(projectRoot, specPath)), sha256: specSha256},
      generator: {path: portable(path.relative(projectRoot, scriptPath)), sha256: generatorSha256},
      supportModule: {path: portable(path.relative(projectRoot, supportScriptPath)), sha256: supportSha256},
      canonicalFixture: {
        targetFrame: manifest.targetFrame,
        fixtureDigest: manifest.fixtureDigest,
        manifest: portable(path.relative(projectRoot, manifestPath)),
        manifestSha256,
        hostSha256: manifest.compilation.hostSha256,
        deterministicDoubleBuild: manifest.compilation.deterministicDoubleBuild,
      },
      verificationCommands: [
        `node scripts/build-adobe-ti-frame-controller-fixture.mjs --verify ${portable(path.relative(projectRoot, manifestPath))}`,
        "node scripts/build-adobe-ti-frame-controller-fixture.mjs --check",
        `node scripts/build-adobe-ti-frame-controller-fixture.mjs --frame ${manifest.targetFrame}`,
      ],
    },
    controllerContract: {
      sourceStage: manifest.source.stage,
      sourceFps: manifest.source.fps,
      sourceRootFrame: manifest.timelineContract.root.entryFrame,
      sourceRootLabel: manifest.timelineContract.root.entryLabel,
      localTimeline: manifest.timelineContract.local.timelineId,
      localFrameDomain: {start: 1, endInclusive: manifest.timelineContract.local.frameCount, indexing: "one-indexed"},
      canonicalTargetFrame: manifest.targetFrame,
      stableChecksBeforeReveal: manifest.timelineContract.consecutiveStableChecksBeforeReveal,
      successPresentation: "The exact untouched child is visible with no controller pixels after all checks pass.",
      failurePresentation: "The child is hidden behind an opaque full-stage FRAME CONTROL FAILED CLOSED screen.",
      postPinInputPolicy: "A transparent top-depth shield blocks pointer interaction while the monitor keeps root/local timelines stopped.",
      audioPolicy: "The loaded movie is set to volume zero; Mc_Sound_0, Mc_Sound_1, and all sounds are repeatedly stopped.",
    },
    staticallyProven: [
      "Every input is hash-pinned, including the untouched source SWF, scenario/audio/binding evidence, generator, and shared sandbox/base-SWF support module.",
      "The generated host was compiled twice from the same deterministic input and both SWF hashes matched.",
      "The compiled host was decompiled and checked for required fail-closed/frame-controller markers and blocked legacy primitives.",
      "The sandbox syntax, fixture-local write, outside-write denial, and loopback-network denial probes passed.",
      "The controller exposes a content-addressed per-target-frame build path for every one-indexed frame 1..142.",
    ],
    runtimeProofStillRequired: [
      "Run the content-addressed fixture through the sandbox in the authorized Adobe Flash Player and observe that the opaque cover disappears only after one explicit load click.",
      "Record a lossless native 800x600 stage capture and a separate fixture/target-frame identity record; the current factory performs no GUI action or capture.",
      "Confirm that direct AVM1 parent control of the loaded child resolves _root.animation_mc.animation as expected in Adobe Player 32 and remains pinned without drift.",
    ],
    limitations: [
      "Direct gotoAndStop is a visual engineering seek. It does not reproduce elapsed-time traversal through preceding local frames.",
      "The fixture intentionally suppresses the two embedded sound streams and therefore cannot support audio listening, cue, synchronization, stop, or Replay acceptance.",
      "The source random(2) branch is neither seeded nor classified by this visual controller.",
      "Interaction, drag, component, Replay, language, and original-course-shell behavior are outside this fixture's authority.",
      "A successful Adobe probe would establish only a controlled visual-frame candidate; strict comparison, product QA, human review, and owner acceptance remain separate gates.",
    ],
    strictAcceptanceEffect: "none; retain every baseline, language, audio, behavior, product, human, owner, validator, regression, and build blocker",
  };
}

async function buildFixture({specPath, reportPath, outputRoot, targetFrame, compile}) {
  const loaded = await loadControllerSpecification(specPath);
  const generatorSha256 = await sha256File(scriptPath);
  const supportSha256 = await sha256File(supportScriptPath);
  const selectedFrame = targetFrame ?? loaded.specification.canonicalTargetFrame;
  const input = buildControllerInput({...loaded, targetFrame: selectedFrame, generatorSha256, supportSha256});
  const fixtureDigest = sha256Text(stableJson(input));
  const inputWithDigest = {...input, fixtureDigest};
  const directory = path.join(outputRoot, "generated", input.animationId, `frame-${String(selectedFrame).padStart(4, "0")}`, fixtureDigest.slice(0, 24));
  await mkdir(directory, {recursive: true});

  const materializedSpecPath = path.join(directory, "fixture-spec.json");
  const hostSourcePath = path.join(directory, "host.as");
  const baseXml = renderBaseSwfXml(input.source.stage, input.source.fps);
  const hostSource = renderControllerActionScript(input, fixtureDigest);
  assertSafeControllerSource(hostSource, "controller source");
  await Promise.all([
    writeFile(materializedSpecPath, stableJson(inputWithDigest), "utf8"),
    writeFile(hostSourcePath, hostSource, "utf8"),
  ]);
  const childPath = path.join(directory, "lesson", "TI", path.basename(input.source.path));
  await copyVerified(path.resolve(projectRoot, input.source.path), childPath, input.source.sha256);

  const toolchain = await probeFixtureToolchain();
  if (compile) invariant(toolchain.canCompileFixture, "FFDec and swfmill are required to compile this fixture");
  const compileResult = compile ? await compileHost({directory, hostSource, baseXml, toolchain}) : null;

  const fixtureRealRoot = await realpath(directory);
  const temporaryRealRoot = await realpath(os.tmpdir());
  const profilePath = path.join(directory, "sandbox.sb");
  await writeFile(profilePath, renderSandboxProfile({fixtureRoot: fixtureRealRoot, temporaryRoot: temporaryRealRoot}), "utf8");
  const sandboxProbe = await probeSandboxProfile(profilePath, directory);
  const manifestPath = path.join(directory, "fixture-manifest.json");
  const hostPath = compileResult?.hostPath || path.join(directory, "host.swf");
  const launcherPath = path.join(directory, "launch-sandboxed.sh");
  const smokeLauncherPath = path.join(directory, "smoke-sandboxed.sh");
  const smokeTemplatePath = path.join(directory, "sandbox-gui-smoke-test.template.json");
  const readmePath = path.join(directory, "README.md");
  await Promise.all([
    writeFile(launcherPath, renderLauncher(manifestPath, profilePath, hostPath, false), "utf8"),
    writeFile(smokeLauncherPath, renderLauncher(manifestPath, profilePath, hostPath, true), "utf8"),
    writeFile(smokeTemplatePath, renderSmokeTemplate(input, fixtureDigest), "utf8"),
    writeFile(readmePath, renderReadme(input), "utf8"),
  ]);
  await Promise.all([chmod(launcherPath, 0o755), chmod(smokeLauncherPath, 0o755)]);

  const generatedFiles = [
    materializedSpecPath,
    hostSourcePath,
    childPath,
    profilePath,
    sandboxProbe.probeFilePath,
    launcherPath,
    smokeLauncherPath,
    smokeTemplatePath,
    readmePath,
  ];
  if (compileResult) generatedFiles.push(
    compileResult.hostPath,
    compileResult.baseXmlPath,
    compileResult.baseSwfPath,
    compileResult.actionPath,
    compileResult.firstPath,
    compileResult.secondPath,
    compileResult.decompiledPath,
    compileResult.exportedScriptPath,
  );
  const generatedFileHashes = await hashGeneratedFiles(directory, generatedFiles);
  const manifest = {
    schemaVersion: 1,
    animationId: input.animationId,
    fixtureKind: input.fixtureKind,
    fixtureDigest,
    targetFrame: selectedFrame,
    directory: portable(path.relative(projectRoot, directory)),
    source: input.source,
    timelineContract: input.timelineContract,
    specification: input.specification,
    evidencePins: input.evidencePins,
    generator: input.generator,
    supportModule: input.supportModule,
    compilation: compileResult ? {
      status: "compiled-deterministic-double-build",
      hostSha256: compileResult.hostSha256,
      deterministicDoubleBuild: true,
      decompiledMarkersVerified: true,
      toolchain: {swfmill: toolchain.swfmill, ffdec: toolchain.ffdec},
    } : {
      status: "not-compiled",
      deterministicDoubleBuild: false,
      decompiledMarkersVerified: false,
    },
    sandbox: {
      ...sandboxProbe,
      probeFilePath: portable(path.relative(directory, sandboxProbe.probeFilePath)),
      networkDenied: true,
      appleEventsDenied: true,
      launchServicesOpenAndDatabaseDenied: true,
      writesRestricted: true,
    },
    runtimeVerification: {
      status: "pending-not-run-by-static-factory",
      exactFrameClaimed: false,
      authoritativeBaselineClaimed: false,
      requiredObservation: `After one explicit click, the opaque controller cover disappears and the untouched child remains visible at declared local frame ${selectedFrame}; a separate lossless capture and identity record are required.`,
    },
    guiSmokeAuthorization: {
      requiredApproval: "capture/sandbox-gui-smoke-test.json",
      template: "sandbox-gui-smoke-test.template.json",
      smokeLauncher: "smoke-sandboxed.sh",
      rule: "do not click the opaque pre-load screen during the safety smoke",
    },
    launchPolicy: compile ? "launch-only-through-launch-sandboxed.sh-after-hash-verified-gui-smoke" : "blocked-host-not-compiled",
    generatedFileHashes,
    strictAcceptanceEffect: input.strictAcceptanceEffect,
  };
  await writeFile(manifestPath, stableJson(manifest), "utf8");
  const manifestSha256 = await sha256File(manifestPath);

  let report = null;
  if (compile && selectedFrame === loaded.specification.canonicalTargetFrame) {
    report = buildEngineeringReport({
      manifestPath,
      manifestSha256,
      manifest,
      generatorSha256,
      supportSha256,
      specPath,
      specSha256: loaded.specSha256,
    });
    await writeFile(reportPath, stableJson(report), "utf8");
  }
  return {directory, manifestPath, manifestSha256, manifest, reportPath: report ? reportPath : null, report};
}

export async function verifyFixtureManifest(manifestPath) {
  const directory = path.dirname(manifestPath);
  const manifestText = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestText);
  invariant(manifest.schemaVersion === 1 && manifest.animationId === CONTROLLER_ANIMATION_ID, "controller manifest identity mismatch");
  invariant(manifest.fixtureKind === "hash-pinned-adobe-avm1-local-frame-controller", "controller manifest kind mismatch");
  invariant(Number.isSafeInteger(manifest.targetFrame), "controller manifest target frame is invalid");
  invariant(isSha256(manifest.fixtureDigest), "controller manifest digest is invalid");
  const generatorHash = await sha256File(scriptPath);
  const supportHash = await sha256File(supportScriptPath);
  invariant(manifest.generator?.sha256 === generatorHash, `controller generator hash mismatch: expected ${manifest.generator?.sha256}, observed ${generatorHash}`);
  invariant(manifest.supportModule?.sha256 === supportHash, `controller support hash mismatch: expected ${manifest.supportModule?.sha256}, observed ${supportHash}`);
  const specPath = path.resolve(projectRoot, assertRelative(manifest.specification?.path, "controller manifest specification"));
  const loaded = await loadControllerSpecification(specPath);
  invariant(loaded.specSha256 === manifest.specification.sha256, "controller manifest specification hash mismatch");
  const expectedInput = buildControllerInput({...loaded, targetFrame: manifest.targetFrame, generatorSha256: generatorHash, supportSha256: supportHash});
  invariant(sha256Text(stableJson(expectedInput)) === manifest.fixtureDigest, "controller manifest digest no longer matches current pinned inputs");
  invariant(JSON.stringify(manifest.evidencePins) === JSON.stringify(expectedInput.evidencePins), "controller manifest evidence pins changed");
  invariant(manifest.source.sha256 === loaded.specification.source.sha256, "controller manifest source hash changed");
  invariant(manifest.compilation?.status === "compiled-deterministic-double-build" || manifest.compilation?.status === "not-compiled", "controller manifest compilation status is invalid");
  invariant(manifest.sandbox?.networkDenied === true && manifest.sandbox?.outsideWriteDenied === true && manifest.sandbox?.localTcpDenied === true, "controller manifest sandbox proof is incomplete");
  invariant(manifest.runtimeVerification?.exactFrameClaimed === false && manifest.runtimeVerification?.authoritativeBaselineClaimed === false, "static controller manifest cannot claim runtime/authoritative proof");
  invariant(manifest.strictAcceptanceEffect?.startsWith("none"), "controller manifest cannot affect strict acceptance");
  invariant(Array.isArray(manifest.generatedFileHashes) && manifest.generatedFileHashes.length > 0, "controller manifest generated files are missing");
  const seen = new Set();
  for (const item of manifest.generatedFileHashes) {
    const relative = assertRelative(item.path, "controller generated file");
    invariant(!seen.has(relative), `controller manifest has duplicate generated path ${relative}`);
    seen.add(relative);
    invariant(isSha256(item.sha256), `controller generated file ${relative} has an invalid hash`);
    const observed = await sha256File(path.resolve(directory, relative));
    invariant(observed === item.sha256, `${relative}: expected ${item.sha256}, observed ${observed}`);
  }
  const materialized = JSON.parse(await readFile(path.join(directory, "fixture-spec.json"), "utf8"));
  invariant(materialized.fixtureDigest === manifest.fixtureDigest && materialized.targetFrame === manifest.targetFrame, "materialized controller spec mismatch");
  const source = await readFile(path.join(directory, "host.as"), "utf8");
  assertSafeControllerSource(source, "controller source");
  invariant(source.includes(`_global.__controllerTargetFrame = ${manifest.targetFrame};`), "controller source target frame mismatch");
  if (manifest.compilation.status === "compiled-deterministic-double-build") {
    const hostHash = await sha256File(path.join(directory, "host.swf"));
    invariant(hostHash === manifest.compilation.hostSha256, "compiled controller host hash mismatch");
    const decompiled = await readFile(path.join(directory, "compiled-host-decompiled.as"), "utf8");
    assertSafeControllerSource(decompiled, "decompiled controller");
    invariant(manifest.compilation.deterministicDoubleBuild === true && manifest.compilation.decompiledMarkersVerified === true, "controller compilation proof is incomplete");
  }
  return {manifest, manifestPath, manifestSha256: sha256Text(manifestText)};
}

export async function verifyLaunchAuthorization(manifestPath) {
  const verified = await verifyFixtureManifest(manifestPath);
  const directory = path.dirname(manifestPath);
  const approvalRelative = assertRelative(verified.manifest.guiSmokeAuthorization?.requiredApproval, "GUI smoke approval");
  const approvalPath = path.join(directory, approvalRelative);
  invariant(await exists(approvalPath), `GUI sandbox smoke evidence is pending: ${approvalRelative}`);
  const approval = JSON.parse(await readFile(approvalPath, "utf8"));
  invariant(approval.animationId === verified.manifest.animationId, "GUI smoke animationId mismatch");
  invariant(approval.fixtureDigest === verified.manifest.fixtureDigest, "GUI smoke fixture digest mismatch");
  invariant(approval.targetFrame === verified.manifest.targetFrame, "GUI smoke target frame mismatch");
  invariant(approval.status === "passed", "GUI sandbox smoke status is not passed");
  invariant(typeof approval.reviewer === "string" && approval.reviewer.trim().length > 0, "GUI smoke reviewer is missing");
  invariant(Number.isFinite(Date.parse(approval.reviewedAt)), "GUI smoke reviewedAt is invalid");
  invariant(["image/png", "image/jpeg"].includes(approval.evidenceMimeType), "GUI smoke evidence MIME type is invalid");
  invariant(isSha256(approval.evidenceSha256), "GUI smoke evidence hash is invalid");
  const evidencePath = path.join(directory, assertRelative(approval.evidenceFile, "GUI smoke evidence"));
  invariant(await sha256File(evidencePath) === approval.evidenceSha256, "GUI smoke evidence hash mismatch");
  invariant(/not clicked|not click|no child was loaded/i.test(approval.observation || ""), "GUI smoke observation must state that the stage was not clicked and no child loaded");
  return {...verified, approval};
}

async function checkCanonical(options) {
  const reportText = await readFile(options.reportPath, "utf8");
  const report = JSON.parse(reportText);
  invariant(report.animationId === CONTROLLER_ANIMATION_ID, "controller report animationId mismatch");
  invariant(report.decision === "static-and-compiled-factory-passed-runtime-frame-control-not-yet-proven", "controller report decision changed");
  const manifestPath = path.resolve(projectRoot, assertRelative(report.factory?.canonicalFixture?.manifest, "controller report manifest"));
  const verified = await verifyFixtureManifest(manifestPath);
  invariant(verified.manifest.targetFrame === report.factory.canonicalFixture.targetFrame, "controller report target frame mismatch");
  invariant(verified.manifestSha256 === report.factory.canonicalFixture.manifestSha256, "controller report manifest hash mismatch");
  const generatorSha256 = await sha256File(scriptPath);
  const supportSha256 = await sha256File(supportScriptPath);
  const specPath = path.resolve(projectRoot, assertRelative(report.factory.specification.path, "controller report specification"));
  const specText = await readFile(specPath, "utf8");
  invariant(sha256Text(specText) === report.factory.specification.sha256, "controller report specification hash mismatch");
  const expected = buildEngineeringReport({
    manifestPath,
    manifestSha256: verified.manifestSha256,
    manifest: verified.manifest,
    generatorSha256,
    supportSha256,
    specPath,
    specSha256: sha256Text(specText),
  });
  invariant(stableJson(expected) === reportText, "controller engineering report is stale");
  return {reportPath: options.reportPath, manifestPath, targetFrame: verified.manifest.targetFrame};
}

function helpText() {
  return `Usage:
  node scripts/build-adobe-ti-frame-controller-fixture.mjs [--frame 1..142]
  node scripts/build-adobe-ti-frame-controller-fixture.mjs --check
  node scripts/build-adobe-ti-frame-controller-fixture.mjs --verify <fixture-manifest.json>
  node scripts/build-adobe-ti-frame-controller-fixture.mjs --verify-launch <fixture-manifest.json>

Options:
  --frame <n>       Compile a content-addressed visual controller for local sprite-21 frame n (default: canonical frame from the tracked spec)
  --spec <path>     Override the tracked controller specification
  --report <path>   Override the canonical engineering report path
  --output <path>   Override the ignored fixture output root
  --no-compile      Generate source/spec/sandbox only; launch remains blocked
  --check           Verify the tracked report, canonical manifest, all hashes, and current generator/support code without writing
  --verify <path>   Verify one generated fixture and every pinned/generated hash
  --verify-launch   Verify a fixture plus its separate no-click GUI sandbox smoke approval
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(helpText());
    return;
  }
  if (options.verifyManifest) {
    const result = await verifyFixtureManifest(options.verifyManifest);
    process.stdout.write(`${stableJson({status: "verified", manifest: portable(path.relative(projectRoot, result.manifestPath)), targetFrame: result.manifest.targetFrame, strictAcceptanceEffect: "none"})}`);
    return;
  }
  if (options.verifyLaunch) {
    const result = await verifyLaunchAuthorization(options.verifyLaunch);
    process.stdout.write(`${stableJson({status: "launch-authorized-after-safety-smoke", manifest: portable(path.relative(projectRoot, result.manifestPath)), targetFrame: result.manifest.targetFrame, reviewer: result.approval.reviewer, strictAcceptanceEffect: "none"})}`);
    return;
  }
  if (options.check) {
    const result = await checkCanonical(options);
    process.stdout.write(`${stableJson({status: "canonical-controller-checked", report: portable(path.relative(projectRoot, result.reportPath)), manifest: portable(path.relative(projectRoot, result.manifestPath)), targetFrame: result.targetFrame, strictAcceptanceEffect: "none"})}`);
    return;
  }
  const result = await buildFixture({
    specPath: options.specPath,
    reportPath: options.reportPath,
    outputRoot: options.outputRoot,
    targetFrame: options.frame,
    compile: options.compile,
  });
  process.stdout.write(stableJson({
    status: result.manifest.compilation.status,
    targetFrame: result.manifest.targetFrame,
    fixtureDigest: result.manifest.fixtureDigest,
    manifest: portable(path.relative(projectRoot, result.manifestPath)),
    manifestSha256: result.manifestSha256,
    report: result.reportPath ? portable(path.relative(projectRoot, result.reportPath)) : null,
    runtimeVerification: result.manifest.runtimeVerification.status,
    strictAcceptanceEffect: "none",
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
