import assert from 'node:assert/strict';
import test from 'node:test';

import {hfrLocalLessonDescriptor} from '../lib/hfr-local-pages.server';

const pages = [
  ['shared-alg001-l06-p001', 'sprite-142', 'source-static-frame'],
  ['shared-alg001-l12-p001', 'sprite-142', 'source-static-frame'],
  ['shared-alg001-l08-p040', 'sprite-255', 'source-game'],
  ['shared-alg001-l08-p050', 'sprite-960', 'source-quiz'],
  ['shared-alg001-l12-p005', 'sprite-391', 'source-static-frame'],
] as const;

test('algebra product modules are selectable on the HFR review route', async () => {
  for (const [animationId, frameDomain, scenario] of pages) {
    for (const mode of ['candidate', 'registered'] as const) {
      const descriptor = await hfrLocalLessonDescriptor(animationId, mode);
      const page = descriptor.pages.find(item => item.animationId === animationId);
      assert.equal(page?.rendererAvailability.kind, 'registered', `${animationId} ${mode}`);
      if (page?.rendererAvailability.kind !== 'registered') continue;
      assert.equal(page.rendererAvailability.moduleKey, animationId);
      assert.ok(page.rendererAvailability.runtimeQuery);
      assert.equal(page.rendererAvailability.runtimeQuery.frameDomain, frameDomain);
      assert.equal(page.rendererAvailability.runtimeQuery.scenario, scenario);
      assert.equal(descriptor.course.href, `/migration-status/g678-hfr/${animationId}/${mode}`);
    }
  }
});
