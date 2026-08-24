import assert from 'node:assert/strict';
import test from 'node:test';

import nextConfig from '../next.config';

test('ordinary pages deny framing while local course adapters permit only same-origin framing', async () => {
  assert.equal(typeof nextConfig.headers, 'function');
  const entries = await nextConfig.headers!();
  const ordinary = entries.find(({source}) => source === '/((?!flash-assets/courses/).*)');
  const adapters = entries.find(({source}) => source === '/flash-assets/courses/:path*');
  const hostComposite = entries.find(({source}) =>
    source === '/flash-assets/courses/shell-course-g04-l03-index-local/'
      + 'host-composite-assets/:path*');
  assert.ok(ordinary);
  assert.ok(adapters);
  assert.ok(hostComposite);

  const ordinaryHeaders = new Map(ordinary.headers.map(({key, value}) => [key, value]));
  const adapterHeaders = new Map(adapters.headers.map(({key, value}) => [key, value]));
  const hostCompositeHeaders = new Map(
    hostComposite.headers.map(({key, value}) => [key, value]),
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
