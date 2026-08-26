import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {
  G4_L3_LESSON,
  canNavigateToG4L3Animation,
  findG4L3Page,
  getG4L3PageLabel,
  getVisibleG4L3Pages,
  isG4L3ReleaseOpen,
  isG4L3Lesson,
  isG4L3Shell,
} from '../lib/g4-l3-lesson-navigation';

interface ReportSection {
  order: number;
  code: string;
  activePageCount: number;
  firstActiveAnimationId: string;
  labels: {en: {valueRaw: string}; es: {valueRaw: string}};
}

interface ReportPage {
  globalPageOrdinal: number;
  sectionPageOrdinal: number;
  sectionCode: string;
  animationId: string;
  batchId: string;
  labels: {
    pageEnglish: {valueRaw: string};
    pageSpanish: {valueRaw: string | null; status: string};
  };
  xmlNavigation: {raw: string | null};
  navigation: {previousAnimationId: string | null; nextAnimationId: string | null};
}

interface ReportContract {
  schemaVersion: number;
  reportType: string;
  sourceBindings: {sourceXml: {path: string; sha256: string}};
  shell: {animationId: string};
  sections: ReportSection[];
  pages: ReportPage[];
}

const reportPath = new URL('../../../reports/g4-l3-lesson-product-navigation-contract.json', import.meta.url);
const report = JSON.parse(readFileSync(reportPath, 'utf8')) as ReportContract;

test('G4 L3 product data is an exact fail-closed projection of the source contract', () => {
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.reportType, 'g4-l3-full-lesson-product-navigation-contract');
  assert.equal(G4_L3_LESSON.sourceContract.path, 'reports/g4-l3-lesson-product-navigation-contract.json');
  assert.equal(G4_L3_LESSON.sourceContract.sourceXmlPath, report.sourceBindings.sourceXml.path);
  assert.equal(G4_L3_LESSON.sourceContract.sourceXmlSha256, report.sourceBindings.sourceXml.sha256);
  assert.equal(G4_L3_LESSON.shellAnimationId, report.shell.animationId);

  assert.deepEqual(
    G4_L3_LESSON.sections.map((section) => ({
      order: section.order,
      code: section.code,
      titleEnglish: section.titleEnglish,
      titleSpanish: section.titleSpanish,
      firstActiveAnimationId: section.firstActiveAnimationId,
      activePageCount: section.activePageCount,
    })),
    report.sections.map((section) => ({
      order: section.order,
      code: section.code,
      titleEnglish: section.labels.en.valueRaw,
      titleSpanish: section.labels.es.valueRaw,
      firstActiveAnimationId: section.firstActiveAnimationId,
      activePageCount: section.activePageCount,
    })),
  );

  assert.deepEqual(
    G4_L3_LESSON.pages.map((page) => ({
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      animationId: page.animationId,
      titleEnglish: page.titleEnglish,
      titleSpanish: page.titleSpanish,
      spanishTitleStatus: page.spanishTitleStatus,
      batchId: page.batchId,
      xmlNavigation: page.xmlNavigation,
      previousAnimationId: page.previousAnimationId,
      nextAnimationId: page.nextAnimationId,
    })),
    report.pages.map((page) => ({
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      animationId: page.animationId,
      titleEnglish: page.labels.pageEnglish.valueRaw,
      titleSpanish: page.labels.pageSpanish.valueRaw,
      spanishTitleStatus: page.labels.pageSpanish.status,
      batchId: page.batchId,
      xmlNavigation: page.xmlNavigation.raw,
      previousAnimationId: page.navigation.previousAnimationId,
      nextAnimationId: page.navigation.nextAnimationId,
    })),
  );
});

test('G4 L3 preserves all 39 active placements, exact adjacency, and FQ ON/OFF/ON', () => {
  assert.equal(G4_L3_LESSON.pages.length, 39);
  assert.equal(G4_L3_LESSON.sections.length, 8);
  assert.equal(new Set(G4_L3_LESSON.pages.map((page) => page.animationId)).size, 39);
  assert.deepEqual(G4_L3_LESSON.pages.map((page) => page.globalPageOrdinal), Array.from({length: 39}, (_, index) => index + 1));
  assert.equal(G4_L3_LESSON.sections.reduce((sum, section) => sum + section.activePageCount, 0), 39);

  for (const [index, page] of G4_L3_LESSON.pages.entries()) {
    assert.equal(page.previousAnimationId, G4_L3_LESSON.pages[index - 1]?.animationId ?? null);
    assert.equal(page.nextAnimationId, G4_L3_LESSON.pages[index + 1]?.animationId ?? null);
    assert.equal(findG4L3Page(page.animationId), page);
  }

  assert.deepEqual(
    G4_L3_LESSON.pages.filter((page) => page.sectionCode === 'FQ').map((page) => page.xmlNavigation),
    ['ON', 'OFF', 'ON'],
  );
  assert.deepEqual(
    G4_L3_LESSON.pages
      .filter((page) => page.xmlBackgroundText)
      .map((page) => page.animationId),
    ['course-g04-l03-ir-001-341242cc'],
  );
  assert.equal(isG4L3Lesson(4, 3), true);
  assert.equal(isG4L3Lesson('4', '03'), true);
  assert.equal(isG4L3Lesson(4, 2), false);
  assert.equal(isG4L3Shell(G4_L3_LESSON.shellAnimationId), true);
});

test('Spanish labels never invent the 24 page titles absent from source evidence', () => {
  const exactSpanish = G4_L3_LESSON.pages.filter((page) => page.titleSpanish !== null);
  const missingSpanish = G4_L3_LESSON.pages.filter((page) => page.titleSpanish === null);
  assert.equal(exactSpanish.length, 15);
  assert.equal(missingSpanish.length, 24);

  for (const page of exactSpanish) {
    assert.deepEqual(getG4L3PageLabel(page, 'es'), {
      text: page.titleSpanish,
      sourceLanguage: 'es',
      sourceStatus: 'exact-subpage-anchor-label',
      usesEnglishFallback: false,
    });
  }
  for (const page of missingSpanish) {
    assert.deepEqual(getG4L3PageLabel(page, 'es'), {
      text: page.titleEnglish,
      sourceLanguage: 'en',
      sourceStatus: 'missing-page-level-spanish-title',
      usesEnglishFallback: true,
    });
  }
});

test('public selection and navigation remain strict-ledger fail-closed', () => {
  const empty = new Set<string>();
  assert.equal(getVisibleG4L3Pages({auditPreview: false, completeAnimationIds: empty, releasePublished: false}).length, 0);
  assert.equal(getVisibleG4L3Pages({auditPreview: true, completeAnimationIds: empty, releasePublished: false}).length, 39);
  assert.equal(canNavigateToG4L3Animation(G4_L3_LESSON.pages[0]!.animationId, {auditPreview: false, completeAnimationIds: empty, releasePublished: false}), false);
  assert.equal(canNavigateToG4L3Animation(G4_L3_LESSON.pages[0]!.animationId, {auditPreview: true, completeAnimationIds: empty, releasePublished: false}), true);

  const admitted = new Set([G4_L3_LESSON.pages[4]!.animationId]);
  assert.equal(getVisibleG4L3Pages({auditPreview: false, completeAnimationIds: admitted, releasePublished: false}).length, 0);
  assert.equal(getVisibleG4L3Pages({auditPreview: false, completeAnimationIds: admitted, releasePublished: true}).length, 0);

  const allMembers = new Set([
    ...G4_L3_LESSON.pages.map((page) => page.animationId),
    G4_L3_LESSON.shellAnimationId,
  ]);
  assert.equal(isG4L3ReleaseOpen({auditPreview: false, completeAnimationIds: allMembers, releasePublished: false}), false);
  assert.equal(isG4L3ReleaseOpen({auditPreview: false, completeAnimationIds: allMembers, releasePublished: true}), true);
  assert.deepEqual(
    getVisibleG4L3Pages({auditPreview: false, completeAnimationIds: allMembers, releasePublished: true}).map((page) => page.animationId),
    G4_L3_LESSON.pages.map((page) => page.animationId),
  );
  assert.equal(canNavigateToG4L3Animation(G4_L3_LESSON.pages[0]!.animationId, {auditPreview: false, completeAnimationIds: allMembers, releasePublished: true}), true);
  assert.equal(canNavigateToG4L3Animation('course-g04-l03-historical-nonmember', {auditPreview: false, completeAnimationIds: allMembers, releasePublished: true}), false);
  assert.deepEqual(G4_L3_LESSON.acceptance, {
    originalRuntimeComplete: false,
    navigationBehaviorComplete: false,
    fullFrameRmseComplete: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
  });
});

test('course map shell link opens the exact 39-page audit projection', () => {
  const source = readFileSync(
    new URL('../components/g4-l3-lesson-navigation.tsx', import.meta.url),
    'utf8',
  );
  assert.match(
    source,
    /\?auditContext=g4-l3-lesson&lang=\$\{locale\}&seed=0&frame=50&scenario=lesson-map-audit/,
  );
});
