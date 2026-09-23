import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {loadCurrentGrade4CourseCatalogCoverage} from
  '../lib/g4-course-catalog-coverage.server';
import {
  buildG4L11MigrationFactoryDescriptor,
  G4_L11_MIGRATION_FACTORY_FREEZE_SHA256,
  G4_L11_MIGRATION_FACTORY_SELECTED_ANIMATION_IDS,
} from '../lib/g4-l11-migration-factory';

const freezeUrl = new URL(
  '../../../catalog/product-bridge-calibrations/g4-l11-page-only-current-js-43-v1.json',
  import.meta.url,
);
const routeUrl = new URL(
  '../app/[locale]/migration-status/g4-l11-migration-factory/page.tsx',
  import.meta.url,
);
const playerUrl = new URL(
  '../components/g4-l11-migration-factory-player.tsx',
  import.meta.url,
);

test('G4 L11 descriptor registers all 43 Current-JS pages in exact source order', () => {
  const descriptor = buildG4L11MigrationFactoryDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  assert.equal(descriptor.course.activePageCount, 43);
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.pages.length, 43);
  assert.deepEqual(descriptor.pages.map((page) => page.globalPageOrdinal),
    Array.from({length: 43}, (_, index) => index + 1));
  assert.deepEqual(descriptor.sections.map((section) =>
    [section.code, section.activePageCount]), [
      ['IR', 1], ['RW', 3], ['VB', 9], ['IN', 12],
      ['TI', 6], ['GS', 2], ['TS', 7], ['FQ', 3],
    ]);
  const registered = descriptor.pages.filter(
    (page) => page.rendererAvailability.kind === 'registered',
  );
  assert.deepEqual(registered.map((page) => page.animationId),
    [...G4_L11_MIGRATION_FACTORY_SELECTED_ANIMATION_IDS]);
  assert.equal(registered.length, 43);
  const in010 = registered.find((page) =>
    page.animationId === 'course-g04-l11-in-010');
  assert.equal(in010?.globalPageOrdinal, 22);
  assert.deepEqual(in010?.rendererAvailability, {
    kind: 'registered',
    moduleKey: 'course-g04-l11-in-010',
    runtimeQuery: {
      frameDomain: 'sprite-246',
      language: 'route-locale',
      seed: '0',
    },
  });
  assert.equal(descriptor.pages.filter(
    (page) => page.rendererAvailability.kind === 'unavailable',
  ).length, 0);
  assert.equal(descriptor.factory.scaleOutDecision,
    'PAGE_ONLY_CURRENT_JS_COMPLETE');
  assert.equal(descriptor.factory.privateProductBridgePageCount, 43);
  assert.ok(Object.values(descriptor.acceptanceEffects).every(
    (value) => value === false,
  ));
});

test('G4 L11 descriptor is bound to the exact frozen factory bytes', async () => {
  const bytes = await readFile(freezeUrl);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    G4_L11_MIGRATION_FACTORY_FREEZE_SHA256);
  const freeze = JSON.parse(bytes.toString('utf8'));
  assert.equal(freeze.calibrationId, 'g4-l11-page-only-current-js-43-v1');
  assert.equal(freeze.scope.courseShellCount, 0);
  assert.equal(freeze.scope.activePageCount, 43);
  assert.equal(freeze.scope.selectedPageCount, 43);
  assert.equal(freeze.selectedPages.length, 43);
  assert.ok(Object.values(freeze.acceptanceEffects).every(
    (value) => value === false,
  ));
});

test('the factory surface is local-only and carries explicit evidence boundaries', async () => {
  const [route, player] = await Promise.all([
    readFile(routeUrl, 'utf8'),
    readFile(playerUrl, 'utf8'),
  ]);
  assert.match(route,
    /process\.env\.NODE_ENV === 'production'[\s\S]*?notFound\(\)/);
  assert.match(player, /data-legacy-course-shell-included="false"/);
  assert.match(player, /data-private-current-js-pages="43"/);
  assert.match(player, /data-scale-out-decision="PAGE_ONLY_CURRENT_JS_COMPLETE"/);
  assert.match(player, /Original runtime, natural behavior, audio, fidelity, human review, and Owner acceptance remain independent closed gates/);
});
