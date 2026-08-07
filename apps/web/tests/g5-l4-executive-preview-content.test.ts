import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {matchPrototype} from '@helpmath/demos/prototype-manifest';

import {
  G5_L4_EXECUTIVE_PREVIEW_BOUNDARY,
  G5_L4_EXECUTIVE_PREVIEW_SCENES
} from '../lib/g5-l4-executive-preview-content';

const expectedScenes = [
  [
    1,
    'course-g05-l04-ir-001-a662633d',
    'sprite-53',
    136,
    136,
    954_270,
    '90831653cd5023dc9353f64ae6859df42c8e91bda1cea069e9a9a4dd5c5f06b0'
  ],
  [
    2,
    'course-g05-l04-rw-002',
    'sprite-341',
    419,
    419,
    9_902_018,
    '5bd9d7d4c99901ea866a90a9ab98c609f1856d3136fd63778a9270bcc888d24f'
  ],
  [
    3,
    'course-g05-l04-rw-003',
    'sprite-535',
    1_141,
    1_141,
    19_559_380,
    '1639cf7eeeeda00cbbce347488cec545fddc46e81cffa0b671d625dc781432a3'
  ],
  [
    4,
    'course-g05-l04-rw-004',
    'sprite-227',
    506,
    506,
    8_569_074,
    '0c15179758a7341599ba528a0240dce9fac26955bda8b824143804dc3e1b43bc'
  ],
  [
    5,
    'course-g05-l04-vb-002',
    'sprite-49',
    186,
    186,
    1_059_963,
    '0c7ec104381d5b5a27e99015a1bd2f2ff7053be27bb5977af4e8fa75168e4d50'
  ],
  [
    6,
    'course-g05-l04-vb-003',
    'sprite-95',
    125,
    175,
    972_971,
    '9957cc8bc7adcf4d452d94f771cd407ab82a355be1ad69880a4a3bbbdb7ccc85'
  ],
  [
    7,
    'course-g05-l04-vb-004',
    'sprite-71',
    208,
    257,
    1_609_469,
    '251297925bc18f50b1049de234b97dfa78de8f7a0d2bd201fb365d38698296c7'
  ],
  [
    8,
    'course-g05-l04-vb-005',
    'sprite-46',
    264,
    264,
    1_499_147,
    '4b05d689c9ddb43f8029600647b32a3372eda6ec20b02cf008f28f533a78095e'
  ],
  [
    9,
    'course-g05-l04-vb-006',
    'sprite-42',
    166,
    166,
    1_005_097,
    '0b64b9a1d28af78ec44dc5cac48b76e263556187fec31c46f721bf4e41b2b2fa'
  ],
  [
    10,
    'course-g05-l04-vb-007',
    'sprite-230',
    52,
    136,
    3_188_145,
    'aa16e19e27ac9df676715c92bfeef2400a4f9821a6d2475d134f05569e7ca896'
  ],
  [
    11,
    'course-g05-l04-vb-008',
    'sprite-50',
    197,
    197,
    1_015_614,
    'ca3341ef5d32d587841c4b753f92471796bcdf1b90390861c7e5de6558bef6fc'
  ],
  [
    12,
    'course-g05-l04-vb-009',
    'sprite-51',
    189,
    189,
    975_049,
    '3d63ad097db4e2d1082a17b427296406f01c62b770376d75bbfe264647848bee'
  ],
  [
    13,
    'course-g05-l04-vb-010',
    'sprite-228',
    35,
    88,
    1_575_809,
    'f4ee5f0dc04ad767abe51f255114b969b87b89c0a546a0fe3f2bcf57e3682bd7'
  ],
  [
    14,
    'course-g05-l04-vb-011',
    'sprite-225',
    32,
    81,
    879_299,
    '1de92806431f00e750310d6b6da78eda7114e9ee8358c021afe1827665a3c568'
  ],
  [
    15,
    'course-g05-l04-in-002',
    'sprite-52',
    765,
    765,
    3_358_832,
    'e3054dcaca2f83a16d24992490e3873c379c0e0627ebb089aea089cd27f335b5'
  ],
  [
    16,
    'course-g05-l04-in-003',
    'sprite-217',
    73,
    182,
    3_015_850,
    '4717ec6471a4a2f19eaba6ba55a55db3a4bbab4c40981e54f4555292e44f6c93'
  ],
  [
    17,
    'course-g05-l04-in-004',
    'sprite-436',
    307,
    320,
    12_975_404,
    'b278a5a691133f90e2ed28d0a33a85b95b251ad99999e9f3148c8e5957ba5526'
  ],
  [
    18,
    'course-g05-l04-in-005',
    'sprite-222',
    92,
    226,
    3_110_250,
    'a58891f4224f476432216ecdbd05fe8317eb6b2751b3603c3064370e4225b7da'
  ],
  [
    19,
    'course-g05-l04-in-006',
    'sprite-103',
    413,
    464,
    1_404_871,
    '3c0a82678520f8bc8d12488a1f83f0cc3315a4717857825a2146272a49483b8f'
  ],
  [
    20,
    'course-g05-l04-in-007',
    'sprite-76',
    654,
    654,
    2_495_420,
    'c21d71816db07a291baf9b00190545e39da2c917d47af29f08e461bc03d10358'
  ],
  [
    21,
    'course-g05-l04-in-008',
    'sprite-123',
    121,
    195,
    833_307,
    '09725c3fc1c3610b3a3ac092c4d2d6731a3e645152ffb511721730abcb98d484'
  ],
  [
    22,
    'course-g05-l04-in-009',
    'sprite-29',
    504,
    504,
    1_587_346,
    '0f858fe82f59aef13cdb9cb5657f74934a13a286c5d711ef3e0ec293acfbb5d8'
  ],
  [
    23,
    'course-g05-l04-in-010',
    'sprite-58',
    129,
    180,
    542_904,
    '0832445a5a39159f6af818908e90fbc5a39142d7833d6bfc51a47d8c88bfbdfa'
  ],
  [
    24,
    'course-g05-l04-in-011',
    'sprite-231',
    341,
    428,
    2_679_380,
    'a72d0fd6a6fa1609f58eb6e326b734e010cf9d2274051f9f88d1b4fd25649497'
  ],
  [
    25,
    'course-g05-l04-in-012',
    'sprite-48',
    298,
    298,
    1_464_942,
    '8861a29538e3cea708e87dbc9df98b02f23be6183503aa4a2cead8d3bfbda4fa'
  ],
  [
    26,
    'course-g05-l04-in-013',
    'sprite-170',
    82,
    178,
    2_764_782,
    '3453e5275d38001acb8d20cb8a1e4da1b68a3dd345aed03033f904709e8cbb03'
  ],
  [
    27,
    'course-g05-l04-in-014',
    'sprite-170',
    83,
    197,
    2_787_247,
    'de19e523f2d368b7eefa4a31330baf990998830cea1176305e081acb118c76c8'
  ],
  [
    28,
    'course-g05-l04-in-015',
    'sprite-101',
    601,
    601,
    2_278_489,
    '0cc1c8fd50905997c110f601e6ba657433a1161f518c06fb386db9daadb844e0'
  ],
  [
    29,
    'course-g05-l04-in-016',
    'sprite-264',
    190,
    299,
    3_368_702,
    '2ad1c14ea8556f3da8074923d2448cdd7dd32ae6cf4ec43753c6147229322531'
  ],
  [
    30,
    'course-g05-l04-in-017',
    'sprite-494',
    373,
    541,
    13_244_089,
    'ff7979e70f93dc69c11088309201ef0ec685d95865a583db0bd9c9f356795fff'
  ],
  [
    31,
    'course-g05-l04-in-018',
    'sprite-220',
    217,
    275,
    3_118_715,
    '85ec6c2f4e864dbb37982532ea3882e3b01c8f69b6221996d3bd2a8a08160f7e'
  ],
  [
    32,
    'course-g05-l04-in-019',
    'sprite-265',
    220,
    274,
    1_471_802,
    'c15e0a967664522fd17755dc8a296befec6cc7b2bba5f6cefec671fda93a9ffa'
  ],
  [
    33,
    'course-g05-l04-in-020',
    'sprite-37',
    282,
    282,
    1_664_690,
    'a648ca2be956f1cbe1bd88849f02454cf2003afa65301a72b7faa807203bfb08'
  ],
  [
    34,
    'course-g05-l04-in-021',
    'sprite-97',
    286,
    288,
    1_181_209,
    'f6e7f9b8f5fac4e5a530c14f95e3887a91629b6397fba21b3bda9c02e8af6213'
  ],
  [
    35,
    'course-g05-l04-in-022',
    'sprite-355',
    411,
    475,
    7_702_490,
    'a5517b8ee9e5a27b8ae2cdf1731824078a18e4a656361d189c48a399089405f0'
  ],
  [
    36,
    'course-g05-l04-ti-002',
    'sprite-413',
    256,
    275,
    6_684_657,
    'bcdb04ed1df92261499cc3e0e80c4e924cd141729ae50543018b6586d45f86c5'
  ],
  [
    37,
    'course-g05-l04-ti-003',
    'sprite-270',
    162,
    164,
    1_418_039,
    '589433ea1087962ae26d02877e406dc327cd81c281525e720f60d4345ffc67ca'
  ],
  [
    38,
    'course-g05-l04-ti-004',
    'sprite-299',
    197,
    472,
    2_495_560,
    '95ab482dce807d640b721bffc6435152288510720def3155e7e76bf8e1510ffc'
  ],
  [
    39,
    'course-g05-l04-ti-005',
    'sprite-272',
    137,
    363,
    1_853_788,
    '8e92319b1049bfb69953ccbc962b474b387551996fff85cef017955eab919213'
  ],
  [
    40,
    'course-g05-l04-ti-006',
    'sprite-191',
    187,
    237,
    1_088_485,
    '9f0b990f287c0bf66722c5ebe5f959deee522f1226b374866a162224efe4d0a5'
  ],
  [
    41,
    'course-g05-l04-ti-007',
    'sprite-177',
    111,
    167,
    1_004_906,
    'd12ddeb50b3f48021edca8092c455e117eea95b3c38fc06e2055b0e96f30e661'
  ],
  [
    42,
    'course-g05-l04-ti-008',
    'sprite-160',
    94,
    146,
    767_359,
    'c9b150f664eaf93da7803091f23d98406d1823086411ee17304cf75283b37010'
  ],
  [
    43,
    'course-g05-l04-ti-009',
    'sprite-171',
    96,
    114,
    644_390,
    'd686b05e0997cd50172bd95ca9a6fba426b7cfd6d48658a42fc9b8e5b3480686'
  ],
  [
    44,
    'course-g05-l04-gs-002',
    'sprite-436',
    451,
    460,
    9_683_082,
    'bfc2b31d45fd89773677744ff9a9bd0a0213caa5d78cb1a7d4eef6f80f4c3c07'
  ],
  [
    45,
    'course-g05-l04-ts-002',
    'sprite-28',
    324,
    324,
    563_581,
    '568e79042ebc4423f041868e76d6507a15dd9a2e1d05258b76ea59f86ec8a580'
  ],
  [
    46,
    'course-g05-l04-ts-003',
    'sprite-25',
    227,
    227,
    483_379,
    '300fd5adb8b179a3cdd9aab70ea1b1fd863321402044ad82f2888107023fa08f'
  ],
  [
    47,
    'course-g05-l04-ts-004',
    'sprite-36',
    290,
    290,
    899_011,
    '798dac2092935f6a59885df7070f423d4246987f920e57887ddc61b422424446'
  ],
  [
    48,
    'course-g05-l04-ts-005',
    'sprite-30',
    234,
    234,
    564_290,
    '8ad1d646f9ae5f2bc87a15695b19a3b8829ac07e259352622c2093705c4fbb63'
  ],
  [
    49,
    'course-g05-l04-ts-006',
    'sprite-12',
    245,
    245,
    265_813,
    'c05ebcfe5a7530662265994a5311a21a65c80404136b24988a687f12e0c0551c'
  ],
  [
    50,
    'course-g05-l04-ts-007',
    'sprite-462',
    263,
    684,
    8_776_360,
    '9c43f6375d1566e519209de9bd6dfe1e298b3b984daad707749b8296acefbc91'
  ],
  [
    51,
    'course-g05-l04-ts-008',
    'sprite-435',
    272,
    695,
    9_876_569,
    '123c51a7ef0177203a3951baefc67dd6b8b7855c3aea3bd635217bba8e1fb384'
  ],
  [
    52,
    'course-g05-l04-fq-001',
    'sprite-145',
    52,
    52,
    557_122,
    '539e66402e9d90d871a21a8e05dfe72fccaac631f484d2fc387d37df2da54d13'
  ],
  [
    53,
    'course-g05-l04-fq-002',
    'sprite-694-question-atlas',
    18,
    56,
    1_063_696,
    '73f1525997c667b351031d6f3e8ec09130970aee57dbe9211735844634b9e809'
  ],
  [
    54,
    'course-g05-l04-fq-003',
    'sprite-694-question-atlas',
    18,
    56,
    1_063_718,
    '6ec31edd28e18b384cc6bd207da94d6480857d5e6e01dc5637c6cb2726a67de8'
  ]
] as const;

const sectionCopy = {
  IR: {english: 'Introduction', spanish: 'Introduction'},
  RW: {english: 'Your World', spanish: 'Tu mundo'},
  VB: {english: 'Important Words', spanish: 'Palabras importantes'},
  IN: {english: 'Learn It', spanish: 'Apréndelo'},
  TI: {english: 'Try It', spanish: 'Inténtalo!'},
  GS: {english: 'Play It', spanish: 'Juégalo'},
  TS: {english: 'Practice Test', spanish: 'Plan de los cuatro pasos'},
  FQ: {english: 'Final Quiz', spanish: 'Examen Final'}
} as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function identityFromAnimationId(animationId: string) {
  const match = animationId.match(/-([a-z]{2})-(\d{3})(?:-[a-f0-9]{8})?$/);
  assert.ok(match, animationId);
  return {
    sectionCode: match[1].toUpperCase() as keyof typeof sectionCopy,
    pageNumber: Number(match[2])
  };
}

test('executive preview binds exactly 54 G5 L4 page candidates in release order', () => {
  assert.deepEqual(
    G5_L4_EXECUTIVE_PREVIEW_SCENES.map((scene) => [
      scene.releaseOrdinal,
      scene.animationId,
      scene.frameDomain,
      scene.frameCount,
      scene.sourceFrameCount,
      scene.runtimeBytes,
      scene.runtimeSha256
    ]),
    expectedScenes
  );
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_SCENES.length, 54);
  assert.equal(
    new Set(G5_L4_EXECUTIVE_PREVIEW_SCENES.map((scene) => scene.animationId))
      .size,
    54
  );
  assert.ok(
    G5_L4_EXECUTIVE_PREVIEW_SCENES.every((scene) =>
      /^[a-f0-9]{64}$/.test(scene.sourceSwfSha256)
    )
  );
  assert.ok(
    G5_L4_EXECUTIVE_PREVIEW_SCENES.every((scene) =>
      /^[a-f0-9]{64}$/.test(scene.runtimeSha256)
    )
  );
});

test('all 54 runtime files are exact-byte and exact-SHA bound to their manifests', async () => {
  for (const scene of G5_L4_EXECUTIVE_PREVIEW_SCENES) {
    const root = `../../../public/flash-assets/courses/${scene.animationId}/`;
    const [runtime, manifest] = await Promise.all([
      readFile(new URL(`${root}canvas-renderer.js`, import.meta.url)),
      readFile(new URL(`${root}manifest.json`, import.meta.url), 'utf8').then(
        JSON.parse
      )
    ]);
    const observed = createHash('sha256').update(runtime).digest('hex');
    assert.equal(scene.runtimeBytes, runtime.byteLength, scene.animationId);
    assert.equal(scene.runtimeBytes, manifest.output.bytes, scene.animationId);
    assert.equal(scene.runtimeSha256, observed, scene.animationId);
    assert.equal(
      scene.runtimeSha256,
      manifest.output.sha256,
      scene.animationId
    );
    assert.equal(manifest.animationId, scene.animationId);
    assert.equal(manifest.strictAcceptanceEffect, 'none', scene.animationId);
    assert.ok(
      Object.values(manifest.acceptanceEffects).every(
        (value) => value === false
      ),
      scene.animationId
    );

    if (scene.rendererModel === 'dual-sprite-composite') {
      assert.equal(scene.animationId, 'course-g05-l04-fq-001');
      assert.equal(
        manifest.sourceComposite.primary.frameDomain,
        scene.frameDomain
      );
      assert.deepEqual(manifest.sourceComposite.primary.requestedFrameRange, [
        1,
        scene.frameCount
      ]);
      assert.equal(
        manifest.sourceComposite.companion.frameDomain,
        scene.companionFrameDomain
      );
      assert.equal(
        manifest.sourceComposite.companion.sourceFrame,
        scene.companionFrame
      );
      assert.equal(
        manifest.sourceComposite.companion.standaloneRequestsEnabled,
        false
      );
      assert.equal(manifest.sourceComposite.rootRendered, false);
      assert.equal(
        manifest.requestContract.allowed.frameDomain,
        scene.frameDomain
      );
      assert.equal(manifest.requestContract.allowed.scenario, scene.scenario);
      assert.deepEqual(manifest.requestContract.allowed.languages, ['en']);
      assert.ok(
        manifest.requestContract.rejected.includes('root frame-domain requests')
      );
      assert.ok(
        manifest.requestContract.rejected.includes(
          'sprite-100 standalone frame-domain requests'
        )
      );
    } else if (scene.rendererModel === 'question-atlas') {
      assert.ok(
        ['course-g05-l04-fq-002', 'course-g05-l04-fq-003'].includes(
          scene.animationId
        )
      );
      assert.equal(manifest.questionAtlas.frameDomain, scene.frameDomain);
      assert.equal(manifest.questionAtlas.frameCount, scene.frameCount);
      assert.equal(
        manifest.questionAtlas.sourceStaticStructure.sourceFrameCount,
        scene.sourceFrameCount
      );
      assert.deepEqual(
        manifest.questionAtlas.sourceFrameRange,
        scene.sourceFrameRange
      );
      assert.equal(manifest.questionAtlas.sourceTimelineId, 'sprite-694');
      assert.equal(
        manifest.questionAtlas.sourceStaticStructure
          .sequentialPlaybackPermitted,
        false
      );
      assert.equal(manifest.acceptanceEffects.answerBehaviorComplete, false);
      assert.equal(manifest.acceptanceEffects.scoringComplete, false);
      assert.equal(manifest.acceptanceEffects.reviewComplete, false);
      assert.equal(
        manifest.acceptanceEffects.randomSelectionParityComplete,
        false
      );
    } else {
      assert.equal(
        manifest.timeline.deterministicContentTimeline.timelineId,
        scene.frameDomain
      );
      assert.equal(
        manifest.timeline.deterministicContentTimeline.frameCount,
        scene.sourceFrameCount
      );
      assert.equal(
        manifest.sourceStaticFrameContract.renderableFrames,
        scene.frameCount
      );
      assert.deepEqual(manifest.timeline.supportedLanguages, ['en']);
    }
  }
});

test('all 54 preview pages are registry-addressable legacy prototypes with exact domains', () => {
  for (const scene of G5_L4_EXECUTIVE_PREVIEW_SCENES) {
    const prototype = matchPrototype({animationId: scene.animationId});
    assert.ok(prototype, scene.animationId);
    assert.equal(prototype.key, scene.animationId);
    assert.equal(prototype.runtime.frameCount, 10, scene.animationId);
    assert.equal(prototype.runtime.defaultFrameDomain, scene.frameDomain);
    const frameDomains = prototype.runtime.frameDomains;
    assert.ok(frameDomains, scene.animationId);
    const prototypeDomain = frameDomains.find(
      (domain) => domain.id === scene.frameDomain
    );
    assert.ok(prototypeDomain, scene.animationId);
    const expectedPrototypeFrameCount =
      scene.rendererModel === 'single-sprite'
        ? scene.sourceFrameCount
        : scene.frameCount;
    assert.equal(prototypeDomain.frameCount, expectedPrototypeFrameCount);
    assert.equal(prototype.movie.frameCount, expectedPrototypeFrameCount);
    assert.deepEqual(prototype.sourceBasenames, []);
  }
});

test('titles, sections, ordinals, and source identities remain frozen-source bound', async () => {
  const [sourceScope, indexXml] = await Promise.all([
    readFile(
      new URL(
        '../../../reports/g5-l4-source-scope-freeze.json',
        import.meta.url
      ),
      'utf8'
    ).then(JSON.parse),
    readFile(
      new URL(
        '../../../source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/index.xml',
        import.meta.url
      ),
      'utf8'
    )
  ]);

  for (const scene of G5_L4_EXECUTIVE_PREVIEW_SCENES) {
    const identity = identityFromAnimationId(scene.animationId);
    const sourceLeaf =
      identity.sectionCode === 'IR'
        ? 'L4RW01'
        : `L4${identity.sectionCode}${String(identity.pageNumber).padStart(2, '0')}`;
    const member = sourceScope.members.find(
      (candidate: {animationId: string}) =>
        candidate.animationId === scene.animationId
    );
    assert.ok(member, scene.animationId);
    assert.equal(member.ordinal, scene.releaseOrdinal);
    assert.equal(member.section, identity.sectionCode);
    assert.equal(scene.sectionCode, identity.sectionCode);
    assert.equal(scene.pageNumber, identity.pageNumber);
    assert.equal(
      scene.sectionEnglish,
      sectionCopy[identity.sectionCode].english
    );
    assert.equal(
      scene.sectionSpanish,
      sectionCopy[identity.sectionCode].spanish
    );
    assert.equal(scene.titleSpanish, member.title.spanish ?? scene.title);
    assert.equal(member.source.swf.sha256, scene.sourceSwfSha256);
    assert.equal(
      member.source.swf.path,
      `HELP_COURSES/ELMGR5/L4/${identity.sectionCode}/${sourceLeaf}.swf`
    );

    const sectionMatch = indexXml.match(
      new RegExp(
        `<Section SName="${identity.sectionCode}"[\\s\\S]*?<\\/Section>`
      )
    );
    assert.ok(sectionMatch, identity.sectionCode);
    const sectionXml = sectionMatch[0];
    assert.ok(
      sectionXml.includes(`<English>${scene.sectionEnglish}</English>`)
    );
    assert.ok(
      sectionXml.includes(`<Spanish>${scene.sectionSpanish}</Spanish>`)
    );
    assert.match(
      sectionXml,
      new RegExp(
        `<Page Title="${escapeRegExp(scene.title)}"[^>]*>${identity.sectionCode}/${sourceLeaf}\\.swf<\\/Page>`
      )
    );
  }
});

test('open-frame accounting distinguishes full, prefix, dual-sprite, and atlas candidates', () => {
  const single = G5_L4_EXECUTIVE_PREVIEW_SCENES.filter(
    (scene) => scene.rendererModel === 'single-sprite'
  );
  const fullSingle = single.filter((scene) => scene.blockedFrameCount === 0);
  const prefixSingle = single.filter((scene) => scene.blockedFrameCount > 0);
  const dual = G5_L4_EXECUTIVE_PREVIEW_SCENES.filter(
    (scene) => scene.rendererModel === 'dual-sprite-composite'
  );
  const atlases = G5_L4_EXECUTIVE_PREVIEW_SCENES.filter(
    (scene) => scene.rendererModel === 'question-atlas'
  );

  assert.equal(single.length, 51);
  assert.equal(fullSingle.length, 20);
  assert.equal(prefixSingle.length, 31);
  assert.equal(dual.length, 1);
  assert.equal(
    fullSingle.reduce((total, scene) => total + scene.frameCount, 0),
    7_628
  );
  assert.equal(
    prefixSingle.reduce((total, scene) => total + scene.frameCount, 0),
    6_016
  );
  assert.equal(
    prefixSingle.reduce((total, scene) => total + scene.blockedFrameCount, 0),
    3_020
  );
  assert.equal(dual[0].animationId, 'course-g05-l04-fq-001');
  assert.equal(dual[0].frameCount, 52);
  assert.equal(dual[0].frameDomain, 'sprite-145');
  assert.equal(dual[0].companionFrameDomain, 'sprite-100');
  assert.equal(dual[0].companionFrame, 1);
  assert.equal(dual[0].scenario, 'source-static-composite-prefix');
  assert.equal(atlases.length, 2);
  assert.ok(atlases.every((scene) => scene.frameCount === 18));
  assert.ok(atlases.every((scene) => scene.sourceFrameCount === 56));
  assert.ok(atlases.every((scene) => scene.blockedFrameCount === 38));
  assert.ok(
    atlases.every(
      (scene) => scene.scenario === 'source-static-question-atlas-inspection'
    )
  );
  assert.ok(
    atlases.every((scene) => scene.frameDomain === 'sprite-694-question-atlas')
  );
  assert.ok(
    atlases.every(
      (scene) =>
        scene.sourceFrameRange?.[0] === 2 && scene.sourceFrameRange?.[1] === 19
    )
  );

  assert.deepEqual(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.stage, {
    width: 800,
    height: 600
  });
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.fps, 12);
  assert.equal(
    G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.currentJavascriptSourceStaticCandidateCount,
    54
  );
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.representedSceneCount, 54);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.singleSpriteCandidateCount, 51);
  assert.equal(
    G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.fullSingleSpriteCandidateCount,
    20
  );
  assert.equal(
    G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.prefixSingleSpriteCandidateCount,
    31
  );
  assert.equal(
    G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.dualSpriteCompositeCandidateCount,
    1
  );
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.questionAtlasCandidateCount, 2);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.activePageCount, 54);
  assert.equal(
    G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.shellCurrentJavascriptCandidateCount,
    1
  );
  assert.equal(
    G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.lessonMvpCurrentJavascriptCandidateCount,
    55
  );
  assert.equal(
    G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.lessonMvpCurrentJavascriptCandidateComplete,
    true
  );
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.representedFrameCount, 13_732);
  assert.equal(
    G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.representedSourceFrameCount,
    16_828
  );
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.blockedFrameCount, 3_096);
});

test('preview authorization cannot promote fidelity, Replay, strict completion, or publication', () => {
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.previewAuthorized, true);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.rootTimelineAccepted, false);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.spanishVisualAccepted, false);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.audioAccepted, false);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.behaviorAccepted, false);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.sourceControlsAccepted, false);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.replayParityAccepted, false);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.normalizedRmseComplete, false);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.originalRuntimeAccepted, false);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.naturalEntryAccepted, false);
  assert.equal(
    G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.originalRuntimeNaturalEntryAccepted,
    false
  );
  assert.equal(
    G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.humanVisualReviewAccepted,
    false
  );
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.ownerFidelityAccepted, false);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.strictMigrationComplete, false);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.strictCompleteCount, 0);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.releaseMemberCount, 55);
  assert.equal(G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.published, false);
});

test('client renderer stays current-JS-only and labels Replay as a modern reset', async () => {
  const source = await readFile(
    new URL('../components/g5-l4-executive-preview.tsx', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(source, /<(?:object|embed)\b|from\s+['"][^'"]*ruffle/i);
  assert.doesNotMatch(source, /\beval\s*\(|\bFunction\s*\(/);
  assert.doesNotMatch(
    source,
    /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/
  );
  assert.match(source, /<AnimationRuntime/);
  assert.match(source, /scenario: scene\.scenario/);
  assert.match(source, /lang: 'en'/);
  assert.match(source, /source-static-current-javascript-preview-not-strict/);
  assert.match(source, /data-current-js-page-progress="54\/54"/);
  assert.match(source, /data-current-js-lesson-mvp-progress="55\/55"/);
  assert.match(source, /data-current-js-source-static-progress="55\/55"/);
  assert.match(source, /data-canonical-governance-candidate-progress="52\/55"/);
  assert.match(source, /data-root-timeline-accepted="false"/);
  assert.match(source, /data-spanish-visual-accepted="false"/);
  assert.match(source, /data-audio-accepted="false"/);
  assert.match(source, /data-behavior-accepted="false"/);
  assert.match(source, /data-source-controls-accepted="false"/);
  assert.match(source, /data-replay-parity-accepted="false"/);
  assert.match(source, /data-natural-entry-accepted="false"/);
  assert.match(source, /data-normalized-rmse-complete="false"/);
  assert.match(source, /data-original-runtime-accepted="false"/);
  assert.match(source, /data-original-runtime-natural-entry-accepted="false"/);
  assert.match(source, /data-human-visual-review-accepted="false"/);
  assert.match(source, /data-owner-fidelity-accepted="false"/);
  assert.match(source, /data-release-progress="0\/55"/);
  assert.match(source, /data-release-published="false"/);
  assert.match(source, /data-strict-migration-complete="false"/);
  assert.match(
    source,
    /54 runnable, hash-bound current-JavaScript page candidates/
  );
  assert.match(source, /13,732\/13,732/);
  assert.match(source, /Replay resets only the modern preview player/);
  assert.match(source, /51 source-static single-sprite/);
  assert.match(source, /one source-static dual-sprite composite/);
  assert.match(
    source,
    /two independent 18-question source-static inspection atlases/
  );
  assert.match(
    source,
    /The two atlases do not enter canonical migration governance/
  );
  assert.match(source, /Strict completion remains 0\/55 and unpublished/);
  assert.match(
    source,
    /Reduced motion is enabled; the deterministic first inspection frame is shown/,
  );
  assert.match(
    source,
    /El movimiento reducido está activado; se muestra el primer fotograma determinista de inspección/,
  );
  assert.doesNotMatch(source, /deterministic terminal frame is shown/);
  assert.match(source, /animationId === 'course-g05-l04-vb-002'/);
  assert.match(source, /locale === 'es' \? item\.titleSpanish : item\.title/);
  assert.doesNotMatch(source, /34\/55|34 of 55|9,744|9\.744|1,882|1\.882/i);
  assert.doesNotMatch(source, /<SceneVisual|<svg/);
});
