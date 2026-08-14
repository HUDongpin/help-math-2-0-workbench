import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const componentUrl = new URL(
  '../components/descriptor-driven-whole-lesson-player.tsx',
  import.meta.url,
);
const shellUrl = new URL(
  '../components/legacy-responsive-lesson-shell.tsx',
  import.meta.url,
);
const animationRuntimeUrl = new URL(
  '../components/animation-runtime.tsx',
  import.meta.url,
);
const animationContractUrl = new URL(
  '../../../packages/demos/src/contract.ts',
  import.meta.url,
);
const routeUrl = new URL(
  '../app/[locale]/courses/[grade]/[lesson]/page.tsx',
  import.meta.url,
);
const coursePlayerUrl = new URL(
  '../components/whole-lesson-course-player.tsx',
  import.meta.url,
);
const courseRegistryUrl = new URL(
  '../lib/whole-lesson-course-registry.ts',
  import.meta.url,
);

test('descriptor-driven player never mounts or prefetches unavailable renderers', async () => {
  const [component, shell, animationRuntime, animationContract] = await Promise.all([
    readFile(componentUrl, 'utf8'),
    readFile(shellUrl, 'utf8'),
    readFile(animationRuntimeUrl, 'utf8'),
    readFile(animationContractUrl, 'utf8'),
  ]);

  assert.match(
    component,
    /nextPage\?\.rendererAvailability\.kind === 'registered'/,
  );
  assert.match(
    component,
    /if \(runtimeAvailable && nextModuleKey\)/,
  );
  assert.match(
    component,
    /const stage = currentRenderer\.kind === 'registered'\s*\?\s*<AnimationRuntime/,
  );
  assert.match(
    component,
    /loadedSwfHostAsset=\{currentPage\.source\.xmlBackgroundText/,
  );
  assert.match(
    component,
    /backgroundCompanionVisible=\{\s*currentPage\.source\.xmlBackgroundText === true\s*\}/,
  );
  assert.match(
    component,
    /data-renderer-availability="unavailable"/,
  );
  assert.match(
    component,
    /data-shell-actionscript-executed=\{shellImplementation \? 'false' : undefined\}/,
  );
  assert.match(component, /data-shell-current-js-candidate=/);
  assert.match(component, /data-shell-runtime-parity="not-established"/);
  assert.match(component, /shellCandidate=\{shellImplementation\}/);
  assert.match(
    component,
    /const sectionLabel = currentSection\.labels\[progress\.locale\]/,
  );
  assert.match(
    component,
    /courseContext=\{\{[\s\S]*?courseTitle: descriptor\.course\.labels\[progress\.locale\],[\s\S]*?pageTitle: currentLabel,[\s\S]*?title: sectionLabel/,
  );
  assert.match(shell, /export interface LessonShellCourseContext/);
  assert.match(
    shell,
    /aria-hidden="true"\s+className="lesson-shell2__map-rail-summary"/,
  );
  assert.match(
    shell,
    /aria-hidden="true"\s+className="lesson-shell2__tool-rail-page-context"/,
  );
  assert.match(
    component,
    /one source-static functional shell candidate/,
  );
  assert.match(
    component,
    /Functional audit interface with all \$\{descriptor\.course\.activePageCount\} registered pages and the JavaScript shell/,
  );
  assert.match(
    component,
    /Interfaz funcional de auditoría con las \$\{descriptor\.course\.activePageCount\} páginas registradas y el shell JavaScript/,
  );
  assert.doesNotMatch(component, /unimplemented pages visible/);
  assert.match(
    component,
    /<span aria-hidden="true">\{currentPage\.globalPageOrdinal\}<\/span>/,
  );
  assert.doesNotMatch(
    component,
    /<span aria-hidden="true">54<\/span>/,
  );
  assert.match(
    component,
    /currentLabel\.usesEnglishFallback\s*\?\s*'El candidato visual current-JS permanece limitado al contenido fuente en inglés\.'\s*:\s*'El título en español procede del XML;/,
  );
  // Review is earned by playback, and only the registered-renderer branch of
  // the stage mounts a runtime that can report it. An unavailable position has
  // nothing to play, so it can never be counted and never shows the strip's
  // page tick.
  assert.doesNotMatch(component, /completionAction/);
  assert.match(
    component,
    /currentRenderer\.kind === 'registered'[\s\S]*?onPlaybackComplete=\{reviewCurrentPage\}[\s\S]*?data-renderer-availability="unavailable"/,
  );
  assert.match(
    component,
    /pageComplete=\{runtimeAvailable && reviewed\.has\(currentPage\.animationId\)\}/,
  );
  assert.match(shell, /data-runtime-available=/);
  assert.doesNotMatch(shell, /<aside[\s\S]*?role=\{mapOverlay \? 'dialog'/);
  assert.doesNotMatch(shell, /<aside[\s\S]*?role=\{toolOverlay \? 'dialog'/);
  const disabledRuntimeControls =
    shell.match(/disabled=\{!runtimeAvailable\}/g) ?? [];
  assert.equal(
    disabledRuntimeControls.length,
    2,
    'legacy and modern Replay controls must disable',
  );
  const disabledPauseControls =
    shell.match(
      /!runtimeAvailable \|\| supportOpen/g,
    ) ?? [];
  assert.equal(
    disabledPauseControls.length,
    2,
    'legacy and modern Pause controls disable only when support owns pause',
  );
  const resumeInspectionControls = shell.match(
    /frameInspectionActive\s*\? onPlaybackResumeFromInspection\(\)/g,
  ) ?? [];
  assert.equal(
    resumeInspectionControls.length,
    2,
    'legacy and modern controls must resume current-JS from an inspected frame',
  );
  assert.match(
    component,
    /const resumeFromInspectedFrame = \(\) => \{[\s\S]*?setSeekRequest\(null\);[\s\S]*?setPaused\(false\);/,
  );
  const disabledAudioControls =
    shell.match(/disabled=\{!runtimeAvailable \|\| !audioAvailable\}/g) ?? [];
  assert.equal(
    disabledAudioControls.length,
    4,
    'legacy and modern mute buttons and Volume sliders must fail closed without audio',
  );
  assert.match(shell, /disabled=\{!playbackSeekAvailable\}/);
  assert.match(shell, /data-source-transport-parity="not-established"/);
  assert.match(
    component,
    /const pageInteractionCompanionTargetId =\s*currentPage\.presentation\?\.pageInteractionCompanionTargetIdSuffix\s*\? `\$\{descriptor\.course\.domIdPrefix\}-\$\{currentPage\.presentation\.pageInteractionCompanionTargetIdSuffix\}`\s*: undefined;/,
  );
  assert.doesNotMatch(component, /course-g05-l04-fq-002|course-g05-l04-fq-003/);
  assert.equal(
    (component.match(
      /pageInteractionCompanionTargetId=\{pageInteractionCompanionTargetId\}/g,
    ) ?? []).length,
    2,
    'the same FQ002/FQ003 companion target must reach the runtime and shell host',
  );
  assert.match(
    shell,
    /data-page-interaction-companion-host="true"[\s\S]*?id=\{pageInteractionCompanionTargetId\}/,
  );
  assert.match(
    animationRuntime,
    /<Renderer[\s\S]*?pageInteractionCompanionTargetId=\{pageInteractionCompanionTargetId\}/,
  );
  assert.match(
    component,
    /uiLanguage=\{progress\.locale\}/,
    'the product locale must reach app-owned renderer UI independently',
  );
  assert.match(
    animationContract,
    /readonly uiLanguage\?: AnimationLanguage;/,
    'the runtime host must expose a typed app-owned UI language',
  );
  assert.match(animationRuntime, /uiLanguage\?: AnimationRendererProps\['lang'\]/);
  assert.match(
    animationRuntime,
    /uiLanguage=\{uiLanguage \?\? playbackContext\.lang\}/,
    'renderer UI falls back to source runtime language outside product hosts',
  );
  assert.match(
    component,
    /query=\{\{[\s\S]*?lang: runtimeLanguage,/,
    'source runtime language remains independently fail-closed',
  );
  assert.match(component, /if \(!nextPage && tourFinished\) return;/);
  assert.match(component, /nextDisabled=\{!nextPage && tourFinished\}/);
  assert.match(shell, /data-lesson-nav="footer-previous"/);
  assert.match(shell, /data-lesson-nav="footer-next"/);
});

test('every Course Map selection owns a focus epoch, including same-page reselection', async () => {
  const component = await readFile(componentUrl, 'utf8');
  assert.match(
    component,
    /const \[navigationFocusEpoch, setNavigationFocusEpoch\] = useState\(0\);/,
  );
  assert.match(
    component,
    /pageHeadingRef\.current\?\.focus\(\);\s*\}, \[currentPage\.animationId, hydrated, navigationFocusEpoch\]\);/,
  );
  assert.match(
    component,
    /const navigateToPage = \([\s\S]*?setNavigationFocusEpoch\(\(value\) => value \+ 1\);/,
  );
});

test('registered whole-lesson routes preserve cross-binding and publication gates before mounting either player', async () => {
  const [route, coursePlayer, registry] = await Promise.all([
    readFile(routeUrl, 'utf8'),
    readFile(coursePlayerUrl, 'utf8'),
    readFile(courseRegistryUrl, 'utf8'),
  ]);
  const registeredBranch = route.slice(
    route.indexOf('if (courseRegistration)'),
    route.indexOf('if (releaseDescriptor)'),
  );
  const bindingGate = registeredBranch.indexOf(
    '!wholeLessonDescriptorMatchesNavigation(',
  );
  const publicationGate = registeredBranch.indexOf(
    'if (!auditPreview && !releasePublished && !showcasePublication.enabled)',
  );
  const playerMount = registeredBranch.indexOf(
    'return <WholeLessonCoursePlayer',
  );

  assert.ok(bindingGate >= 0);
  assert.ok(publicationGate > bindingGate);
  assert.ok(playerMount > publicationGate);
  assert.match(
    registeredBranch,
    /const auditPreview = developmentAuditPreview;/,
  );
  assert.match(
    registeredBranch,
    /currentJsShowcasePublication\(\s*courseRegistration\.descriptor\.releaseId,\s*\)/,
  );
  assert.match(
    registeredBranch,
    /if \(!auditPreview && !releasePublished && !showcasePublication\.enabled\) \{\s*notFound\(\);\s*\}/,
  );
  assert.doesNotMatch(registeredBranch, /controlledPreview|isControlledPreviewEnabled/);
  assert.match(
    registeredBranch,
    /wholeLessonDescriptorMatchesNavigation\(\s*courseRegistration\.descriptor,\s*releaseDescriptor,/,
  );
  assert.match(registeredBranch, /strictCompleteMemberCount=/);
  assert.doesNotMatch(route, /G4_L3_LESSON|G5_L4_ATOMIC_RELEASE_ID/);
  assert.doesNotMatch(route, /isG4L3Lesson|isG5L4ExecutivePreviewEnabled/);
  assert.match(coursePlayer, /registration\.player\.kind === 'preserved-custom'/);
  assert.match(coursePlayer, /<G4L3WholeLessonPlayer/);
  assert.match(coursePlayer, /<DescriptorDrivenWholeLessonPlayer/);
  assert.match(registry, /G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR/);
  assert.match(registry, /G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR/);
});

test('the descriptor-driven player forwards the header title band to the shell', async () => {
  const [component, shell] = await Promise.all([
    readFile(componentUrl, 'utf8'),
    readFile(shellUrl, 'utf8'),
  ]);

  assert.match(
    component,
    /chromeTitleBand: descriptor\.visualSkin\.header\.title,/,
  );
  assert.match(
    component,
    /courseContext=\{\{[\s\S]*?courseTitle: descriptor\.course\.labels\[progress\.locale\],/,
  );
  assert.match(shell, /chromeTitleBand\?: WholeLessonChromeTitleBand;/);
  assert.match(
    shell,
    /const chromeTitleBand = visualSkin\.chromeTitleBand;/,
  );
  // Every lesson chrome paints the same <CourseName> wordmark, so no shell or
  // player may treat that string as a lesson identity.
  assert.doesNotMatch(component, /Counting on Numbers/);
  assert.doesNotMatch(shell, /Counting on Numbers/);
});
