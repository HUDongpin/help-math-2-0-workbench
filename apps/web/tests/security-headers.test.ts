import assert from 'node:assert/strict';
import test from 'node:test';

import nextConfig from '../next.config';

test('ordinary pages deny framing while local course adapters permit only same-origin framing', async () => {
  assert.equal(typeof nextConfig.headers, 'function');
  const entries = await nextConfig.headers!();
  const deploymentProvenance = entries.find(({source}) => source === '/:path*');
  const ordinary = entries.find(({source}) => source === '/((?!flash-assets/courses/).*)');
  const adapters = entries.find(({source}) => source === '/flash-assets/courses/:path*');
  const hostComposite = entries.find(({source}) =>
    source === '/flash-assets/courses/shell-course-g04-l03-index-local/'
      + 'host-composite-assets/:path*');
  assert.ok(deploymentProvenance);
  assert.ok(ordinary);
  assert.ok(adapters);
  assert.ok(hostComposite);

  const deploymentProvenanceHeaders = new Map(
    deploymentProvenance.headers.map(({key, value}) => [key, value]),
  );
  const ordinaryHeaders = new Map(ordinary.headers.map(({key, value}) => [key, value]));
  const adapterHeaders = new Map(adapters.headers.map(({key, value}) => [key, value]));
  const hostCompositeHeaders = new Map(
    hostComposite.headers.map(({key, value}) => [key, value]),
  );
  const projectId = deploymentProvenanceHeaders.get(
    'X-Helpmath-Vercel-Project-ID',
  );
  const deploymentUrl = deploymentProvenanceHeaders.get(
    'X-Helpmath-Vercel-Deployment-URL',
  );
  const gitCommitSha = deploymentProvenanceHeaders.get(
    'X-Helpmath-Git-Commit-SHA',
  );
  assert.ok(
    projectId === 'unavailable'
      || projectId === 'prj_q3v5Ue0zCL1T9rzTFD21KpNc5tzu',
  );
  assert.ok(
    deploymentUrl === 'unavailable'
      || /^https:\/\/[a-z0-9-]+\.vercel\.app$/u.test(deploymentUrl ?? ''),
  );
  assert.ok(
    gitCommitSha === 'unavailable'
      || /^[0-9a-f]{40}$/u.test(gitCommitSha ?? ''),
  );
  assert.equal(ordinaryHeaders.get('X-Frame-Options'), 'DENY');
  assert.match(ordinaryHeaders.get('Content-Security-Policy') ?? '', /frame-ancestors 'none'/);
  assert.match(ordinaryHeaders.get('Content-Security-Policy') ?? '', /frame-src 'self'/);

  assert.equal(adapterHeaders.get('X-Frame-Options'), 'SAMEORIGIN');
  assert.match(adapterHeaders.get('Content-Security-Policy') ?? '', /frame-ancestors 'self'/);
  assert.match(adapterHeaders.get('Content-Security-Policy') ?? '', /connect-src 'none'/);
  assert.doesNotMatch(
    adapterHeaders.get('Content-Security-Policy') ?? '',
    /https?:\/\//,
    'embedded course adapters may not load remote origins'
  );
  assert.equal(
    hostCompositeHeaders.get('Cache-Control'),
    'private, no-store, max-age=0',
  );
  assert.equal(
    hostCompositeHeaders.get('X-Robots-Tag'),
    'noindex, nofollow, noarchive, noimageindex',
  );
});
