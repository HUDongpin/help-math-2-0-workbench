import type {NextConfig} from 'next';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {isClerkLocalAuthConfigurationReady} from './lib/clerk-local-auth-config';
import {isG678LocalPreviewEnabled} from './lib/g678-preview-policy';
import {
  CLERK_SYNTHETIC_DIST_DIR,
  CLERK_SYNTHETIC_DIST_DIR_AUTHORIZATION,
} from './lib/clerk-synthetic-execution';

const webDirectory = path.dirname(fileURLToPath(import.meta.url));
const g678LocalOnlyRegistrySpecifier =
  '@helpmath/demos/local-only-animation-registry';
const g678LocalOnlyRegistryMetadataSpecifier =
  '@helpmath/demos/local-only-animation-registry-metadata';
const g678LocalOnlyRegistryProductionStub = path.join(
  webDirectory,
  'lib/g678-local-only-registry.production-stub.ts',
);
const p064LocalCandidateSpecifier = '@helpmath/demos/nms-l02-p064-local-candidate';
const p064LocalCandidateProductionStub = path.join(
  webDirectory,
  'lib/g678-p064-candidate.production-stub.tsx',
);
const p064LocalCandidateSource = path.resolve(
  webDirectory,
  '../../packages/demos/src/nms-l02-p064-quiz-candidate.tsx',
);
const algP001LocalCandidateSpecifier = '@helpmath/demos/alg-l06-p001-local-candidate';
const algP001LocalCandidateProductionStub = path.join(
  webDirectory,
  'lib/g678-alg-l06-p001.production-stub.tsx',
);
const algP001LocalCandidateSource = path.resolve(
  webDirectory,
  '../../packages/demos/src/alg-l06-p001-title-view.tsx',
);
const p054LocalCandidateSpecifier = '@helpmath/demos/nms-l02-p054-local-candidate';
const p054LocalCandidateProductionStub = path.join(
  webDirectory,
  'lib/g678-p054-candidate.production-stub.tsx',
);
const p054LocalCandidateSource = path.resolve(
  webDirectory,
  '../../packages/demos/src/nms-l02-p054-board-candidate.tsx',
);
const geoP002LocalCandidateSpecifier = '@helpmath/demos/geo-l06-p002-local-candidate';
const geoP002LocalCandidateProductionStub = path.join(
  webDirectory,
  'lib/g678-geo-p002-candidate.production-stub.tsx',
);
const geoP002LocalCandidateSource = path.resolve(
  webDirectory,
  '../../packages/demos/src/geo-l06-p002-local-candidate.tsx',
);
const datP002LocalCandidateSpecifier = '@helpmath/demos/dat-l02-p002-local-candidate';
const datP002LocalCandidateProductionStub = path.join(
  webDirectory,
  'lib/g678-dat-p002-candidate.production-stub.tsx',
);
const datP002LocalCandidateSource = path.resolve(
  webDirectory,
  '../../packages/demos/src/dat-l02-p002-candidate-renderer-v1.tsx',
);
const geoP002HostRuntimeSpecifier = '@/components/g678-geo-l06-p002-runtime';
const geoP002HostRuntimeProductionStub = path.join(
  webDirectory,
  'lib/g678-geo-p002-host-runtime.production-stub.tsx',
);
const geoP002HostRuntimeSource = path.join(
  webDirectory,
  'components/g678-geo-l06-p002-runtime.tsx',
);
const algP003HostRuntimeSpecifier = '@/components/g678-alg-l06-p003-host-runtime';
const algL12P005HostSpecifier = '@/components/g678-alg-l12-p005-host-lesson';
const algL12P005HostSource = path.join(webDirectory, 'components/g678-alg-l12-p005-host-lesson.tsx');
const algL12P005HostProductionStub = path.join(webDirectory, 'lib/g678-alg-l12-p005-host.production-stub.tsx');
const algL12P006HostSpecifier = '@/components/g678-alg-l12-p006-host-lesson';
const algL12P006HostSource = path.join(webDirectory, 'components/g678-alg-l12-p006-host-lesson.tsx');
const algL12P006HostProductionStub = path.join(webDirectory, 'lib/g678-alg-l12-p006-host.production-stub.tsx');
const algL12P009HostSpecifier = '@/components/g678-alg-l12-p009-host-lesson';
const algL12P009HostSource = path.join(webDirectory, 'components/g678-alg-l12-p009-host-lesson.tsx');
const algL12P009HostProductionStub = path.join(webDirectory, 'lib/g678-alg-l12-p009-host.production-stub.tsx');
const algP003HostRuntimeProductionStub = path.join(
  webDirectory, 'lib/g678-alg-l06-p003-host-runtime.production-stub.tsx',
);
const algP003HostRuntimeSource = path.join(
  webDirectory, 'components/g678-alg-l06-p003-host-runtime.tsx',
);
const p064QuestionAudioSpecifier = '@/lib/nms-l02-p064-question-audio-response';
const p064QuestionAudioProductionStub = path.join(
  webDirectory,
  'lib/nms-l02-p064-question-audio.production-stub.ts',
);
const g678LocalPreviewDemosSourceRoot =
  process.env.HELP_MATH_G678_DEMOS_SOURCE_ROOT
    ? path.resolve(process.env.HELP_MATH_G678_DEMOS_SOURCE_ROOT)
    : null;
const g4L3WholeLessonPackageBuild =
  process.env.G4_L3_WHOLE_LESSON_PACKAGE === '1';
const g4L3WholeLessonPackageV31Build =
  g4L3WholeLessonPackageBuild
  && process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_1 === '1';
const g4L3WholeLessonPackageV32Build =
  g4L3WholeLessonPackageBuild
  && process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_2 === '1';
const g4L3WholeLessonPackageV33Build =
  g4L3WholeLessonPackageBuild
  && process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_3 === '1';
const g5L4WholeLessonPackageBuild =
  process.env.G5_L4_WHOLE_LESSON_PACKAGE === '1';
const localReferenceDiagnosticBuild =
  process.env.HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const p064ProductionScanBuild =
  process.env.HELP_MATH_P064_PRODUCTION_SCAN === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const geoP002ProductionScanBuild =
  process.env.HELP_MATH_GEO_P002_PRODUCTION_SCAN === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const geoP002HostProductionScanBuild =
  process.env.HELP_MATH_GEO_P002_HOST_PRODUCTION_SCAN === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const clerkSyntheticBuild =
  process.env.HELP_MATH_CLERK_SYNTHETIC_BUILD
    === CLERK_SYNTHETIC_DIST_DIR_AUTHORIZATION
  && process.env.NODE_ENV === 'development'
  && process.env.VERCEL_ENV === undefined;
const currentJsCandidateQaBuild =
  process.env.HELP_MATH_CURRENT_JS_CANDIDATE_QA
    === 'current-js-candidate-profile-v1'
  && process.env.CURRENT_JS_CANDIDATE_PROFILE_ENABLED === 'true'
  && process.env.NODE_ENV === 'development'
  && process.env.VERCEL_ENV === undefined;
const algP001LocalQaBuild =
  process.env.HELP_MATH_ALG_P001_LOCAL_QA === '1'
  && process.env.NODE_ENV === 'development'
  && process.env.VERCEL_ENV === undefined;
const algP001ProductionScanBuild =
  process.env.HELP_MATH_ALG_P001_PRODUCTION_SCAN === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const algP003ProductionScanBuild =
  process.env.HELP_MATH_ALG_P003_PRODUCTION_SCAN === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const novaFullStackFakeTransportRequested = [
  process.env.NOVA_TEST_FAKE_TRANSPORT_AUTHORIZATION,
  process.env.NOVA_TEST_FAKE_TRANSPORT_MODE,
  process.env.NOVA_TEST_FAKE_TRANSPORT_ORIGIN,
  process.env.NOVA_TEST_FAKE_TRANSPORT_RECEIPT_PATH,
].some((value) => value !== undefined);
const localClerkAuthBuild = isClerkLocalAuthConfigurationReady(process.env);
const localClerkScriptSources = localClerkAuthBuild
  ? ' https://*.clerk.accounts.dev https://*.clerk.com https://*.protect.clerk.com'
  : '';
const localClerkConnectSources = localClerkAuthBuild
  ? ' https://api.clerk.com https://*.clerk.accounts.dev https://*.clerk.com https://*.protect.clerk.com https://img.clerk.com'
  : '';
const localClerkImageSources = localClerkAuthBuild
  ? ' https://img.clerk.com'
  : '';
const localClerkFrameSources = localClerkAuthBuild
  ? ' https://*.protect.clerk.com'
  : '';
if (g4L3WholeLessonPackageBuild && g5L4WholeLessonPackageBuild) {
  throw new Error(
    'G4 L3 and G5 L4 standalone package builds are mutually exclusive.',
  );
}
if (
  process.env.NODE_ENV === 'production' &&
  novaFullStackFakeTransportRequested
) {
  throw new Error(
    'Nova full-stack fake transport is forbidden in production builds.',
  );
}
if (
  process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_1 === '1'
  && !g4L3WholeLessonPackageBuild
) {
  throw new Error(
    'G4 L3 v3.1 package mode requires G4_L3_WHOLE_LESSON_PACKAGE=1.',
  );
}
if (
  process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_2 === '1'
  && !g4L3WholeLessonPackageBuild
) {
  throw new Error(
    'G4 L3 v3.2 package mode requires G4_L3_WHOLE_LESSON_PACKAGE=1.',
  );
}
if (
  process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_3 === '1'
  && !g4L3WholeLessonPackageBuild
) {
  throw new Error(
    'G4 L3 v3.3 package mode requires G4_L3_WHOLE_LESSON_PACKAGE=1.',
  );
}
if (
  [
    g4L3WholeLessonPackageV31Build,
    g4L3WholeLessonPackageV32Build,
    g4L3WholeLessonPackageV33Build,
  ].filter(Boolean).length > 1
) {
  throw new Error(
    'G4 L3 v3.1, v3.2, and v3.3 package modes are mutually exclusive.',
  );
}
const wholeLessonPackageBuild =
  g4L3WholeLessonPackageBuild || g5L4WholeLessonPackageBuild;
if (p064ProductionScanBuild && (localReferenceDiagnosticBuild || wholeLessonPackageBuild)) {
  throw new Error('The P064 production scan requires an isolated build profile.');
}
if (localReferenceDiagnosticBuild && wholeLessonPackageBuild) {
  throw new Error(
    'The local reference diagnostic build and whole-lesson package builds are mutually exclusive.',
  );
}
if (
  clerkSyntheticBuild
  && (localReferenceDiagnosticBuild || wholeLessonPackageBuild)
) {
  throw new Error(
    'The Clerk synthetic dev build is mutually exclusive with diagnostic and package builds.',
  );
}
const wholeLessonPackageDistDir = g5L4WholeLessonPackageBuild
  ? '.next-g5-l4-package'
  : g4L3WholeLessonPackageV33Build
    ? '.next-g4-l3-package-v3-3'
    : g4L3WholeLessonPackageV32Build
      ? '.next-g4-l3-package-v3-2'
      : g4L3WholeLessonPackageV31Build
        ? '.next-g4-l3-package-v3-1'
        : '.next-g4-l3-package';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      `connect-src 'self' https://challenges.cloudflare.com${localClerkConnectSources}`,
      "font-src 'self' data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      `frame-src 'self' https://challenges.cloudflare.com${localClerkFrameSources}`,
      `img-src 'self' data: blob:${localClerkImageSources}`,
      "object-src 'none'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval' 'wasm-unsafe-eval'"} https://challenges.cloudflare.com${localClerkScriptSources}`,
      "style-src 'self' 'unsafe-inline'",
      "worker-src 'self' blob:"
    ].join('; ')
  },
  {key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups'},
  // Nova voice input uses the browser's speech-recognition control. HELP Math
  // never receives the audio stream; only the learner-approved transcript is
  // posted to the same-origin Nova route. Device camera access stays blocked.
  {key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()'},
  {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
  {key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload'},
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'X-Frame-Options', value: 'DENY'}
];

// Only the opted-in local P053/P054 candidates play hash-checked Blob audio.
// Production and every other page retain the ordinary media fallback policy.
const p054LocalMediaHeaders = securityHeaders.map(header => header.key === 'Content-Security-Policy'
  ? {...header, value: `${header.value}; media-src 'self' blob:`}
  : header);

const embeddedCourseAdapterHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "connect-src 'none'",
      "font-src 'none'",
      "form-action 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data:",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'"
    ].join('; ')
  },
  {key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups'},
  {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
  {key: 'Referrer-Policy', value: 'no-referrer'},
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'X-Frame-Options', value: 'SAMEORIGIN'}
];

const legacyRedirects: NonNullable<NextConfig['redirects']> = async () => [
  {source: '/Home.htm', destination: '/', permanent: true},
  {source: '/About.htm', destination: '/about', permanent: true},
  {source: '/AcademicLanguage.htm', destination: '/approach', permanent: true},
  {source: '/SIOP.htm', destination: '/approach', permanent: true},
  {source: '/Content.htm', destination: '/curriculum', permanent: true},
  {source: '/Standards.htm', destination: '/curriculum', permanent: true},
  {source: '/Evidence.htm', destination: '/research', permanent: true},
  {source: '/Awards.htm', destination: '/research', permanent: true},
  {source: '/Resources.htm', destination: '/resources', permanent: true},
  {source: '/Sales.htm', destination: '/contact', permanent: true},
  {source: '/Trial.htm', destination: '/contact', permanent: true},
  {source: '/Purchasing.htm', destination: '/contact', permanent: true},
  {source: '/Login.htm', destination: '/login', permanent: true},
  {source: '/TechSpecs.htm', destination: '/support', permanent: true}
];

const nextConfig: NextConfig = {
  // Keep the learner-facing local preview free of the development badge so
  // screenshot and projector review reflect the actual course surface.
  devIndicators: false,
  distDir: clerkSyntheticBuild
    ? CLERK_SYNTHETIC_DIST_DIR
    : algP001LocalQaBuild
      ? '.next-alg-p001-local-qa'
    : algP001ProductionScanBuild
      ? '.next-alg-p001-production-scan'
    : algP003ProductionScanBuild
      ? '.next-alg-p003-production-scan-20260925'
    : currentJsCandidateQaBuild
      ? '.next-current-js-candidate-qa'
    : geoP002HostProductionScanBuild
      ? '.next-geo-p002-host-production-scan-20260925'
    : geoP002ProductionScanBuild
      ? '.next-geo-p002-production-scan-20260925'
    : p064ProductionScanBuild
      ? '.next-p064-production-scan'
    : localReferenceDiagnosticBuild
      ? '.next-local-reference-diagnostic'
      : wholeLessonPackageBuild
        ? wholeLessonPackageDistDir
        : '.next',
  output: wholeLessonPackageBuild
    ? 'standalone'
    : undefined,
  outputFileTracingRoot: path.resolve(webDirectory, '../..'),
  outputFileTracingIncludes: {
    '/*': [
      '../../catalog/animations.json',
      '../../catalog/missing-references.json',
      '../../catalog/completion-ledger.json',
      '../../catalog/lesson-releases.json',
      '../../catalog/lesson-release-ledger.json',
      '../../catalog/lessons.json',
      '../../reports/g5-l4-source-scope-freeze.json',
      '../../apps/web/server-assets/flash-assets/courses/**/*.mp3',
    ],
  },
  outputFileTracingExcludes: {
    '*': [
      // The diagnostic page is always 404 in production; do not package its
      // unregistered private renderer or source-glyph exports with the server.
      '../../packages/demos/src/alg-l06-p001-title-view.tsx',
      '../../migrations/shared-alg001-l06-p001/assets/title-svg/*.svg',
      '../../migrations/shared-alg001-l06-p001/assets/source-stream-142.mp3',
      ...(wholeLessonPackageBuild ? [
        '../../artifacts/**/*',
        '../../migrations/**/*',
        '../../private-archive/**/*',
        '../../source-assets/**/*',
      ] : []),
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@helpmath/demos'],
  turbopack: {
    resolveAlias: {
      ...(process.env.NODE_ENV === 'production' ? {
        [g678LocalOnlyRegistrySpecifier]:
          g678LocalOnlyRegistryProductionStub,
        [g678LocalOnlyRegistryMetadataSpecifier]:
          g678LocalOnlyRegistryProductionStub,
      } : {}),
      [p064LocalCandidateSpecifier]: isG678LocalPreviewEnabled()
        ? p064LocalCandidateSource : p064LocalCandidateProductionStub,
      [algP001LocalCandidateSpecifier]: isG678LocalPreviewEnabled()
        ? algP001LocalCandidateSource : algP001LocalCandidateProductionStub,
      [p054LocalCandidateSpecifier]: isG678LocalPreviewEnabled()
        ? p054LocalCandidateSource : p054LocalCandidateProductionStub,
      [geoP002LocalCandidateSpecifier]: isG678LocalPreviewEnabled()
        ? geoP002LocalCandidateSource : geoP002LocalCandidateProductionStub,
      [datP002LocalCandidateSpecifier]: isG678LocalPreviewEnabled()
        ? datP002LocalCandidateSource : datP002LocalCandidateProductionStub,
      [geoP002HostRuntimeSpecifier]: isG678LocalPreviewEnabled()
        ? geoP002HostRuntimeSource : geoP002HostRuntimeProductionStub,
      [algP003HostRuntimeSpecifier]: isG678LocalPreviewEnabled()
        ? algP003HostRuntimeSource : algP003HostRuntimeProductionStub,
      [algL12P005HostSpecifier]: isG678LocalPreviewEnabled()
        ? algL12P005HostSource : algL12P005HostProductionStub,
      [algL12P006HostSpecifier]: isG678LocalPreviewEnabled()
        ? algL12P006HostSource : algL12P006HostProductionStub,
      [algL12P009HostSpecifier]: isG678LocalPreviewEnabled()
        ? algL12P009HostSource : algL12P009HostProductionStub,
      ...(process.env.NODE_ENV === 'production' ? {
        [p064QuestionAudioSpecifier]: p064QuestionAudioProductionStub,
      } : {}),
    },
  },
  webpack(config, {dev, webpack, isServer}) {
    // Next16's installed browser baseline supports async functions, while its
    // webpack runtime target remains web/es6. Declare that one capability for
    // the opted-in loopback client only; do not alter server/Edge/production.
    if (dev && isServer === false && isG678LocalPreviewEnabled()) {
      config.output ??= {};
      config.output.environment = {
        ...(config.output.environment ?? {}),
        asyncFunction: true,
      };
    }
    if (dev && g678LocalPreviewDemosSourceRoot) {
      config.resolve ??= {};
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        [g678LocalOnlyRegistrySpecifier]: path.join(
          g678LocalPreviewDemosSourceRoot,
          'local-only-animation-registry.ts',
        ),
        [g678LocalOnlyRegistryMetadataSpecifier]: path.join(
          g678LocalPreviewDemosSourceRoot,
          'local-only-animation-registry-metadata.ts',
        ),
      };
    }
    if (!dev) {
      config.resolve ??= {};
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        [g678LocalOnlyRegistrySpecifier]:
          g678LocalOnlyRegistryProductionStub,
        [g678LocalOnlyRegistryMetadataSpecifier]:
          g678LocalOnlyRegistryProductionStub,
      };
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/local-only-animation-registry(?:-metadata)?|packages[\\/]demos[\\/]src[\\/]local-only-animation-registry(?:-metadata)?\.ts)$/u,
        g678LocalOnlyRegistryProductionStub,
      ));
    }
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      [p064LocalCandidateSpecifier]: dev && isG678LocalPreviewEnabled()
        ? p064LocalCandidateSource : p064LocalCandidateProductionStub,
      [algP001LocalCandidateSpecifier]: dev && isG678LocalPreviewEnabled()
        ? algP001LocalCandidateSource : algP001LocalCandidateProductionStub,
      [p054LocalCandidateSpecifier]: dev && isG678LocalPreviewEnabled()
        ? p054LocalCandidateSource : p054LocalCandidateProductionStub,
      [geoP002LocalCandidateSpecifier]: dev && isG678LocalPreviewEnabled()
        ? geoP002LocalCandidateSource : geoP002LocalCandidateProductionStub,
      [datP002LocalCandidateSpecifier]: dev && isG678LocalPreviewEnabled()
        ? datP002LocalCandidateSource : datP002LocalCandidateProductionStub,
      [geoP002HostRuntimeSpecifier]: dev && isG678LocalPreviewEnabled()
        ? geoP002HostRuntimeSource : geoP002HostRuntimeProductionStub,
      [algP003HostRuntimeSpecifier]: dev && isG678LocalPreviewEnabled()
        ? algP003HostRuntimeSource : algP003HostRuntimeProductionStub,
      [algL12P005HostSpecifier]: dev && isG678LocalPreviewEnabled()
        ? algL12P005HostSource : algL12P005HostProductionStub,
      [algL12P006HostSpecifier]: dev && isG678LocalPreviewEnabled()
        ? algL12P006HostSource : algL12P006HostProductionStub,
      [algL12P009HostSpecifier]: dev && isG678LocalPreviewEnabled()
        ? algL12P009HostSource : algL12P009HostProductionStub,
    };
    if (!dev) {
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l12-p009-host-lesson|apps[\\/]web[\\/]components[\\/]g678-alg-l12-p009-host-lesson\.tsx)$/u,
        algL12P009HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l12-p006-host-lesson|apps[\\/]web[\\/]components[\\/]g678-alg-l12-p006-host-lesson\.tsx)$/u,
        algL12P006HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l12-p005-host-lesson|apps[\\/]web[\\/]components[\\/]g678-alg-l12-p005-host-lesson\.tsx)$/u,
        algL12P005HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/nms-l02-p064-local-candidate|packages[\\/]demos[\\/]src[\\/]nms-l02-p064-quiz-candidate\.tsx)$/u,
        p064LocalCandidateProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/alg-l06-p001-local-candidate|packages[\\/]demos[\\/]src[\\/]alg-l06-p001-title-view\.tsx)$/u,
        algP001LocalCandidateProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/nms-l02-p054-local-candidate|packages[\\/]demos[\\/]src[\\/]nms-l02-p054-board-candidate\.tsx)$/u,
        p054LocalCandidateProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/geo-l06-p002-local-candidate|packages[\\/]demos[\\/]src[\\/]geo-l06-p002-local-candidate\.tsx)$/u,
        geoP002LocalCandidateProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/dat-l02-p002-local-candidate|packages[\\/]demos[\\/]src[\\/]dat-l02-p002-candidate-renderer-v1\.tsx)$/u,
        datP002LocalCandidateProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-geo-l06-p002-runtime|apps[\\/]web[\\/]components[\\/]g678-geo-l06-p002-runtime\.tsx)$/u,
        geoP002HostRuntimeProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p003-host-runtime|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p003-host-runtime\.tsx)$/u,
        algP003HostRuntimeProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/lib\/nms-l02-p064-question-audio-response|apps[\\/]web[\\/]lib[\\/]nms-l02-p064-question-audio-response\.ts)$/u,
        p064QuestionAudioProductionStub,
      ));
    }
    return config;
  },
  async rewrites() {
    // P053's modern lesson embeds the sealed P054 game. Keep its client URLs
    // intact while routing only the exact local P053 document to new guards.
    const has = [{type: 'header' as const, key: 'referer',
      value: 'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-nms002-l02-p053'}];
    const p004Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p004/candidate-v1'}];
    return {beforeFiles: isG678LocalPreviewEnabled() ? [
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/canvas-renderer.js',has:p004Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p004/predecessor/canvas'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/continuous-source-v2',has:p004Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p004/predecessor/main'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/optional-spanish-audio-v1',has:p004Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p004/predecessor/spanish'},
      {source: '/flash-assets/g678-local/shared-nms002-l02-p054/reveal/:level/:order', has,
        destination: '/flash-assets/g678-local/shared-nms002-l02-p053/game/reveal/:level/:order'},
      {source: '/flash-assets/g678-local/shared-nms002-l02-p054/feedback-audio/:kind', has,
        destination: '/flash-assets/g678-local/shared-nms002-l02-p053/game/feedback-audio/:kind'},
    ] : [], afterFiles: [], fallback: []};
  },
  async headers() {
    return [
      {
        source: '/((?!flash-assets/courses/).*)',
        headers: securityHeaders
      },
      ...(isG678LocalPreviewEnabled() ? ['/en', '/es'].map(locale => ({
        source: `${locale}/migration-status/g678-calibration/shared-nms002-l02-p054`,
        headers: p054LocalMediaHeaders,
      })) : []),
      ...(isG678LocalPreviewEnabled() ? ['/en', '/es'].map(locale => ({
        source: `${locale}/migration-status/g678-calibration/shared-nms002-l02-p053`,
        headers: p054LocalMediaHeaders,
      })) : []),
      {
        source: '/flash-assets/courses/:path*',
        headers: embeddedCourseAdapterHeaders
      },
      {
        source:
          '/flash-assets/courses/shell-course-g04-l03-index-local/host-composite-assets/:path*',
        headers: [
          {key: 'Cache-Control', value: 'private, no-store, max-age=0'},
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, noimageindex',
          },
        ],
      }
    ];
  },
  redirects: legacyRedirects
};

export default nextConfig;
