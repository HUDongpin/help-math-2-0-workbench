import type {NextConfig} from 'next';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {isClerkLocalAuthConfigurationReady} from './lib/clerk-local-auth-config';
import {
  CLERK_SYNTHETIC_DIST_DIR,
  CLERK_SYNTHETIC_DIST_DIR_AUTHORIZATION,
} from './lib/clerk-synthetic-execution';

const webDirectory = path.dirname(fileURLToPath(import.meta.url));
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
const clerkSyntheticBuild =
  process.env.HELP_MATH_CLERK_SYNTHETIC_BUILD
    === CLERK_SYNTHETIC_DIST_DIR_AUTHORIZATION
  && process.env.NODE_ENV === 'development'
  && process.env.VERCEL_ENV === undefined;
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
    ],
  },
  outputFileTracingExcludes: wholeLessonPackageBuild
    ? {
        '*': [
          '../../artifacts/**/*',
          '../../migrations/**/*',
          '../../private-archive/**/*',
          '../../source-assets/**/*',
        ],
      }
    : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@helpmath/demos'],
  async headers() {
    return [
      {
        source: '/((?!flash-assets/courses/).*)',
        headers: securityHeaders
      },
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
