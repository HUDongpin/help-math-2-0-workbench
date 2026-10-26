#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const base = process.env.HELP_MATH_G678_QA_BASE_URL ?? 'http://127.0.0.1:3324';
const parsedBase = new URL(base);
invariant(parsedBase.protocol === 'http:' &&
  parsedBase.hostname === '127.0.0.1' &&
  parsedBase.username === '' && parsedBase.password === '' &&
  parsedBase.pathname === '/' && parsedBase.search === '' &&
  parsedBase.hash === '',
'G678 browser QA base must be one loopback HTTP origin');
const output = 'output/playwright/g678-current-js-326-v1';
const PATHS = Object.freeze({
  freeze: 'catalog/product-bridge-calibrations/g678-current-js-326-page-registration-v1.json',
  catalog: 'catalog/g678-shared-catalog.v1.json',
  in02Audit: 'catalog/g678-in02-l1-family-audit-v1.json',
  vb02Audit: 'catalog/g678-vb02-l1-family-audit-v1.json',
  vb03Audit: 'catalog/g678-vb03-l1-family-audit-v1.json',
  algL09SimpleGlossaryAudit:
    'catalog/g678-alg-l09-simple-glossary-family-audit-v1.json',
  algL09TerminalStopAudit:
    'catalog/g678-alg-l09-terminal-stop-family-audit-v1.json',
  algL09Vb03TerminalStopAudit:
    'catalog/g678-alg-l09-vb03-terminal-stop-family-audit-v1.json',
  algL09IntroShellLinkageAudit:
    'catalog/g678-alg-l09-intro-shell-linkage-family-audit-v1.json',
  algL09Vb06DragAudit:
    'catalog/g678-alg-l09-vb06-drag-family-audit-v1.json',
  algL09Vb02GlossaryAudit:
    'catalog/g678-alg-l09-vb02-glossary-family-audit-v1.json',
  launcher: 'scripts/run-g678-local-preview.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  glossaryHost:
    'packages/demos/src/private-source-static-glossary-candidate.tsx',
  instructionGlossaryHost:
    'packages/demos/src/private-source-static-instruction-glossary-candidate.tsx',
  vocabularyGlossaryHost:
    'packages/demos/src/private-source-static-vocabulary-glossary-candidate.tsx',
  repeatedVocabularyGlossaryHost:
    'packages/demos/src/private-source-static-repeated-vocabulary-glossary-candidate.tsx',
  algL09SimpleGlossaryHost:
    'packages/demos/src/private-source-static-alg-l09-simple-glossary-candidate.tsx',
  algL09TerminalStopHost:
    'packages/demos/src/private-source-static-alg-l09-terminal-stop-candidate.tsx',
  algL09Vb06DragHost:
    'packages/demos/src/private-source-static-alg-l09-vb06-drag-candidate.tsx',
  algL09Vb06DragBehavior: 'packages/demos/src/g678-alg-l09-vb06-drag.ts',
  assessmentHost:
    'packages/demos/src/private-source-static-assessment-candidate.tsx',
  assessmentReducer: 'packages/demos/src/g678-ts07-assessment.ts',
  feedbackSelector:
    'packages/demos/src/g678-advanced-manual/host-feedback-selector.ts',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
  nextConfig: 'apps/web/next.config.ts',
});
const REGISTRY_PATHS = Object.freeze({
  privateRegistry: Object.freeze({
    live: 'packages/demos/private-current-js-registry.json',
    snapshot: `${output}/private-current-js-registry.snapshot.json`,
  }),
  localRegistry: Object.freeze({
    live: 'packages/demos/src/registry.local-only.metadata.generated.ts',
    snapshot: `${output}/registry.local-only.metadata.generated.snapshot.ts`,
  }),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function projectPath(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes the project root`);
  return absolute;
}

async function binding(relativePath, json = false) {
  const absolute = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(absolute), lstat(absolute, {bigint: true}),
  ]);
  invariant(canonical === absolute && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), buffer: bytes,
    ...(json ? {value: JSON.parse(bytes)} : {})});
}

async function absoluteBinding(requestedPath) {
  const absolute = path.resolve(requestedPath);
  const canonical = await realpath(absolute);
  const before = await lstat(canonical, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    'Chromium executable must be one canonical ordinary file');
  const bytes = await readFile(canonical);
  const after = await lstat(canonical, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  'Chromium executable changed during read');
  return Object.freeze({requestedPath: absolute, realPath: canonical,
    bytes: bytes.length, sha256: sha256(bytes)});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

async function currentInputs({check}) {
  const jsonKeys = new Set([
    'freeze', 'catalog', 'in02Audit', 'vb02Audit', 'vb03Audit',
    'algL09SimpleGlossaryAudit', 'algL09TerminalStopAudit',
    'algL09Vb03TerminalStopAudit',
    'algL09IntroShellLinkageAudit', 'algL09Vb06DragAudit',
    'algL09Vb02GlossaryAudit',
  ]);
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key,
      await binding(relativePath, jsonKeys.has(key))],
  ));
  const values = Object.fromEntries(entries);
  const registryEntries = await Promise.all(Object.entries(REGISTRY_PATHS).map(
    async ([key, paths]) => {
      const source = await binding(check ? paths.snapshot : paths.live,
        key === 'privateRegistry');
      return [key, check ? source : Object.freeze({...source,
        path: paths.snapshot})];
    },
  ));
  Object.assign(values, Object.fromEntries(registryEntries));
  const script = await binding(path.relative(ROOT, SCRIPT_PATH));
  const executable = await absoluteBinding(chromium.executablePath());
  const freeze = values.freeze.value;
  const privateCalibration = values.privateRegistry.value.calibrations.find(
    (calibration) =>
      calibration.calibrationId === 'g678-16-page-product-calibration-v1');
  invariant(freeze.registrationCandidatePlacementCount === 326 &&
    freeze.selectedPages.length === 326 &&
    new Set(freeze.selectedPages.map((page) => page.animationId)).size === 326 &&
    privateCalibration?.entries?.length === 326 &&
    privateCalibration?.freezeManifestSha256 === values.freeze.sha256 &&
    values.localRegistry.buffer.toString('utf8').includes(
      'export const registeredLocalOnlyAnimationKeys') &&
    values.localRegistry.buffer.toString('utf8').match(/'shared-/gu)?.length >=
      326 &&
    values.productBridge.bytes > 0 && values.glossaryHost.bytes > 0 &&
    values.instructionGlossaryHost.bytes > 0 &&
    values.vocabularyGlossaryHost.bytes > 0 &&
    values.repeatedVocabularyGlossaryHost.bytes > 0 &&
    values.algL09SimpleGlossaryHost.bytes > 0 &&
    values.algL09TerminalStopHost.bytes > 0 &&
    values.algL09Vb06DragHost.bytes > 0 &&
    values.algL09Vb06DragBehavior.bytes > 0 &&
    values.assessmentHost.bytes > 0 && values.assessmentReducer.bytes > 0 &&
    values.feedbackSelector.bytes > 0 && values.sourceStaticHost.bytes > 0,
  '326-page QA input identity drifted');
  return Object.freeze({values, descriptors: Object.freeze({
    ...Object.fromEntries(Object.entries(values).map(([key, value]) =>
      [key, descriptor(value)])),
    script: descriptor(script),
    chromiumExecutable: executable,
  }), snapshotBytes: check ? null : Object.freeze(Object.fromEntries(
    registryEntries.map(([key, value]) => [key, value.buffer])))});
}

function lessonExpectations(catalog, freeze) {
  const counts = new Map();
  for (const page of freeze.selectedPages) {
    counts.set(page.stableLessonKey,
      (counts.get(page.stableLessonKey) ?? 0) + 1);
  }
  const lessons = catalog.lessons.map((lesson) => Object.freeze({
    stableLessonKey: lesson.stableLessonKey,
    moduleCode: lesson.moduleCode,
    lessonNumber: lesson.lessonNumber,
    activePageCount: lesson.pages.length,
    registeredPageCount: counts.get(lesson.stableLessonKey) ?? 0,
  }));
  invariant(lessons.length === 44 &&
    lessons.every((lesson) => lesson.registeredPageCount > 0 &&
      lesson.registeredPageCount < lesson.activePageCount) &&
    lessons.reduce((sum, lesson) => sum + lesson.registeredPageCount, 0) === 326,
  '326-page lesson vector drifted');
  return Object.freeze(lessons);
}

function sampleExpectations(
  freeze,
  in02Audit,
  vb02Audit,
  vb03Audit,
  algL09SimpleGlossaryAudit,
  algL09TerminalStopAudit,
  algL09Vb03TerminalStopAudit,
  algL09IntroShellLinkageAudit,
  algL09Vb06DragAudit,
  algL09Vb02GlossaryAudit,
) {
  const pureLinearPages = freeze.selectedPages.filter((page) =>
    page.adapterFamily === 'pure-linear-source-static');
  const pureSamples = ['ALG001', 'DAT001', 'GEO001', 'NMS002'].map(
    (moduleCode) => {
      const candidates = pureLinearPages.filter((page) =>
        page.moduleCode === moduleCode).sort((left, right) =>
        left.runtime.canvasRenderer.bytes - right.runtime.canvasRenderer.bytes);
      invariant(candidates.length > 0,
        `no pure-linear sample for ${moduleCode}`);
      return candidates[0];
    });
  const fq01 = freeze.selectedPages.find((page) =>
    page.animationId === 'shared-alg001-l01-p055' &&
      page.adapterFamily === 'final-quiz-intro-source-static');
  invariant(fq01, 'final 326 freeze lacks the calibrated FQ01 representative');
  const ts03Ids = [
    'shared-alg001-l01-p048',
    'shared-alg001-l03-p048',
    'shared-nms002-l01-p039',
  ];
  const ts03 = ts03Ids.map((animationId) => freeze.selectedPages.find((page) =>
    page.animationId === animationId &&
      page.adapterFamily === 'ts03-l1-glossary-source-static'));
  invariant(ts03.every(Boolean),
    'final 326 freeze lacks the three TS03 behavior-shape samples');
  const ts02Ids = [
    'shared-alg001-l01-p047',
    'shared-alg001-l04-p044',
    'shared-alg001-l09-p032',
    'shared-alg001-l10-p043',
    'shared-dat001-l01-p047',
    'shared-nms002-l01-p038',
  ];
  const ts02 = ts02Ids.map((animationId) => freeze.selectedPages.find((page) =>
    page.animationId === animationId &&
      page.adapterFamily === 'ts02-l1-glossary-source-static'));
  invariant(ts02.every(Boolean),
    'final 326 freeze lacks the six TS02 behavior-shape samples');
  const ts04Ids = [
    'shared-alg001-l01-p049',
    'shared-alg001-l04-p046',
    'shared-alg001-l10-p045',
    'shared-dat001-l01-p049',
    'shared-geo001-l01-p052',
    'shared-nms002-l01-p040',
  ];
  const ts04 = ts04Ids.map((animationId) => freeze.selectedPages.find((page) =>
    page.animationId === animationId &&
      page.adapterFamily === 'ts04-l1-glossary-source-static'));
  invariant(ts04.every(Boolean),
    'final 326 freeze lacks the six TS04 behavior-shape samples');
  const ts05Ids = [
    'shared-alg001-l01-p050',
    'shared-alg001-l02-p052',
    'shared-alg001-l07-p056',
    'shared-dat001-l01-p050',
    'shared-geo001-l01-p053',
    'shared-nms002-l01-p041',
  ];
  const ts05 = ts05Ids.map((animationId) => freeze.selectedPages.find((page) =>
    page.animationId === animationId &&
      page.adapterFamily === 'ts05-l1-glossary-source-static'));
  invariant(ts05.every(Boolean),
    'final 326 freeze lacks the six TS05 behavior-shape samples');
  const ts07 = freeze.selectedPages.find((page) =>
    page.animationId === 'shared-nms002-l01-p043' &&
      page.adapterFamily === 'ts07-nms-l1-assessment-source-static');
  invariant(ts07,
    '326 freeze lacks the TS07 assessment representative product slice');
  const in02Ids = [
    'shared-alg001-l01-p021',
    'shared-alg001-l02-p023',
    'shared-alg001-l03-p016',
    'shared-alg001-l04-p016',
    'shared-alg001-l05-p027',
    'shared-alg001-l06-p030',
    'shared-alg001-l08-p017',
    'shared-alg001-l09-p014',
    'shared-alg001-l10-p017',
    'shared-alg001-l11-p012',
    'shared-alg001-l12-p016',
    'shared-dat001-l01-p018',
    'shared-nms002-l01-p012',
  ];
  const in02 = in02Ids.map((animationId) => {
    const page = freeze.selectedPages.find((candidate) =>
      candidate.animationId === animationId &&
      candidate.adapterFamily === 'in02-l1-glossary-source-static');
    const auditRecord = in02Audit.records.find((record) =>
      record.animationId === animationId);
    invariant(page && auditRecord &&
      auditRecord.behavior.buttons.length === page.glossaryEntries.length &&
      auditRecord.behavior.buttons.every((button) =>
        page.glossaryEntries.some((entry) =>
          entry.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
            button.sourceKeyAttribute.trim().toLocaleLowerCase('en-US'))),
    `${animationId} IN02 audit/freeze glossary cross-binding drifted`);
    return Object.freeze({...page,
      glossaryInspectionFrame: Math.max(...auditRecord.behavior.buttons.map(
        (button) => button.firstFrame)),
      glossarySourceButtons: Object.freeze(auditRecord.behavior.buttons.map(
        (button) => Object.freeze({...button}))),
    });
  });
  invariant(in02.every(Boolean),
    '326 freeze lacks the exact thirteen IN02 L1 glossary pages');
  const vb02Ids = [
    'shared-alg001-l01-p007',
    'shared-alg001-l02-p008',
    'shared-alg001-l03-p006',
    'shared-alg001-l04-p006',
    'shared-alg001-l05-p005',
    'shared-alg001-l06-p011',
    'shared-alg001-l10-p007',
    'shared-alg001-l11-p005',
    'shared-alg001-l12-p007',
    'shared-dat001-l01-p008',
    'shared-nms002-l01-p006',
  ];
  const vb02 = vb02Ids.map((animationId) => {
    const page = freeze.selectedPages.find((candidate) =>
      candidate.animationId === animationId &&
      candidate.adapterFamily === 'vb02-l1-glossary-source-static');
    const auditRecord = vb02Audit.records.find((record) =>
      record.animationId === animationId);
    invariant(page && auditRecord &&
      auditRecord.behavior.buttons.length === page.glossaryEntries.length &&
      auditRecord.behavior.buttons.every((button) =>
        page.glossaryEntries.some((entry) =>
          entry.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
            button.sourceKeyAttribute.trim().toLocaleLowerCase('en-US'))),
    `${animationId} VB02 audit/freeze glossary cross-binding drifted`);
    return Object.freeze({...page,
      glossaryInspectionFrame: Math.max(...auditRecord.behavior.buttons.map(
        (button) => button.firstFrame)),
      glossarySourceButtons: Object.freeze(auditRecord.behavior.buttons.map(
        (button) => Object.freeze({...button}))),
    });
  });
  invariant(vb02.every(Boolean),
    '326 freeze lacks the exact eleven VB02 L1 glossary pages');
  const vb03Ids = [
    'shared-alg001-l01-p008',
    'shared-alg001-l02-p009',
    'shared-alg001-l03-p007',
    'shared-alg001-l05-p006',
    'shared-alg001-l06-p012',
    'shared-alg001-l07-p008',
    'shared-alg001-l08-p008',
    'shared-alg001-l10-p008',
    'shared-alg001-l12-p008',
  ];
  const vb03 = vb03Ids.map((animationId) => {
    const page = freeze.selectedPages.find((candidate) =>
      candidate.animationId === animationId &&
      candidate.adapterFamily === 'vb03-l1-glossary-source-static');
    const auditRecord = vb03Audit.records.find((record) =>
      record.animationId === animationId);
    invariant(page && auditRecord &&
      auditRecord.behavior.buttons.every((button) =>
        page.glossaryEntries.some((entry) =>
          entry.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
            button.sourceKeyAttribute.trim().toLocaleLowerCase('en-US'))) &&
      page.glossaryEntries.every((entry) =>
        auditRecord.behavior.buttons.some((button) =>
          button.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
            entry.sourceKeyAttribute.trim().toLocaleLowerCase('en-US'))),
    `${animationId} VB03 audit/freeze glossary cross-binding drifted`);
    return Object.freeze({...page,
      glossaryInspectionFrame: Math.max(...auditRecord.behavior.buttons.map(
        (button) => button.firstFrame)),
      glossarySourceButtons: Object.freeze(auditRecord.behavior.buttons.map(
        (button) => Object.freeze({...button}))),
    });
  });
  invariant(vb03.every(Boolean),
    '326 freeze lacks the exact nine VB03 L1 glossary pages');
  const algL09SimpleGlossaryIds = [
    'shared-alg001-l09-p005',
    'shared-alg001-l09-p010',
    'shared-alg001-l09-p011',
    'shared-alg001-l09-p013',
    'shared-alg001-l09-p015',
    'shared-alg001-l09-p017',
    'shared-alg001-l09-p019',
    'shared-alg001-l09-p021',
    'shared-alg001-l09-p023',
  ];
  const algL09SimpleGlossary = algL09SimpleGlossaryIds.map((animationId) => {
    const page = freeze.selectedPages.find((candidate) =>
      candidate.animationId === animationId &&
      candidate.adapterFamily === 'alg-l09-simple-glossary-source-static');
    const auditRecord = algL09SimpleGlossaryAudit.records.find((record) =>
      record.animationId === animationId);
    invariant(page && auditRecord &&
      auditRecord.behavior.buttons.length === page.glossaryEntries.length &&
      auditRecord.behavior.buttons.every((button) =>
        page.glossaryEntries.some((entry) =>
          entry.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
            button.sourceKeyAttribute.trim().toLocaleLowerCase('en-US'))),
    `${animationId} ALG L9 audit/freeze glossary cross-binding drifted`);
    return Object.freeze({...page,
      glossaryInspectionFrame: Math.max(...auditRecord.behavior.buttons.map(
        (button) => button.firstFrame)),
      glossarySourceButtons: Object.freeze(auditRecord.behavior.buttons.map(
        (button) => Object.freeze({...button}))),
    });
  });
  invariant(algL09SimpleGlossary.every(Boolean),
    '326 freeze lacks the exact nine ALG L9 simple-glossary pages');
  const algL09TerminalStopIds = [
    'shared-alg001-l09-p003',
    'shared-alg001-l09-p006',
    'shared-alg001-l09-p007',
  ];
  const algL09TerminalStop = algL09TerminalStopIds.map((animationId) => {
    const page = freeze.selectedPages.find((candidate) =>
      candidate.animationId === animationId &&
      candidate.adapterFamily === 'alg-l09-terminal-stop-source-static');
    const auditRecord = algL09TerminalStopAudit.records.find((record) =>
      record.animationId === animationId);
    invariant(page && auditRecord &&
      auditRecord.behavior.mainTerminalStopPresent === true &&
      auditRecord.behavior.childTimelineScriptCount === 1 &&
      auditRecord.behavior.buttons.length === page.glossaryEntries.length &&
      auditRecord.behavior.buttons.every((button) =>
        page.glossaryEntries.some((entry) =>
          entry.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
            button.sourceKeyAttribute.trim().toLocaleLowerCase('en-US'))),
    `${animationId} ALG L9 terminal-stop audit/freeze cross-binding drifted`);
    return auditRecord.behavior.buttons.length > 0
      ? Object.freeze({...page,
        glossaryInspectionFrame: Math.max(...auditRecord.behavior.buttons.map(
          (button) => button.firstFrame)),
        glossarySourceButtons: Object.freeze(auditRecord.behavior.buttons.map(
          (button) => Object.freeze({...button}))),
      })
      : page;
  });
  invariant(algL09TerminalStop.every(Boolean),
    '326 freeze lacks the exact three ALG L9 terminal-stop pages');
  const algL09Vb03TerminalStop = (() => {
    const animationId = 'shared-alg001-l09-p009';
    const page = freeze.selectedPages.find((candidate) =>
      candidate.animationId === animationId &&
      candidate.adapterFamily ===
        'alg-l09-vb03-terminal-stop-source-static');
    const auditRecord = algL09Vb03TerminalStopAudit.records.find((record) =>
      record.animationId === animationId);
    invariant(page && auditRecord &&
      auditRecord.behavior.mainTerminalStopPresent === true &&
      auditRecord.behavior.childTimelineScriptCount === 1 &&
      auditRecord.behavior.buttons.length === 4 &&
      page.glossaryEntries.length === 4 &&
      auditRecord.behavior.buttons.every((button) =>
        page.glossaryEntries.some((entry) =>
          entry.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
            button.sourceKeyAttribute.trim().toLocaleLowerCase('en-US'))),
    `${animationId} ALG L9 VB03 audit/freeze cross-binding drifted`);
    return Object.freeze({...page,
      glossaryInspectionFrame: Math.max(...auditRecord.behavior.buttons.map(
        (button) => button.firstFrame)),
      glossarySourceButtons: Object.freeze(auditRecord.behavior.buttons.map(
        (button) => Object.freeze({...button}))),
    });
  })();
  const algL09IntroShellLinkage = (() => {
    const animationId = 'shared-alg001-l09-p001';
    const page = freeze.selectedPages.find((candidate) =>
      candidate.animationId === animationId &&
      candidate.adapterFamily ===
        'alg-l09-intro-shell-linkage-source-static');
    const auditRecord = algL09IntroShellLinkageAudit.records.find((record) =>
      record.animationId === animationId);
    invariant(page && auditRecord &&
      auditRecord.structure.mainFrameDomain === 'sprite-142' &&
      auditRecord.structure.mainFrameCount === 134 &&
      auditRecord.behavior.mainTimelineScriptCount === 0 &&
      auditRecord.behavior.shellLinkageReachability ===
        'exported-not-root-reachable' &&
      page.glossaryEntries.length === 0,
    `${animationId} ALG L9 intro shell-linkage audit/freeze drifted`);
    return page;
  })();
  const algL09Vb06Drag = (() => {
    const animationId = 'shared-alg001-l09-p012';
    const page = freeze.selectedPages.find((candidate) =>
      candidate.animationId === animationId &&
      candidate.adapterFamily === 'alg-l09-vb06-drag-source-static');
    const auditRecord = algL09Vb06DragAudit.records.find((record) =>
      record.animationId === animationId);
    invariant(page && auditRecord &&
      auditRecord.behavior.childTimelineScriptCount === 13 &&
      auditRecord.behavior.interaction.stopFrame === 129 &&
      auditRecord.behavior.interaction.resumeFrame === 130 &&
      auditRecord.behavior.interaction.completionThreshold === 4 &&
      auditRecord.behavior.interaction.drags.length === 4 &&
      auditRecord.behavior.buttons.length === 3 &&
      page.glossaryEntries.length === 3 &&
      auditRecord.behavior.buttons.every((button) =>
        page.glossaryEntries.some((entry) =>
          entry.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
            button.sourceKeyAttribute.trim().toLocaleLowerCase('en-US'))),
    `${animationId} ALG L9 VB06 drag audit/freeze drifted`);
    return Object.freeze({...page,
      glossaryInspectionFrame: 129,
      glossarySourceButtons: Object.freeze(auditRecord.behavior.buttons.map(
        (button) => Object.freeze({...button}))),
      dragAudit: Object.freeze({
        stopFrame: auditRecord.behavior.interaction.stopFrame,
        resumeFrame: auditRecord.behavior.interaction.resumeFrame,
        completionThreshold:
          auditRecord.behavior.interaction.completionThreshold,
      }),
    });
  })();
  const algL09Vb02Glossary = (() => {
    const animationId = 'shared-alg001-l09-p008';
    const page = freeze.selectedPages.find((candidate) =>
      candidate.animationId === animationId &&
      candidate.adapterFamily === 'alg-l09-vb02-glossary-source-static');
    const auditRecord = algL09Vb02GlossaryAudit.records.find((record) =>
      record.animationId === animationId);
    invariant(page && auditRecord &&
      auditRecord.behavior.mainTimelineScriptCount === 0 &&
      auditRecord.behavior.childTimelineScriptCount === 8 &&
      auditRecord.behavior.childAudioControlReachability ===
        'root-reachable-placed-at-frame-1-self-stopped-no-main-trigger' &&
      auditRecord.behavior.buttons.length === 3 &&
      page.glossaryEntries.length === 3 &&
      auditRecord.behavior.buttons.every((button) =>
        page.glossaryEntries.some((entry) =>
          entry.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
            button.sourceKeyAttribute.trim().toLocaleLowerCase('en-US'))),
    `${animationId} ALG L9 VB02 glossary audit/freeze drifted`);
    return Object.freeze({...page,
      glossaryInspectionFrame: 2,
      glossarySourceButtons: Object.freeze(auditRecord.behavior.buttons.map(
        (button) => Object.freeze({...button}))),
    });
  })();
  return Object.freeze([
    ...pureSamples, fq01, ...ts03, ...ts02, ...ts04, ...ts05, ts07, ...in02,
    ...vb02, ...vb03, ...algL09SimpleGlossary, ...algL09TerminalStop,
    algL09Vb03TerminalStop, algL09IntroShellLinkage, algL09Vb06Drag,
    algL09Vb02Glossary,
  ]);
}

async function screenshotBinding(stage, fileName) {
  const bytes = await readFile(path.join(stage, fileName));
  return Object.freeze({path: `${output}/${fileName}`, bytes: bytes.length,
    sha256: sha256(bytes)});
}

async function buildEvidence(inputs) {
  const freeze = inputs.values.freeze.value;
  const expectedLessons = lessonExpectations(inputs.values.catalog.value, freeze);
  const samples = sampleExpectations(freeze, inputs.values.in02Audit.value,
    inputs.values.vb02Audit.value, inputs.values.vb03Audit.value,
    inputs.values.algL09SimpleGlossaryAudit.value,
    inputs.values.algL09TerminalStopAudit.value,
    inputs.values.algL09Vb03TerminalStopAudit.value,
    inputs.values.algL09IntroShellLinkageAudit.value,
    inputs.values.algL09Vb06DragAudit.value,
    inputs.values.algL09Vb02GlossaryAudit.value);
  const outputAbsolute = projectPath(output);
  invariant(!await lstat(outputAbsolute).then(() => true, () => false),
    `${output} already exists`);
  const stage = `${outputAbsolute}.staging-${process.pid}`;
  await mkdir(stage, {recursive: false});
  invariant(inputs.snapshotBytes, 'browser QA build requires registry snapshots');
  await Promise.all([
    writeFile(path.join(stage, 'private-current-js-registry.snapshot.json'),
      inputs.snapshotBytes.privateRegistry, {flag: 'wx'}),
    writeFile(path.join(stage,
      'registry.local-only.metadata.generated.snapshot.ts'),
    inputs.snapshotBytes.localRegistry, {flag: 'wx'}),
  ]);
  const browser = await chromium.launch({headless: true});
  const browserIdentity = Object.freeze({name: 'Chromium',
    version: browser.version(), executable: inputs.descriptors.chromiumExecutable});
  const evidence = {
    schemaVersion: 1,
    artifactType: 'g678-current-js-326-browser-qa-v1',
    generatedAt: new Date().toISOString(),
    baseUrl: base,
    inputs: inputs.descriptors,
    browser: browserIdentity,
    frozenCalibrationPlacementCount: freeze.frozenCalibrationPlacementCount,
    registeredCurrentJsPages: freeze.selectedPages.length,
    allLessons: null,
    samples: [],
    screenshots: [],
    acceptanceEffects: Object.freeze({authoritativeOriginalRuntime: false,
      visualFidelityAccepted: false, audioAccepted: false,
      humanVisualAccepted: false, ownerAccepted: false,
      strictComplete: false, released: false, published: false}),
  };
  try {
    const allLessonsPage = await browser.newPage(
      {viewport: {width: 1440, height: 1100}});
    const allLessonsConsoleErrors = [];
    const allLessonsPageErrors = [];
    allLessonsPage.on('console', (message) => {
      if (message.type() === 'error') allLessonsConsoleErrors.push(message.text());
    });
    allLessonsPage.on('pageerror', (error) =>
      allLessonsPageErrors.push(String(error)));
    await allLessonsPage.goto(`${base}/en?screen=lessons`,
      {waitUntil: 'networkidle'});
    await allLessonsPage.getByRole('button', {name: 'G6–G8 shared'}).click();
    await allLessonsPage.waitForFunction(() =>
      document.querySelectorAll('[data-workspace-screen="lessons"] article')
        .length === 44);
    const lessonScreen = allLessonsPage.locator('[data-workspace-screen="lessons"]');
    const cards = lessonScreen.locator('article');
    const cardCopy = await cards.locator('[data-lesson-card-copy]').allTextContents();
    const statusCopy = await cards.locator('[data-lesson-card-status]').allTextContents();
    const browserLessons = cardCopy.map((copy, index) => {
      const identity = copy.match(
        /G6–G8 shared · (NMS002|GEO001|ALG001|DAT001) · L(\d+)/u);
      const progress = copy.match(/(\d+)\/(\d+) pages registered/u);
      invariant(identity && progress, `invalid shared lesson card: ${copy}`);
      const expected = expectedLessons[index];
      const observed = {moduleCode: identity[1], lessonNumber: Number(identity[2]),
        registeredPageCount: Number(progress[1]),
        activePageCount: Number(progress[2])};
      invariant(expected.moduleCode === observed.moduleCode &&
        expected.lessonNumber === observed.lessonNumber &&
        expected.registeredPageCount === observed.registeredPageCount &&
        expected.activePageCount === observed.activePageCount,
      `shared lesson browser vector drifted at ${expected.stableLessonKey}`);
      return Object.freeze({...expected});
    });
    invariant(browserLessons.length === 44 &&
      browserLessons.reduce((sum, lesson) =>
        sum + lesson.registeredPageCount, 0) === 326 &&
      statusCopy.every((copy) => copy.includes('Mapping pending')) &&
      await lessonScreen.locator('a').count() === 0 &&
      allLessonsConsoleErrors.length === 0 && allLessonsPageErrors.length === 0,
    'All Lessons browser contract drifted');
    const allLessonsFile = 'all-lessons-44-partial.png';
    await allLessonsPage.screenshot({path: path.join(stage, allLessonsFile),
      fullPage: true});
    evidence.allLessons = {sharedCardCount: browserLessons.length,
      linkedCardCount: 0, registeredPageSum: 326,
      exactLessonVector: browserLessons,
      consoleErrors: allLessonsConsoleErrors, pageErrors: allLessonsPageErrors};
    evidence.screenshots.push(await screenshotBinding(stage, allLessonsFile));
    await allLessonsPage.close();

    for (const sample of samples) {
      const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
      const consoleErrors = [];
      const pageErrors = [];
      const assetResponses = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(String(error)));
      page.on('response', (response) => {
        if (response.url().includes(
          `/flash-assets/g678-local/${sample.animationId}/canvas-renderer.js`)) {
          const headers = response.headers();
          assetResponses.push({url: response.url(), status: response.status(),
            cacheControl: headers['cache-control'] ?? null,
            contentType: headers['content-type'] ?? null,
            corp: headers['cross-origin-resource-policy'] ?? null,
            nosniff: headers['x-content-type-options'] ?? null});
        }
      });
      await page.goto(
        `${base}/en/migration-status/g678-calibration/${sample.animationId}`,
        {waitUntil: 'domcontentloaded'});
      await page.waitForFunction((animationId) =>
        document.querySelector(`canvas[data-course-canvas="${animationId}"]`)
          ?.getAttribute('data-render-state') === 'ready',
      sample.animationId, {timeout: 45_000});
      const stageElement = page.locator('.runtime-stage');
      const shell = page.locator('.runtime-shell');
      const initialFrame = Number(await stageElement.getAttribute('data-flash-frame'));
      await page.waitForFunction((previous) => Number(
        document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame'))
          > previous, initialFrame, {timeout: 5_000});
      const progressedFrame = Number(
        await stageElement.getAttribute('data-flash-frame'));
      const playbackCompleteAtProgress = await shell.getAttribute(
        'data-runtime-playback-complete');
      const expectedAssetUrl = `${base}/flash-assets/g678-local/` +
        `${sample.animationId}/canvas-renderer.js?sha256=` +
        sample.runtime.canvasRenderer.sha256;
      invariant(assetResponses.length === 1 &&
        assetResponses[0].url === expectedAssetUrl &&
        assetResponses[0].status === 200 &&
        assetResponses[0].corp === 'same-origin' &&
        assetResponses[0].nosniff === 'nosniff' &&
        assetResponses[0].cacheControl === 'private, no-store, max-age=0' &&
        assetResponses[0].contentType?.startsWith('text/javascript') &&
        consoleErrors.length === 0 && pageErrors.length === 0 &&
        playbackCompleteAtProgress === 'false',
      `${sample.animationId} browser/asset policy drifted`);
      let glossary = null;
      let assessment = null;
      let groupedDrag = null;
      const waitForEnabledButton = async (name, sourceCharacterId = null) => {
        const locator = sourceCharacterId === null
          ? page.getByRole('button', {name, exact: true})
          : page.locator(
            `button[data-source-character-id="${sourceCharacterId}"]`,
          );
        await locator.waitFor({state: 'visible'});
        await page.waitForFunction(({label, characterId}) => {
          const button = [...document.querySelectorAll('button')].find(
            (candidate) => characterId === null
              ? candidate.textContent?.trim() === label
              : candidate.getAttribute('data-source-character-id') ===
                String(characterId));
          return button instanceof HTMLButtonElement && !button.disabled;
        }, {label: name, characterId: sourceCharacterId}, {timeout: 10_000});
        return locator;
      };
      const isTs03 = sample.adapterFamily ===
        'ts03-l1-glossary-source-static';
      const isTs02 = sample.adapterFamily ===
        'ts02-l1-glossary-source-static';
      const isTs04 = sample.adapterFamily ===
        'ts04-l1-glossary-source-static';
      const isTs05 = sample.adapterFamily ===
        'ts05-l1-glossary-source-static';
      const isIn02 = sample.adapterFamily ===
        'in02-l1-glossary-source-static';
      const isVb02 = sample.adapterFamily ===
        'vb02-l1-glossary-source-static';
      const isVb03 = sample.adapterFamily ===
        'vb03-l1-glossary-source-static';
      const isAlgL09SimpleGlossary = sample.adapterFamily ===
        'alg-l09-simple-glossary-source-static';
      const isAlgL09TerminalStopGlossary = sample.adapterFamily ===
        'alg-l09-terminal-stop-source-static' &&
        Number.isSafeInteger(sample.glossaryInspectionFrame);
      const isAlgL09Vb03TerminalStopGlossary = sample.adapterFamily ===
        'alg-l09-vb03-terminal-stop-source-static' &&
        Number.isSafeInteger(sample.glossaryInspectionFrame);
      const isAlgL09Vb06Drag = sample.adapterFamily ===
        'alg-l09-vb06-drag-source-static' &&
        Number.isSafeInteger(sample.glossaryInspectionFrame);
      const isAlgL09Vb02Glossary = sample.adapterFamily ===
        'alg-l09-vb02-glossary-source-static' &&
        Number.isSafeInteger(sample.glossaryInspectionFrame);
      const isTs07 = sample.adapterFamily ===
        'ts07-nms-l1-assessment-source-static';
      if (isIn02 || isVb02 || isVb03 || isAlgL09SimpleGlossary ||
        isAlgL09TerminalStopGlossary ||
        isAlgL09Vb03TerminalStopGlossary || isAlgL09Vb06Drag ||
        isAlgL09Vb02Glossary) {
        const timeline = page.locator(
          'input[data-responsive-focus-key="timeline"]:visible').first();
        await timeline.waitFor({state: 'visible'});
        const currentInspectionFrame = Number(await timeline.inputValue());
        if (currentInspectionFrame === sample.glossaryInspectionFrame) {
          const lastFrame = Number(await timeline.getAttribute('max'));
          const adjacentFrame = sample.glossaryInspectionFrame < lastFrame
            ? sample.glossaryInspectionFrame + 1
            : sample.glossaryInspectionFrame - 1;
          invariant(adjacentFrame >= 1 && adjacentFrame !==
            sample.glossaryInspectionFrame,
          `${sample.animationId} has no adjacent inspection frame`);
          await timeline.fill(String(adjacentFrame));
          await page.waitForFunction((frame) =>
            document.querySelector('.runtime-stage')
              ?.getAttribute('data-flash-frame') === String(frame) &&
            document.querySelector('.runtime-shell')
              ?.getAttribute('data-runtime-paused') === 'true',
          adjacentFrame);
        }
        await timeline.fill(String(sample.glossaryInspectionFrame));
        await page.waitForFunction((frame) =>
          document.querySelector('.runtime-stage')
            ?.getAttribute('data-flash-frame') === String(frame) &&
          document.querySelector('.runtime-shell')
            ?.getAttribute('data-runtime-paused') === 'true',
        sample.glossaryInspectionFrame);
      }
      if (isTs03 || isTs02 || isTs04 || isTs05 || isIn02 || isVb02 ||
        isVb03 || isAlgL09SimpleGlossary ||
        isAlgL09TerminalStopGlossary ||
        isAlgL09Vb03TerminalStopGlossary || isAlgL09Vb06Drag ||
        isAlgL09Vb02Glossary) {
        const verifyTerm = async ({button, entryId, definition,
          sourceCharacterId = null}) => {
          const trigger = await waitForEnabledButton(button, sourceCharacterId);
          await trigger.click();
          const overlay = page.locator(
            `[data-glossary-entry-id="${entryId}"]`,
          );
          await overlay.waitFor({state: 'visible'});
          invariant((await overlay.textContent()).includes(definition) &&
            await shell.getAttribute('data-runtime-paused') === 'true',
          `${sample.animationId} ${entryId} glossary overlay drifted`);
          await overlay.getByRole('button', {name: 'Close and continue'}).click();
          invariant(await shell.getAttribute('data-runtime-paused') === 'false',
            `${sample.animationId} glossary close did not resume`);
          return Object.freeze({button, entryId, definition,
            sourceCharacterId});
        };
        const englishDefinitions = isVb03
          ? sample.glossarySourceButtons.map((sourceButton) => {
            const entry = sample.glossaryEntries.find((candidate) =>
              candidate.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
                sourceButton.sourceKeyAttribute.trim()
                  .toLocaleLowerCase('en-US'));
            invariant(entry,
              `${sample.animationId} lacks ${sourceButton.characterId} glossary binding`);
            return {button: entry.labels.en, entryId: entry.id,
              definition: entry.definitions.en,
              sourceCharacterId: sourceButton.characterId};
          })
          : isIn02 || isVb02 || isAlgL09SimpleGlossary ||
            isAlgL09TerminalStopGlossary ||
            isAlgL09Vb03TerminalStopGlossary || isAlgL09Vb06Drag ||
            isAlgL09Vb02Glossary
          ? sample.glossaryEntries.map((entry) => {
            const sourceButton = sample.glossarySourceButtons.find((button) =>
              button.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
                entry.sourceKeyAttribute.trim().toLocaleLowerCase('en-US'));
            invariant(sourceButton,
              `${sample.animationId} lacks ${entry.id} source button binding`);
            return {button: entry.labels.en, entryId: entry.id,
              definition: entry.definitions.en,
              sourceCharacterId: sourceButton.characterId};
          })
          : isTs02 ? [
          {button: 'Restate', entryId: 'restate',
            definition: 'To repeat again; to say again'},
          {button: 'Question', entryId: 'question',
            definition:
              'A problem to solve. For example: Find the mean of this set of numbers {1, 2, 5, 10}'},
          {button: 'Problem', entryId: 'problem',
            definition:
              'A question to solve or answer. For example: Evaluate the equation y = 2x + 3'},
        ] : isTs03 ? [
          {button: 'Organize', entryId: 'organize',
            definition:
              'To organize means to put into order; to arrange in a desired pattern.'},
          {button: 'Information', entryId: 'information',
            definition:
              'A collection of facts or data. For example: José is 15 years old. José has a cell phone.'},
        ] : isTs05 ? [
          {button: 'Strategies', entryId: 'strategies',
            definition: 'A plan of action. For example: Juanita plans to use a calculator'},
          {button: 'Equation', entryId: 'equation',
            definition:
              'A mathematical sentence where both sides of the equal sign (=) have the same value'},
          {button: 'Pattern', entryId: 'pattern',
            definition: 'A repeated set or sequence of numbers, shapes or designs'},
          {button: 'Table', entryId: 'table',
            definition: 'A diagram, graph or table showing information in an ordered way.'},
          {button: 'Simple / Simpler / Simplest',
            entryId: 'simple-simpler-simplest',
            definition: 'To put something in its easiest form to understand.'},
          ...(sample.glossaryEntries.some((entry) => entry.id === 'show') ? [{
            button: 'Show', entryId: 'show',
            definition: 'To show means to be visible or to be displayed or seen.',
          }] : []),
        ] : [
          {button: 'Solve', entryId: 'solve',
            definition:
              'To solve the problem is another way of finding the answer.'},
          {button: 'Problem', entryId: 'problem',
            definition:
              'A question to solve or answer. For example: Evaluate the equation y = 2x + 3'},
          {button: 'Strategies', entryId: 'strategies',
            definition: 'A plan of action. For example: Juanita plans to use a calculator'},
          ...(sample.animationId === 'shared-alg001-l01-p049' ? [{
            button: 'Data Tables', entryId: 'data-tables',
            definition:
              'Data tables are organized by columns and rows created to easily view information.',
          }] : []),
          {button: 'Equation', entryId: 'equation',
            definition:
              'A mathematical sentence where both sides of the equal sign (=) have the same value'},
          {button: 'Pattern', entryId: 'pattern',
            definition: 'A repeated set or sequence of numbers, shapes or designs'},
          {button: 'Table', entryId: 'table',
            definition: 'A diagram, graph or table showing information in an ordered way.'},
          {button: 'Simple / Simpler / Simplest',
            entryId: 'simple-simpler-simplest',
            definition: 'To put something in its easiest form to understand.'},
        ];
        const englishTerms = [];
        for (const definition of englishDefinitions) {
          englishTerms.push(await verifyTerm(definition));
        }
        let spanishTerms = null;
        const spanishSample = isIn02 || isVb02 || isVb03 ||
          isAlgL09SimpleGlossary || isAlgL09TerminalStopGlossary ||
          isAlgL09Vb03TerminalStopGlossary || isAlgL09Vb06Drag ||
          isAlgL09Vb02Glossary ||
          sample.animationId === 'shared-alg001-l03-p048' ||
          sample.animationId === 'shared-alg001-l10-p043' ||
          sample.animationId === 'shared-alg001-l01-p049' ||
          sample.animationId === 'shared-alg001-l01-p050';
        if (spanishSample) {
          const spanish = await browser.newPage(
            {viewport: {width: 1440, height: 1000}});
          const spanishErrors = [];
          spanish.on('console', (message) => {
            if (message.type() === 'error') spanishErrors.push(message.text());
          });
          await spanish.goto(
            `${base}/es/migration-status/g678-calibration/${sample.animationId}`,
            {waitUntil: 'domcontentloaded'});
          await spanish.waitForFunction((animationId) =>
            document.querySelector(`canvas[data-course-canvas="${animationId}"]`)
              ?.getAttribute('data-render-state') === 'ready',
          sample.animationId, {timeout: 45_000});
          const spanishShell = spanish.locator('.runtime-shell');
          if (isIn02 || isVb02 || isVb03 || isAlgL09SimpleGlossary ||
            isAlgL09TerminalStopGlossary ||
            isAlgL09Vb03TerminalStopGlossary || isAlgL09Vb06Drag ||
            isAlgL09Vb02Glossary) {
            const spanishPauseControl = spanish.locator(
              'button[data-responsive-focus-key="pause"]:visible').first();
            await spanishPauseControl.waitFor({state: 'visible'});
            if (await spanishShell.getAttribute('data-runtime-paused') !==
              'true') {
              invariant(await spanishPauseControl.getAttribute(
                'data-playback-action') === 'pause',
              `${sample.animationId} Spanish calibration cannot pause playback`);
              await spanishPauseControl.click();
              await spanish.waitForFunction(() =>
                document.querySelector('.runtime-shell')
                  ?.getAttribute('data-runtime-paused') === 'true');
            }
            const spanishTimeline = spanish.locator(
              'input[data-responsive-focus-key="timeline"]:visible').first();
            await spanishTimeline.waitFor({state: 'visible'});
            const currentInspectionFrame = Number(
              await spanishTimeline.inputValue());
            if (currentInspectionFrame === sample.glossaryInspectionFrame) {
              const lastFrame = Number(
                await spanishTimeline.getAttribute('max'));
              const adjacentFrame = sample.glossaryInspectionFrame < lastFrame
                ? sample.glossaryInspectionFrame + 1
                : sample.glossaryInspectionFrame - 1;
              invariant(adjacentFrame >= 1 && adjacentFrame !==
                sample.glossaryInspectionFrame,
              `${sample.animationId} has no adjacent Spanish inspection frame`);
              await spanishTimeline.fill(String(adjacentFrame));
              await spanish.waitForFunction((frame) =>
                document.querySelector('.runtime-stage')
                  ?.getAttribute('data-flash-frame') === String(frame) &&
                document.querySelector('.runtime-shell')
                  ?.getAttribute('data-runtime-paused') === 'true',
              adjacentFrame);
            }
            await spanishTimeline.fill(String(sample.glossaryInspectionFrame));
            await spanish.waitForFunction((frame) =>
              document.querySelector('.runtime-stage')
                ?.getAttribute('data-flash-frame') === String(frame) &&
              document.querySelector('.runtime-shell')
                ?.getAttribute('data-runtime-paused') === 'true',
            sample.glossaryInspectionFrame);
          }
          const verifySpanishTerm = async ({button, entryId, definition,
            sourceCharacterId = null}) => {
            const trigger = sourceCharacterId === null
              ? spanish.getByRole('button', {name: button, exact: true})
              : spanish.locator(
                `button[data-source-character-id="${sourceCharacterId}"]`,
              );
            await trigger.waitFor({state: 'visible'});
            await spanish.waitForFunction(({label, characterId}) => {
              const element = [...document.querySelectorAll('button')].find(
                (candidate) => characterId === null
                  ? candidate.textContent?.trim() === label
                  : candidate.getAttribute('data-source-character-id') ===
                    String(characterId));
              return element instanceof HTMLButtonElement && !element.disabled;
            }, {label: button, characterId: sourceCharacterId},
            {timeout: 10_000});
            await trigger.click();
            const overlay = spanish.locator(
              `[data-glossary-entry-id="${entryId}"]`,
            );
            await overlay.waitFor({state: 'visible'});
            invariant((await overlay.textContent()).includes(definition) &&
              await spanishShell.getAttribute('data-runtime-paused') === 'true',
            `${sample.animationId} Spanish ${entryId} glossary drifted`);
            await overlay.getByRole('button',
              {name: 'Cerrar y continuar'}).click();
            invariant(await spanishShell.getAttribute('data-runtime-paused') ===
              'false', `${sample.animationId} Spanish glossary did not resume`);
            return Object.freeze({button, entryId, definition,
              sourceCharacterId});
          };
          const spanishDefinitions = isVb03
            ? sample.glossarySourceButtons.map((sourceButton) => {
              const entry = sample.glossaryEntries.find((candidate) =>
                candidate.sourceKeyAttribute.trim()
                  .toLocaleLowerCase('en-US') ===
                  sourceButton.sourceKeyAttribute.trim()
                    .toLocaleLowerCase('en-US'));
              invariant(entry,
                `${sample.animationId} lacks ${sourceButton.characterId} Spanish glossary binding`);
              return {button: entry.labels.es, entryId: entry.id,
                definition: entry.definitions.es,
                sourceCharacterId: sourceButton.characterId};
            })
            : isIn02 || isVb02 || isAlgL09SimpleGlossary ||
              isAlgL09TerminalStopGlossary ||
              isAlgL09Vb03TerminalStopGlossary || isAlgL09Vb06Drag ||
              isAlgL09Vb02Glossary
            ? sample.glossaryEntries.map((entry) => {
              const sourceButton = sample.glossarySourceButtons.find((button) =>
                button.sourceKeyAttribute.trim().toLocaleLowerCase('en-US') ===
                  entry.sourceKeyAttribute.trim().toLocaleLowerCase('en-US'));
              invariant(sourceButton,
                `${sample.animationId} lacks ${entry.id} source button binding`);
              return {button: entry.labels.es, entryId: entry.id,
                definition: entry.definitions.es,
                sourceCharacterId: sourceButton.characterId};
            })
            : isTs02 ? [
            {button: 'Replantear', entryId: 'restate',
              definition: 'Volver a repetir; decir de nuevo.'},
            {button: 'Pregunta', entryId: 'question',
              definition:
                'Un problema para resolver. Por ejemplo: Encontrar el promedio de este conjunto de números: {1,2,5,10}'},
            {button: 'Problema', entryId: 'problem',
              definition:
                'Una pregunta para resolver o contestar. Por ejemplo: Evalúe la ecuación y = 2x + 3'},
          ] : isTs03 ? [
            {button: 'Organizar', entryId: 'organize',
              definition:
                'Organizar significa poner en orden, ordenar de acuerdo a un patrón deseado.'},
            {button: 'Información', entryId: 'information',
              definition:
                'Colección de datos o hechos. Por ejemplo: José tiene 15 años. José tiene un teléfono celular.'},
          ] : isTs05 ? [
            {button: 'Estrategias', entryId: 'strategies',
              definition: 'Un plan de acción. Por ejemplo: Juanita planea usar la calculadora'},
            {button: 'Ecuación', entryId: 'equation',
              definition: 'Enunciado de una igualdad en la cual ambos lados del signo igual'},
            {button: 'Patrón', entryId: 'pattern',
              definition: 'Una secuencia o conjunto de números que se repiten'},
            {button: 'Cuadro', entryId: 'table',
              definition: 'Un diagrama, gráfica o tabla que presenta información'},
            {button: 'Simple / Más Simple / El Más simple',
              entryId: 'simple-simpler-simplest',
              definition: 'Es poner algo en su forma más fácil de entender.'},
            {button: 'Mostrar', entryId: 'show',
              definition: 'Mostrar significa enseñar o ser visto.'},
          ] : [
            {button: 'Resolver', entryId: 'solve',
              definition:
                'Resolver el problema es otra manera de encontrar la respuesta.'},
            {button: 'Problema', entryId: 'problem',
              definition:
                'Una pregunta para resolver o contestar. Por ejemplo: Evalúe la ecuación y = 2x + 3'},
            {button: 'Estrategias', entryId: 'strategies',
              definition: 'Un plan de acción. Por ejemplo: Juanita planea usar la calculadora'},
            {button: 'Tablas de datos', entryId: 'data-tables',
              definition:
                'Las tablas de datos están organizadas en columnas y filas'},
            {button: 'Ecuación', entryId: 'equation',
              definition: 'Enunciado de una igualdad en la cual ambos lados del signo igual'},
            {button: 'Patrón', entryId: 'pattern',
              definition: 'Una secuencia o conjunto de números que se repiten'},
            {button: 'Cuadro', entryId: 'table',
              definition: 'Un diagrama, gráfica o tabla que presenta información'},
            {button: 'Simple / Más Simple / El Más simple',
              entryId: 'simple-simpler-simplest',
              definition: 'Es poner algo en su forma más fácil de entender.'},
          ];
          spanishTerms = [];
          for (const definition of spanishDefinitions) {
            spanishTerms.push(await verifySpanishTerm(definition));
          }
          invariant(spanishErrors.length === 0,
            `${sample.animationId} Spanish console errors`);
          await spanish.close();
        }
        glossary = {englishTerms, spanishTerms,
          pausedWhileOpen: true, resumedAfterClose: true};
      }
      if (isAlgL09Vb06Drag) {
        const dragTimeline = page.locator(
          'input[data-responsive-focus-key="timeline"]:visible').first();
        await dragTimeline.waitFor({state: 'visible'});
        if (Number(await dragTimeline.inputValue()) !== 129) {
          await dragTimeline.fill('129');
        }
        await page.waitForFunction(() =>
          document.querySelector('.runtime-stage')
            ?.getAttribute('data-flash-frame') === '129');
        if (await shell.getAttribute('data-runtime-paused') === 'true') {
          await page.getByRole('button',
            {name: 'Continue from inspected frame'}).click();
        }
        await page.waitForFunction(() =>
          document.querySelector(
            '[data-advanced-manual-kind="four-source-grouped-drag-drop"]') &&
          document.querySelector('.runtime-shell')
            ?.getAttribute('data-runtime-interactive-stop-held') === 'true' &&
          document.querySelector('[data-quiz-drag-count="0"]'));

        const activateDrop = async (sourceId, targetId) => {
          await page.locator(`button[data-source-id="${sourceId}"]`).click();
          await page.locator(`button[data-target-id="${targetId}"]`).click();
        };
        await activateDrop('drag-1', 'drop-1');
        const wrong = page.locator(
          '[role="alert"][data-feedback-kind="proportional"]');
        await wrong.waitFor({state: 'visible'});
        const wrongText = await wrong.textContent();
        invariant(wrongText.includes(
          'Two quantities have a proportional relationship when every ratio of pairs of values is equal.') &&
          await page.locator('[data-quiz-drag-count="0"]').count() === 1,
        `${sample.animationId} wrong grouped-drag feedback drifted`);
        await wrong.getByRole('button', {name: 'Try again'}).click();

        const correctSequence = [
          ['drag-1', 'drop-3'],
          ['drag-3', 'drop-4'],
          ['drag-2', 'drop-1'],
          ['drag-4', 'drop-2'],
        ];
        for (let index = 0; index < correctSequence.length; index += 1) {
          await activateDrop(...correctSequence[index]);
          await page.waitForFunction((count) =>
            document.querySelector(
              `[data-quiz-drag-count="${count}"]`), index + 1);
        }
        await page.waitForFunction(() => Number(
          document.querySelector('.runtime-shell')?.getAttribute(
            'data-runtime-interactive-stop-resolved-count')) === 1 && Number(
          document.querySelector('.runtime-stage')?.getAttribute(
            'data-flash-frame')) >= 130, null, {timeout: 6_000});
        const resumedFrame = Number(await stageElement.getAttribute(
          'data-flash-frame'));
        invariant(await shell.getAttribute('data-runtime-playback-complete') ===
          'false', `${sample.animationId} completed at grouped-drag resume`);

        const runtimeBeforeReplay = await shell.elementHandle();
        invariant(runtimeBeforeReplay,
          `${sample.animationId} runtime missing before grouped-drag Replay`);
        await page.locator(
          'button[data-responsive-focus-key="replay"]:visible').click();
        await page.waitForFunction((prior) => !prior.isConnected,
          runtimeBeforeReplay);
        await page.waitForFunction((animationId) =>
          document.querySelector(`canvas[data-course-canvas="${animationId}"]`)
            ?.getAttribute('data-render-state') === 'ready',
        sample.animationId, {timeout: 45_000});
        const replayTimeline = page.locator(
          'input[data-responsive-focus-key="timeline"]:visible').first();
        await replayTimeline.fill('129');
        await page.getByRole('button',
          {name: 'Continue from inspected frame'}).click();
        await page.waitForFunction(() =>
          document.querySelector('[data-quiz-drag-count="0"]') &&
          document.querySelector('.runtime-shell')
            ?.getAttribute('data-runtime-interactive-stop-held') === 'true');
        groupedDrag = Object.freeze({
          sourceStopFrame: 129,
          wrong: Object.freeze({sourceId: 'drag-1', targetId: 'drop-1',
            feedbackKind: 'proportional', resetCount: 0}),
          correctSequence: Object.freeze(correctSequence.map((pair) =>
            Object.freeze([...pair]))),
          completionCount: 4,
          resolvedStopCount: 1,
          resumedFrame,
          replay: Object.freeze({runtimeRemounted: true,
            resetCount: 0, returnedToHeldStop: true}),
          feedbackAudioAccepted: false,
          externalNarrationAudioAccepted: false,
        });
      }
      if (isTs07) {
        const timeline = page.locator(
          'input[data-responsive-focus-key="timeline"]:visible').first();
        await timeline.waitFor({state: 'visible'});
        await timeline.fill('757');
        await page.waitForFunction(() =>
          document.querySelector('.runtime-stage')
            ?.getAttribute('data-flash-frame') === '757' &&
          document.querySelector('.runtime-shell')
            ?.getAttribute('data-runtime-paused') === 'true');
        await page.getByRole('button',
          {name: 'Continue from inspected frame'}).click();
        await page.waitForFunction(() =>
          document.querySelector('[data-answer-controls-ready="true"]') &&
          document.querySelector('.runtime-shell')
            ?.getAttribute('data-runtime-interactive-stop-held') === 'true');
        const assessmentSurface = page.locator(
          '[data-page-interaction-companion-surface$="-assessment"]');
        invariant(await assessmentSurface.getAttribute(
          'data-source-quiz-stop-frame') === '757' &&
          await page.locator('[data-source-quiz-visual-frame]')
            .getAttribute('data-source-quiz-visual-frame') === '758',
        `${sample.animationId} quiz stop/visual proxy drifted`);

        await waitForEnabledButton('Difference');
        await page.getByRole('button', {name: 'Difference', exact: true}).click();
        const overlay = page.locator('[data-glossary-entry-id="difference"]');
        await overlay.waitFor({state: 'visible'});
        const differenceDefinition =
          'The answer to a subtraction problem. For example: 5 – 3 = 2; 2 is the difference.';
        invariant((await overlay.textContent()).includes(differenceDefinition) &&
          await shell.getAttribute('data-runtime-paused') === 'true',
        `${sample.animationId} assessment glossary drifted`);
        await overlay.getByRole('button', {name: 'Close and continue'}).click();
        await page.waitForFunction(() =>
          document.querySelector('.runtime-shell')
            ?.getAttribute('data-runtime-paused') === 'false');

        await waitForEnabledButton('Need More Help');
        await page.getByRole('button', {name: 'Need More Help', exact: true})
          .click();
        const hint = page.getByRole('complementary', {name: 'Need More Help'});
        await hint.waitFor({state: 'visible'});
        const hintText = await hint.textContent();
        invariant(hintText.includes('Difference means to subtract.') &&
          hintText.includes('10,000 – 3,500'),
        `${sample.animationId} maintained hint drifted`);
        await hint.getByRole('button', {name: 'Close help'}).click();

        await waitForEnabledButton('36°');
        await page.getByRole('button', {name: '36°', exact: true}).click();
        const firstWrong = page.getByRole('alert').filter({hasText: 'OH! NO'});
        await firstWrong.waitFor({state: 'visible'});
        await page.waitForFunction(() =>
          document.querySelector('[data-practice-phase="selecting"]') &&
          document.querySelector('[data-answer-controls-ready="true"]'),
        null, {timeout: 6_000});
        invariant(await shell.getAttribute(
          'data-runtime-interactive-stop-held') === 'true',
        `${sample.animationId} first wrong did not return to held selection`);

        await page.getByRole('button', {name: '38°', exact: true}).click();
        const right = page.getByRole('alert').filter({hasText: 'Excellent!'});
        await right.waitFor({state: 'visible'});
        await page.waitForFunction(() => Number(
          document.querySelector('.runtime-shell')?.getAttribute(
            'data-runtime-interactive-stop-resolved-count')) === 1 && Number(
          document.querySelector('.runtime-stage')?.getAttribute(
            'data-flash-frame')) > 757, null, {timeout: 6_000});
        const resolvedFrame = Number(await stageElement.getAttribute(
          'data-flash-frame'));

        const runtimeBeforeReplay = await page.locator('.runtime-shell')
          .elementHandle();
        invariant(runtimeBeforeReplay,
          `${sample.animationId} runtime missing before Replay`);
        await page.locator(
          'button[data-responsive-focus-key="replay"]:visible').click();
        await page.waitForFunction((prior) => !prior.isConnected,
          runtimeBeforeReplay);
        await page.waitForFunction((animationId) =>
          document.querySelector(`canvas[data-course-canvas="${animationId}"]`)
            ?.getAttribute('data-render-state') === 'ready',
        sample.animationId, {timeout: 45_000});
        await timeline.fill('757');
        await page.getByRole('button',
          {name: 'Continue from inspected frame'}).waitFor({state: 'visible'});
        await page.getByRole('button',
          {name: 'Continue from inspected frame'}).click();
        await page.waitForFunction(() =>
          document.querySelector('[data-practice-phase="selecting"]') &&
          document.querySelector('[data-answer-controls-ready="true"]') &&
          document.querySelector('.runtime-shell')
            ?.getAttribute('data-runtime-interactive-stop-held') === 'true');

        const spanish = await browser.newPage(
          {viewport: {width: 1440, height: 1000}});
        const spanishErrors = [];
        spanish.on('console', (message) => {
          if (message.type() === 'error') spanishErrors.push(message.text());
        });
        await spanish.goto(
          `${base}/es/migration-status/g678-calibration/${sample.animationId}`,
          {waitUntil: 'domcontentloaded'});
        await spanish.waitForFunction((animationId) =>
          document.querySelector(`canvas[data-course-canvas="${animationId}"]`)
            ?.getAttribute('data-render-state') === 'ready',
        sample.animationId, {timeout: 45_000});
        await spanish.waitForFunction(() => {
          const button = [...document.querySelectorAll('button')].find(
            (candidate) => candidate.textContent?.trim() === 'Diferencia');
          return button instanceof HTMLButtonElement && !button.disabled;
        });
        invariant((await spanish.locator(
          '[data-spanish-text-parity-accepted="false"]').textContent())
          .includes('la paridad textual en español sigue pendiente'),
        `${sample.animationId} Spanish source-language disclosure drifted`);
        await spanish.getByRole('button', {name: 'Diferencia', exact: true})
          .click();
        const spanishOverlay = spanish.locator(
          '[data-glossary-entry-id="difference"]');
        await spanishOverlay.waitFor({state: 'visible'});
        invariant((await spanishOverlay.textContent()).includes(
          'Es lo que obtenemos en una resta o problema de substracción') &&
          spanishErrors.length === 0,
        `${sample.animationId} Spanish glossary/disclosure drifted`);
        await spanish.close();

        assessment = Object.freeze({sourceStopFrame: 757,
          sourceQuizVisualProxyFrame: 758,
          glossary: Object.freeze({entryId: 'difference',
            definition: differenceDefinition,
            pausedWhileOpen: true, resumedAfterClose: true}),
          hint: Object.freeze({title: 'Need More Help',
            lines: ['Difference means to subtract.',
              'Example: 10,000 – 3,500 means the difference between 10,000 and 3,500.']}),
          firstWrong: Object.freeze({answer: '36°', feedback: 'OH! NO',
            returnedToSelection: true}),
          right: Object.freeze({answer: '38°', feedback: 'Excellent!',
            resolvedStopCount: 1, resumedFrame: resolvedFrame}),
          replay: Object.freeze({runtimeRemounted: true,
            resetToSelectingAtHeldStop: true}),
          spanish: Object.freeze({glossaryEntryId: 'difference',
            sourceEnglishDisclosure: true,
            textParityAccepted: false}),
          feedbackAudioAccepted: false});
      }
      const pauseControl = page.locator(
        'button[data-responsive-focus-key="pause"]:visible').first();
      await pauseControl.waitFor({state: 'visible'});
      for (let attempt = 0; attempt < 3 &&
        await shell.getAttribute('data-runtime-paused') !== 'true';
        attempt += 1) {
        invariant(await pauseControl.getAttribute('data-playback-action') ===
          'pause', `${sample.animationId} final capture cannot pause playback`);
        await pauseControl.click();
        await page.waitForFunction(() =>
          document.querySelector('.runtime-shell')
            ?.getAttribute('data-runtime-paused') === 'true',
        null, {timeout: 3_000}).catch(() => false);
      }
      invariant(await shell.getAttribute('data-runtime-paused') === 'true',
        `${sample.animationId} final capture did not remain paused`);
      await page.waitForFunction((animationId) =>
        document.querySelector(`canvas[data-course-canvas="${animationId}"]`)
          ?.getAttribute('data-render-state') === 'ready',
      sample.animationId, {timeout: 10_000});
      evidence.samples.push({animationId: sample.animationId,
        moduleCode: sample.moduleCode, stableLessonKey: sample.stableLessonKey,
        frameDomain: sample.runtime.frameDomain,
        frameCount: sample.runtime.frameCount,
        runtimeSha256: sample.runtime.canvasRenderer.sha256,
        initialFrame, progressedFrame,
        glossaryInspectionFrame: sample.glossaryInspectionFrame ?? null,
        canvasState: await page.locator(
          `canvas[data-course-canvas="${sample.animationId}"]`)
          .getAttribute('data-render-state'),
        playbackComplete: playbackCompleteAtProgress,
        assetResponses, consoleErrors, pageErrors,
        glossary, assessment, groupedDrag});
      const screenshotFile = `${sample.animationId}.png`;
      await page.screenshot({path: path.join(stage, screenshotFile),
        fullPage: true});
      evidence.screenshots.push(await screenshotBinding(stage, screenshotFile));
      await page.close();
    }
    await writeFile(path.join(stage, 'evidence.json'),
      `${JSON.stringify(evidence, null, 2)}\n`, {flag: 'wx'});
    await rename(stage, outputAbsolute);
    return evidence;
  } catch (error) {
    await rename(stage, `${stage}.failed-${Date.now()}`).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}

async function checkEvidence(inputs) {
  const evidence = (await binding(`${output}/evidence.json`, true)).value;
  invariant(JSON.stringify(evidence.inputs) ===
    JSON.stringify(inputs.descriptors), 'browser QA input bindings drifted');
  const browser = await chromium.launch({headless: true});
  const version = browser.version();
  await browser.close();
  invariant(evidence.browser.version === version &&
    JSON.stringify(evidence.browser.executable) ===
      JSON.stringify(inputs.descriptors.chromiumExecutable),
  'browser QA Chromium identity drifted');
  const expectedLessons = lessonExpectations(inputs.values.catalog.value,
    inputs.values.freeze.value);
  const expectedSamples = sampleExpectations(inputs.values.freeze.value,
    inputs.values.in02Audit.value, inputs.values.vb02Audit.value,
    inputs.values.vb03Audit.value,
    inputs.values.algL09SimpleGlossaryAudit.value,
    inputs.values.algL09TerminalStopAudit.value,
    inputs.values.algL09Vb03TerminalStopAudit.value,
    inputs.values.algL09IntroShellLinkageAudit.value,
    inputs.values.algL09Vb06DragAudit.value,
    inputs.values.algL09Vb02GlossaryAudit.value);
  const expectedScreenshotPaths = [
    `${output}/all-lessons-44-partial.png`,
    ...expectedSamples.map((sample) => `${output}/${sample.animationId}.png`),
  ];
  invariant(evidence.baseUrl === base,
    'browser QA loopback origin drifted');
  invariant(evidence.registeredCurrentJsPages === 326 &&
    evidence.allLessons.sharedCardCount === 44 &&
    evidence.allLessons.linkedCardCount === 0 &&
    evidence.allLessons.registeredPageSum === 326 &&
    JSON.stringify(evidence.allLessons.exactLessonVector) ===
      JSON.stringify(expectedLessons) &&
    evidence.allLessons.consoleErrors.length === 0 &&
    evidence.allLessons.pageErrors.length === 0,
  'browser QA exact 44-lesson vector drifted');
  invariant(evidence.samples.length === 76 &&
    expectedSamples.length === 76,
  'browser QA exact sample denominator drifted');
  invariant(JSON.stringify(evidence.screenshots.map((item) => item.path)) ===
    JSON.stringify(expectedScreenshotPaths),
  'browser QA exact screenshot path set drifted');
  invariant(evidence.baseUrl === base &&
    evidence.registeredCurrentJsPages === 326 &&
    evidence.allLessons.sharedCardCount === 44 &&
    evidence.allLessons.linkedCardCount === 0 &&
    evidence.allLessons.registeredPageSum === 326 &&
    JSON.stringify(evidence.allLessons.exactLessonVector) ===
      JSON.stringify(expectedLessons) &&
    evidence.allLessons.consoleErrors.length === 0 &&
    evidence.allLessons.pageErrors.length === 0 &&
    evidence.samples.length === 76 &&
    evidence.samples.every((sample, index) => {
      const expected = expectedSamples[index];
      const expectedAssetUrl = `${base}/flash-assets/g678-local/` +
        `${expected.animationId}/canvas-renderer.js?sha256=` +
        expected.runtime.canvasRenderer.sha256;
      const response = sample.assetResponses[0];
      const isTs03 = expected.adapterFamily ===
        'ts03-l1-glossary-source-static';
      const isTs02 = expected.adapterFamily ===
        'ts02-l1-glossary-source-static';
      const isTs04 = expected.adapterFamily ===
        'ts04-l1-glossary-source-static';
      const isTs05 = expected.adapterFamily ===
        'ts05-l1-glossary-source-static';
      const isIn02 = expected.adapterFamily ===
        'in02-l1-glossary-source-static';
      const isVb02 = expected.adapterFamily ===
        'vb02-l1-glossary-source-static';
      const isVb03 = expected.adapterFamily ===
        'vb03-l1-glossary-source-static';
      const isAlgL09SimpleGlossary = expected.adapterFamily ===
        'alg-l09-simple-glossary-source-static';
      const isAlgL09TerminalStopGlossary = expected.adapterFamily ===
        'alg-l09-terminal-stop-source-static' &&
        Number.isSafeInteger(expected.glossaryInspectionFrame);
      const isAlgL09Vb03TerminalStopGlossary = expected.adapterFamily ===
        'alg-l09-vb03-terminal-stop-source-static' &&
        Number.isSafeInteger(expected.glossaryInspectionFrame);
      const isAlgL09Vb06Drag = expected.adapterFamily ===
        'alg-l09-vb06-drag-source-static' &&
        Number.isSafeInteger(expected.glossaryInspectionFrame);
      const isAlgL09Vb02Glossary = expected.adapterFamily ===
        'alg-l09-vb02-glossary-source-static' &&
        Number.isSafeInteger(expected.glossaryInspectionFrame);
      const isTs07 = expected.adapterFamily ===
        'ts07-nms-l1-assessment-source-static';
      const expectedEnglishTermCount = isVb03
        ? expected.glossarySourceButtons.length
        : isIn02 || isVb02 || isAlgL09SimpleGlossary ||
          isAlgL09TerminalStopGlossary ||
          isAlgL09Vb03TerminalStopGlossary || isAlgL09Vb06Drag ||
          isAlgL09Vb02Glossary
        ? expected.glossaryEntries.length
        : isTs02 ? 3 : isTs03 ? 2 :
        isTs04 ? expected.animationId === 'shared-alg001-l01-p049' ? 8 : 7 :
          isTs05 ? expected.glossaryEntries.length : 0;
      const expectedSpanishTermCount = isVb03
        ? expected.glossarySourceButtons.length
        : isIn02 || isVb02 || isAlgL09SimpleGlossary ||
          isAlgL09TerminalStopGlossary ||
          isAlgL09Vb03TerminalStopGlossary || isAlgL09Vb06Drag ||
          isAlgL09Vb02Glossary
        ? expected.glossaryEntries.length
        : expected.animationId === 'shared-alg001-l01-p050' ? 6 :
          expected.animationId === 'shared-alg001-l01-p049' ? 8 :
        expected.animationId === 'shared-alg001-l10-p043' ? 3 :
          expected.animationId === 'shared-alg001-l03-p048' ? 2 : 0;
      const glossaryValid = isTs03 || isTs02 || isTs04 || isTs05 ||
        isIn02 || isVb02 || isVb03 || isAlgL09SimpleGlossary ||
        isAlgL09TerminalStopGlossary ||
        isAlgL09Vb03TerminalStopGlossary || isAlgL09Vb06Drag ||
        isAlgL09Vb02Glossary
        ? sample.glossary?.englishTerms?.length === expectedEnglishTermCount &&
          sample.glossary.pausedWhileOpen === true &&
          sample.glossary.resumedAfterClose === true &&
          (expectedSpanishTermCount > 0
            ? sample.glossary.spanishTerms?.length === expectedSpanishTermCount
            : sample.glossary.spanishTerms === null)
        : sample.glossary === null;
      const assessmentValid = isTs07
        ? sample.assessment?.sourceStopFrame === 757 &&
          sample.assessment.sourceQuizVisualProxyFrame === 758 &&
          sample.assessment.glossary?.entryId === 'difference' &&
          sample.assessment.glossary.pausedWhileOpen === true &&
          sample.assessment.glossary.resumedAfterClose === true &&
          JSON.stringify(sample.assessment.hint?.lines) === JSON.stringify([
            'Difference means to subtract.',
            'Example: 10,000 – 3,500 means the difference between 10,000 and 3,500.',
          ]) &&
          sample.assessment.firstWrong?.answer === '36°' &&
          sample.assessment.firstWrong?.feedback === 'OH! NO' &&
          sample.assessment.firstWrong?.returnedToSelection === true &&
          sample.assessment.right?.answer === '38°' &&
          sample.assessment.right?.feedback === 'Excellent!' &&
          sample.assessment.right?.resolvedStopCount === 1 &&
          sample.assessment.right?.resumedFrame > 757 &&
          sample.assessment.replay?.runtimeRemounted === true &&
          sample.assessment.replay?.resetToSelectingAtHeldStop === true &&
          sample.assessment.spanish?.glossaryEntryId === 'difference' &&
          sample.assessment.spanish?.sourceEnglishDisclosure === true &&
          sample.assessment.spanish?.textParityAccepted === false &&
          sample.assessment.feedbackAudioAccepted === false
        : sample.assessment === null;
      const groupedDragValid = isAlgL09Vb06Drag
        ? sample.groupedDrag?.sourceStopFrame === 129 &&
          sample.groupedDrag.wrong?.sourceId === 'drag-1' &&
          sample.groupedDrag.wrong?.targetId === 'drop-1' &&
          sample.groupedDrag.wrong?.feedbackKind === 'proportional' &&
          sample.groupedDrag.wrong?.resetCount === 0 &&
          JSON.stringify(sample.groupedDrag.correctSequence) ===
            JSON.stringify([['drag-1', 'drop-3'], ['drag-3', 'drop-4'],
              ['drag-2', 'drop-1'], ['drag-4', 'drop-2']]) &&
          sample.groupedDrag.completionCount === 4 &&
          sample.groupedDrag.resolvedStopCount === 1 &&
          sample.groupedDrag.resumedFrame >= 130 &&
          sample.groupedDrag.replay?.runtimeRemounted === true &&
          sample.groupedDrag.replay?.resetCount === 0 &&
          sample.groupedDrag.replay?.returnedToHeldStop === true &&
          sample.groupedDrag.feedbackAudioAccepted === false &&
          sample.groupedDrag.externalNarrationAudioAccepted === false
        : sample.groupedDrag === null;
      const sampleValid = sample.animationId === expected.animationId &&
        sample.moduleCode === expected.moduleCode &&
        sample.stableLessonKey === expected.stableLessonKey &&
        sample.frameDomain === expected.runtime.frameDomain &&
        sample.frameCount === expected.runtime.frameCount &&
        sample.runtimeSha256 === expected.runtime.canvasRenderer.sha256 &&
        sample.glossaryInspectionFrame ===
          (expected.glossaryInspectionFrame ?? null) &&
        ['ready', 'updating'].includes(sample.canvasState) &&
        sample.progressedFrame > sample.initialFrame &&
        sample.playbackComplete === 'false' &&
        sample.consoleErrors.length === 0 && sample.pageErrors.length === 0 &&
        sample.assetResponses.length === 1 &&
        response.url === expectedAssetUrl && response.status === 200 &&
        response.corp === 'same-origin' && response.nosniff === 'nosniff' &&
        response.cacheControl === 'private, no-store, max-age=0' &&
        glossaryValid && assessmentValid && groupedDragValid &&
        response.contentType?.startsWith('text/javascript');
      invariant(sampleValid,
        `${expected.animationId}: durable browser sample assertion drifted`);
      return sampleValid;
    }) &&
    JSON.stringify(evidence.screenshots.map((item) => item.path)) ===
      JSON.stringify(expectedScreenshotPaths) &&
    JSON.stringify(evidence.acceptanceEffects) === JSON.stringify({
      authoritativeOriginalRuntime: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      released: false,
      published: false,
    }),
  'browser QA product assertions drifted');
  for (const screenshot of evidence.screenshots) {
    const current = await binding(screenshot.path);
    invariant(current.bytes === screenshot.bytes &&
      current.sha256 === screenshot.sha256,
    `${screenshot.path} drifted`);
  }
  return evidence;
}

const args = process.argv.slice(2);
invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
  'usage: qa-g678-current-js-326-browser.mjs [--check]');
const check = args[0] === '--check';
const inputs = await currentInputs({check});
const evidence = check ? await checkEvidence(inputs) : await buildEvidence(inputs);
process.stdout.write(`${JSON.stringify({check,
  evidence: `${output}/evidence.json`,
  registeredCurrentJsPages: evidence.registeredCurrentJsPages,
  sharedLessonCards: evidence.allLessons.sharedCardCount,
  linkedLessonCards: evidence.allLessons.linkedCardCount,
  sampledModules: evidence.samples.map((sample) => sample.moduleCode),
  screenshotCount: evidence.screenshots.length,
  acceptanceEffects: evidence.acceptanceEffects}, null, 2)}\n`);
