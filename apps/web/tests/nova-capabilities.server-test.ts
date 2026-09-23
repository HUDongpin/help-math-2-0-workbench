import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

import {
  NOVA_TUTOR_COURSE_POLICY,
  NovaTutorPolicyConfigurationError,
  parseNovaTutorReleaseIds,
  resolveNovaClientCapabilities,
} from '../lib/nova-capabilities.server';
import {EMPTY_NOVA_CLIENT_CAPABILITIES} from '../lib/nova-capabilities';
import {NOVA_OPENROUTER_MODEL} from '../lib/nova-openrouter.server';

const releaseId = 'lesson-g04-l03-negative-numbers';

function configuredEnvironment(
  overrides: Readonly<Record<string, string | undefined>> = {},
) {
  return {
    NODE_ENV: 'development',
    MODERN_WIDE_SHELL_ENABLED: 'true',
    NOVA_TUTOR_ENABLED: 'true',
    NOVA_TUTOR_RELEASE_IDS: releaseId,
    NOVA_ALLOW_FRAME_CONTEXT: 'false',
    NOVA_ALLOW_SPEECH_INPUT: 'false',
    NOVA_MODEL: NOVA_OPENROUTER_MODEL,
    OPENROUTER_API_KEY: 'sk-or-v1-test-only-key-1234567890',
    OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
    ...overrides,
  };
}

describe('Nova Tutor course policy', () => {
  it('binds the exact eight releases to descriptor identities and priorities', () => {
    assert.deepEqual(
      NOVA_TUTOR_COURSE_POLICY.map((entry) => ({
        grade: entry.grade,
        lesson: entry.lesson,
        releaseId: entry.releaseId,
        descriptorId: entry.descriptorId,
        rolloutPriority: entry.rolloutPriority,
      })),
      [
        {
          grade: 4,
          lesson: 3,
          releaseId: 'lesson-g04-l03-negative-numbers',
          descriptorId: 'g4-l3-formal-page-only-course-v1',
          rolloutPriority: 1,
        },
        {
          grade: 5,
          lesson: 4,
          releaseId: 'lesson-g05-l04-number-lines',
          descriptorId: 'g5-l4-formal-page-only-course-v1',
          rolloutPriority: 2,
        },
        {
          grade: 3,
          lesson: 2,
          releaseId: 'lesson-g03-l02-addition-subtraction-page-only-current-js',
          descriptorId: 'whole-lesson-player-g03-l02-page-only-v1',
          rolloutPriority: 3,
        },
        {
          grade: 4,
          lesson: 5,
          releaseId: 'lesson-g04-l05-multiplication-page-only',
          descriptorId: 'g4-l5-formal-page-only-course-v1',
          rolloutPriority: 4,
        },
        {
          grade: 4,
          lesson: 10,
          releaseId: 'lesson-g04-l10-perimeter-area-page-only',
          descriptorId: 'g4-l10-formal-page-only-course-v1',
          rolloutPriority: 5,
        },
        {
          grade: 4,
          lesson: 11,
          releaseId: 'lesson-g04-l11-coordinate-grid-page-only',
          descriptorId: 'g4-l11-formal-page-only-course-v1',
          rolloutPriority: 6,
        },
        {
          grade: 5,
          lesson: 3,
          releaseId: 'lesson-g05-l03-exponents-prime-factorizations-page-only',
          descriptorId: 'whole-lesson-player-g05-l03-page-only-v1',
          rolloutPriority: 7,
        },
        {
          grade: 5,
          lesson: 5,
          releaseId: 'lesson-g05-l05-add-subtract-negative-numbers',
          descriptorId: 'whole-lesson-player-g05-l05-page-only-v1',
          rolloutPriority: 8,
        },
      ],
    );
  });

  it('treats an absent or blank rollout list as a valid closed rollout', () => {
    assert.deepEqual(parseNovaTutorReleaseIds(undefined), []);
    assert.deepEqual(parseNovaTutorReleaseIds('  '), []);
  });

  it('fails the complete rollout closed on unknown or duplicate releases', () => {
    assert.throws(
      () => parseNovaTutorReleaseIds(`${releaseId},unknown-release`),
      NovaTutorPolicyConfigurationError,
    );
    assert.throws(
      () => parseNovaTutorReleaseIds(`${releaseId}, ${releaseId}`),
      NovaTutorPolicyConfigurationError,
    );
    assert.throws(
      () => parseNovaTutorReleaseIds(`${releaseId},`),
      NovaTutorPolicyConfigurationError,
    );
  });
});

describe('resolveNovaClientCapabilities', () => {
  const input = {
    grade: 4,
    lesson: 3,
    releaseId,
    hostPresentation: 'modern-wide' as const,
  };

  it('authorizes text while keeping both independent input flags closed', () => {
    assert.deepEqual(
      resolveNovaClientCapabilities({
        ...input,
        environment: configuredEnvironment(),
      }),
      {
        schemaVersion: 1,
        text: true,
        currentLessonFrame: false,
        speechToDraft: false,
      },
    );
  });

  it('enables frame and speech only through their independent exact flags', () => {
    assert.deepEqual(
      resolveNovaClientCapabilities({
        ...input,
        environment: configuredEnvironment({
          NOVA_ALLOW_FRAME_CONTEXT: 'true',
          NOVA_ALLOW_SPEECH_INPUT: 'true',
        }),
      }),
      {
        schemaVersion: 1,
        text: true,
        currentLessonFrame: true,
        speechToDraft: true,
      },
    );
  });

  it('returns the public empty DTO for unselected courses or legacy hosts', () => {
    assert.deepEqual(
      resolveNovaClientCapabilities({
        ...input,
        environment: configuredEnvironment({NOVA_TUTOR_RELEASE_IDS: ''}),
      }),
      EMPTY_NOVA_CLIENT_CAPABILITIES,
    );
    assert.deepEqual(
      resolveNovaClientCapabilities({
        ...input,
        hostPresentation: 'legacy-composite',
        environment: configuredEnvironment(),
      }),
      EMPTY_NOVA_CLIENT_CAPABILITIES,
    );
  });

  it('fails closed without revealing invalid provider or rollout configuration', () => {
    assert.deepEqual(
      resolveNovaClientCapabilities({
        ...input,
        environment: configuredEnvironment({NOVA_MODEL: 'some-fallback'}),
      }),
      EMPTY_NOVA_CLIENT_CAPABILITIES,
    );
    assert.deepEqual(
      resolveNovaClientCapabilities({
        ...input,
        environment: configuredEnvironment({
          NOVA_TUTOR_RELEASE_IDS: `${releaseId},${releaseId}`,
        }),
      }),
      EMPTY_NOVA_CLIENT_CAPABILITIES,
    );
  });
});
