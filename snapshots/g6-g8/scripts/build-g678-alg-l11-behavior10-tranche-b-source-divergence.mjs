#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {
  chmod,
  lstat,
  readFile,
  readdir,
  realpath,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const PREFIX = 'g678-alg-l11-behavior10-tranche-b';
const AUDIT = `catalog/${PREFIX}-audit-v1.json`;
const AUDIT_BUILDER = `scripts/audit-${PREFIX}.mjs`;
const RUN_ROOT = `work/g678-shared-page-factory/${PREFIX}-audit-v1`;
const RUN = `${RUN_ROOT}/run-manifest.json`;
const INVENTORY = `${RUN_ROOT}/evidence-inventory.json`;
export const OUTPUT =
  `catalog/${PREFIX}-source-divergence-v1.json`;

const IDS = Object.freeze([
  'shared-alg001-l11-p040',
  'shared-alg001-l11-p041',
  'shared-alg001-l11-p042',
]);
const NO_DIVERGENCE_IDS = Object.freeze([
  'shared-alg001-l11-p026',
  'shared-alg001-l11-p027',
  'shared-alg001-l11-p028',
  'shared-alg001-l11-p029',
  'shared-alg001-l11-p030',
  'shared-alg001-l11-p031',
  'shared-alg001-l11-p032',
]);
const ALL_B_IDS = Object.freeze([...NO_DIVERGENCE_IDS, ...IDS]);

const INPUTS = Object.freeze({
  reviewedSourceAudit: Object.freeze({path: AUDIT, bytes: 139507,
    sha256:
      '2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8'}),
  sourceAuditBuilder: Object.freeze({path: AUDIT_BUILDER, bytes: 54426,
    sha256:
      '5e6ccbec8fc5e8b92d3547484a2e1596967517aab61b8fac282a9294a29b515b'}),
  diagnosticRun: Object.freeze({path: RUN, bytes: 138379,
    sha256:
      '832624ad441120ed1986b7dffd6f7ac0e2688e7ad8cf69c33f28c305ae5ab106'}),
  evidenceInventory: Object.freeze({path: INVENTORY, bytes: 274118,
    sha256:
      'df7b3b3962f0d046b7bef9c42b5d16222841d25f24982f8b8f1ab06803d402b6',
    fileCountBeforeInventoryAndManifest: 1451}),
});

const FALSE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  behaviorAccepted: false,
  authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

const PAGES = Object.freeze([
  Object.freeze({
    animationId: IDS[0], mainObjectId: 351, finalQuizFrame: 812,
    source: Object.freeze({path: 'G6-G8-shared/ALG001/L11/TS/L11TS07.swf',
      bytes: 543508,
      sha256:
        'd6f115a52d6778b04891bb4b9f991a60718f17553a947536eb813ed10d0375b5'}),
    correct: Object.freeze({characterId: 335, spriteFrameCount: 1,
      depth: 549, ratio: 811, translateX: 7388, translateY: -1086,
      placementBytes: 507,
      placementSha256:
        '06ca548458a2dec03e139a06137cf628fcf32248ae5432321ca2086bb11e0d0d',
      spriteOpeningBytes: 100,
      spriteOpeningSha256:
        '4e906de645a42e258fb01b8a0f2bff9cc816f622c7dda830038679883e934e29',
      frameSvg: Object.freeze({path:
        `${IDS[0]}/help-popup-svg/DefineSprite_335/1.svg`, bytes: 79698,
      sha256:
        '19fecfb08ff8a8b52deeadf280b4e183599a2d080d3d4cf5fbdc9de1c578b377'}),
      openButtonId: 13, closeButtonId: 303}),
    stale: Object.freeze({characterId: 350, spriteFrameCount: 70,
      depth: 617, ratio: 811, translateX: 7992, translateY: -2842,
      placementBytes: 507,
      placementSha256:
        '50529a590d203d8306847ad53ef74eb44ce172429d2c47d409fbbf44bcfc2b4d',
      spriteOpeningBytes: 101,
      spriteOpeningSha256:
        'ef171277bdc13e54a891c0055bf21214ef3216c249c08c5eb2a103f5d4347b3e',
      frameSvg: Object.freeze({path:
        `${IDS[0]}/stale-angle-overlay-svg/DefineSprite_350/1.svg`, bytes: 4939,
      sha256:
        'e154a8d2d388fcc5d2a2e349424af50945dac76e603739c36d163fc324d3e5c0'}),
    }),
  }),
  Object.freeze({
    animationId: IDS[1], mainObjectId: 338, finalQuizFrame: 884,
    source: Object.freeze({path: 'G6-G8-shared/ALG001/L11/TS/L11TS08.swf',
      bytes: 566092,
      sha256:
        '3bfac12aec4982064c1041ce296c185299f7fc0247b46144f1144a10ab812e6c'}),
    correct: Object.freeze({characterId: 322, spriteFrameCount: 1,
      depth: 239, ratio: 883, translateX: 7388, translateY: -1086,
      placementBytes: 507,
      placementSha256:
        'b71c6a34f423097f8fb68dc1bc2e2a6c80550ea9771ac625e56c9e562fb74ee5',
      spriteOpeningBytes: 100,
      spriteOpeningSha256:
        '60caae5d450cc257dee5818aa289f44ff8f26cb28e9fb1aa78652e24ab53adf0',
      frameSvg: Object.freeze({path:
        `${IDS[1]}/help-popup-svg/DefineSprite_322/1.svg`, bytes: 113410,
      sha256:
        '60f23be2dc8af25f2c7bbe1114f8eefccea24554209ef22e4f4bb7a144327a2c'}),
      openButtonId: 13, closeButtonId: 301}),
    stale: Object.freeze({characterId: 337, spriteFrameCount: 70,
      depth: 286, ratio: 883, translateX: 7992, translateY: -2842,
      placementBytes: 507,
      placementSha256:
        '08a495044ff1cd942bca21f1232abb26ee8fe5ce0327a9b8bf43526854536565',
      spriteOpeningBytes: 101,
      spriteOpeningSha256:
        '653e310848d269c15a201ed7070e81879f8e8c17b54fcdcd211ee34274d9f086',
      frameSvg: Object.freeze({path:
        `${IDS[1]}/stale-angle-overlay-svg/DefineSprite_337/1.svg`, bytes: 4939,
      sha256:
        'db4bcfbdd951290a0693b390f0b5267def4cc1940be56214121a90b42b0ab8f4'}),
    }),
  }),
  Object.freeze({
    animationId: IDS[2], mainObjectId: 303, finalQuizFrame: 982,
    source: Object.freeze({path: 'G6-G8-shared/ALG001/L11/TS/L11TS09.swf',
      bytes: 605797,
      sha256:
        '58b8366ea544632a77d1903b7f5a654ddf91311ef9a8dfcca9a7ca8528f6669e'}),
    correct: Object.freeze({characterId: 287, spriteFrameCount: 1,
      depth: 209, ratio: 981, translateX: 7328, translateY: -1040,
      placementBytes: 507,
      placementSha256:
        '7fd64499f34b189e6c441eb1744764811e14d0d70540995f47b0eeaab33666ae',
      spriteOpeningBytes: 100,
      spriteOpeningSha256:
        '98767a65cfeac8665360a16ef4877cebff3be932b4c6ac83fb061865eecba13d',
      frameSvg: Object.freeze({path:
        `${IDS[2]}/help-popup-svg/DefineSprite_287/1.svg`, bytes: 52701,
      sha256:
        'ccd776ec6f583425899512debde0f6168b0786bb4be5c99ff6d8974c81cd8781'}),
      openButtonId: 13, closeButtonId: 274}),
    stale: Object.freeze({characterId: 302, spriteFrameCount: 70,
      depth: 234, ratio: 981, translateX: 7992, translateY: -2842,
      placementBytes: 507,
      placementSha256:
        'e0cbebb29443a308e21fc8980b6e90fd2563e7ce934b587d4a3e54a96260e93c',
      spriteOpeningBytes: 101,
      spriteOpeningSha256:
        '71b90d0248effb241416c5ba94c98b1e727bd43e338bbcbd4d51ea23c6ac7f59',
      frameSvg: Object.freeze({path:
        `${IDS[2]}/stale-angle-overlay-svg/DefineSprite_302/1.svg`, bytes: 4939,
      sha256:
        'fe3332ad4e06f14265cd752d45ff90e3ad2422e70b83e59caac1ca06b21ed26e'}),
    }),
  }),
]);

const OPEN_SCRIPT = Object.freeze({bytes: 106,
  sha256: 'b0087663b7df3fef95b307be9dcc1c24066dc45634f0febf94fd0f3411706dd8'});
const INIT_SCRIPT = Object.freeze({bytes: 93,
  sha256: '64fb7604de9127107fff9630ff3a550a6bccd0b48c2743097e637c68555d4629'});
const CLOSE_SCRIPT = Object.freeze({bytes: 109,
  sha256: '11bcd7e208cd1ffaf805db93a144ed2f16db3de3b13b202bbcc550291c201ad2'});

const LIMITATIONS = Object.freeze([
  'This static source-divergence decision does not determine how an authorized original Flash runtime displayed either case-sensitive instance.',
  'Only exact p040-p042 maintained candidates may suppress Mc_PopUp; p026-p032 receive no source-divergence authorization.',
  'The source-controlled Mc_Popup help content and its open, close, and reset lifecycle must remain implemented and source-bound.',
  'Browser evidence must later prove stale Mc_PopUp absence and the correct Mc_Popup lifecycle before product calibration.',
  'This decision does not establish fidelity, audio, human, Owner, registration, scale-out, release, or publication acceptance.',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function exactKeys(value, expected, message) {
  invariant(value && typeof value === 'object' && !Array.isArray(value) &&
    exact(Object.keys(value).sort(), [...expected].sort()), message);
}

function projectPath(relative) {
  const target = path.resolve(ROOT, relative);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relative} escapes project root`);
  return target;
}

async function stableFile(relative, {json = false, readOnly = false} = {}) {
  const target = projectPath(relative);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (!readOnly || (before.mode & 0o222n) === 0n),
  `${relative} must be one canonical${readOnly ? ' read-only' : ''} file`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relative} changed during read`);
  return Object.freeze({path: relative, bytes: buffer.length,
    sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}

function descriptor(file) {
  return Object.freeze({path: file.path, bytes: file.bytes,
    sha256: file.sha256});
}

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function attributes(fragment) {
  return Object.fromEntries([...fragment.matchAll(
    /(characterId|depth|name|ratio|frameCount|spriteId|translateX|translateY)="([^"]+)"/gu)]
    .map((match) => [match[1], match[2]]));
}

function placementEvidence(xml, instanceName) {
  const expression = new RegExp(
    `<item type="PlaceObject2Tag"[^>]*name="${instanceName}"[^>]*>[\\s\\S]*?</item>`,
    'gu');
  const matches = [...xml.matchAll(expression)];
  invariant(matches.length === 1,
    `${instanceName} exact placement denominator drifted`);
  const fragment = Buffer.from(matches[0][0]);
  const values = attributes(matches[0][0]);
  return Object.freeze({instanceName, characterId: Number(values.characterId),
    depth: Number(values.depth), ratio: Number(values.ratio),
    translateX: Number(values.translateX),
    translateY: Number(values.translateY), bytes: fragment.length,
    sha256: sha256(fragment)});
}

function spriteEvidence(xml, characterId) {
  const expression = new RegExp(
    `<item type="DefineSpriteTag"[^>]*spriteId="${characterId}"[^>]*>`,
    'gu');
  const matches = [...xml.matchAll(expression)];
  invariant(matches.length === 1,
    `${characterId} exact sprite definition denominator drifted`);
  const opening = Buffer.from(matches[0][0]);
  const values = attributes(matches[0][0]);
  return Object.freeze({characterId, frameCount: Number(values.frameCount),
    openingTagBytes: opening.length, openingTagSha256: sha256(opening)});
}

function expectedScriptPaths(page) {
  return Object.freeze({
    open: `${page.animationId}/ffdec-export/scripts/DefineButton2_${
      page.correct.openButtonId}/BUTTONCONDACTION on(release).as`,
    init: `${page.animationId}/ffdec-export/scripts/DefineSprite_${
      page.mainObjectId}/frame_${page.finalQuizFrame}/DoAction.as`,
    close: `${page.animationId}/ffdec-export/scripts/DefineButton2_${
      page.correct.closeButtonId}/BUTTONCONDACTION on(release).as`,
  });
}

function expectedSourceEvidence(page) {
  const paths = expectedScriptPaths(page);
  return Object.freeze({
    finalQuizFrame: page.finalQuizFrame,
    correctHelp: Object.freeze({
      role: 'source-controlled-help-popup', instanceName: 'Mc_Popup',
      characterId: page.correct.characterId,
      sprite: Object.freeze({characterId: page.correct.characterId,
        frameCount: page.correct.spriteFrameCount,
        openingTagBytes: page.correct.spriteOpeningBytes,
        openingTagSha256: page.correct.spriteOpeningSha256}),
      finalQuizPlacement: Object.freeze({instanceName: 'Mc_Popup',
        characterId: page.correct.characterId, depth: page.correct.depth,
        ratio: page.correct.ratio, translateX: page.correct.translateX,
        translateY: page.correct.translateY,
        bytes: page.correct.placementBytes,
        sha256: page.correct.placementSha256}),
      frameSvg: page.correct.frameSvg,
      exactActionScriptReferenceCount: 2,
      actionScriptReferences: Object.freeze([
        Object.freeze({path: paths.open, bytes: OPEN_SCRIPT.bytes,
          sha256: OPEN_SCRIPT.sha256, matchCount: 1,
          visibilityAssignment: 'Mc_Popup._visible = true;'}),
        Object.freeze({path: paths.init, bytes: INIT_SCRIPT.bytes,
          sha256: INIT_SCRIPT.sha256, matchCount: 1,
          visibilityAssignment: 'Mc_Popup._visible = false;'}),
      ]),
      closeLifecycleScript: Object.freeze({path: paths.close,
        bytes: CLOSE_SCRIPT.bytes, sha256: CLOSE_SCRIPT.sha256,
        closesCurrentHelpSurface: true}),
    }),
    staleAngleOverlay: Object.freeze({
      role: 'case-sensitive-stale-angle-overlay', instanceName: 'Mc_PopUp',
      characterId: page.stale.characterId,
      sprite: Object.freeze({characterId: page.stale.characterId,
        frameCount: page.stale.spriteFrameCount,
        openingTagBytes: page.stale.spriteOpeningBytes,
        openingTagSha256: page.stale.spriteOpeningSha256}),
      finalQuizPlacement: Object.freeze({instanceName: 'Mc_PopUp',
        characterId: page.stale.characterId, depth: page.stale.depth,
        ratio: page.stale.ratio, translateX: page.stale.translateX,
        translateY: page.stale.translateY,
        bytes: page.stale.placementBytes,
        sha256: page.stale.placementSha256}),
      frameSvg: page.stale.frameSvg,
      exactActionScriptReferenceCount: 0,
      controlledByExtractedActionScript: false,
      sourceStaticVisibility: 'present-without-local-hide-script',
      originalRuntimeDispositionEstablished: false,
    }),
  });
}

function allowedDomBehavior(page) {
  return Object.freeze({
    caseSensitiveSourceIdentityRequired: true,
    correctHelpSelector:
      `[data-source-instance-name="Mc_Popup"][data-source-character-id="${
        page.correct.characterId}"]`,
    staleOverlaySelector:
      `[data-source-instance-name="Mc_PopUp"][data-source-character-id="${
        page.stale.characterId}"]`,
    staleOverlayMayRender: false,
    correctHelpMustRemainImplemented: true,
    correctHelpVisibleCountBeforeOpen: 0,
    correctHelpVisibleCountAfterOpen: 1,
    correctHelpVisibleCountAfterClose: 0,
    correctHelpVisibleCountAfterReplayReset: 0,
    staleOverlayDomCountInEveryState: 0,
  });
}

function expectedEntry(page) {
  const sourceEvidence = expectedSourceEvidence(page);
  return Object.freeze({
    animationId: page.animationId,
    familyId: 'l11-guided-tutorial-choice', source: page.source,
    sourceEvidence,
    sourceEvidenceSha256: sha256(stableBytes(sourceEvidence)),
    decision: Object.freeze({
      divergenceKind:
        'case-sensitive-stale-angle-overlay-authoring-residue-suppression',
      sourceAuditBlocker:
        'case-sensitive-stale-angle-overlay-original-runtime-disposition-unresolved',
      sourceDivergenceDecisionEstablished: true,
      maintainedCandidateMaySuppressStaleAngleOverlay: true,
      originalRuntimeDispositionEstablished: false,
      reason:
        'Mc_Popup is the exact case-sensitive help instance controlled by two extracted ActionScript references and a close lifecycle; the distinct final-quiz Mc_PopUp 70-frame angle overlay has zero extracted ActionScript references and is unrelated to the retained help lifecycle.',
      allowedDomBehavior: allowedDomBehavior(page),
    }),
  });
}

function laterBrowserContract() {
  return Object.freeze({requiredBeforeProductCalibration: true,
    browserCalibrationPassed: false,
    exactPlacementIds: IDS,
    perPlacementRequiredStates: Object.freeze(PAGES.map((page) =>
      Object.freeze({animationId: page.animationId,
        correctHelpSelector: allowedDomBehavior(page).correctHelpSelector,
        staleOverlaySelector: allowedDomBehavior(page).staleOverlaySelector,
        states: Object.freeze([
          Object.freeze({state: 'final-quiz-before-help',
            correctHelpVisibleCount: 0, staleOverlayDomCount: 0}),
          Object.freeze({state: 'after-help-open',
            correctHelpVisibleCount: 1, staleOverlayDomCount: 0,
            exactSourceHelpSvgRequired: true}),
          Object.freeze({state: 'after-help-close',
            correctHelpVisibleCount: 0, staleOverlayDomCount: 0}),
          Object.freeze({state: 'after-replay-reset',
            correctHelpVisibleCount: 0, staleOverlayDomCount: 0}),
        ])})))});
}

function expectedArtifact() {
  const entries = Object.freeze(PAGES.map(expectedEntry));
  return Object.freeze({schemaVersion: 1,
    artifactType:
      'g678-alg-l11-behavior10-tranche-b-source-divergence-v1',
    decisionId: 'g678-alg-l11-behavior10-tranche-b-source-divergence-v1',
    status:
      'exact-3-maintained-candidate-stale-overlay-suppression-authorized-all-downstream-gates-closed',
    inputs: INPUTS,
    scope: Object.freeze({behavior10PlacementCount: 10,
      exactDivergencePlacementCount: 3,
      exactDivergencePlacementIds: IDS,
      noDivergencePlacementCount: 7,
      noDivergencePlacementIds: NO_DIVERGENCE_IDS}),
    maintainedCandidateSuppressionAuthorizedPlacementCount: 3,
    sourceDivergenceDecisionEstablishedCount: 3,
    originalRuntimeDispositionEstablishedCount: 0,
    entries,
    sourceEvidenceSetSha256: sha256(Buffer.from(entries.map((entry) =>
      `${entry.animationId}|${entry.sourceEvidenceSha256}\n`).join(''))),
    noDivergencePlacements: Object.freeze(NO_DIVERGENCE_IDS.map(
      (animationId) => Object.freeze({animationId,
        sourceDivergenceAuthorizedByThisDecision: false,
        requiredBehavior: 'retain exact audited source behavior'}))),
    laterBrowserContract: laterBrowserContract(),
    independentReviewPassed: false,
    registrationCandidatePlacementCount: 0,
    currentJavaScriptRegisteredPlacementCount: 0,
    productCalibrationPassed: false,
    browserProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    scaleOutAuthorized: false,
    releaseAuthorized: false,
    published: false,
    limitations: LIMITATIONS,
    acceptanceEffects: FALSE_EFFECTS,
  });
}

export function validateBehavior10TrancheBSourceDivergence(value) {
  const expected = expectedArtifact();
  exactKeys(value, Object.keys(expected),
    'behavior10 tranche-b divergence top-level schema drifted');
  invariant(exact(value, expected),
    'behavior10 tranche-b source-divergence decision drifted');
  return true;
}

async function evidenceFile(relative, inventoryMap) {
  const expected = inventoryMap.get(relative);
  invariant(expected, `${relative} is absent from bound evidence inventory`);
  const current = await stableFile(`${RUN_ROOT}/${relative}`, {readOnly: true});
  invariant(current.bytes === expected.bytes &&
    current.sha256 === expected.sha256,
  `${relative} evidence inventory binding drifted`);
  return current;
}

async function verifyPageEvidence(page, member, inventoryMap) {
  invariant(member?.animationId === page.animationId &&
    exact(member.source, {...page.source,
      physicalReadOnlyIdentityVerified: true}) &&
    member.familyId === 'l11-guided-tutorial-choice' &&
    member.sourceAuditPassed === true &&
    member.registrationCandidate === false &&
    member.productCalibrationPassed === false &&
    member.wholeLessonEngineeringPreviewReady === false &&
    exact(member.acceptanceEffects, FALSE_EFFECTS),
  `${page.animationId} source-audit member boundary drifted`);
  const help = member.helpPopup;
  invariant(help.sourceInstanceName === 'Mc_Popup' &&
    help.characterId === page.correct.characterId &&
    help.staleAngleOverlay.instanceName === 'Mc_PopUp' &&
    help.staleAngleOverlay.characterId === page.stale.characterId &&
    help.staleAngleOverlay.placedAtFinalQuizFrame === page.finalQuizFrame &&
    help.staleAngleOverlay.controlledByExtractedActionScript === false &&
    help.staleAngleOverlay.distinctFromSourceHelpInstance === true &&
    help.staleAngleOverlay.sourceStaticVisibility ===
      'present-without-local-hide-script' &&
    help.staleAngleOverlay.originalRuntimeDispositionEstablished === false &&
    help.staleAngleOverlay.sourceDivergenceDecisionEstablished === false,
  `${page.animationId} case-sensitive source evidence drifted`);

  const xmlFile = await evidenceFile(
    member.freshFfdecBinaryClosure.swfXml.path, inventoryMap);
  const xml = xmlFile.buffer.toString('utf8');
  const correctPlacement = placementEvidence(xml, 'Mc_Popup');
  const stalePlacement = placementEvidence(xml, 'Mc_PopUp');
  const correctSprite = spriteEvidence(xml, page.correct.characterId);
  const staleSprite = spriteEvidence(xml, page.stale.characterId);
  const expectedEvidence = expectedSourceEvidence(page);
  invariant(exact(correctPlacement,
    expectedEvidence.correctHelp.finalQuizPlacement) &&
    exact(stalePlacement,
      expectedEvidence.staleAngleOverlay.finalQuizPlacement) &&
    exact(correctSprite, expectedEvidence.correctHelp.sprite) &&
    exact(staleSprite, expectedEvidence.staleAngleOverlay.sprite),
  `${page.animationId} object/sprite placement evidence drifted`);

  const [helpSvg, staleSvg] = await Promise.all([
    evidenceFile(help.frameSvg.path, inventoryMap),
    evidenceFile(help.staleAngleOverlay.frameSvg.path, inventoryMap),
  ]);
  invariant(exact({path: help.frameSvg.path, bytes: helpSvg.bytes,
    sha256: helpSvg.sha256}, page.correct.frameSvg) &&
    exact({path: help.staleAngleOverlay.frameSvg.path,
      bytes: staleSvg.bytes, sha256: staleSvg.sha256}, page.stale.frameSvg) &&
    helpSvg.buffer.toString('utf8', 0, 200).includes('<svg') &&
    staleSvg.buffer.toString('utf8', 0, 200).includes('<svg'),
  `${page.animationId} exact SVG evidence drifted`);

  const scriptEntries = [...inventoryMap.keys()].filter((relative) =>
    relative.startsWith(`${page.animationId}/ffdec-export/scripts/`) &&
      relative.endsWith('.as')).sort();
  const scriptRows = await Promise.all(scriptEntries.map(async (relative) => {
    const file = await evidenceFile(relative, inventoryMap);
    return Object.freeze({path: relative, bytes: file.bytes,
      sha256: file.sha256,
      source: file.buffer.toString('utf8').replace(/\r\n?/gu, '\n')});
  }));
  const correctReferences = scriptRows.filter((row) =>
    row.source.includes('Mc_Popup')).map((row) => Object.freeze({
      path: row.path, bytes: row.bytes, sha256: row.sha256,
      matchCount: countLiteral(row.source, 'Mc_Popup'),
      visibilityAssignment: row.source.includes('Mc_Popup._visible = true;')
        ? 'Mc_Popup._visible = true;' : 'Mc_Popup._visible = false;',
    }));
  const staleReferenceCount = scriptRows.reduce((count, row) =>
    count + countLiteral(row.source, 'Mc_PopUp'), 0);
  const paths = expectedScriptPaths(page);
  const close = scriptRows.find((row) => row.path === paths.close);
  invariant(correctReferences.reduce((count, row) =>
    count + row.matchCount, 0) === 2 &&
    exact(correctReferences,
      expectedEvidence.correctHelp.actionScriptReferences) &&
    staleReferenceCount === 0 && close &&
    close.bytes === CLOSE_SCRIPT.bytes && close.sha256 === CLOSE_SCRIPT.sha256 &&
    close.source.includes('this._visible = false;') &&
    close.source.includes('_parent.NMHBtn.enabled = true;'),
  `${page.animationId} exact case-sensitive ActionScript evidence drifted`);
  return true;
}

export async function prepareBehavior10TrancheBSourceDivergence() {
  const [audit, auditBuilder, run, inventory] = await Promise.all([
    stableFile(AUDIT, {json: true, readOnly: true}),
    stableFile(AUDIT_BUILDER),
    stableFile(RUN, {json: true, readOnly: true}),
    stableFile(INVENTORY, {json: true, readOnly: true}),
  ]);
  invariant(exact(descriptor(audit), INPUTS.reviewedSourceAudit) &&
    exact(descriptor(auditBuilder), INPUTS.sourceAuditBuilder) &&
    exact(descriptor(run), INPUTS.diagnosticRun) &&
    exact({...descriptor(inventory),
      fileCountBeforeInventoryAndManifest: inventory.value.length},
    INPUTS.evidenceInventory),
  'behavior10 tranche-b divergence input hash binding drifted');
  invariant(audit.value.artifactType ===
    'g678-alg-l11-behavior10-tranche-b-audit-v1' &&
    exact(audit.value.selectedPlacementIds, ALL_B_IDS) &&
    audit.value.sourceAuditPassedPlacementCount === 10 &&
    audit.value.staleAngleOverlaySourceDefectCount === 3 &&
    audit.value.staleAngleOverlayOriginalRuntimeDispositionEstablishedCount ===
      0 && audit.value.registrationCandidatePlacementCount === 0 &&
    audit.value.currentJavaScriptRegisteredPlacementCount === 0 &&
    audit.value.productCalibrationPassed === false &&
    audit.value.wholeLessonEngineeringPreviewReady === false &&
    audit.value.scaleOutAuthorized === false &&
    exact(audit.value.acceptanceEffects, FALSE_EFFECTS),
  'behavior10 tranche-b reviewed audit boundary drifted');
  invariant(exact(audit.value.diagnosticRun, INPUTS.diagnosticRun) &&
    exact(run.value.inputs.builder, INPUTS.sourceAuditBuilder) &&
    exact(run.value.evidenceInventory, INPUTS.evidenceInventory) &&
    run.value.registrationCandidatePlacementCount === 0 &&
    run.value.productCalibrationPassed === false &&
    run.value.scaleOutAuthorized === false &&
    exact(run.value.acceptanceEffects, FALSE_EFFECTS),
  'behavior10 tranche-b diagnostic run boundary drifted');
  invariant(Array.isArray(inventory.value) && inventory.value.length === 1451 &&
    new Set(inventory.value.map((row) => row.path)).size === 1451,
  'behavior10 tranche-b evidence inventory denominator drifted');
  const inventoryMap = new Map(inventory.value.map((row) => [row.path, row]));
  for (const page of PAGES) {
    await verifyPageEvidence(page, audit.value.members.find((member) =>
      member.animationId === page.animationId), inventoryMap);
  }
  for (const animationId of NO_DIVERGENCE_IDS) {
    const member = audit.value.members.find((row) =>
      row.animationId === animationId);
    invariant(member && !member.p1Blockers.includes(
      'case-sensitive-stale-angle-overlay-original-runtime-disposition-unresolved'),
    `${animationId} unexpectedly entered the source-divergence scope`);
  }
  const artifact = expectedArtifact();
  validateBehavior10TrancheBSourceDivergence(artifact);
  return Object.freeze({artifact, bytes: stableBytes(artifact)});
}

export async function buildBehavior10TrancheBSourceDivergence(
  {check = false} = {},
) {
  const prepared = await prepareBehavior10TrancheBSourceDivergence();
  if (check) {
    const current = await stableFile(OUTPUT, {json: true, readOnly: true});
    invariant(current.buffer.equals(prepared.bytes),
      'behavior10 tranche-b source-divergence artifact drifted');
    validateBehavior10TrancheBSourceDivergence(current.value);
  } else {
    await writeFile(projectPath(OUTPUT), prepared.bytes,
      {flag: 'wx', mode: 0o444});
    await chmod(projectPath(OUTPUT), 0o444);
    const current = await stableFile(OUTPUT, {readOnly: true});
    invariant(current.buffer.equals(prepared.bytes),
      'behavior10 tranche-b source-divergence publication drifted');
  }
  return Object.freeze({check, output: OUTPUT, bytes: prepared.bytes.length,
    sha256: sha256(prepared.bytes), exactDivergencePlacementCount: 3,
    maintainedCandidateSuppressionAuthorizedPlacementCount: 3,
    originalRuntimeDispositionEstablishedCount: 0,
    registrationCandidatePlacementCount: 0,
    currentJavaScriptRegisteredPlacementCount: 0,
    productCalibrationPassed: false, browserProductCalibrationPassed: false,
    scaleOutAuthorized: false, releaseAuthorized: false, published: false,
    acceptanceEffects: FALSE_EFFECTS});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-alg-l11-behavior10-tranche-b-source-divergence.mjs [--check]');
  buildBehavior10TrancheBSourceDivergence({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
