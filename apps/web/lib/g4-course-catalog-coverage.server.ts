import {readFileSync} from 'node:fs';
import path from 'node:path';

import {registeredAnimationKeys} from '@helpmath/demos/animation-registry';

import {
  buildGrade4CourseCatalogCoverage,
  type Grade4CourseCatalogCoverage,
  type Grade4CourseCatalogCoverageInput,
} from './g4-course-catalog-coverage';

function workspaceRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '../..')];
  const root = candidates.find((candidate) => {
    try {
      const document = JSON.parse(
        readFileSync(path.join(candidate, 'catalog/lessons.json'), 'utf8'),
      ) as {schemaVersion?: unknown};
      return document.schemaVersion === 1;
    } catch {
      return false;
    }
  });
  if (!root) throw new Error('Unable to resolve the HELP Math workspace root');
  return root;
}

function readJson(root: string, relativePath: string): unknown {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8')) as unknown;
}

export function loadCurrentGrade4CourseCatalogInputs(): Grade4CourseCatalogCoverageInput {
  const root = workspaceRoot();
  return Object.freeze({
    lessonsDocument: readJson(root, 'catalog/lessons.json'),
    animationsDocument: readJson(root, 'catalog/animations.json'),
    missingReferencesDocument: readJson(root, 'catalog/missing-references.json'),
    registeredAnimationKeys,
  });
}

/**
 * Current-file entry point for planning and tests. It is deliberately not
 * imported by the public route registry: coverage alone cannot register or
 * publish a course player.
 */
export function loadCurrentGrade4CourseCatalogCoverage(): Grade4CourseCatalogCoverage {
  return buildGrade4CourseCatalogCoverage(
    loadCurrentGrade4CourseCatalogInputs(),
  );
}
