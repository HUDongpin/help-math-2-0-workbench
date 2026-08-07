import type {NextConfig} from 'next';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

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
      "connect-src 'self' https://challenges.cloudflare.com",
      "font-src 'self' data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "frame-src 'self' https://challenges.cloudflare.com",
      "img-src 'self' data: blob:",
      "object-src 'none'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval' 'wasm-unsafe-eval'"} https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline'"
    ].join('; ')
  },
  {key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups'},
  {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
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

const executivePreviewHeaders = [
  {key: 'Cache-Control', value: 'private, no-store, max-age=0'},
  {key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, noimageindex'},
  {key: 'Vary', value: 'Cookie'}
];

const g4L3PreviewHeaders = [
  ...executivePreviewHeaders,
  {key: 'X-Helpmath-Controlled-Preview', value: 'g4-l3-executive-preview'}
];

const g4L3ControlledPreviewHeaders = [
      {
        source: '/courses/4/3',
        headers: g4L3PreviewHeaders
      },
      {
        source: '/en/courses/4/3',
        headers: g4L3PreviewHeaders
      },
      {
        source: '/es/courses/4/3',
        headers: g4L3PreviewHeaders
      },
      {
        source: '/animations/:animationId',
        headers: g4L3PreviewHeaders
      },
      {
        source: '/en/animations/:animationId',
        headers: g4L3PreviewHeaders
      },
      {
        source: '/es/animations/:animationId',
        headers: g4L3PreviewHeaders
      }
    ];

const g5L4ControlledPreviewHeaders = [
      {
        source: '/courses/5/4',
        headers: [
          ...executivePreviewHeaders,
          {key: 'X-Helpmath-Controlled-Preview', value: 'g5-l4-ceo-preview'}
        ]
      },
      {
        source: '/en/courses/5/4',
        headers: [
          ...executivePreviewHeaders,
          {key: 'X-Helpmath-Controlled-Preview', value: 'g5-l4-ceo-preview'}
        ]
      },
      {
        source: '/es/courses/5/4',
        headers: [
          ...executivePreviewHeaders,
          {key: 'X-Helpmath-Controlled-Preview', value: 'g5-l4-ceo-preview'}
        ]
      }
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
  distDir: localReferenceDiagnosticBuild
    ? '.next-local-reference-diagnostic'
    : wholeLessonPackageBuild
      ? wholeLessonPackageDistDir
      : '.next',
  output: wholeLessonPackageBuild
    ? 'standalone'
    : undefined,
  outputFileTracingRoot: path.resolve(webDirectory, '../..'),
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
        headers: [...embeddedCourseAdapterHeaders, ...executivePreviewHeaders]
      },
      {
        source: '/flash-assets/:path*',
        headers: executivePreviewHeaders
      },
      {
        source: '/executive-preview',
        headers: executivePreviewHeaders
      },
      {
        source: '/en/executive-preview',
        headers: executivePreviewHeaders
      },
      {
        source: '/es/executive-preview',
        headers: executivePreviewHeaders
      },
      {
        source: '/executive-preview/g5-l4',
        headers: executivePreviewHeaders
      },
      {
        source: '/en/executive-preview/g5-l4',
        headers: executivePreviewHeaders
      },
      {
        source: '/es/executive-preview/g5-l4',
        headers: executivePreviewHeaders
      },
      ...g4L3ControlledPreviewHeaders,
      ...g5L4ControlledPreviewHeaders
    ];
  },
  redirects: legacyRedirects
};

export default nextConfig;
