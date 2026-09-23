import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {loadAnimationModule} from '../src/animation-registry';
import {matchPrototype} from '../src/prototype-manifest';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const animationRouteFile = 'apps/web/app/[locale]/animations/[animationId]/page.tsx';
const referenceRouteFile = 'apps/web/app/[locale]/reference/[animationId]/page.tsx';

const coursePilotIds = Object.freeze([
  'course-g03-l01-ts-008',
  'course-g03-l01-vb-004',
  'course-g03-l06-fq-002-review',
  'course-g03-l06-ti-001',
  'course-g03-l08-re-001',
  'course-g04-l01-ir-001',
  'course-g04-l03-in-009',
  'course-g04-l09-gs-002',
  'course-g05-l13-rw-002',
  'shell-course-g04-l01-index-local'
]);

const adobeRootBaselineIds = new Set([
  'course-g03-l01-ts-008',
  'course-g03-l01-vb-004',
  'course-g03-l06-fq-002-review',
  'course-g03-l06-ti-001',
  'course-g03-l08-re-001',
  'course-g04-l01-ir-001',
  'course-g04-l03-in-009',
  'course-g05-l13-rw-002'
]);

interface PilotManifest {
  animationId: string;
  status: string;
  source: {swfSha256: string};
  runtime: {stage: {width: number; height: number}; fps: number; frameCount: number};
  baseline: {authority: string; route: string; routeFile: string};
  acceptance: {
    engineeringReview: {decision: string};
    humanVisualReview: {decision: string};
    ownerReview: {decision: string};
  };
  implementation: {
    rendering: string;
    route: string;
    routeFile: string;
    component: string;
    timelineModule: string;
    testFile: string;
    registryModule: string;
  };
}

interface CatalogAnimation {
  animationId: string;
  source: {sha256: string};
}

interface AnimationCatalog {
  animations: CatalogAnimation[];
}

async function exists(relativePath: string): Promise<void> {
  await access(`${repositoryRoot}${relativePath}`);
}

test('all ten course and shell pilot manifests bind real product routes and lazy modules without promoting maturity', async () => {
  const [generatedRegistry, productRoute, referenceRoute, catalogText] = await Promise.all([
    readFile(`${repositoryRoot}packages/demos/src/registry.generated.ts`, 'utf8'),
    readFile(`${repositoryRoot}${animationRouteFile}`, 'utf8'),
    readFile(`${repositoryRoot}${referenceRouteFile}`, 'utf8'),
    readFile(`${repositoryRoot}catalog/animations.json`, 'utf8')
  ]);
  const catalog = JSON.parse(catalogText) as AnimationCatalog;

  assert.match(productRoute, /matchPrototype/);
  assert.match(productRoute, /<AnimationRuntime/);
  assert.match(referenceRoute, /Ruffle is a forensic reference, never the production implementation/);

  for (const animationId of coursePilotIds) {
    const workspace = `migrations/${animationId}`;
    const manifest = JSON.parse(
      await readFile(`${repositoryRoot}${workspace}/migration.json`, 'utf8')
    ) as PilotManifest;

    assert.equal(manifest.animationId, animationId);
    assert.equal(manifest.status, 'preserved', `${animationId} must remain non-complete`);
    assert.equal(manifest.acceptance.engineeringReview.decision, 'pending');
    assert.equal(manifest.acceptance.humanVisualReview.decision, 'pending');
    assert.equal(manifest.acceptance.ownerReview.decision, 'pending');
    assert.notEqual(manifest.implementation.rendering, 'undecided');
    assert.equal(manifest.implementation.route, `/animations/${animationId}`);
    assert.equal(manifest.implementation.routeFile, animationRouteFile);
    assert.equal(manifest.implementation.component, `packages/demos/src/modules/${animationId}.tsx`);
    assert.equal(manifest.implementation.timelineModule, `packages/demos/src/timelines/${animationId}.ts`);
    assert.equal(manifest.implementation.registryModule, `./modules/${animationId}`);
    await Promise.all([
      exists(manifest.implementation.routeFile),
      exists(manifest.implementation.component),
      exists(manifest.implementation.timelineModule),
      exists(manifest.implementation.testFile)
    ]);

    assert.match(
      generatedRegistry,
      new RegExp(
        `'${animationId}': \\(\\) => import\\('\\./modules/${animationId}'\\)`
      ),
      `${animationId} must have a generated lazy import`
    );
    const [prototype, module] = await Promise.all([
      Promise.resolve(matchPrototype({animationId})),
      loadAnimationModule(animationId)
    ]);
    assert.equal(prototype?.key, animationId);
    assert.equal(module?.key, animationId);
    assert.equal(module?.maturity, 'legacy-prototype');

    const catalogAnimation = catalog.animations.find((entry) => entry.animationId === animationId);
    assert.ok(catalogAnimation, `${animationId} must resolve through the product catalog`);
    assert.equal(catalogAnimation.source.sha256, manifest.source.swfSha256);

    if (adobeRootBaselineIds.has(animationId)) {
      assert.equal(manifest.baseline.route, `/reference/${animationId}`);
      assert.equal(manifest.baseline.routeFile, referenceRouteFile);
      await exists(manifest.baseline.routeFile);
      const report = JSON.parse(
        await readFile(
          `${repositoryRoot}${workspace}/baseline/adobe-flash-player-32-standalone-default.json`,
          'utf8'
        )
      ) as {
        status: string;
        authority: {kind: string};
        source: {swfSha256: string};
        runtime: PilotManifest['runtime'];
        frames: Array<{frame: number}>;
      };
      assert.match(report.status, /^authoritative-/);
      assert.equal(report.authority.kind, 'original-swf-adobe-flash-player-runtime');
      assert.equal(report.source.swfSha256, manifest.source.swfSha256);
      assert.deepEqual(report.runtime.stage, manifest.runtime.stage);
      assert.equal(report.runtime.fps, manifest.runtime.fps);
      assert.equal(report.runtime.frameCount, manifest.runtime.frameCount);
      assert.equal(report.frames.length, manifest.runtime.frameCount);
    } else {
      assert.equal(manifest.baseline.route, '');
      assert.equal(manifest.baseline.routeFile, '');
    }
  }
});
