#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isHfrArtifactEntry, validateHfrArtifactClosure, validateHfrCurrentProducer} from './lib/hfr-artifact-binding-v1.mjs';

import {
  privateCurrentJsCalibrationMatches,
  upsertPrivateCurrentJsCalibration,
} from './private-current-js-registry.mjs';
import {finalizeG678Ts05FamilyRegistration} from
  './finalize-g678-ts05-family-registration.mjs';
import {finalizeTs04L1Registration} from
  './finalize-g678-ts04-l1-registration.mjs';
import {finalizeTs05L1Registration} from
  './finalize-g678-ts05-l1-registration.mjs';
import {finalizeTs07NmsL1Registration} from
  './finalize-g678-ts07-nms-l1-registration.mjs';
import {finalizeG678Ts07NmsL1FamilyRegistration} from
  './finalize-g678-ts07-nms-l1-family-registration.mjs';
import {finalizeIn02L1Registration} from
  './finalize-g678-in02-l1-registration.mjs';
import {finalizeG678In02L1FamilyRegistration} from
  './finalize-g678-in02-l1-family-registration.mjs';
import {finalizeVb02L1Registration} from
  './finalize-g678-vb02-l1-registration.mjs';
import {finalizeG678Vb02L1FamilyRegistration} from
  './finalize-g678-vb02-l1-family-registration.mjs';
import {finalizeVb03L1Registration} from
  './finalize-g678-vb03-l1-registration.mjs';
import {finalizeG678Vb03L1FamilyRegistration} from
  './finalize-g678-vb03-l1-family-registration.mjs';
import {finalizeAlgL09SimpleGlossaryRegistration} from
  './finalize-g678-alg-l09-simple-glossary-registration.mjs';
import {finalizeG678AlgL09SimpleGlossaryFamilyRegistration} from
  './finalize-g678-alg-l09-simple-glossary-family-registration.mjs';
import {finalizeAlgL09TerminalStopRegistration} from
  './finalize-g678-alg-l09-terminal-stop-registration.mjs';
import {finalizeG678AlgL09TerminalStopFamilyRegistration} from
  './finalize-g678-alg-l09-terminal-stop-family-registration.mjs';
import {finalizeAlgL09Vb03TerminalStopRegistration} from
  './finalize-g678-alg-l09-vb03-terminal-stop-registration.mjs';
import {finalizeG678AlgL09Vb03TerminalStopFamilyRegistration} from
  './finalize-g678-alg-l09-vb03-terminal-stop-family-registration.mjs';
import {finalizeAlgL09IntroShellLinkageRegistration} from
  './finalize-g678-alg-l09-intro-shell-linkage-registration.mjs';
import {finalizeG678AlgL09IntroShellLinkageFamilyRegistration} from
  './finalize-g678-alg-l09-intro-shell-linkage-family-registration.mjs';
import {finalizeAlgL09Vb06DragRegistration} from
  './finalize-g678-alg-l09-vb06-drag-registration.mjs';
import {finalizeG678AlgL09Vb06DragFamilyRegistration} from
  './finalize-g678-alg-l09-vb06-drag-family-registration.mjs';
import {finalizeAlgL09Vb02GlossaryRegistration} from
  './finalize-g678-alg-l09-vb02-glossary-registration.mjs';
import {finalizeG678AlgL09Vb02GlossaryFamilyRegistration} from
  './finalize-g678-alg-l09-vb02-glossary-family-registration.mjs';
import {finalizeAlgL09In04NumericRegistration} from
  './finalize-g678-alg-l09-in04-numeric-registration.mjs';
import {finalizeG678AlgL09In04NumericFamilyRegistration} from
  './finalize-g678-alg-l09-in04-numeric-family-registration.mjs';
import {finalizeAlgL09In06ChoiceRegistration} from
  './finalize-g678-alg-l09-in06-choice-registration.mjs';
import {finalizeG678AlgL09In06ChoiceFamilyRegistration} from
  './finalize-g678-alg-l09-in06-choice-family-registration.mjs';
import {finalizeAlgL09In08ChoiceRegistration} from
  './finalize-g678-alg-l09-in08-choice-registration.mjs';
import {finalizeG678AlgL09In08ChoiceFamilyRegistration} from
  './finalize-g678-alg-l09-in08-choice-family-registration.mjs';
import {finalizeAlgL09In10ChoiceRegistration} from
  './finalize-g678-alg-l09-in10-choice-registration.mjs';
import {finalizeG678AlgL09In10ChoiceFamilyRegistration} from
  './finalize-g678-alg-l09-in10-choice-family-registration.mjs';
import {finalizeAlgL09TiChoiceRegistration} from
  './finalize-g678-alg-l09-ti-choice-registration.mjs';
import {finalizeG678AlgL09TiChoiceFamilyRegistration} from
  './finalize-g678-alg-l09-ti-choice-family-registration.mjs';
import {finalizeAlgL09GuidedTutorialRegistration} from
  './finalize-g678-alg-l09-guided-tutorial-registration.mjs';
import {finalizeG678AlgL09GuidedTutorialFamilyRegistration} from
  './finalize-g678-alg-l09-guided-tutorial-family-registration.mjs';
import {finalizeAlgL09GameAssessmentRegistration} from
  './finalize-g678-alg-l09-game-assessment-registration.mjs';
import {finalizeG678AlgL09GameAssessmentFamilyRegistration} from
  './finalize-g678-alg-l09-game-assessment-family-registration.mjs';
import {finalizeAlgL11Tranche1Registration} from
  './finalize-g678-alg-l11-tranche1-registration.mjs';
import {checkG678CurrentFinal354Admission} from
  './check-g678-current-final354-admission.mjs';
import {finalizeG678AlgL11Remaining23Provisional377Registration} from
  './finalize-g678-alg-l11-remaining23-provisional377-registration.mjs';
import {freezeG678Final354PrivateCurrentJsRegistryWitness} from
  './freeze-g678-final354-private-current-js-registry-witness.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const DEFAULT_REGISTRY = 'packages/demos/private-current-js-registry.json';
const G678_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-276-page-product-calibrated-registration-v1.json';
const G678_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-276-page-product-calibrated-registration-v1.fragment.json';
const G678_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-276-page-registration-v1.json';
const G678_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-276-page-registration-v1.fragment.json';
const G678_PREDECESSOR_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-261-page-registration-v1.json';
const G678_PREDECESSOR_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-261-page-registration-v1.fragment.json';
const G678_TS07_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-277-page-registration-v1.json';
const G678_TS07_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-277-page-registration-v1.fragment.json';
const G678_TS07_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-277-page-product-calibrated-registration-v1.json';
const G678_TS07_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-277-page-product-calibrated-registration-v1.fragment.json';
const G678_IN02_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-290-page-registration-v1.json';
const G678_IN02_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-290-page-registration-v1.fragment.json';
const G678_IN02_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-290-page-product-calibrated-registration-v1.json';
const G678_IN02_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-290-page-product-calibrated-registration-v1.fragment.json';
const G678_VB02_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-301-page-registration-v1.json';
const G678_VB02_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-301-page-registration-v1.fragment.json';
const G678_VB02_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-301-page-product-calibrated-registration-v1.json';
const G678_VB02_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-301-page-product-calibrated-registration-v1.fragment.json';
const G678_VB03_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-310-page-registration-v1.json';
const G678_VB03_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-310-page-registration-v1.fragment.json';
const G678_VB03_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-310-page-product-calibrated-registration-v1.json';
const G678_VB03_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-310-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_GLOSSARY_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-319-page-registration-v1.json';
const G678_ALG_L09_GLOSSARY_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-319-page-registration-v1.fragment.json';
const G678_ALG_L09_GLOSSARY_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-319-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_GLOSSARY_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-319-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_TERMINAL_STOP_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-322-page-registration-v1.json';
const G678_ALG_L09_TERMINAL_STOP_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-322-page-registration-v1.fragment.json';
const G678_ALG_L09_TERMINAL_STOP_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-322-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_TERMINAL_STOP_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-322-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-323-page-registration-v1.json';
const G678_ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-323-page-registration-v1.fragment.json';
const G678_ALG_L09_VB03_TERMINAL_STOP_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-323-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_VB03_TERMINAL_STOP_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-323-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-324-page-registration-v1.json';
const G678_ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-324-page-registration-v1.fragment.json';
const G678_ALG_L09_INTRO_SHELL_LINKAGE_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-324-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_INTRO_SHELL_LINKAGE_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-324-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_VB06_DRAG_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-325-page-registration-v1.json';
const G678_ALG_L09_VB06_DRAG_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-325-page-registration-v1.fragment.json';
const G678_ALG_L09_VB06_DRAG_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-325-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_VB06_DRAG_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-325-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_VB02_GLOSSARY_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-326-page-registration-v1.json';
const G678_ALG_L09_VB02_GLOSSARY_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-326-page-registration-v1.fragment.json';
const G678_ALG_L09_VB02_GLOSSARY_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-326-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_VB02_GLOSSARY_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-326-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_IN04_NUMERIC_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-327-page-registration-v1.json';
const G678_ALG_L09_IN04_NUMERIC_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-327-page-registration-v1.fragment.json';
const G678_ALG_L09_IN04_NUMERIC_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-327-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_IN04_NUMERIC_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-327-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_IN06_CHOICE_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-328-page-registration-v1.json';
const G678_ALG_L09_IN06_CHOICE_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-328-page-registration-v1.fragment.json';
const G678_ALG_L09_IN06_CHOICE_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-328-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_IN06_CHOICE_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-328-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_IN08_CHOICE_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-329-page-registration-v1.json';
const G678_ALG_L09_IN08_CHOICE_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-329-page-registration-v1.fragment.json';
const G678_ALG_L09_IN08_CHOICE_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-329-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_IN08_CHOICE_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-329-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_IN10_CHOICE_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-330-page-registration-v1.json';
const G678_ALG_L09_IN10_CHOICE_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-330-page-registration-v1.fragment.json';
const G678_ALG_L09_IN10_CHOICE_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-330-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_IN10_CHOICE_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-330-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_TI_CHOICE_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-registration-v1.json';
const G678_ALG_L09_TI_CHOICE_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-registration-v1.fragment.json';
const G678_ALG_L09_TI_CHOICE_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_TI_CHOICE_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_GUIDED_TUTORIAL_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-339-page-registration-v1.json';
const G678_ALG_L09_GUIDED_TUTORIAL_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-339-page-registration-v1.fragment.json';
const G678_ALG_L09_GUIDED_TUTORIAL_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-339-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_GUIDED_TUTORIAL_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-339-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L09_GAME_ASSESSMENT_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-registration-v1.json';
const G678_ALG_L09_GAME_ASSESSMENT_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-registration-v1.fragment.json';
const G678_ALG_L09_GAME_ASSESSMENT_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-product-calibrated-registration-v1.json';
const G678_ALG_L09_GAME_ASSESSMENT_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L11_TRANCHE1_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.json';
const G678_ALG_L11_TRANCHE1_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.fragment.json';
const G678_ALG_L11_TRANCHE1_FINAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json';
const G678_ALG_L11_TRANCHE1_FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.fragment.json';
const G678_ALG_L11_REMAINING23_PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json';
const G678_ALG_L11_REMAINING23_PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.fragment.json';
const G678_FINAL354_REGISTRY_WITNESS =
  'catalog/product-bridge-calibrations/g678-final354-private-current-js-registry-witness-v1.json';
const G678_FINAL354_REGISTRY_SHA256 =
  '2c734cdba9d19efaea00812bffdae5fa2de747972b447b8f86f6f2a0d037d239';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function projectPath(root, relativePath, label) {
  invariant(
    typeof relativePath === 'string' && relativePath.length > 0 &&
      !path.isAbsolute(relativePath),
    `${label} must be a project-relative path`,
  );
  const resolved = path.resolve(root, relativePath);
  invariant(
    resolved.startsWith(`${root}${path.sep}`),
    `${label} escapes the project root`,
  );
  return resolved;
}

async function ordinaryJson(root, relativePath, label) {
  const absolutePath = projectPath(root, relativePath, label);
  const metadata = await lstat(absolutePath);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${label} must be an ordinary single-link file`,
  );
  const bytes = await readFile(absolutePath);
  return {
    absolutePath,
    bytes,
    sha256: digest(bytes),
    value: JSON.parse(bytes.toString('utf8')),
  };
}

async function ordinaryFile(root, relativePath, label) {
  const absolutePath = projectPath(root, relativePath, label);
  const metadata = await lstat(absolutePath);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${label} must be an ordinary single-link file`,
  );
  const bytes = await readFile(absolutePath);
  return {
    absolutePath,
    binding: Object.freeze({
      path: relativePath,
      bytes: bytes.length,
      sha256: digest(bytes),
    }),
  };
}

export async function validateFragment(root, calibration) {
  const deploymentScope = calibration.deploymentScope ?? 'bundled';
  invariant(
    deploymentScope === 'bundled' || deploymentScope === 'local-only',
    'calibration deploymentScope is invalid',
  );
  const freeze = await ordinaryJson(
    root,
    calibration.freezeManifest,
    'freeze manifest',
  );
  invariant(
    freeze.value?.schemaVersion === 1 &&
      freeze.value.calibrationId === calibration.calibrationId &&
      Array.isArray(freeze.value.selectedPages) &&
      freeze.value.selectedPages.length === calibration.entries.length,
    'calibration fragment does not match its freeze manifest',
  );
  invariant(
    (freeze.value.deploymentScope ?? 'bundled') === deploymentScope,
    'calibration deploymentScope does not match its freeze manifest',
  );
  const selected = new Map(freeze.value.selectedPages.map((page) => [
    page?.animationId,
    page,
  ]));
  const entryArtifacts = new Map();
  for (const entry of calibration.entries) {
    const selectedPage = selected.get(entry.key);
    invariant(
      selectedPage?.complexityLane === entry.complexityLane,
      `${entry.key}: registry entry is not frozen with the same lane`,
    );
    if (isHfrArtifactEntry(entry)) {
      validateHfrArtifactClosure(root, calibration, entry, freeze.value);
      entryArtifacts.set(entry.key, Object.freeze({...entry.artifacts}));
      continue;
    }
    const domArtifacts = entry.artifacts?.kind ===
      'maintained-dom-module-v1' ? entry.artifacts : null;
    invariant(domArtifacts || entry.module === `./modules/${entry.key}`,
      `${entry.key}: module path must use the canonical animation key or exact maintained DOM binding`);
    const modulePath = domArtifacts?.module?.path ??
      `packages/demos/src/${entry.module.slice(2)}.tsx`;
    const moduleFile = await ordinaryFile(
      root,
      modulePath,
      `${entry.key} module`,
    );
    const timelinePath = domArtifacts?.timeline?.path ??
      `packages/demos/src/timelines/${entry.key}.ts`;
    const timelineFile = await ordinaryFile(
      root,
      timelinePath,
      `${entry.key} timeline`,
    );
    if (domArtifacts) {
      const rendererBinding = selectedPage?.runtime?.rendererBinding;
      invariant(JSON.stringify(rendererBinding) ===
        JSON.stringify(domArtifacts) &&
        domArtifacts.module.path === modulePath &&
        domArtifacts.timeline.path === timelinePath &&
        domArtifacts.module.bytes === moduleFile.binding.bytes &&
        domArtifacts.module.sha256 === moduleFile.binding.sha256 &&
        domArtifacts.timeline.bytes === timelineFile.binding.bytes &&
        domArtifacts.timeline.sha256 === timelineFile.binding.sha256,
      `${entry.key}: maintained DOM freeze binding drifted`);
      const [memberManifest, sourceRun] = await Promise.all([
        ordinaryFile(root, domArtifacts.memberManifest.path,
          `${entry.key} member manifest`),
        ordinaryFile(root, domArtifacts.sourceRun.path,
          `${entry.key} source run`),
      ]);
      invariant(domArtifacts.memberManifest.bytes ===
          memberManifest.binding.bytes &&
        domArtifacts.memberManifest.sha256 === memberManifest.binding.sha256 &&
        domArtifacts.sourceRun.bytes === sourceRun.binding.bytes &&
        domArtifacts.sourceRun.sha256 === sourceRun.binding.sha256,
      `${entry.key}: maintained DOM source provenance drifted`);
      entryArtifacts.set(entry.key, Object.freeze({...domArtifacts,
        module: moduleFile.binding, timeline: timelineFile.binding,
        memberManifest: memberManifest.binding, sourceRun: sourceRun.binding}));
      continue;
    }
    const runtimeDeclaration = selectedPage?.runtime?.canvasRenderer;
    invariant(
      runtimeDeclaration &&
        typeof runtimeDeclaration.path === 'string' &&
        Number.isSafeInteger(runtimeDeclaration.bytes) &&
        typeof runtimeDeclaration.sha256 === 'string',
      `${entry.key}: freeze runtime binding is missing`,
    );
    const runtimeFile = await ordinaryFile(
      root,
      runtimeDeclaration.path,
      `${entry.key} runtime`,
    );
    invariant(
      runtimeFile.binding.bytes === runtimeDeclaration.bytes &&
        runtimeFile.binding.sha256 === runtimeDeclaration.sha256,
      `${entry.key}: runtime bytes drifted from the freeze`,
    );
    entryArtifacts.set(entry.key, Object.freeze({
      module: moduleFile.binding,
      timeline: timelineFile.binding,
      runtime: runtimeFile.binding,
    }));
  }
  return {
    deploymentScope,
    entryArtifacts,
    freeze,
    freezePath: calibration.freezeManifest,
  };
}

export function assertProvisional377PrewriteRegistryWitness({
  check,
  liveRegistryBytes,
  witnessBytes,
}) {
  if (check) return true;
  invariant(Buffer.isBuffer(liveRegistryBytes) &&
    Buffer.isBuffer(witnessBytes) && liveRegistryBytes.equals(witnessBytes) &&
    digest(witnessBytes) === G678_FINAL354_REGISTRY_SHA256,
  'provisional377 live registry is not the exact final354 witness precondition');
  return true;
}

function calibrationFromFragment(fragment, {freeze, freezePath}) {
  const calibration = fragment?.calibration ?? fragment;
  if (fragment?.calibration) {
    invariant(
      fragment.schemaVersion === 1 &&
        fragment.artifactType === 'private-current-js-calibration-fragment-v1' &&
        fragment.freeze?.path === freezePath &&
        fragment.freeze?.bytes === freeze.bytes.length &&
        fragment.freeze?.sha256 === freeze.sha256,
      'calibration fragment wrapper does not bind its freeze manifest',
    );
  }
  return calibration;
}

function bindCalibrationArtifacts(calibration, validated) {
  return {
    ...calibration,
    freezeManifestBytes: validated.freeze.bytes.length,
    freezeManifestSha256: validated.freeze.sha256,
    entries: calibration.entries.map((entry) => ({
      ...entry,
      artifacts: validated.entryArtifacts.get(entry.key),
    })),
  };
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

export async function synchronizePrivateCurrentJsCalibration({
  calibrationPath,
  check,
  provisionalBrowserQa = false,
  registryPath = DEFAULT_REGISTRY,
  root = PROJECT_ROOT,
}) {
  const normalizedRoot = await realpath(path.resolve(root));
  const [calibrationBinding, registryBinding] = await Promise.all([
    ordinaryJson(normalizedRoot, calibrationPath, 'calibration fragment'),
    ordinaryJson(normalizedRoot, registryPath, 'private registry'),
  ]);
  const fragment = calibrationBinding.value;
  const provisionalCalibration = fragment?.calibration ?? fragment;
  const validated = await validateFragment(
    normalizedRoot,
    provisionalCalibration,
  );
  if (provisionalBrowserQa) {
    const placementCount =
      validated.freeze.value.registrationCandidatePlacementCount;
    const predecessorRecalibration = placementCount === 261;
    invariant(predecessorRecalibration || placementCount === 276 ||
      placementCount === 277 || placementCount === 290 ||
      placementCount === 301 || placementCount === 310 ||
      placementCount === 319 || placementCount === 322 ||
      placementCount === 323 || placementCount === 324 ||
      placementCount === 325 || placementCount === 326 ||
      placementCount === 327 || placementCount === 328 ||
      placementCount === 329 || placementCount === 330 ||
      placementCount === 336 || placementCount === 339 ||
      placementCount === 342 || placementCount === 354 ||
      placementCount === 377,
    'provisional G678 browser QA supports only canonical 261, 276, 277, 290, 301, 310, 319, 322, 323, 324, 325, 326, 327, 328, 329, 330, 336, 339, 342, 354, or 377 artifacts');
    if (predecessorRecalibration) {
      await finalizeTs04L1Registration({check: true});
    } else if (placementCount === 276) {
      // The successor browser pass replays the predecessor samples on the
      // current host. Static 276 provenance remains exact here, while the
      // superseded 261 browser receipt is deliberately not treated as a
      // current-host assertion during that recalibration bootstrap.
      await finalizeTs05L1Registration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 277) {
      await finalizeTs07NmsL1Registration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 290) {
      await finalizeIn02L1Registration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 301) {
      await finalizeVb02L1Registration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 310) {
      await finalizeVb03L1Registration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 319) {
      await finalizeAlgL09SimpleGlossaryRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 322) {
      await finalizeAlgL09TerminalStopRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 323) {
      await finalizeAlgL09Vb03TerminalStopRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 324) {
      await finalizeAlgL09IntroShellLinkageRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 325) {
      await finalizeAlgL09Vb06DragRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 326) {
      await finalizeAlgL09Vb02GlossaryRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 327) {
      await finalizeAlgL09In04NumericRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 328) {
      await finalizeAlgL09In06ChoiceRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 329) {
      await finalizeAlgL09In08ChoiceRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 330) {
      await finalizeAlgL09In10ChoiceRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 336) {
      await finalizeAlgL09TiChoiceRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 339) {
      await finalizeAlgL09GuidedTutorialRegistration({check: true,
        requireCurrentPredecessorHost: false});
    } else if (placementCount === 377) {
      if (!check) {
        const [witness, witnessCheck] = await Promise.all([
          ordinaryJson(normalizedRoot, G678_FINAL354_REGISTRY_WITNESS,
            'immutable final354 registry witness'),
          freezeG678Final354PrivateCurrentJsRegistryWitness({check: true}),
        ]);
        invariant(witnessCheck.check === true &&
          witnessCheck.exactFinal354RegistrationCount === 354,
        'provisional377 final354 registry witness check failed');
        assertProvisional377PrewriteRegistryWitness({check,
          liveRegistryBytes: registryBinding.bytes,
          witnessBytes: witness.bytes});
      }
      await finalizeG678AlgL11Remaining23Provisional377Registration({check: true});
    } else if (placementCount === 354) {
      await finalizeAlgL11Tranche1Registration({check: true,
        requireCurrentPredecessorHost: false});
    } else {
      await finalizeAlgL09GameAssessmentRegistration({check: true,
        requireCurrentPredecessorHost: false});
    }
    const canonicalFragmentPath = predecessorRecalibration
      ? G678_PREDECESSOR_PROVISIONAL_FRAGMENT
      : placementCount === 276
        ? G678_PROVISIONAL_FRAGMENT
        : placementCount === 277
          ? G678_TS07_PROVISIONAL_FRAGMENT
        : placementCount === 290
          ? G678_IN02_PROVISIONAL_FRAGMENT
          : placementCount === 301
            ? G678_VB02_PROVISIONAL_FRAGMENT
            : placementCount === 310
              ? G678_VB03_PROVISIONAL_FRAGMENT
              : placementCount === 319
                ? G678_ALG_L09_GLOSSARY_PROVISIONAL_FRAGMENT
              : placementCount === 322
                ? G678_ALG_L09_TERMINAL_STOP_PROVISIONAL_FRAGMENT
              : placementCount === 323
                ? G678_ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_FRAGMENT
              : placementCount === 324
                ? G678_ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_FRAGMENT
              : placementCount === 325
                ? G678_ALG_L09_VB06_DRAG_PROVISIONAL_FRAGMENT
              : placementCount === 326
                ? G678_ALG_L09_VB02_GLOSSARY_PROVISIONAL_FRAGMENT
              : placementCount === 327
                ? G678_ALG_L09_IN04_NUMERIC_PROVISIONAL_FRAGMENT
              : placementCount === 328
                ? G678_ALG_L09_IN06_CHOICE_PROVISIONAL_FRAGMENT
              : placementCount === 329
                ? G678_ALG_L09_IN08_CHOICE_PROVISIONAL_FRAGMENT
              : placementCount === 339
                ? G678_ALG_L09_GUIDED_TUTORIAL_PROVISIONAL_FRAGMENT
              : placementCount === 342
                ? G678_ALG_L09_GAME_ASSESSMENT_PROVISIONAL_FRAGMENT
              : placementCount === 377
                ? G678_ALG_L11_REMAINING23_PROVISIONAL_FRAGMENT
              : placementCount === 354
                ? G678_ALG_L11_TRANCHE1_PROVISIONAL_FRAGMENT
              : placementCount === 330
                ? G678_ALG_L09_IN10_CHOICE_PROVISIONAL_FRAGMENT
                : G678_ALG_L09_TI_CHOICE_PROVISIONAL_FRAGMENT;
    const canonicalFreezePath = predecessorRecalibration
      ? G678_PREDECESSOR_PROVISIONAL_FREEZE
      : placementCount === 276
        ? G678_PROVISIONAL_FREEZE
        : placementCount === 277
          ? G678_TS07_PROVISIONAL_FREEZE
        : placementCount === 290
          ? G678_IN02_PROVISIONAL_FREEZE
          : placementCount === 301
            ? G678_VB02_PROVISIONAL_FREEZE
            : placementCount === 310
              ? G678_VB03_PROVISIONAL_FREEZE
              : placementCount === 319
                ? G678_ALG_L09_GLOSSARY_PROVISIONAL_FREEZE
              : placementCount === 322
                ? G678_ALG_L09_TERMINAL_STOP_PROVISIONAL_FREEZE
              : placementCount === 323
                ? G678_ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_FREEZE
              : placementCount === 324
                ? G678_ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_FREEZE
              : placementCount === 325
                ? G678_ALG_L09_VB06_DRAG_PROVISIONAL_FREEZE
              : placementCount === 326
                ? G678_ALG_L09_VB02_GLOSSARY_PROVISIONAL_FREEZE
              : placementCount === 327
                ? G678_ALG_L09_IN04_NUMERIC_PROVISIONAL_FREEZE
              : placementCount === 328
                ? G678_ALG_L09_IN06_CHOICE_PROVISIONAL_FREEZE
              : placementCount === 329
                ? G678_ALG_L09_IN08_CHOICE_PROVISIONAL_FREEZE
              : placementCount === 339
                ? G678_ALG_L09_GUIDED_TUTORIAL_PROVISIONAL_FREEZE
              : placementCount === 342
                ? G678_ALG_L09_GAME_ASSESSMENT_PROVISIONAL_FREEZE
              : placementCount === 377
                ? G678_ALG_L11_REMAINING23_PROVISIONAL_FREEZE
              : placementCount === 354
                ? G678_ALG_L11_TRANCHE1_PROVISIONAL_FREEZE
              : placementCount === 330
                ? G678_ALG_L09_IN10_CHOICE_PROVISIONAL_FREEZE
                : G678_ALG_L09_TI_CHOICE_PROVISIONAL_FREEZE;
    const [canonicalFragment, canonicalFreeze] = await Promise.all([
      ordinaryJson(normalizedRoot, canonicalFragmentPath,
        'canonical provisional G678 fragment'),
      ordinaryJson(normalizedRoot, canonicalFreezePath,
        'canonical provisional G678 freeze'),
    ]);
    invariant(fq01CandidateArtifactsMatchCanonical({
      candidateFragmentBytes: calibrationBinding.bytes,
      canonicalFragmentBytes: canonicalFragment.bytes,
      candidateFreezeBytes: validated.freeze.bytes,
      canonicalFreezeBytes: canonicalFreeze.bytes,
    }) && provisionalCalibration.deploymentScope === 'local-only',
    `provisional G678 browser QA requires exact canonical local-only ${placementCount}-page artifacts`);
  } else if (requiresFq01FinalAdmission({
    normalizedRoot,
    calibration: provisionalCalibration,
  })) {
    const placementCount =
      validated.freeze.value.registrationCandidatePlacementCount;
    invariant(placementCount === 276 || placementCount === 277 ||
      placementCount === 290 || placementCount === 301 ||
      placementCount === 310 || placementCount === 319 ||
      placementCount === 322 || placementCount === 323 ||
      placementCount === 324 || placementCount === 325 ||
      placementCount === 326 || placementCount === 327 ||
      placementCount === 328 || placementCount === 329 ||
      placementCount === 330 || placementCount === 336 ||
      placementCount === 339 || placementCount === 342 ||
      placementCount === 354,
    'G678 final admission supports only canonical post-browser 276, 277, 290, 301, 310, 319, 322, 323, 324, 325, 326, 327, 328, 329, 330, 336, 339, 342, or 354 artifacts');
    if (placementCount === 354) {
      await checkG678CurrentFinal354Admission({
        fragmentPath: calibrationPath,
        freezePath: provisionalCalibration.freezeManifest,
      });
    } else if (placementCount === 342) {
      await finalizeG678AlgL09GameAssessmentFamilyRegistration({check: true});
    } else if (placementCount === 339) {
      await finalizeG678AlgL09GuidedTutorialFamilyRegistration({check: true});
    } else if (placementCount === 336) {
      await finalizeG678AlgL09TiChoiceFamilyRegistration({check: true});
    } else if (placementCount === 330) {
      await finalizeG678AlgL09In10ChoiceFamilyRegistration({check: true});
    } else if (placementCount === 329) {
      await finalizeG678AlgL09In08ChoiceFamilyRegistration({check: true});
    } else if (placementCount === 328) {
      await finalizeG678AlgL09In06ChoiceFamilyRegistration({check: true});
    } else if (placementCount === 327) {
      await finalizeG678AlgL09In04NumericFamilyRegistration({check: true});
    } else if (placementCount === 326) {
      await finalizeG678AlgL09Vb02GlossaryFamilyRegistration({check: true});
    } else if (placementCount === 325) {
      await finalizeG678AlgL09Vb06DragFamilyRegistration({check: true});
    } else if (placementCount === 324) {
      await finalizeG678AlgL09IntroShellLinkageFamilyRegistration({check: true});
    } else if (placementCount === 323) {
      await finalizeG678AlgL09Vb03TerminalStopFamilyRegistration({check: true});
    } else if (placementCount === 322) {
      await finalizeG678AlgL09TerminalStopFamilyRegistration({check: true});
    } else if (placementCount === 319) {
      await finalizeG678AlgL09SimpleGlossaryFamilyRegistration({check: true});
    } else if (placementCount === 310) {
      await finalizeG678Vb03L1FamilyRegistration({check: true});
    } else if (placementCount === 301) {
      await finalizeG678Vb02L1FamilyRegistration({check: true});
    } else if (placementCount === 290) {
      await finalizeG678In02L1FamilyRegistration({check: true});
    } else if (placementCount === 277) {
      await finalizeG678Ts07NmsL1FamilyRegistration({check: true});
    } else {
      await finalizeG678Ts05FamilyRegistration({check: true});
    }
    const [canonicalFragment, canonicalFreeze] = await Promise.all([
      ordinaryJson(normalizedRoot, placementCount === 342
        ? G678_ALG_L09_GAME_ASSESSMENT_FINAL_FRAGMENT
        : placementCount === 354
        ? G678_ALG_L11_TRANCHE1_FINAL_FRAGMENT
        : placementCount === 339
        ? G678_ALG_L09_GUIDED_TUTORIAL_FINAL_FRAGMENT
        : placementCount === 336
        ? G678_ALG_L09_TI_CHOICE_FINAL_FRAGMENT
        : placementCount === 330
        ? G678_ALG_L09_IN10_CHOICE_FINAL_FRAGMENT
        : placementCount === 329
        ? G678_ALG_L09_IN08_CHOICE_FINAL_FRAGMENT
        : placementCount === 328
        ? G678_ALG_L09_IN06_CHOICE_FINAL_FRAGMENT
        : placementCount === 327
        ? G678_ALG_L09_IN04_NUMERIC_FINAL_FRAGMENT
        : placementCount === 326
        ? G678_ALG_L09_VB02_GLOSSARY_FINAL_FRAGMENT
        : placementCount === 325
        ? G678_ALG_L09_VB06_DRAG_FINAL_FRAGMENT
        : placementCount === 324
        ? G678_ALG_L09_INTRO_SHELL_LINKAGE_FINAL_FRAGMENT
        : placementCount === 323
        ? G678_ALG_L09_VB03_TERMINAL_STOP_FINAL_FRAGMENT
        : placementCount === 319
        ? G678_ALG_L09_GLOSSARY_FINAL_FRAGMENT
        : placementCount === 322
          ? G678_ALG_L09_TERMINAL_STOP_FINAL_FRAGMENT
        : placementCount === 310
        ? G678_VB03_FINAL_FRAGMENT
        : placementCount === 301
          ? G678_VB02_FINAL_FRAGMENT
        : placementCount === 290
          ? G678_IN02_FINAL_FRAGMENT
        : placementCount === 277
          ? G678_TS07_FINAL_FRAGMENT : G678_FINAL_FRAGMENT,
        'canonical G678 final fragment'),
      ordinaryJson(normalizedRoot, placementCount === 342
        ? G678_ALG_L09_GAME_ASSESSMENT_FINAL_FREEZE
        : placementCount === 354
        ? G678_ALG_L11_TRANCHE1_FINAL_FREEZE
        : placementCount === 339
        ? G678_ALG_L09_GUIDED_TUTORIAL_FINAL_FREEZE
        : placementCount === 336
        ? G678_ALG_L09_TI_CHOICE_FINAL_FREEZE
        : placementCount === 330
        ? G678_ALG_L09_IN10_CHOICE_FINAL_FREEZE
        : placementCount === 329
        ? G678_ALG_L09_IN08_CHOICE_FINAL_FREEZE
        : placementCount === 328
        ? G678_ALG_L09_IN06_CHOICE_FINAL_FREEZE
        : placementCount === 327
        ? G678_ALG_L09_IN04_NUMERIC_FINAL_FREEZE
        : placementCount === 326
        ? G678_ALG_L09_VB02_GLOSSARY_FINAL_FREEZE
        : placementCount === 325
        ? G678_ALG_L09_VB06_DRAG_FINAL_FREEZE
        : placementCount === 324
        ? G678_ALG_L09_INTRO_SHELL_LINKAGE_FINAL_FREEZE
        : placementCount === 323
        ? G678_ALG_L09_VB03_TERMINAL_STOP_FINAL_FREEZE
        : placementCount === 319
        ? G678_ALG_L09_GLOSSARY_FINAL_FREEZE
        : placementCount === 322
          ? G678_ALG_L09_TERMINAL_STOP_FINAL_FREEZE
        : placementCount === 310
        ? G678_VB03_FINAL_FREEZE
        : placementCount === 301
          ? G678_VB02_FINAL_FREEZE
        : placementCount === 290
          ? G678_IN02_FINAL_FREEZE
        : placementCount === 277
          ? G678_TS07_FINAL_FREEZE : G678_FINAL_FREEZE,
        'canonical G678 final freeze'),
    ]);
    invariant(fq01CandidateArtifactsMatchCanonical({
      candidateFragmentBytes: calibrationBinding.bytes,
      canonicalFragmentBytes: canonicalFragment.bytes,
      candidateFreezeBytes: validated.freeze.bytes,
      canonicalFreezeBytes: canonicalFreeze.bytes,
    }),
    `G678 final calibration fragment/freeze must exactly equal the canonical post-browser ${placementCount}-page admission artifacts`);
  }
  const calibration = bindCalibrationArtifacts(
    calibrationFromFragment(fragment, validated),
    validated,
  );
  if (!check && !(registryBinding.value.calibrations ?? [registryBinding.value])
    .some(existing => existing.calibrationId === calibration.calibrationId)) {
    for (const entry of calibration.entries) if (isHfrArtifactEntry(entry))
      validateHfrCurrentProducer(normalizedRoot, calibration, entry, validated.freeze.value);
  }
  if (check) {
    invariant(
      privateCurrentJsCalibrationMatches(registryBinding.value, calibration),
      `${calibration.calibrationId}: private Current-JS registry is stale or absent`,
    );
    return Object.freeze({
      calibrationId: calibration.calibrationId,
      deploymentScope: validated.deploymentScope,
      entries: calibration.entries.length,
      mode: 'check',
      registrySha256: registryBinding.sha256,
    });
  }
  const updated = upsertPrivateCurrentJsCalibration(
    registryBinding.value,
    calibration,
  );
  const bytes = jsonBytes(updated);
  const target = registryBinding.absolutePath;
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    const current = await readFile(target);
    invariant(
      digest(current) === registryBinding.sha256,
      'private registry changed during calibration upsert',
    );
    await rename(temporary, target);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
  return Object.freeze({
    calibrationId: calibration.calibrationId,
    deploymentScope: validated.deploymentScope,
    entries: calibration.entries.length,
    freezeSha256: validated.freeze.sha256,
    mode: 'write',
    registrySha256: digest(bytes),
  });
}

export function fq01CandidateArtifactsMatchCanonical({
  candidateFragmentBytes,
  canonicalFragmentBytes,
  candidateFreezeBytes,
  canonicalFreezeBytes,
}) {
  return Buffer.from(candidateFragmentBytes).equals(
    Buffer.from(canonicalFragmentBytes)) &&
    Buffer.from(candidateFreezeBytes).equals(Buffer.from(canonicalFreezeBytes));
}

export function requiresFq01FinalAdmission({
  normalizedRoot,
  calibration,
}) {
  const canonicalRoot = path.resolve(normalizedRoot);
  return canonicalRoot === PROJECT_ROOT &&
    calibration?.calibrationId === 'g678-16-page-product-calibration-v1';
}

export function parseArguments(argv) {
  const options = {
    calibrationPath: null,
    check: null,
    provisionalBrowserQa: false,
    registryPath: DEFAULT_REGISTRY,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check' || argument === '--write') {
      invariant(options.check === null, 'choose exactly one of --check or --write');
      options.check = argument === '--check';
      continue;
    }
    if (argument === '--provisional-browser-qa') {
      invariant(!options.provisionalBrowserQa,
        '--provisional-browser-qa may appear only once');
      options.provisionalBrowserQa = true;
      continue;
    }
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    const key = {
      '--calibration': 'calibrationPath',
      '--registry': 'registryPath',
    }[argument];
    invariant(key, `unknown argument: ${argument}`);
    invariant(index + 1 < argv.length, `${argument} requires a value`);
    options[key] = argv[++index];
  }
  if (!options.help) {
    invariant(options.check !== null, 'choose exactly one of --check or --write');
    invariant(options.calibrationPath, '--calibration is required');
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      'Usage: node scripts/upsert-private-current-js-calibration.mjs --calibration <fragment.json> (--write|--check) [--registry <registry.json>] [--provisional-browser-qa]\n',
    );
  } else {
    synchronizePrivateCurrentJsCalibration(options).then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    }).catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
  }
}
