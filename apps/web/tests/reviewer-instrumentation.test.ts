import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';

import {isReviewerInstrumentationEnabled} from '../lib/reviewer-instrumentation';

const SHELL = '../components/legacy-responsive-lesson-shell.tsx';

test('reviewer instrumentation stays off unless the deployment opts in', () => {
  assert.equal(isReviewerInstrumentationEnabled({}), false);
  assert.equal(
    isReviewerInstrumentationEnabled({REVIEWER_INSTRUMENTATION_ENABLED: 'false'}),
    false,
  );
  assert.equal(
    isReviewerInstrumentationEnabled({REVIEWER_INSTRUMENTATION_ENABLED: '1'}),
    false,
  );
  assert.equal(
    isReviewerInstrumentationEnabled({REVIEWER_INSTRUMENTATION_ENABLED: 'TRUE'}),
    false,
  );
  assert.equal(
    isReviewerInstrumentationEnabled({REVIEWER_INSTRUMENTATION_ENABLED: 'true'}),
    true,
  );
});

test('the shell defaults reviewerMode off, so instruments are opt-in', async () => {
  const shell = await readFile(new URL(SHELL, import.meta.url), 'utf8');
  assert.match(shell, /reviewerMode = false,/);
  assert.match(shell, /reviewerMode\?: boolean;/);
});

test('every engineering instrument is gated on reviewerMode, not candidateMode', async () => {
  const shell = await readFile(new URL(SHELL, import.meta.url), 'utf8');

  // Frame inspection state itself.
  assert.match(
    shell,
    /const frameInspectionActive = reviewerMode && playbackInspectionActive;/,
  );

  // For each instrument, the nearest JSX gate opening before it must be the
  // reviewer gate. Comparing indices rather than regex distances keeps this
  // from breaking on reformatting while still pinning the actual invariant.
  const gatedByReviewer = (marker: string) => {
    const at = shell.indexOf(marker);
    assert.notEqual(at, -1, `${marker} is missing from the shell`);
    const head = shell.slice(0, at);
    return head.lastIndexOf('{reviewerMode') > head.lastIndexOf('{candidateMode');
  };

  for (const instrument of [
    'data-responsive-focus-key="rewind"',      // -N frames
    'data-responsive-focus-key="forward"',     // +N frames
    'lesson-shell2__modern-timeline',          // inspect-frame slider
    'lesson-shell2__modern-transport-summary', // parity summary
    'lesson-shell2__transport-boundary"',      // parity notice
  ]) {
    assert.ok(
      gatedByReviewer(instrument),
      `${instrument} must sit behind the reviewer gate, not the candidate gate`,
    );
  }
});

test('release status remains available through the designer-only candidate mode', async () => {
  const shell = await readFile(new URL(SHELL, import.meta.url), 'utf8');
  // The status footer and the release-mode attribute are release facts, not
  // instruments, and must not have moved behind the reviewer gate.
  assert.match(shell, /data-candidate-mode=\{candidateMode \? 'true' : 'false'\}/);
  assert.match(
    shell,
    /\{candidateMode\s*\?\s*<footer[\s\S]{0,300}?className="lesson-shell2__status"/,
  );
});

test('both gates are reported in the DOM so a reviewer can tell them apart', async () => {
  const shell = await readFile(new URL(SHELL, import.meta.url), 'utf8');
  assert.match(shell, /data-reviewer-mode=\{reviewerMode \? 'true' : 'false'\}/);
});

test('the route resolves reviewer and designer disclosure gates independently', async () => {
  const route = await readFile(
    new URL('../app/[locale]/courses/[grade]/[lesson]/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(route, /reviewerMode=\{isReviewerInstrumentationEnabled\(\)\}/);
  // Publication state is preserved, but ordinary learners do not see its
  // engineering disclosure unless the explicit designer view is available.
  assert.match(
    route,
    /candidateMode=\{designerView && \(auditPreview \|\| !releasePublished\)\}/,
  );
  assert.match(route, /isMigrationStatusDesignerViewRequested\(view\)/);
  assert.doesNotMatch(route, /reviewerMode=\{auditPreview/);
});
