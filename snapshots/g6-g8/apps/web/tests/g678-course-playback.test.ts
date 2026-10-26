import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  HFR_RENDERER_BINDING,
  projectRegisteredCoursePages,
  readLocalRegistryBindings,
} from '../lib/g678-course-playback';
import type {WholeLessonPlayerPage} from '../lib/whole-lesson-player-descriptor';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function page(animationId: string, registered = false): WholeLessonPlayerPage {
  return {
    globalPageOrdinal: 1,
    sectionPageOrdinal: 1,
    sectionCode: 'IR',
    animationId,
    previousAnimationId: null,
    nextAnimationId: null,
    source: {},
    labels: {
      en: {text: 'Page', sourceLanguage: 'en', sourceStatus: 'exact-page-title', usesEnglishFallback: false},
      es: {text: 'Page', sourceLanguage: 'en', sourceStatus: 'missing-page-level-spanish-title', usesEnglishFallback: true},
    },
    rendererAvailability: registered
      ? {kind: 'registered', moduleKey: animationId, runtimeQuery: {frameDomain: 'sprite-12', language: 'fixed-en', scenario: 'source-static-frame', seed: '0'}}
      : {kind: 'unavailable', reason: 'outside-g678-frozen-current-js-calibration-set'},
  };
}

test('HFR pages play on the renderer scenario and missing pages stay listed', () => {
  const registry = new Map<string, string | null>([
    ['shared-dat001-l08-p001', HFR_RENDERER_BINDING],
    ['shared-dat001-l08-p002', null],
  ]);
  const projection = projectRegisteredCoursePages([
    page('shared-dat001-l08-p001'),
    page('shared-dat001-l08-p002', true),
    page('shared-dat001-l08-p003'),
  ], registry);
  assert.equal(projection.hfrPageCount, 1);
  assert.deepEqual(projection.unavailableAnimationIds, ['shared-dat001-l08-p003']);
  assert.equal(projection.pages[0]?.rendererAvailability.kind, 'registered');
  assert.equal(projection.pages[0]?.rendererAvailability.kind === 'registered'
    ? projection.pages[0].rendererAvailability.runtimeQuery?.scenario : '', 'hfr');
  assert.equal(projection.pages[1]?.rendererAvailability.kind === 'registered'
    ? projection.pages[1].rendererAvailability.runtimeQuery?.frameDomain : '', 'sprite-12');
});

test('nested lesson pages keep their source domain instead of the generic root query', () => {
  const registry = new Map<string, string | null>([
    ['shared-alg001-l06-p001', 'maintained-dom-module-v1'],
    ['shared-alg001-l12-p013', null],
    ['shared-alg001-l12-p015', null],
    ['shared-nms002-l02-p002', null],
    ['shared-nms002-l02-p052', 'maintained-dom-module-v1'],
    ['shared-nms002-l01-p047', null],
    ['shared-alg001-l06-p060', null],
    ['shared-nms002-l02-p053', null],
    ['shared-geo001-l06-p001', null],
    ['shared-geo001-l07-p001', null],
    ['shared-nms002-l09-p003', 'maintained-dom-module-v1'],
    ['shared-dat001-l08-p001', HFR_RENDERER_BINDING],
  ]);
  const projection = projectRegisteredCoursePages([
    page('shared-alg001-l06-p001'),
    page('shared-alg001-l12-p013'),
    page('shared-alg001-l12-p015'),
    page('shared-nms002-l02-p002'),
    page('shared-nms002-l02-p052', true),
    page('shared-nms002-l01-p047'),
    page('shared-alg001-l06-p060'),
    page('shared-nms002-l02-p053'),
    page('shared-geo001-l06-p001'),
    page('shared-geo001-l07-p001'),
    page('shared-nms002-l09-p003'),
    page('shared-dat001-l08-p001'),
  ], registry);
  const query = (index: number) => {
    const availability = projection.pages[index]?.rendererAvailability;
    return availability?.kind === 'registered' ? availability.runtimeQuery : undefined;
  };
  assert.equal(query(0)?.frameDomain, 'sprite-142');
  assert.equal(query(0)?.scenario, 'source-static-frame');
  assert.equal(query(0)?.language, 'route-locale');
  assert.equal(query(1)?.frameDomain, 'sprite-63');
  assert.equal(query(1)?.scenario, 'source-static-frame');
  assert.equal(query(1)?.language, 'fixed-en');
  assert.equal(query(2)?.frameDomain, 'sprite-76');
  assert.equal(query(2)?.scenario, 'source-static-frame');
  assert.equal(query(3)?.frameDomain, 'sprite-310');
  assert.equal(query(3)?.scenario, 'source-real-world');
  assert.equal(query(4)?.frameDomain, 'sprite-350');
  assert.equal(query(4)?.scenario, 'intro');
  assert.equal(query(4)?.language, 'route-locale');
  assert.equal(query(5)?.frameDomain, 'sprite-1024');
  assert.equal(query(5)?.scenario, 'source-quiz');
  assert.equal(query(6)?.frameDomain, 'sprite-973');
  assert.equal(query(6)?.scenario, 'source-quiz');
  assert.equal(query(7)?.frameDomain, 'sprite-187');
  assert.equal(query(7)?.scenario, 'source-directions-v1');
  assert.equal(query(8)?.frameDomain, 'sprite-142');
  assert.equal(query(8)?.scenario, 'source-introduction');
  assert.equal(query(9)?.frameDomain, 'sprite-142');
  assert.equal(query(9)?.scenario, 'source-introduction');
  assert.equal(query(10)?.frameDomain, 'sprite-246');
  assert.equal(query(10)?.scenario, 'source-static-frame');
  assert.equal(query(10)?.language, 'fixed-en');
  assert.equal(query(11)?.scenario, 'hfr');
  assert.equal(projection.hfrPageCount, 1);
});

test('the local registry readback covers every active G6-G8 placement', () => {
  const source = fs.readFileSync(path.join(root, 'packages/demos/src/registry.local-only.generated.ts'), 'utf8');
  const registry = readLocalRegistryBindings(source);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'catalog/g678-page-only-release-manifest.v1.json'), 'utf8')) as {
    releases: {members: {animationId: string}[]}[];
  };
  const lessons = manifest.releases.map((release) => {
    const ids = release.members.map((member) => member.animationId);
    const projection = projectRegisteredCoursePages(ids.map((id) => page(id)), registry);
    return {id: ids[0]?.replace(/-p\d{3}$/u, ''), total: ids.length, hfr: projection.hfrPageCount, unavailable: projection.unavailableAnimationIds.length};
  });
  const totals = lessons.reduce((sum, lesson) => ({
    pages: sum.pages + lesson.total,
    hfr: sum.hfr + lesson.hfr,
    unavailable: sum.unavailable + lesson.unavailable,
  }), {pages: 0, hfr: 0, unavailable: 0});
  assert.equal(registry.size, 2282);
  assert.equal(totals.pages, 2282);
  assert.equal(totals.hfr, 1658);
  assert.equal(totals.unavailable, 0);
  const shortestHfr = lessons.filter((lesson) => lesson.hfr > 0).sort((a, b) => a.total - b.total)[0];
  assert.equal(shortestHfr?.id, 'shared-dat001-l08');
  assert.equal(shortestHfr?.total, 34);
});
