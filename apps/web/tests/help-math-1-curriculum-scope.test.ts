import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

import {
  HELP_MATH_1_CURRICULUM_SCOPE,
  HELP_MATH_1_GRADE_FILTERS,
} from '../lib/help-math-1-curriculum-scope';

test('historical HELP Math 1.0 curriculum scope stays distinct from availability', () => {
  assert.deepEqual(HELP_MATH_1_GRADE_FILTERS, ['3', '4', '5', '6', '7', '8']);
  assert.equal(HELP_MATH_1_CURRICULUM_SCOPE.firstGrade, 3);
  assert.equal(HELP_MATH_1_CURRICULUM_SCOPE.lastGrade, 8);
  assert.equal(HELP_MATH_1_CURRICULUM_SCOPE.gradeCount, 6);
  assert.equal(HELP_MATH_1_CURRICULUM_SCOPE.structuredMathLessonCount, 73);
  assert.equal(
    HELP_MATH_1_CURRICULUM_SCOPE.structuredMathLessonCount
      + HELP_MATH_1_CURRICULUM_SCOPE.nonMathActiveLessonCount,
    HELP_MATH_1_CURRICULUM_SCOPE.sqlActiveLessonCount,
  );
  assert.equal(
    HELP_MATH_1_CURRICULUM_SCOPE.status,
    'historical-curriculum-scope-not-current-availability',
  );
});

test('the learner navigation keeps the historical scope separate from the public launch catalog', () => {
  const workspace = readFileSync(
    new URL('../components/learning-platform-workspace.tsx', import.meta.url),
    'utf8',
  );

  assert.match(
    workspace,
    /<i>\{lessonCatalog\.length\}<\/i>/,
  );
  assert.match(workspace, /new Set\([\s\S]*lessonCatalog\.map/u);
  assert.match(workspace, /allLessonsAvailable[\s\S]*href=\{allLessonsHref\}/u);
  assert.doesNotMatch(workspace, /HELP_MATH_1_CURRICULUM_SCOPE/u);
  assert.doesNotMatch(workspace, /HELP_MATH_1_GRADE_FILTERS/u);
  assert.doesNotMatch(workspace, /grades 3 to 8|grados 3 a 8/u);
});
