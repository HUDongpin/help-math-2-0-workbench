import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyG5L4PreviewAsset,
  G5_L4_PREVIEW_RUNTIME_SHA256,
  hasSafeFlashAssetSegments,
  hasExactG5L4RuntimeDigest,
  isG5L4PreviewAssetAuthorized
} from '../lib/g5-l4-preview-asset-policy';

const expected = {
  'course-g05-l04-ir-001-a662633d':
    '90831653cd5023dc9353f64ae6859df42c8e91bda1cea069e9a9a4dd5c5f06b0',
  'course-g05-l04-rw-002':
    '5bd9d7d4c99901ea866a90a9ab98c609f1856d3136fd63778a9270bcc888d24f',
  'course-g05-l04-rw-003':
    '1639cf7eeeeda00cbbce347488cec545fddc46e81cffa0b671d625dc781432a3',
  'course-g05-l04-rw-004':
    '0c15179758a7341599ba528a0240dce9fac26955bda8b824143804dc3e1b43bc',
  'course-g05-l04-vb-002':
    '0c7ec104381d5b5a27e99015a1bd2f2ff7053be27bb5977af4e8fa75168e4d50',
  'course-g05-l04-vb-003':
    '9957cc8bc7adcf4d452d94f771cd407ab82a355be1ad69880a4a3bbbdb7ccc85',
  'course-g05-l04-vb-004':
    '251297925bc18f50b1049de234b97dfa78de8f7a0d2bd201fb365d38698296c7',
  'course-g05-l04-vb-005':
    '4b05d689c9ddb43f8029600647b32a3372eda6ec20b02cf008f28f533a78095e',
  'course-g05-l04-vb-006':
    '0b64b9a1d28af78ec44dc5cac48b76e263556187fec31c46f721bf4e41b2b2fa',
  'course-g05-l04-vb-007':
    'aa16e19e27ac9df676715c92bfeef2400a4f9821a6d2475d134f05569e7ca896',
  'course-g05-l04-vb-008':
    'ca3341ef5d32d587841c4b753f92471796bcdf1b90390861c7e5de6558bef6fc',
  'course-g05-l04-vb-009':
    '3d63ad097db4e2d1082a17b427296406f01c62b770376d75bbfe264647848bee',
  'course-g05-l04-vb-010':
    'f4ee5f0dc04ad767abe51f255114b969b87b89c0a546a0fe3f2bcf57e3682bd7',
  'course-g05-l04-vb-011':
    '1de92806431f00e750310d6b6da78eda7114e9ee8358c021afe1827665a3c568',
  'course-g05-l04-in-002':
    'e3054dcaca2f83a16d24992490e3873c379c0e0627ebb089aea089cd27f335b5',
  'course-g05-l04-in-003':
    '4717ec6471a4a2f19eaba6ba55a55db3a4bbab4c40981e54f4555292e44f6c93',
  'course-g05-l04-in-004':
    'b278a5a691133f90e2ed28d0a33a85b95b251ad99999e9f3148c8e5957ba5526',
  'course-g05-l04-in-005':
    'a58891f4224f476432216ecdbd05fe8317eb6b2751b3603c3064370e4225b7da',
  'course-g05-l04-in-006':
    '3c0a82678520f8bc8d12488a1f83f0cc3315a4717857825a2146272a49483b8f',
  'course-g05-l04-in-007':
    'c21d71816db07a291baf9b00190545e39da2c917d47af29f08e461bc03d10358',
  'course-g05-l04-in-008':
    '09725c3fc1c3610b3a3ac092c4d2d6731a3e645152ffb511721730abcb98d484',
  'course-g05-l04-in-009':
    '0f858fe82f59aef13cdb9cb5657f74934a13a286c5d711ef3e0ec293acfbb5d8',
  'course-g05-l04-in-010':
    '0832445a5a39159f6af818908e90fbc5a39142d7833d6bfc51a47d8c88bfbdfa',
  'course-g05-l04-in-011':
    'a72d0fd6a6fa1609f58eb6e326b734e010cf9d2274051f9f88d1b4fd25649497',
  'course-g05-l04-in-012':
    '8861a29538e3cea708e87dbc9df98b02f23be6183503aa4a2cead8d3bfbda4fa',
  'course-g05-l04-in-013':
    '3453e5275d38001acb8d20cb8a1e4da1b68a3dd345aed03033f904709e8cbb03',
  'course-g05-l04-in-014':
    'de19e523f2d368b7eefa4a31330baf990998830cea1176305e081acb118c76c8',
  'course-g05-l04-in-015':
    '0cc1c8fd50905997c110f601e6ba657433a1161f518c06fb386db9daadb844e0',
  'course-g05-l04-in-016':
    '2ad1c14ea8556f3da8074923d2448cdd7dd32ae6cf4ec43753c6147229322531',
  'course-g05-l04-in-017':
    'ff7979e70f93dc69c11088309201ef0ec685d95865a583db0bd9c9f356795fff',
  'course-g05-l04-in-018':
    '85ec6c2f4e864dbb37982532ea3882e3b01c8f69b6221996d3bd2a8a08160f7e',
  'course-g05-l04-in-019':
    'c15e0a967664522fd17755dc8a296befec6cc7b2bba5f6cefec671fda93a9ffa',
  'course-g05-l04-in-020':
    'a648ca2be956f1cbe1bd88849f02454cf2003afa65301a72b7faa807203bfb08',
  'course-g05-l04-in-021':
    'f6e7f9b8f5fac4e5a530c14f95e3887a91629b6397fba21b3bda9c02e8af6213',
  'course-g05-l04-in-022':
    'a5517b8ee9e5a27b8ae2cdf1731824078a18e4a656361d189c48a399089405f0',
  'course-g05-l04-ti-002':
    'bcdb04ed1df92261499cc3e0e80c4e924cd141729ae50543018b6586d45f86c5',
  'course-g05-l04-ti-003':
    '589433ea1087962ae26d02877e406dc327cd81c281525e720f60d4345ffc67ca',
  'course-g05-l04-ti-004':
    '95ab482dce807d640b721bffc6435152288510720def3155e7e76bf8e1510ffc',
  'course-g05-l04-ti-005':
    '8e92319b1049bfb69953ccbc962b474b387551996fff85cef017955eab919213',
  'course-g05-l04-ti-006':
    '9f0b990f287c0bf66722c5ebe5f959deee522f1226b374866a162224efe4d0a5',
  'course-g05-l04-ti-007':
    'd12ddeb50b3f48021edca8092c455e117eea95b3c38fc06e2055b0e96f30e661',
  'course-g05-l04-ti-008':
    'c9b150f664eaf93da7803091f23d98406d1823086411ee17304cf75283b37010',
  'course-g05-l04-ti-009':
    'd686b05e0997cd50172bd95ca9a6fba426b7cfd6d48658a42fc9b8e5b3480686',
  'course-g05-l04-gs-002':
    'bfc2b31d45fd89773677744ff9a9bd0a0213caa5d78cb1a7d4eef6f80f4c3c07',
  'course-g05-l04-ts-002':
    '568e79042ebc4423f041868e76d6507a15dd9a2e1d05258b76ea59f86ec8a580',
  'course-g05-l04-ts-003':
    '300fd5adb8b179a3cdd9aab70ea1b1fd863321402044ad82f2888107023fa08f',
  'course-g05-l04-ts-004':
    '798dac2092935f6a59885df7070f423d4246987f920e57887ddc61b422424446',
  'course-g05-l04-ts-005':
    '8ad1d646f9ae5f2bc87a15695b19a3b8829ac07e259352622c2093705c4fbb63',
  'course-g05-l04-ts-006':
    'c05ebcfe5a7530662265994a5311a21a65c80404136b24988a687f12e0c0551c',
  'course-g05-l04-ts-007':
    '9c43f6375d1566e519209de9bd6dfe1e298b3b984daad707749b8296acefbc91',
  'course-g05-l04-ts-008':
    '123c51a7ef0177203a3951baefc67dd6b8b7855c3aea3bd635217bba8e1fb384',
  'course-g05-l04-fq-001':
    '539e66402e9d90d871a21a8e05dfe72fccaac631f484d2fc387d37df2da54d13',
  'course-g05-l04-fq-002':
    '73f1525997c667b351031d6f3e8ec09130970aee57dbe9211735844634b9e809',
  'course-g05-l04-fq-003':
    '6ec31edd28e18b384cc6bd207da94d6480857d5e6e01dc5637c6cb2726a67de8'
} as const;

test('asset policy controls exactly the 54 hash-bound G5 L4 page subtrees', () => {
  assert.deepEqual(G5_L4_PREVIEW_RUNTIME_SHA256, expected);
  assert.equal(Object.keys(expected).length, 54);
  for (const [animationId, runtimeSha256] of Object.entries(expected)) {
    assert.deepEqual(
      classifyG5L4PreviewAsset(['courses', animationId, 'canvas-renderer.js']),
      {
        controlled: true,
        animationId,
        kind: 'runtime',
        expectedRuntimeSha256: runtimeSha256
      }
    );
    assert.equal(
      classifyG5L4PreviewAsset(['courses', animationId, 'manifest.json']).kind,
      'manifest'
    );
  }
  assert.equal(
    classifyG5L4PreviewAsset([
      'courses',
      'course-g04-l03-vb-002',
      'canvas-renderer.js'
    ]).controlled,
    false
  );
});

test('asset policy rejects traversal and path-separator aliases before classification', () => {
  assert.equal(
    hasSafeFlashAssetSegments([
      'courses',
      'course-g05-l04-vb-002',
      'canvas-renderer.js'
    ]),
    true
  );
  for (const adversarial of [
    ['courses', 'other', '..', 'course-g05-l04-vb-002', 'canvas-renderer.js'],
    ['courses', '.', 'course-g05-l04-vb-002', 'canvas-renderer.js'],
    ['courses/course-g05-l04-vb-002', 'canvas-renderer.js'],
    ['courses', 'course-g05-l04-vb-002\\canvas-renderer.js'],
    []
  ]) {
    assert.equal(hasSafeFlashAssetSegments(adversarial), false);
  }
});

test('runtime requests require one exact lowercase SHA-256 query value', () => {
  for (const digest of Object.values(expected)) {
    assert.equal(
      hasExactG5L4RuntimeDigest(
        new URL(`https://example.test/runtime.js?sha256=${digest}`),
        digest
      ),
      true
    );
    assert.equal(
      hasExactG5L4RuntimeDigest(
        new URL('https://example.test/runtime.js'),
        digest
      ),
      false
    );
    assert.equal(
      hasExactG5L4RuntimeDigest(
        new URL(`https://example.test/runtime.js?sha256=${'f'.repeat(64)}`),
        digest
      ),
      false
    );
    assert.equal(
      hasExactG5L4RuntimeDigest(
        new URL(
          `https://example.test/runtime.js?sha256=${digest}&sha256=${digest}`
        ),
        digest
      ),
      false
    );
  }
});

test('controlled assets allow local audit, explicit preview, or publication independently', () => {
  assert.equal(
    isG5L4PreviewAssetAuthorized({
      developmentAudit: false,
      previewEnabled: false,
      published: false
    }),
    false
  );
  assert.equal(
    isG5L4PreviewAssetAuthorized({
      developmentAudit: false,
      previewEnabled: true,
      published: false
    }),
    true
  );
  assert.equal(
    isG5L4PreviewAssetAuthorized({
      developmentAudit: false,
      previewEnabled: false,
      published: true
    }),
    true
  );
  assert.equal(
    isG5L4PreviewAssetAuthorized({
      developmentAudit: true,
      previewEnabled: false,
      published: false
    }),
    true
  );
});
