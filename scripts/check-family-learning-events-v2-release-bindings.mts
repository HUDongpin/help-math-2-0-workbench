import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  FAMILY_LEARNING_EVENTS_V2_PRODUCTION_RELEASE_BINDINGS,
  publishedReleasesMissingFamilyLearningEventsV2Binding,
} from '../apps/web/lib/family/learning-events-v2-contract.ts';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const ledgerPath = path.join(
  projectRoot,
  'catalog',
  'lesson-release-ledger.json',
);

const ledger = JSON.parse(await readFile(ledgerPath, 'utf8')) as unknown;
if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) {
  throw new Error('Lesson release ledger must be an object.');
}
const releases = (ledger as {releases?: unknown}).releases;
if (!Array.isArray(releases)) {
  throw new Error('Lesson release ledger must contain a releases array.');
}

const publishedReleaseIds = releases.flatMap((release) => {
  if (
    !release
    || typeof release !== 'object'
    || Array.isArray(release)
    || (release as {published?: unknown}).published !== true
  ) return [];
  const releaseId = (release as {releaseId?: unknown}).releaseId;
  if (typeof releaseId !== 'string' || releaseId.length === 0) {
    throw new Error('Every published Lesson release needs a non-empty releaseId.');
  }
  return [releaseId];
});

const missing = publishedReleasesMissingFamilyLearningEventsV2Binding(
  publishedReleaseIds,
);
if (missing.length > 0) {
  throw new Error(
    `Published Lesson releases missing an explicit Family LearningEventV2 `
      + `production binding: ${missing.join(', ')}`,
  );
}

process.stdout.write(
  `PASS Family LearningEventV2 release-binding boundary `
    + `published=${publishedReleaseIds.length} `
    + `production_bindings=${FAMILY_LEARNING_EVENTS_V2_PRODUCTION_RELEASE_BINDINGS.length}\n`,
);
