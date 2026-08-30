import type {AnimationLanguage, MovieMetadata, RuntimeContext} from '../contract';
import {
  COURSE_SHELL_G04_L03_MOVER_ASSET_MANIFEST_SHA256,
  COURSE_SHELL_G04_L03_MOVER_VISUAL_ASSETS,
  COURSE_SHELL_G04_L03_MOVER_VISUAL_RUNS
} from './generated/shell-course-g04-l03-sprite-528-assets';
import {COURSE_SHELL_G04_L03_CONTROL_DOMAIN_DATA} from './generated/shell-course-g04-l03-control-assets';
import {
  COURSE_SHELL_G04_L03_PROGRESS_ASSET_MANIFEST_SHA256,
  COURSE_SHELL_G04_L03_PROGRESS_FRAME_ASSETS
} from './generated/shell-course-g04-l03-sprite-132-assets';
import {
  COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA,
  COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS,
  type CourseShellG04L03AdditionalDomainId
} from './generated/shell-course-g04-l03-additional-domain-assets';
import {
  COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA,
  COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS,
  type CourseShellG04L03SingleFrameDomainId
} from './generated/shell-course-g04-l03-single-frame-domain-assets';

export const COURSE_SHELL_G04_L03_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: 50,
  durationMs: (50 * 1_000) / 12
});

export const COURSE_SHELL_G04_L03_SOURCE = Object.freeze({
  animationId: 'shell-course-g04-l03-index-local',
  swfSha256: '817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e',
  courseXmlSha256: '0f1109321a5b65507c36fb8fd30380c4899cb7f381c2959aa7092d59bba990b0',
  frame35ScriptSha256: 'c070856dfd4868480ac5b826a8a155e2441f4dea353e6d8eeb9775108d899db0',
  frame49ScriptSha256: 'e123f46532b5797df9bfdad8e2778d116dc900fbda07bc3003d1f80ffce26158',
  frame50ScriptSha256: '5b8eab18c203538d658759ab058914417155bd84ae198af107cd1fcb582b29a4',
  courseName: 'Counting on Numbers',
  lessonTitleEnglish: 'Negative Numbers',
  lessonTitleSpanish: null,
  rootInitializationFrame: 49,
  rootProjectionFrame: 50,
  activeXmlPageCount: 39,
  staticShellCandidatePageCount: 44,
  staticShellConflictStatus: 'unresolved' as const
});

export const COURSE_SHELL_G04_L03_ROOT_FRAME_ASSET_BASE =
  '/flash-assets/courses/shell-course-g04-l03-index-local/root-frames';
export const COURSE_SHELL_G04_L03_ADDITIONAL_ASSET_BASE =
  '/flash-assets/courses/shell-course-g04-l03-index-local';
export const COURSE_SHELL_G04_L03_NATIVE_MENU_ASSET_BASE =
  '/flash-assets/courses/shell-course-g04-l03-index-local/sprite-1011';
export const COURSE_SHELL_G04_L03_NATIVE_MENU = Object.freeze({
  frameDomain: 'sprite-1011' as const,
  sourceCharacterId: 1011,
  sourceInstanceId: 'm1_l1',
  frameCount: 48,
  rootFrame: 50,
  rootDepth: 263,
  exporterCanvas: Object.freeze({width: 1368, height: 719}),
  exporterLocalOrigin: Object.freeze({x: 726.8, y: 671.5}),
  rootTranslatePixels: Object.freeze({x: 240.15, y: 545.4}),
  rootCompositionOffset: Object.freeze({x: -486.65, y: -126.1}),
  assetManifestSha256: '0d89cfe921a7c0753f4b4895b27ecf9f77277b6c22f2f280ef38f8c42b3eb241'
});

export const COURSE_SHELL_G04_L03_NATIVE_MENU_FRAME_HASHES = Object.freeze([
  'd1353bea76f7b24f2e2c69ebbc35bd055d3c32fe26d4b3a825ed69d27076766a',
  'd1353bea76f7b24f2e2c69ebbc35bd055d3c32fe26d4b3a825ed69d27076766a',
  'd1353bea76f7b24f2e2c69ebbc35bd055d3c32fe26d4b3a825ed69d27076766a',
  'd1353bea76f7b24f2e2c69ebbc35bd055d3c32fe26d4b3a825ed69d27076766a',
  'd1353bea76f7b24f2e2c69ebbc35bd055d3c32fe26d4b3a825ed69d27076766a',
  'd1353bea76f7b24f2e2c69ebbc35bd055d3c32fe26d4b3a825ed69d27076766a',
  'd1353bea76f7b24f2e2c69ebbc35bd055d3c32fe26d4b3a825ed69d27076766a',
  'd1353bea76f7b24f2e2c69ebbc35bd055d3c32fe26d4b3a825ed69d27076766a',
  '9c09d82cb8996c73371da5938e85396f1e70aca4505b3c5c6010b25c2b92a64d',
  '9c09d82cb8996c73371da5938e85396f1e70aca4505b3c5c6010b25c2b92a64d',
  '9c09d82cb8996c73371da5938e85396f1e70aca4505b3c5c6010b25c2b92a64d',
  '9c09d82cb8996c73371da5938e85396f1e70aca4505b3c5c6010b25c2b92a64d',
  '9c09d82cb8996c73371da5938e85396f1e70aca4505b3c5c6010b25c2b92a64d',
  '9c09d82cb8996c73371da5938e85396f1e70aca4505b3c5c6010b25c2b92a64d',
  '9c09d82cb8996c73371da5938e85396f1e70aca4505b3c5c6010b25c2b92a64d',
  '9c09d82cb8996c73371da5938e85396f1e70aca4505b3c5c6010b25c2b92a64d',
  '9c09d82cb8996c73371da5938e85396f1e70aca4505b3c5c6010b25c2b92a64d',
  '0c7fa5b50a419c66c98ab5b4cb7171ada817d83a23d678a015ad2d66c775bc04',
  '1b38d32d538e8b1017d392177e53dd0b535e56cf4ed195aba860cfd2e67df1a3',
  'dd7f25e8e076000f4978ed82914fc77b3a515a95b973dbee7a41d5a033568e89',
  'e5cb67b51e81af88918b3a4779d87e93e67b54057012ce29314a98276040c633',
  '3328a704522c6a036c675292126718b9c305812f2184aed196fd3463a3fcafc9',
  '8d66cdb95f1262612b36b93dec54bf1762dc61cd88760f210e990aa25365f280',
  'b7d1cb2110f549b447fb4091b0779644c5ecc7cb4565c03b8277c88f82efcae4',
  'bd2f2b7046a3e156ebba0181e21db8b6534436df9c9cbb3f7c7d052f1f51012a',
  'b23f7cbffefa0eafaf14ecc798152acfb08bf122e023d0a7377dd6b8d98a446f',
  'e38f8cff868cc48f4b364a7b519b044710018d869162055cc989571886114cd7',
  'af9dc360d1289a21ec9d734a360a720eae4d062acfe28e81a2d198c88e18ab71',
  '2fb0a2a23a553d9a31fcb45d810b8e09188581e8e48fc5c41752862170dd57de',
  '7a5c54a5bf61d5be61adba555b13a67613ed57bc645610962a415e71c6b9d141',
  'b0b2488c3f6a30afb45838799e292c96c0d5c9694c33406d2694cf9f9cafef6d',
  '3ecef94759013c0c6332d9c36b3ff58ec3aa5d38177a0dc36d3d057a4b6a07ed',
  'c163a55e5a7174f18a4a1e5a47ad3ef0689fee26333d2d8427dd1590f6df06e6',
  '2ea065206514cc5d6fea16414de2d44dc46326f39009ab0af80249a8b47e4993',
  'a583630d7439ebfdcd719a9bb8930889c14a19e6b4117397a33b47237709b006',
  '05bbfb13a236549d59d3ea82e3a739e35cc18dbddb43564b09da1ca07481521b',
  'ccdc45f9324c7d1658710ab3210ec34eadf1ec6f5b715ea1273c8411fa092a62',
  '968400d06fc39772fadb8524b5f4ca724473812049a1350198cf2e20dc89a1bd',
  '792604cf0343792fd709d7eb725ea5325a4a1d0e8cc4835dbe0be556ce1fd48a',
  '96db50d7f092314d3f98f58b6a275ea435102a99d19819290d1e08bc95fcb217',
  '671a35f497106c4e4f8f073f03cc2da99a7eed01550be86fb125a861e70eaf6f',
  '166289c0be3cc494d40a3f00aa3a5e1fa28a984b30cc43eb7c04fe76c05c89a9',
  '5c86872077e7f75078cc1f600071c96e8f20fb86f633e75ac0e3d616f190c56d',
  'a6613a69fa13c28fb364be04a582880d6d7d074ccf044b9faf428d2687b5b842',
  '9f916366b7018c7d3d82dd41629482d5dd28abb8c3bbaa41e762c984e008c6a2',
  '88f43d152fcc453b0f0e098d6b1493b3aeccd254142c21c2385139619068c8c0',
  '2c8f39b0229b672996fda503325de6f78d6b1435471f5ed58da64cb3289b464d',
  '9ec5e2fca2f6c2556c05b2efe82dbdd0a0acc06a367f9d19401d65b5b81d4e6b'
] as const);

export const COURSE_SHELL_G04_L03_MOVER_ASSET_BASE =
  '/flash-assets/courses/shell-course-g04-l03-index-local/sprite-528';
export const COURSE_SHELL_G04_L03_MOVER = Object.freeze({
  frameDomain: 'sprite-528' as const,
  sourceCharacterId: 528,
  sourceInstanceId: 'mover_mc',
  frameCount: 871,
  rootFrame: 49,
  rootDepth: 423,
  exporterCanvas: Object.freeze({width: 1463, height: 263}),
  exporterLocalOrigin: Object.freeze({x: 1248.05, y: 204.9}),
  rootTranslatePixels: Object.freeze({x: 567.55, y: 441.7}),
  rootCompositionOffset: Object.freeze({x: -680.5, y: 236.8}),
  assetManifestSha256: COURSE_SHELL_G04_L03_MOVER_ASSET_MANIFEST_SHA256
});
export const COURSE_SHELL_G04_L03_POPUP_ASSET_BASE =
  '/flash-assets/courses/shell-course-g04-l03-index-local/sprite-302';
export const COURSE_SHELL_G04_L03_POPUP = Object.freeze({
  frameDomain: 'sprite-302' as const,
  sourceCharacterId: 302,
  sourceInstanceId: 'popup',
  frameCount: 149,
  rootFrame: 49,
  rootDepth: 239,
  exporterCanvas: Object.freeze({width: 1362, height: 485}),
  exporterLocalOrigin: Object.freeze({x: 1181.2, y: 467.4}),
  rootTranslatePixels: Object.freeze({x: 618.75, y: 505.55}),
  rootCompositionOffset: Object.freeze({x: -562.45, y: 38.15}),
  assetManifestSha256:
    COURSE_SHELL_G04_L03_CONTROL_DOMAIN_DATA['sprite-302'].assetManifestSha256
});
export const COURSE_SHELL_G04_L03_MOUSE_OBJECT_ASSET_BASE =
  '/flash-assets/courses/shell-course-g04-l03-index-local/sprite-327';
export const COURSE_SHELL_G04_L03_MOUSE_OBJECT = Object.freeze({
  frameDomain: 'sprite-327' as const,
  sourceCharacterId: 327,
  sourceInstanceId: 'mouseobj',
  frameCount: 132,
  rootFrame: 49,
  rootDepth: 243,
  exporterCanvas: Object.freeze({width: 1398, height: 532}),
  exporterLocalOrigin: Object.freeze({x: 1195.6, y: 467.4}),
  rootTranslatePixels: Object.freeze({x: 618.75, y: 605.55}),
  rootCompositionOffset: Object.freeze({x: -576.85, y: 138.15}),
  assetManifestSha256:
    COURSE_SHELL_G04_L03_CONTROL_DOMAIN_DATA['sprite-327'].assetManifestSha256
});
export const COURSE_SHELL_G04_L03_PROGRESS_ASSET_BASE =
  '/flash-assets/courses/shell-course-g04-l03-index-local/sprite-132';
export const COURSE_SHELL_G04_L03_PROGRESS = Object.freeze({
  frameDomain: 'sprite-132' as const,
  sourceCharacterId: 132,
  sourceInstanceId: 'preloader_mc.progress_mc',
  frameCount: 100,
  rootFrame: 1,
  rootDepth: 5,
  exporterCanvas: Object.freeze({width: 500, height: 42}),
  exporterLocalOrigin: Object.freeze({x: 371.2, y: 11.5}),
  rootTranslatePixels: Object.freeze({x: 394.25, y: 309.75}),
  rootCompositionOffset: Object.freeze({x: 23.05, y: 298.25}),
  assetManifestSha256: COURSE_SHELL_G04_L03_PROGRESS_ASSET_MANIFEST_SHA256
});

/**
 * Hashes bind the product-readable copies to the FFDec static root export.
 * They are structural inspection assets, not an original-runtime baseline.
 */
export const COURSE_SHELL_G04_L03_ROOT_FRAME_ASSETS = Object.freeze([
  Object.freeze({frame: 1, file: 'frame-0001.png', sha256: 'c837d81ea38236a5f1d6c0c0fa521f7c4ed2dea5c0036c1024c8e17ed3164eb6'}),
  Object.freeze({frame: 2, file: 'frame-0002.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 3, file: 'frame-0003.png', sha256: '0c46128f7385159c9ae74d69f8163e80c653ddb383b4320cf45f0ba1f401358d'}),
  Object.freeze({frame: 4, file: 'frame-0004.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 5, file: 'frame-0005.png', sha256: 'df3ea9cc8cea8dc3aefccad889b013845554c8c5a14167d708c68c9eabcf6b08'}),
  Object.freeze({frame: 6, file: 'frame-0006.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 7, file: 'frame-0007.png', sha256: '08d916ab0c1d1ad70e8959751d26e29f9c435935fbf0c7c1be1802d9d7f68ad5'}),
  Object.freeze({frame: 8, file: 'frame-0008.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 9, file: 'frame-0009.png', sha256: 'd0e86e9de99b81fcc967bd62a4ae985fbc0bfc513193f0ca37b8a0eaa0fce087'}),
  Object.freeze({frame: 10, file: 'frame-0010.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 11, file: 'frame-0011.png', sha256: 'fa432b173c93ac4087f237145cfab430708089324b45d1da33e59f27d2dcf6ce'}),
  Object.freeze({frame: 12, file: 'frame-0012.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 13, file: 'frame-0013.png', sha256: '0131f90fc9ded615a61cb56a55aabcda305392dd6ed57c3bf19827ead23f6303'}),
  Object.freeze({frame: 14, file: 'frame-0014.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 15, file: 'frame-0015.png', sha256: 'b8db8f0809e6419b8c62ae01b13c91f91e592037157e6891a51f7ffd22bacd46'}),
  Object.freeze({frame: 16, file: 'frame-0016.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 17, file: 'frame-0017.png', sha256: '475a46a8f7ad25f4e204b7603689cfe29edf5ba9fff787d52ccecafe8e6d90a4'}),
  Object.freeze({frame: 18, file: 'frame-0018.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 19, file: 'frame-0019.png', sha256: '13c67dff15209e2b0c8a705ae07c5fbf91180f62ddf9942e96f0f417be2f52eb'}),
  Object.freeze({frame: 20, file: 'frame-0020.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 21, file: 'frame-0021.png', sha256: 'f3bcf3fff08f02e7b22a9f5077e896eff3d0afc11fd9a994dd669fe0aae645d8'}),
  Object.freeze({frame: 22, file: 'frame-0022.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 23, file: 'frame-0023.png', sha256: '5d6695efb85b9002b05ed4079619bae33d658caa997c6fd671b92ac62885bac2'}),
  Object.freeze({frame: 24, file: 'frame-0024.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 25, file: 'frame-0025.png', sha256: 'e810925faa3f5368735362ea01395894b99b7cb5949070376d1e0bb82e02f574'}),
  Object.freeze({frame: 26, file: 'frame-0026.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 27, file: 'frame-0027.png', sha256: 'ef0dfc1028ab65931cbf4434aa281e6a4caa3e16831b69c691b7db66d7f72047'}),
  Object.freeze({frame: 28, file: 'frame-0028.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 29, file: 'frame-0029.png', sha256: '465c8c305ff084a9d9dc0e7c09b55856927934351bc197cceaba7b2bbcbc7857'}),
  Object.freeze({frame: 30, file: 'frame-0030.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 31, file: 'frame-0031.png', sha256: '457f4b00faa4b2d9fd92407d0edbeced4399f5f9529aef7071bad065299fc0f1'}),
  Object.freeze({frame: 32, file: 'frame-0032.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 33, file: 'frame-0033.png', sha256: '478687ab8718ea3f22bf24657f21bc77f2d8b68c7e6073d6d13b9c67dcc6f69e'}),
  Object.freeze({frame: 34, file: 'frame-0034.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 35, file: 'frame-0035.png', sha256: '2a3fd163792666ae87a4d9d4a3b342556fc3444b5df24f5fbbbdee5fe8ec8a21'}),
  Object.freeze({frame: 36, file: 'frame-0036.png', sha256: '6f409d32061a158cd6b149bb45ddd3c34cb4a3bb1d23538be4034d80dff0997a'}),
  Object.freeze({frame: 37, file: 'frame-0037.png', sha256: '6c5cc749d2bd498e632ebdb18be1f9a6ff5db620580d5cde19ecbaf75c8adfa0'}),
  Object.freeze({frame: 38, file: 'frame-0038.png', sha256: '9fd45a36549246fade6404a3c6732823c9a20c1d7684f3e0df79f0ee1cbc981c'}),
  Object.freeze({frame: 39, file: 'frame-0039.png', sha256: '9fd45a36549246fade6404a3c6732823c9a20c1d7684f3e0df79f0ee1cbc981c'}),
  Object.freeze({frame: 40, file: 'frame-0040.png', sha256: '9fd45a36549246fade6404a3c6732823c9a20c1d7684f3e0df79f0ee1cbc981c'}),
  Object.freeze({frame: 41, file: 'frame-0041.png', sha256: '9fd45a36549246fade6404a3c6732823c9a20c1d7684f3e0df79f0ee1cbc981c'}),
  Object.freeze({frame: 42, file: 'frame-0042.png', sha256: '9fd45a36549246fade6404a3c6732823c9a20c1d7684f3e0df79f0ee1cbc981c'}),
  Object.freeze({frame: 43, file: 'frame-0043.png', sha256: '9fd45a36549246fade6404a3c6732823c9a20c1d7684f3e0df79f0ee1cbc981c'}),
  Object.freeze({frame: 44, file: 'frame-0044.png', sha256: '9fd45a36549246fade6404a3c6732823c9a20c1d7684f3e0df79f0ee1cbc981c'}),
  Object.freeze({frame: 45, file: 'frame-0045.png', sha256: '9fd45a36549246fade6404a3c6732823c9a20c1d7684f3e0df79f0ee1cbc981c'}),
  Object.freeze({frame: 46, file: 'frame-0046.png', sha256: '9fd45a36549246fade6404a3c6732823c9a20c1d7684f3e0df79f0ee1cbc981c'}),
  Object.freeze({frame: 47, file: 'frame-0047.png', sha256: '9fd45a36549246fade6404a3c6732823c9a20c1d7684f3e0df79f0ee1cbc981c'}),
  Object.freeze({frame: 48, file: 'frame-0048.png', sha256: '1b7dc8832219ee20438a80514cf0b11afe0abda6f169d36a855eb1afd9e7e902'}),
  Object.freeze({frame: 49, file: 'frame-0049.png', sha256: '32787a9cccfa2f5d167c5377f2a169fe2d4393ab7a08047536c7695ef60832a9'}),
  Object.freeze({frame: 50, file: 'frame-0050.png', sha256: '3fea5a88bd4fbc907d1d814a78e81cecdcedf42294461fd93a46fe6678097802'})
] as const);

export const COURSE_SHELL_G04_L03_SECTION_CODES = Object.freeze([
  'IR',
  'RW',
  'VB',
  'IN',
  'TI',
  'GS',
  'TS',
  'FQ'
] as const);

export type CourseShellG04L03SectionCode =
  (typeof COURSE_SHELL_G04_L03_SECTION_CODES)[number];
export type CourseShellG04L03Phase =
  | 'source-loading-static-structure'
  | 'source-initialization-static-structure'
  | 'source-close-confirmation-static-structure'
  | 'source-native-menu-static-structure'
  | 'source-mover-tooltip-static-structure'
  | 'source-control-tooltip-static-structure'
  | 'source-preloader-progress-static-structure'
  | 'source-additional-domain-static-structure'
  | 'source-single-frame-domain-static-structure';
export type CourseShellG04L03Presentation =
  | 'ffdec-structural-root'
  | 'ffdec-structural-native-menu'
  | 'ffdec-structural-mover-tooltip'
  | 'ffdec-structural-control-tooltip'
  | 'ffdec-structural-preloader-progress'
  | 'ffdec-structural-additional-domain'
  | 'ffdec-structural-single-frame-domain'
  | 'current-javascript-lesson-map';
export type CourseShellG04L03View = 'menu' | 'section' | 'quit-confirmation';

export interface CourseShellG04L03Page {
  readonly globalPageOrdinal: number;
  readonly sectionPageOrdinal: number;
  readonly sectionCode: CourseShellG04L03SectionCode;
  readonly sourcePath: string;
  readonly animationId: string;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
  readonly spanishTitleStatus:
    | 'exact-subpage-anchor-label'
    | 'missing-page-level-spanish-title';
  /** Local current-JavaScript audit route; this is never a strict/public admission signal. */
  readonly auditRoute: string;
  readonly strictRoute: null;
}

export interface CourseShellG04L03Section {
  readonly order: number;
  readonly code: CourseShellG04L03SectionCode;
  readonly titleEnglish: string;
  readonly titleSpanish: string;
  readonly pages: readonly CourseShellG04L03Page[];
}

type PageInput = readonly [
  sourcePath: string,
  animationId: string,
  titleEnglish: string,
  titleSpanish?: string
];

function page(
  globalPageOrdinal: number,
  sectionPageOrdinal: number,
  sectionCode: CourseShellG04L03SectionCode,
  input: PageInput
): CourseShellG04L03Page {
  const [sourcePath, animationId, titleEnglish, titleSpanish] = input;
  return Object.freeze({
    globalPageOrdinal,
    sectionPageOrdinal,
    sectionCode,
    sourcePath,
    animationId,
    titleEnglish,
    titleSpanish: titleSpanish ?? null,
    spanishTitleStatus: titleSpanish
      ? 'exact-subpage-anchor-label'
      : 'missing-page-level-spanish-title',
    auditRoute: `/animations/${animationId}?auditContext=g4-l3-lesson`,
    strictRoute: null
  });
}

let globalPageOrdinal = 0;
function section(
  order: number,
  code: CourseShellG04L03SectionCode,
  titleEnglish: string,
  titleSpanish: string,
  inputs: readonly PageInput[]
): CourseShellG04L03Section {
  const pages = inputs.map((input, index) =>
    page(++globalPageOrdinal, index + 1, code, input)
  );
  return Object.freeze({
    order,
    code,
    titleEnglish,
    titleSpanish,
    pages: Object.freeze(pages)
  });
}

export const COURSE_SHELL_G04_L03_SECTIONS: readonly CourseShellG04L03Section[] =
  Object.freeze([
    section(1, 'IR', 'Introduction', 'Introduction', [
      ['IR/L3RW01.swf', 'course-g04-l03-ir-001-341242cc', 'Introduction']
    ]),
    section(2, 'RW', 'Your World', 'Tu mundo', [
      ['RW/L3RW02.swf', 'course-g04-l03-rw-002', 'Page 1'],
      ['RW/L3RW03.swf', 'course-g04-l03-rw-003', 'Page 2'],
      ['RW/L3RW04.swf', 'course-g04-l03-rw-004', 'Page 3']
    ]),
    section(3, 'VB', 'Important Words', 'Palabras importantes', [
      ['VB/L3VB02.swf', 'course-g04-l03-vb-002', 'Number Line', 'Recta numérica'],
      ['VB/L3VB03.swf', 'course-g04-l03-vb-003', 'Number Line Practice', 'Práctica de la recta numérica'],
      ['VB/L3VB04.swf', 'course-g04-l03-vb-004', 'Positive Numbers', 'Números positivos'],
      ['VB/L3VB05.swf', 'course-g04-l03-vb-005', 'Negative Numbers', 'Números negativos'],
      ['VB/L3VB06.swf', 'course-g04-l03-vb-006', 'Zero', 'Cero'],
      ['VB/L3VB07.swf', 'course-g04-l03-vb-007', 'Positive Numbers Practice', 'Práctica de números positivos'],
      ['VB/L3VB08.swf', 'course-g04-l03-vb-008', 'Negative Numbers Practice', 'Práctica de números negativos'],
      ['VB/L3VB09.swf', 'course-g04-l03-vb-009', 'Pattern', 'Patrón']
    ]),
    section(4, 'IN', 'Learn It', 'Apréndelo', [
      ['IN/L3IN02.swf', 'course-g04-l03-in-002', 'Numbers on the Number Line', 'Los números en la recta numérica'],
      ['IN/L3IN03.swf', 'course-g04-l03-in-003', 'Numbers on the Number Line'],
      ['IN/L3IN04.swf', 'course-g04-l03-in-004', 'Numbers on the Number Line'],
      ['IN/L3IN05.swf', 'course-g04-l03-in-005', 'Numbers on the Number Line'],
      ['IN/L3IN06.swf', 'course-g04-l03-in-006', 'Numbers on the Number Line'],
      ['IN/L3IN07.swf', 'course-g04-l03-in-007', 'Patterns', 'Patrones'],
      ['IN/L3IN08.swf', 'course-g04-l03-in-008', 'Patterns'],
      ['IN/L3IN09.swf', 'course-g04-l03-in-009', 'Situations with Negative Numbers: Temperature', 'Situaciones con números negativos Temperature:Temperatura'],
      ['IN/L3IN10.swf', 'course-g04-l03-in-010', 'Situations with Negative Numbers: Temperature'],
      ['IN/L3IN11.swf', 'course-g04-l03-in-011', 'Situations with Negative Numbers: Owing', 'Situaciones con números negativos : Deber'],
      ['IN/L3IN12.swf', 'course-g04-l03-in-012', 'Situations with Negative Numbers: Owing']
    ]),
    section(5, 'TI', 'Try It', 'Inténtalo!', [
      ['TI/L3TI02.swf', 'course-g04-l03-ti-002', 'Question 1'],
      ['TI/L3TI03.swf', 'course-g04-l03-ti-003', 'Question 2'],
      ['TI/L3TI04.swf', 'course-g04-l03-ti-004', 'Question 3'],
      ['TI/L3TI05.swf', 'course-g04-l03-ti-005', 'Question 4'],
      ['TI/L3TI06.swf', 'course-g04-l03-ti-006', 'Question 5']
    ]),
    section(6, 'GS', 'Play It', 'Juégalo', [
      ['GS/L3GS02.swf', 'course-g04-l03-gs-002', 'Game 1']
    ]),
    section(7, 'TS', 'Practice Test', 'Plan de los cuatro pasos', [
      ['TS/L3TS02.swf', 'course-g04-l03-ts-002', '4 - Step Plan', 'Plan de 4 Pasos'],
      ['TS/L3TS03.swf', 'course-g04-l03-ts-003', '4 - Step Plan'],
      ['TS/L3TS04.swf', 'course-g04-l03-ts-004', '4 - Step Plan'],
      ['TS/L3TS05.swf', 'course-g04-l03-ts-005', '4 - Step Plan'],
      ['TS/L3TS06.swf', 'course-g04-l03-ts-006', '4 - Step Plan'],
      ['TS/L3TS07.swf', 'course-g04-l03-ts-007', 'Question 1', 'Pregunta 1'],
      ['TS/L3TS08.swf', 'course-g04-l03-ts-008', 'Question 2', 'Pregunta 2']
    ]),
    section(8, 'FQ', 'Final Quiz', 'Examen Final', [
      ['FQ/L3FQ01.swf', 'course-g04-l03-fq-001', 'Introduction'],
      ['FQ/L3FQ02.swf', 'course-g04-l03-fq-002', 'Page 1'],
      ['FQ/L3FQ03.swf', 'course-g04-l03-fq-003', 'Page 2']
    ])
  ]);

export interface CourseShellG04L03InteractionState {
  readonly view: CourseShellG04L03View;
  readonly selectedSection: CourseShellG04L03SectionCode | null;
}

export interface CourseShellG04L03FrameState {
  readonly frameDomain: 'root' | 'sprite-1011' | 'sprite-132' | 'sprite-302' | 'sprite-327' | 'sprite-528' | CourseShellG04L03AdditionalDomainId | CourseShellG04L03SingleFrameDomainId;
  readonly frame: number;
  readonly rootFrame: number;
  readonly status: 'ready';
  readonly blocker: null;
  readonly phase: CourseShellG04L03Phase;
  readonly presentation: CourseShellG04L03Presentation;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly scenario: string;
  readonly view: CourseShellG04L03View;
  readonly selectedSection: CourseShellG04L03SectionCode | null;
  readonly courseTitle: string;
  readonly lessonTitle: string;
  readonly lessonTitleLanguage: 'en';
  readonly lessonTitleFallback: boolean;
  readonly sections: readonly CourseShellG04L03Section[];
  readonly rootFrameAsset: Readonly<{source: string; sha256: string}>;
  readonly nestedFrameAsset: Readonly<{source: string; sha256: string}> | null;
  readonly nestedGeometry:
    | typeof COURSE_SHELL_G04_L03_NATIVE_MENU
    | typeof COURSE_SHELL_G04_L03_PROGRESS
    | typeof COURSE_SHELL_G04_L03_POPUP
    | typeof COURSE_SHELL_G04_L03_MOUSE_OBJECT
    | typeof COURSE_SHELL_G04_L03_MOVER
    | (typeof COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA)[CourseShellG04L03AdditionalDomainId]
    | (typeof COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA)[CourseShellG04L03SingleFrameDomainId]
    | null;
  readonly rootVisualAuthority: 'ffdec-static-root-timeline-structural-render-not-original-runtime';
  readonly nestedVisualAuthority: 'ffdec-static-nested-timeline-structural-render-not-original-runtime' | null;
  readonly originalRuntimeBaselineComplete: false;
  readonly actionScriptExecuted: false;
  readonly strictAcceptanceEffect: 'none';
}

export type CourseShellG04L03Event =
  | Readonly<{type: 'select-section'; section: CourseShellG04L03SectionCode}>
  | Readonly<{type: 'show-menu'}>
  | Readonly<{type: 'request-quit'}>
  | Readonly<{type: 'cancel-quit'}>
  | Readonly<{type: 'replay'}>;

export function normalizeCourseShellG04L03Frame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(COURSE_SHELL_G04_L03_MOVIE.frameCount, Math.max(1, Math.trunc(frame)));
}

export function normalizeCourseShellG04L03NativeMenuFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(
    COURSE_SHELL_G04_L03_NATIVE_MENU.frameCount,
    Math.max(1, Math.trunc(frame))
  );
}

export function normalizeCourseShellG04L03MoverFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(COURSE_SHELL_G04_L03_MOVER.frameCount, Math.max(1, Math.trunc(frame)));
}

function courseShellG04L03MoverAsset(frame: number) {
  const run = COURSE_SHELL_G04_L03_MOVER_VISUAL_RUNS.find(
    ({startFrame, endFrame}) => frame >= startFrame && frame <= endFrame
  );
  if (!run) throw new Error(`Missing source-static sprite-528 visual run for frame ${frame}`);
  const asset = COURSE_SHELL_G04_L03_MOVER_VISUAL_ASSETS[run.visualIndex - 1];
  if (!asset) throw new Error(`Missing source-static sprite-528 visual ${run.visualIndex}`);
  return asset;
}

export function normalizeCourseShellG04L03ControlFrame(
  frame: number,
  frameDomain: 'sprite-302' | 'sprite-327'
): number {
  const frameCount = frameDomain === 'sprite-302'
    ? COURSE_SHELL_G04_L03_POPUP.frameCount
    : COURSE_SHELL_G04_L03_MOUSE_OBJECT.frameCount;
  if (!Number.isFinite(frame)) return 1;
  return Math.min(frameCount, Math.max(1, Math.trunc(frame)));
}

export function normalizeCourseShellG04L03ProgressFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(COURSE_SHELL_G04_L03_PROGRESS.frameCount, Math.max(1, Math.trunc(frame)));
}

export function isCourseShellG04L03AdditionalDomain(
  frameDomain: string | undefined
): frameDomain is CourseShellG04L03AdditionalDomainId {
  return typeof frameDomain === 'string' && COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.some(
    (candidate) => candidate === frameDomain
  );
}

export function normalizeCourseShellG04L03AdditionalFrame(
  frame: number,
  frameDomain: CourseShellG04L03AdditionalDomainId
): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(
    COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[frameDomain].frameCount,
    Math.max(1, Math.trunc(frame))
  );
}

function courseShellG04L03AdditionalAsset(
  frameDomain: CourseShellG04L03AdditionalDomainId,
  frame: number
) {
  const data = COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[frameDomain];
  const run = data.runs.find(
    ({startFrame, endFrame}) => frame >= startFrame && frame <= endFrame
  );
  if (!run) throw new Error(`Missing source-static ${frameDomain} visual run for frame ${frame}`);
  const asset = data.assets[run.visualIndex - 1];
  if (!asset) throw new Error(`Missing source-static ${frameDomain} visual ${run.visualIndex}`);
  return asset;
}

export function isCourseShellG04L03SingleFrameDomain(
  frameDomain: string | undefined
): frameDomain is CourseShellG04L03SingleFrameDomainId {
  return typeof frameDomain === 'string' && COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.some(
    (candidate) => candidate === frameDomain
  );
}

function courseShellG04L03SingleFrameAsset(
  frameDomain: CourseShellG04L03SingleFrameDomainId
) {
  const data = COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA[frameDomain];
  const run = data.runs[0];
  const asset = data.assets[run.visualIndex - 1];
  if (!asset) throw new Error(`Missing source-static ${frameDomain} one-frame visual`);
  return asset;
}

function courseShellG04L03ControlAsset(
  frameDomain: 'sprite-302' | 'sprite-327',
  frame: number
) {
  const data = COURSE_SHELL_G04_L03_CONTROL_DOMAIN_DATA[frameDomain];
  const run = data.runs.find(
    ({startFrame, endFrame}) => frame >= startFrame && frame <= endFrame
  );
  if (!run) throw new Error(`Missing source-static ${frameDomain} visual run for frame ${frame}`);
  const asset = data.assets[run.visualIndex - 1];
  if (!asset) throw new Error(`Missing source-static ${frameDomain} visual ${run.visualIndex}`);
  return asset;
}

export function courseShellG04L03PhaseAtFrame(frame: number): CourseShellG04L03Phase {
  const normalized = normalizeCourseShellG04L03Frame(frame);
  if (normalized <= 48) return 'source-loading-static-structure';
  if (normalized === 49) return 'source-initialization-static-structure';
  return 'source-close-confirmation-static-structure';
}

export function courseShellG04L03InteractionForScenario(
  scenario: string
): CourseShellG04L03InteractionState {
  if (scenario === 'quit-confirmation') {
    return Object.freeze({view: 'quit-confirmation', selectedSection: null});
  }
  if (scenario.startsWith('section-')) {
    const requested = scenario.slice('section-'.length).toUpperCase();
    const sectionCode = COURSE_SHELL_G04_L03_SECTION_CODES.find(
      (code) => code === requested
    );
    if (sectionCode) return Object.freeze({view: 'section', selectedSection: sectionCode});
  }
  return Object.freeze({view: 'menu', selectedSection: null});
}

export function transitionCourseShellG04L03(
  state: CourseShellG04L03InteractionState,
  event: CourseShellG04L03Event
): CourseShellG04L03InteractionState {
  switch (event.type) {
    case 'select-section':
      return Object.freeze({view: 'section', selectedSection: event.section});
    case 'request-quit':
      return Object.freeze({view: 'quit-confirmation', selectedSection: state.selectedSection});
    case 'cancel-quit':
      return Object.freeze({
        view: state.selectedSection ? 'section' : 'menu',
        selectedSection: state.selectedSection
      });
    case 'show-menu':
    case 'replay':
      return Object.freeze({view: 'menu', selectedSection: null});
  }
}

export function getCourseShellG04L03FrameState(
  frame: number,
  context: Pick<RuntimeContext, 'frameDomain' | 'lang' | 'scenario' | 'seed'>
): CourseShellG04L03FrameState {
  if (isCourseShellG04L03SingleFrameDomain(context.frameDomain)) {
    const frameDomain = context.frameDomain;
    const nestedGeometry = COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA[frameDomain];
    const nestedAsset = courseShellG04L03SingleFrameAsset(frameDomain);
    const rootFrameAsset = COURSE_SHELL_G04_L03_ROOT_FRAME_ASSETS[nestedGeometry.rootFrame - 1];
    return Object.freeze({
      frameDomain,
      frame: 1,
      rootFrame: nestedGeometry.rootFrame,
      status: 'ready',
      blocker: null,
      phase: 'source-single-frame-domain-static-structure',
      presentation: 'ffdec-structural-single-frame-domain',
      language: context.lang,
      seed: context.seed,
      scenario: context.scenario,
      view: 'menu',
      selectedSection: null,
      courseTitle: COURSE_SHELL_G04_L03_SOURCE.courseName,
      lessonTitle: COURSE_SHELL_G04_L03_SOURCE.lessonTitleEnglish,
      lessonTitleLanguage: 'en',
      lessonTitleFallback: context.lang === 'es',
      sections: COURSE_SHELL_G04_L03_SECTIONS,
      rootFrameAsset: Object.freeze({source: `${COURSE_SHELL_G04_L03_ROOT_FRAME_ASSET_BASE}/${rootFrameAsset.file}`, sha256: rootFrameAsset.sha256}),
      nestedFrameAsset: Object.freeze({source: `${COURSE_SHELL_G04_L03_ADDITIONAL_ASSET_BASE}/${frameDomain}/${nestedAsset.file}`, sha256: nestedAsset.sha256}),
      nestedGeometry,
      rootVisualAuthority: 'ffdec-static-root-timeline-structural-render-not-original-runtime',
      nestedVisualAuthority: 'ffdec-static-nested-timeline-structural-render-not-original-runtime',
      originalRuntimeBaselineComplete: false,
      actionScriptExecuted: false,
      strictAcceptanceEffect: 'none'
    });
  }
  if (isCourseShellG04L03AdditionalDomain(context.frameDomain)) {
    const frameDomain = context.frameDomain;
    const nestedGeometry = COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[frameDomain];
    const nestedFrame = normalizeCourseShellG04L03AdditionalFrame(frame, frameDomain);
    const nestedAsset = courseShellG04L03AdditionalAsset(frameDomain, nestedFrame);
    const rootFrameAsset = COURSE_SHELL_G04_L03_ROOT_FRAME_ASSETS[
      nestedGeometry.rootFrame - 1
    ];
    return Object.freeze({
      frameDomain,
      frame: nestedFrame,
      rootFrame: nestedGeometry.rootFrame,
      status: 'ready',
      blocker: null,
      phase: 'source-additional-domain-static-structure',
      presentation: 'ffdec-structural-additional-domain',
      language: context.lang,
      seed: context.seed,
      scenario: context.scenario,
      view: 'menu',
      selectedSection: null,
      courseTitle: COURSE_SHELL_G04_L03_SOURCE.courseName,
      lessonTitle: COURSE_SHELL_G04_L03_SOURCE.lessonTitleEnglish,
      lessonTitleLanguage: 'en',
      lessonTitleFallback: context.lang === 'es',
      sections: COURSE_SHELL_G04_L03_SECTIONS,
      rootFrameAsset: Object.freeze({
        source: `${COURSE_SHELL_G04_L03_ROOT_FRAME_ASSET_BASE}/${rootFrameAsset.file}`,
        sha256: rootFrameAsset.sha256
      }),
      nestedFrameAsset: Object.freeze({
        source: `${COURSE_SHELL_G04_L03_ADDITIONAL_ASSET_BASE}/${frameDomain}/${nestedAsset.file}`,
        sha256: nestedAsset.sha256
      }),
      nestedGeometry,
      rootVisualAuthority: 'ffdec-static-root-timeline-structural-render-not-original-runtime',
      nestedVisualAuthority: 'ffdec-static-nested-timeline-structural-render-not-original-runtime',
      originalRuntimeBaselineComplete: false,
      actionScriptExecuted: false,
      strictAcceptanceEffect: 'none'
    });
  }
  if (context.frameDomain === COURSE_SHELL_G04_L03_PROGRESS.frameDomain) {
    const nestedFrame = normalizeCourseShellG04L03ProgressFrame(frame);
    const rootFrameAsset = COURSE_SHELL_G04_L03_ROOT_FRAME_ASSETS[
      COURSE_SHELL_G04_L03_PROGRESS.rootFrame - 1
    ];
    const nestedAsset = COURSE_SHELL_G04_L03_PROGRESS_FRAME_ASSETS[nestedFrame - 1];
    return Object.freeze({
      frameDomain: COURSE_SHELL_G04_L03_PROGRESS.frameDomain,
      frame: nestedFrame,
      rootFrame: COURSE_SHELL_G04_L03_PROGRESS.rootFrame,
      status: 'ready',
      blocker: null,
      phase: 'source-preloader-progress-static-structure',
      presentation: 'ffdec-structural-preloader-progress',
      language: context.lang,
      seed: context.seed,
      scenario: context.scenario,
      view: 'menu',
      selectedSection: null,
      courseTitle: COURSE_SHELL_G04_L03_SOURCE.courseName,
      lessonTitle: COURSE_SHELL_G04_L03_SOURCE.lessonTitleEnglish,
      lessonTitleLanguage: 'en',
      lessonTitleFallback: context.lang === 'es',
      sections: COURSE_SHELL_G04_L03_SECTIONS,
      rootFrameAsset: Object.freeze({
        source: `${COURSE_SHELL_G04_L03_ROOT_FRAME_ASSET_BASE}/${rootFrameAsset.file}`,
        sha256: rootFrameAsset.sha256
      }),
      nestedFrameAsset: Object.freeze({
        source: `${COURSE_SHELL_G04_L03_PROGRESS_ASSET_BASE}/${nestedAsset.file}`,
        sha256: nestedAsset.sha256
      }),
      nestedGeometry: COURSE_SHELL_G04_L03_PROGRESS,
      rootVisualAuthority: 'ffdec-static-root-timeline-structural-render-not-original-runtime',
      nestedVisualAuthority: 'ffdec-static-nested-timeline-structural-render-not-original-runtime',
      originalRuntimeBaselineComplete: false,
      actionScriptExecuted: false,
      strictAcceptanceEffect: 'none'
    });
  }
  if (context.frameDomain === 'sprite-302' || context.frameDomain === 'sprite-327') {
    const frameDomain = context.frameDomain;
    const nestedGeometry = frameDomain === 'sprite-302'
      ? COURSE_SHELL_G04_L03_POPUP
      : COURSE_SHELL_G04_L03_MOUSE_OBJECT;
    const assetBase = frameDomain === 'sprite-302'
      ? COURSE_SHELL_G04_L03_POPUP_ASSET_BASE
      : COURSE_SHELL_G04_L03_MOUSE_OBJECT_ASSET_BASE;
    const nestedFrame = normalizeCourseShellG04L03ControlFrame(frame, frameDomain);
    const rootFrameAsset = COURSE_SHELL_G04_L03_ROOT_FRAME_ASSETS[
      nestedGeometry.rootFrame - 1
    ];
    const nestedAsset = courseShellG04L03ControlAsset(frameDomain, nestedFrame);
    return Object.freeze({
      frameDomain,
      frame: nestedFrame,
      rootFrame: nestedGeometry.rootFrame,
      status: 'ready',
      blocker: null,
      phase: 'source-control-tooltip-static-structure',
      presentation: 'ffdec-structural-control-tooltip',
      language: context.lang,
      seed: context.seed,
      scenario: context.scenario,
      view: 'menu',
      selectedSection: null,
      courseTitle: COURSE_SHELL_G04_L03_SOURCE.courseName,
      lessonTitle: COURSE_SHELL_G04_L03_SOURCE.lessonTitleEnglish,
      lessonTitleLanguage: 'en',
      lessonTitleFallback: context.lang === 'es',
      sections: COURSE_SHELL_G04_L03_SECTIONS,
      rootFrameAsset: Object.freeze({
        source: `${COURSE_SHELL_G04_L03_ROOT_FRAME_ASSET_BASE}/${rootFrameAsset.file}`,
        sha256: rootFrameAsset.sha256
      }),
      nestedFrameAsset: Object.freeze({
        source: `${assetBase}/${nestedAsset.file}`,
        sha256: nestedAsset.sha256
      }),
      nestedGeometry,
      rootVisualAuthority: 'ffdec-static-root-timeline-structural-render-not-original-runtime',
      nestedVisualAuthority: 'ffdec-static-nested-timeline-structural-render-not-original-runtime',
      originalRuntimeBaselineComplete: false,
      actionScriptExecuted: false,
      strictAcceptanceEffect: 'none'
    });
  }
  if (context.frameDomain === COURSE_SHELL_G04_L03_MOVER.frameDomain) {
    const nestedFrame = normalizeCourseShellG04L03MoverFrame(frame);
    const rootFrameAsset = COURSE_SHELL_G04_L03_ROOT_FRAME_ASSETS[
      COURSE_SHELL_G04_L03_MOVER.rootFrame - 1
    ];
    const nestedAsset = courseShellG04L03MoverAsset(nestedFrame);
    return Object.freeze({
      frameDomain: COURSE_SHELL_G04_L03_MOVER.frameDomain,
      frame: nestedFrame,
      rootFrame: COURSE_SHELL_G04_L03_MOVER.rootFrame,
      status: 'ready',
      blocker: null,
      phase: 'source-mover-tooltip-static-structure',
      presentation: 'ffdec-structural-mover-tooltip',
      language: context.lang,
      seed: context.seed,
      scenario: context.scenario,
      view: 'menu',
      selectedSection: null,
      courseTitle: COURSE_SHELL_G04_L03_SOURCE.courseName,
      lessonTitle: COURSE_SHELL_G04_L03_SOURCE.lessonTitleEnglish,
      lessonTitleLanguage: 'en',
      lessonTitleFallback: context.lang === 'es',
      sections: COURSE_SHELL_G04_L03_SECTIONS,
      rootFrameAsset: Object.freeze({
        source: `${COURSE_SHELL_G04_L03_ROOT_FRAME_ASSET_BASE}/${rootFrameAsset.file}`,
        sha256: rootFrameAsset.sha256
      }),
      nestedFrameAsset: Object.freeze({
        source: `${COURSE_SHELL_G04_L03_MOVER_ASSET_BASE}/${nestedAsset.file}`,
        sha256: nestedAsset.sha256
      }),
      nestedGeometry: COURSE_SHELL_G04_L03_MOVER,
      rootVisualAuthority: 'ffdec-static-root-timeline-structural-render-not-original-runtime',
      nestedVisualAuthority: 'ffdec-static-nested-timeline-structural-render-not-original-runtime',
      originalRuntimeBaselineComplete: false,
      actionScriptExecuted: false,
      strictAcceptanceEffect: 'none'
    });
  }
  if (context.frameDomain === COURSE_SHELL_G04_L03_NATIVE_MENU.frameDomain) {
    const nestedFrame = normalizeCourseShellG04L03NativeMenuFrame(frame);
    const rootFrameAsset = COURSE_SHELL_G04_L03_ROOT_FRAME_ASSETS[
      COURSE_SHELL_G04_L03_NATIVE_MENU.rootFrame - 1
    ];
    const nestedHash = COURSE_SHELL_G04_L03_NATIVE_MENU_FRAME_HASHES[nestedFrame - 1];
    return Object.freeze({
      frameDomain: COURSE_SHELL_G04_L03_NATIVE_MENU.frameDomain,
      frame: nestedFrame,
      rootFrame: COURSE_SHELL_G04_L03_NATIVE_MENU.rootFrame,
      status: 'ready',
      blocker: null,
      phase: 'source-native-menu-static-structure',
      presentation: 'ffdec-structural-native-menu',
      language: context.lang,
      seed: context.seed,
      scenario: context.scenario,
      view: 'menu',
      selectedSection: null,
      courseTitle: COURSE_SHELL_G04_L03_SOURCE.courseName,
      lessonTitle: COURSE_SHELL_G04_L03_SOURCE.lessonTitleEnglish,
      lessonTitleLanguage: 'en',
      lessonTitleFallback: context.lang === 'es',
      sections: COURSE_SHELL_G04_L03_SECTIONS,
      rootFrameAsset: Object.freeze({
        source: `${COURSE_SHELL_G04_L03_ROOT_FRAME_ASSET_BASE}/${rootFrameAsset.file}`,
        sha256: rootFrameAsset.sha256
      }),
      nestedFrameAsset: Object.freeze({
        source: `${COURSE_SHELL_G04_L03_NATIVE_MENU_ASSET_BASE}/frame-${String(nestedFrame).padStart(4, '0')}.png`,
        sha256: nestedHash
      }),
      nestedGeometry: COURSE_SHELL_G04_L03_NATIVE_MENU,
      rootVisualAuthority: 'ffdec-static-root-timeline-structural-render-not-original-runtime',
      nestedVisualAuthority: 'ffdec-static-nested-timeline-structural-render-not-original-runtime',
      originalRuntimeBaselineComplete: false,
      actionScriptExecuted: false,
      strictAcceptanceEffect: 'none'
    });
  }
  const normalized = normalizeCourseShellG04L03Frame(frame);
  const phase = courseShellG04L03PhaseAtFrame(normalized);
  const presentation =
    normalized === 50 && context.scenario !== 'source-root-structural'
      ? ('current-javascript-lesson-map' as const)
      : ('ffdec-structural-root' as const);
  const interaction =
    presentation === 'current-javascript-lesson-map'
      ? courseShellG04L03InteractionForScenario(context.scenario)
      : Object.freeze({view: 'menu' as const, selectedSection: null});
  const rootFrameAsset = COURSE_SHELL_G04_L03_ROOT_FRAME_ASSETS[normalized - 1];
  return Object.freeze({
    frameDomain: 'root',
    frame: normalized,
    rootFrame: normalized,
    status: 'ready',
    blocker: null,
    phase,
    presentation,
    language: context.lang,
    seed: context.seed,
    scenario: context.scenario,
    view: interaction.view,
    selectedSection: interaction.selectedSection,
    courseTitle: COURSE_SHELL_G04_L03_SOURCE.courseName,
    lessonTitle: COURSE_SHELL_G04_L03_SOURCE.lessonTitleEnglish,
    lessonTitleLanguage: 'en',
    lessonTitleFallback: context.lang === 'es',
    sections: COURSE_SHELL_G04_L03_SECTIONS,
    rootFrameAsset: Object.freeze({
      source: `${COURSE_SHELL_G04_L03_ROOT_FRAME_ASSET_BASE}/${rootFrameAsset.file}`,
      sha256: rootFrameAsset.sha256
    }),
    nestedFrameAsset: null,
    nestedGeometry: null,
    rootVisualAuthority: 'ffdec-static-root-timeline-structural-render-not-original-runtime',
    nestedVisualAuthority: null,
    originalRuntimeBaselineComplete: false,
    actionScriptExecuted: false,
    strictAcceptanceEffect: 'none'
  });
}
