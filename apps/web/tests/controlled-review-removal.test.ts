import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {proxyForRequest} from '../proxy';

const webRoot = path.resolve(import.meta.dirname, '..');

async function withProductionEnvironment<T>(callback: () => Promise<T>) {
  const original = process.env.NODE_ENV;
  try {
    Reflect.set(process.env, 'NODE_ENV', 'production');
    return await callback();
  } finally {
    if (original === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV');
    else Reflect.set(process.env, 'NODE_ENV', original);
  }
}

test('controlled-review routes and passphrase session plumbing are removed', async () => {
  const retiredFiles = [
    'app/[locale]/executive-preview/page.tsx',
    'app/[locale]/executive-preview/g5-l4/page.tsx',
    'app/api/executive-preview/session/route.ts',
    'components/executive-preview-page.tsx',
    'components/g4-l3-controlled-ceo-preview-boundary.tsx',
    'components/g5-l4-executive-preview.tsx',
    'components/g5-l4-executive-preview.module.css',
    'config/executive-preview-window.json',
    'lib/executive-preview-access.ts',
    'lib/executive-preview-rate-limit.ts',
    'lib/executive-preview-server.ts',
    'lib/g4-l3-controlled-ceo-preview.ts',
    'lib/g5-l4-executive-preview.ts',
    'lib/g5-l4-executive-preview-capture.ts',
  ];
  for (const relativePath of retiredFiles) {
    await assert.rejects(access(path.join(webRoot, relativePath)), relativePath);
  }

  const [
    proxySource,
    configSource,
    courseSource,
    demoSource,
    enContent,
    esContent,
  ] = await Promise.all([
    readFile(path.join(webRoot, 'proxy.ts'), 'utf8'),
    readFile(path.join(webRoot, 'next.config.ts'), 'utf8'),
    readFile(path.join(webRoot, 'app/[locale]/courses/[grade]/[lesson]/page.tsx'), 'utf8'),
    readFile(path.join(webRoot, 'app/[locale]/demos/[id]/page.tsx'), 'utf8'),
    readFile(path.join(webRoot, 'content/en/index.ts'), 'utf8'),
    readFile(path.join(webRoot, 'content/es/index.ts'), 'utf8'),
  ]);

  for (const source of [proxySource, configSource, courseSource, demoSource]) {
    assert.doesNotMatch(source, /EXECUTIVE_PREVIEW|executive-preview|controlledPreview/u);
  }
  assert.match(courseSource, /const auditPreview = developmentAuditPreview;/u);
  assert.match(demoSource, /process\.env\.NODE_ENV === 'production'\) notFound\(\);/u);
  assert.doesNotMatch(
    enContent,
    /href: "\/executive-preview"|passphrase|private review|authorized preview access/u,
  );
  assert.doesNotMatch(
    esContent,
    /frase de acceso|vistas previas privadas|revisores autorizados/u,
  );
});

test('production routing no longer sends visitors to a review login', async () => {
  await withProductionEnvironment(async () => {
    const preview = await proxyForRequest(
      new NextRequest('https://www.helpmath.ai/executive-preview'),
    );
    assert.equal(preview.status, 404);

    const demo = await proxyForRequest(
      new NextRequest('https://www.helpmath.ai/demos/conversion-1-2'),
    );
    assert.equal(demo.status, 404);

    const course = await proxyForRequest(
      new NextRequest('https://www.helpmath.ai/courses/4/3'),
    );
    assert.equal(course.status, 200);
    assert.equal(course.headers.get('location'), null);
    assert.equal(course.headers.get('x-helpmath-controlled-preview'), null);

    for (const pathName of [
      '/about',
      '/approach',
      '/curriculum',
      '/research',
      '/resources',
      '/support',
      '/library',
      '/demos',
      '/login',
      '/sign-in',
      '/sign-up',
      '/account',
      '/contact',
      '/migration-status',
    ]) {
      const response = await proxyForRequest(
        new NextRequest(`https://www.helpmath.ai${pathName}`),
      );
      assert.equal(response.status, 404, pathName);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    }

    for (const pathName of ['/privacy', '/terms']) {
      const response = await proxyForRequest(
        new NextRequest(`https://www.helpmath.ai${pathName}`),
      );
      assert.equal(response.status, 200, pathName);
    }

    const originalG5L4Showcase =
      process.env.CURRENT_JS_SHOWCASE_G5_L4_ENABLED;
    try {
      Reflect.deleteProperty(
        process.env,
        'CURRENT_JS_SHOWCASE_G5_L4_ENABLED',
      );
      const hiddenG5L4 = await proxyForRequest(
        new NextRequest('https://www.helpmath.ai/courses/5/4'),
      );
      assert.equal(hiddenG5L4.status, 404);

      process.env.CURRENT_JS_SHOWCASE_G5_L4_ENABLED = '1';
      const inexactG5L4 = await proxyForRequest(
        new NextRequest('https://www.helpmath.ai/courses/5/4'),
      );
      assert.equal(inexactG5L4.status, 404);

      process.env.CURRENT_JS_SHOWCASE_G5_L4_ENABLED = 'true';
      const publicG5L4 = await proxyForRequest(
        new NextRequest('https://www.helpmath.ai/courses/5/4'),
      );
      assert.equal(publicG5L4.status, 200);
      assert.equal(publicG5L4.headers.get('x-middleware-next'), null);
    } finally {
      if (originalG5L4Showcase === undefined) {
        Reflect.deleteProperty(
          process.env,
          'CURRENT_JS_SHOWCASE_G5_L4_ENABLED',
        );
      } else {
        process.env.CURRENT_JS_SHOWCASE_G5_L4_ENABLED = originalG5L4Showcase;
      }
    }

    const originalMigrationStatus = process.env.MIGRATION_STATUS_ENABLED;
    try {
      process.env.MIGRATION_STATUS_ENABLED = '1';
      const hiddenMigrationStatus = await proxyForRequest(
        new NextRequest('https://www.helpmath.ai/migration-status'),
      );
      assert.equal(hiddenMigrationStatus.status, 404);
      const migrationStatus = await proxyForRequest(
        new NextRequest('https://www.helpmath.ai/migration-status?view=designer'),
      );
      assert.equal(migrationStatus.status, 200);
    } finally {
      if (originalMigrationStatus === undefined) {
        Reflect.deleteProperty(process.env, 'MIGRATION_STATUS_ENABLED');
      } else {
        process.env.MIGRATION_STATUS_ENABLED = originalMigrationStatus;
      }
    }
  });
});

test('locale-free flash assets are not rewritten through the default locale', async () => {
  const asset = await proxyForRequest(new NextRequest(
    'http://localhost:3200/flash-assets/courses/example/canvas-renderer.js',
  ));
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get('x-middleware-rewrite'), null);
  assert.equal(asset.headers.get('x-middleware-next'), '1');
});
