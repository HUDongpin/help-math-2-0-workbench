import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'node:test';

async function source(path: string) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

describe('Nova client capability gates', () => {
  it('resolves capabilities in the Course Server Component and threads only the public DTO', async () => {
    const [coursePage, wrapper, g4Player, descriptorPlayer, shell] =
      await Promise.all([
        source('../app/[locale]/courses/[grade]/[lesson]/page.tsx'),
        source('../components/whole-lesson-course-player.tsx'),
        source('../components/g4-l3-whole-lesson-player.tsx'),
        source('../components/descriptor-driven-whole-lesson-player.tsx'),
        source('../components/legacy-responsive-lesson-shell.tsx'),
      ]);

    assert.match(coursePage, /resolveNovaClientCapabilities\(\{/);
    assert.match(coursePage, /hostPresentation,[\s\S]*\}\);/);
    assert.match(coursePage, /novaCapabilities=\{novaCapabilities\}/);
    assert.match(wrapper, /novaCapabilities=\{novaCapabilities\}/g);
    assert.match(g4Player, /const tutorContext = novaCapabilities\.text\s*\?/);
    assert.match(descriptorPlayer, /const tutorContext = novaCapabilities\.text\s*\?/);
    assert.match(shell, /const tutorAvailable = modernWide && novaCapabilities\.text && Boolean\(tutorContext\)/);
    assert.match(shell, /tutorAvailable && tutorContext[\s\S]*<LessonNovaTutor/);
    assert.match(shell, /capabilities=\{novaCapabilities\}/g);
  });

  it('selects the first learner-visible text-capable homepage course in product priority order', async () => {
    const [home, workspace] = await Promise.all([
      source('../app/[locale]/page.tsx'),
      source('../components/learning-platform-workspace.tsx'),
    ]);
    const priorityEntries = [
      '[4, 3]',
      '[5, 4]',
      '[3, 2]',
      '[4, 5]',
      '[4, 10]',
      '[4, 11]',
      '[5, 3]',
      '[5, 5]',
    ];
    let previous = -1;
    for (const entry of priorityEntries) {
      const index = home.indexOf(entry);
      assert.ok(index > previous, `${entry} must retain Nova homepage priority`);
      previous = index;
    }
    assert.match(home, /availableLessons\.find\(/);
    assert.match(home, /if \(!capabilities\.text\) continue;/);
    assert.match(home, /novaCourseHref = learnerVisibleLesson\.href/);
    assert.match(home, /novaCourseHref=\{novaCourseHref\}/);
    assert.match(workspace, /novaCourseHref && novaCapabilities\.text/);
    assert.match(workspace, /href=\{novaCourseHref\}/);
  });

  it('binds capture, attachment, and component identity to the exact page placement', async () => {
    const [integration, client, shell, tutor] = await Promise.all([
      source('../lib/tutor-integration.ts'),
      source('../lib/nova-client.ts'),
      source('../components/legacy-responsive-lesson-shell.tsx'),
      source('../components/lesson-nova-tutor.tsx'),
    ]);

    assert.match(integration, /readonly releaseId: string;/);
    assert.match(integration, /readonly globalPageOrdinal: number;/);
    assert.match(client, /releaseId: frame\.releaseId/);
    assert.match(client, /globalPageOrdinal: frame\.globalPageOrdinal/);
    assert.match(shell, /!novaCapabilities\.currentLessonFrame/);
    assert.match(shell, /tutorStageFrameSnapshot\([\s\S]*tutorFramePlacement/);
    assert.match(shell, /tutorSnapshot\?\.releaseId === tutorFramePlacement\.releaseId/);
    assert.match(shell, /currentSnapshot\.globalPageOrdinal === nextSnapshot\.globalPageOrdinal/);
    assert.match(shell, /key=\{`\$\{novaTutorMode\}:\$\{tutorContext\.releaseId\}:\$\{tutorContext\.globalPageOrdinal\}:\$\{tutorContext\.animationId\}`\}/);
    assert.match(shell, /const dismissTutor = useCallback\(\(\) => \{[\s\S]*setTutorSnapshotMode\(null\);[\s\S]*setTutorSnapshot\(null\);/);
    assert.match(shell, /return \(\) => \{[\s\S]*cancelled = true;[\s\S]*cancelAnimationFrame\(animationFrame\)/);
    assert.match(tutor, /frameMatchesContext\(frameSnapshot, context\)/);
    assert.match(tutor, /Attach current lesson frame/);
    assert.doesNotMatch(tutor, /type="file"|readLocalImage|getUserMedia|mediaDevices/);
  });

  it('keeps the localized conversation speaker label visually separated from its message', async () => {
    const tutor = await source('../components/lesson-nova-tutor.tsx');

    assert.match(tutor, /\(spanish \? 'Tú' : 'You'\)\}<\/strong>\s*\{' '\}/);
  });

  it('records only allowlisted speech workflow status and locale without transcript text', async () => {
    const tutor = await source('../components/lesson-nova-tutor.tsx');

    assert.match(
      tutor,
      /track\('nova_speech_status', \{locale, status\}\)/,
    );
    assert.match(tutor, /recordNovaSpeechStatus\('draft-ready', locale\)/);
    assert.match(tutor, /recordNovaSpeechStatus\('confirmed-send', locale\)/);
    assert.doesNotMatch(
      tutor,
      /track\('nova_speech_status', \{[^}]*transcript/,
    );
  });
});
