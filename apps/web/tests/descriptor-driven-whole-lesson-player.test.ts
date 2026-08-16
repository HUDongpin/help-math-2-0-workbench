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
  assert.match(
    component,
    /const shellSections: LessonShellSection\[\] = descriptor\.sections\.map/,
  );
  assert.match(component, /sections=\{shellSections\}/);
  assert.match(component, /const tutorContext = tutorPageContext\(\{/);
  assert.match(component, /novaTutorMode=\{novaTutorMode\}/);
  assert.match(component, /tutorContext=\{tutorContext\}/);
  assert.match(
    component,
    /pageTitleSpanish: currentPage\.labels\.es\.usesEnglishFallback[\s\S]*?\? null[\s\S]*?: currentPage\.labels\.es\.text/,
    'an English fallback must not be mislabeled as authored Spanish tutor context',
  );
  assert.match(
    shell,
    /const tutorAvailable = modernWide && Boolean\(tutorContext\)/,
  );
  assert.doesNotMatch(shell, /data-learning-mode-switch="three-mode"/);
  assert.match(shell, /data-mode-switch-available="false"/);
  assert.match(
    shell,
    /data-tutor-placement=\{!tutorAvailable[\s\S]*?\? 'unavailable'/,
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
    /disclosure=\{reviewerMode[\s\S]*?: undefined\}/,
    'migration evidence must be reviewer-only on the learner route',
  );
  assert.doesNotMatch(
    component,
    /current-JS pages plus .*strict members; unpublished/,
    'ordinary learner copy must not expose the superseded shell-inclusive denominator',
  );
  assert.match(
    component,
    /historical shell and strict-admission contracts remain available for internal review only/,
  );
  assert.match(component, /Use Previous and Next to move through this lesson\./);
  assert.match(component, /Your progress stays saved on this device\./);
  assert.match(
    component,
    /`\$\{reviewedRegisteredCount\} of \$\{registeredPages\.length\} pages complete`/,
  );
  assert.doesNotMatch(
    component,
    /Use Previous and Next to traverse all .* XML positions|current-JS pages reviewed/,
    'ordinary help and progress copy must stay learner-facing',
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
  assert.doesNotMatch(shell, /<aside[^>]*role=\{mapOverlay \? 'dialog'/);
  assert.doesNotMatch(shell, /<aside[^>]*role=\{toolOverlay \? 'dialog'/);
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
  const resumeInspectionControls = [
    ...(shell.match(
      /frameInspectionActive\s*\? onPlaybackResumeFromInspection\(\)/g,
    ) ?? []),
    ...(shell.match(
      /if \(frameInspectionActive\) onPlaybackResumeFromInspection\(\)/g,
    ) ?? []),
  ];
  assert.equal(
    resumeInspectionControls.length,
    2,
    'legacy and modern controls must resume current-JS from an inspected frame',
  );
  assert.match(
    component,
    /const resumeFromInspectedFrame = \(\) => \{[\s\S]*?setSeekRequest\(null\);[\s\S]*?setPaused\(false\);/,
  );
  assert.match(
    component,
    /const pendingScrubberFocusRef = useRef<[\s\S]*?'section-scrubber'[\s\S]*?null[\s\S]*?>\(null\);/,
  );
  assert.doesNotMatch(component, /const selectPageOrdinal = \(pageOrdinal: number\)/);
  assert.doesNotMatch(component, /onPageSelect=\{selectPageOrdinal\}/);
  assert.match(
    component,
    /sectionProgress=\{\{[\s\S]*?code: currentSection\.code,[\s\S]*?currentPage: currentSectionPageOrdinal,[\s\S]*?onPageSelect: selectSectionPageOrdinal,[\s\S]*?totalPages: currentSectionPages\.length/,
  );
  assert.match(
    component,
    /if \(pendingScrubberFocusRef\.current\) \{[\s\S]*?pendingScrubberFocusRef\.current = null;[\s\S]*?requestAnimationFrame[\s\S]*?data-responsive-focus-key=[\s\S]*?focus\(\{preventScroll: true\}\)/,
  );
  const disabledAudioControls =
    shell.match(/disabled=\{!runtimeAvailable \|\| !audioAvailable\}/g) ?? [];
  assert.equal(
    disabledAudioControls.length,
    5,
    'legacy and disclosure volume controls must fail closed without audio',
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
  assert.match(
    component,
    /audioLanguage=\{progress\.locale\}/,
    'product audio language must remain independent from fixed visual English',
  );
  assert.match(component, /createMemoryOnlyLessonHost\(\{/);
  assert.match(component, /enabledCapabilities: audioEnabled \? \['audio'\] : \[\]/);
  assert.match(component, /audioEnabled=\{audioEnabled\}/);
  assert.match(component, /onLessonHostRequest=\{handleLessonHostRequest\}/);
  assert.match(animationContract, /readonly audioEnabled\?: boolean;/);
  assert.match(
    animationRuntime,
    /const audioModule = audioEnabled \? animationModule : undefined;/,
    'a closed server audio gate strips audio declarations from executable hooks',
  );
  assert.match(
    animationRuntime,
    /<Renderer activeInteractiveAudioId=\{playingInteractiveAudioId\} audioEnabled=\{audioEnabled\}/,
    'the renderer receives the same server-resolved audio publication decision',
  );
  assert.match(
    animationRuntime,
    /interactiveAudioAssets[\s\S]*?isExactInteractiveAudioAsset/,
  );
  assert.match(animationRuntime, /\? 'interactive'/);
  assert.match(
    animationRuntime,
    /if \(narrationRequest\.action === 'stop'\) \{[\s\S]*?stopNarrationTrack\(\);[\s\S]*?stopInteractiveAudio\(\);[\s\S]*?stopTimelineAudioNow\(\);/,
    'the shell narration stop command must stop interactive FQ audio too',
  );
  assert.match(
    animationRuntime,
    /const explicitlyStopped = useRef\(false\);[\s\S]*?const stopNow = useCallback\(\(\) => \{\s*explicitlyStopped\.current = true;\s*stopActive\(\);[\s\S]*?explicitlyStopped\.current = false;[\s\S]*?if \(explicitlyStopped\.current\) \{\s*previous\.current = frame;\s*return;/,
    'a learner Stop decision must remain latched while the current timeline keeps advancing',
  );
  assert.equal(
    animationRuntime.match(
      /if \(active\.current\.get\(cue\.id\) !== audio\) return;/g,
    )?.length,
    2,
    'late play promise resolution or rejection must not mutate a newer audio identity',
  );
  assert.match(
    animationRuntime,
    /const reducedMotionManualCue = reduced === true[\s\S]*?audioCueMatchesContext\(cue, audioContext\)[\s\S]*?fallbackCue: currentAutoplayBlockedCue \?\? reducedMotionManualCue/,
    'reduced-motion learners must receive an on-demand path to the exact context-matched cue',
  );
  assert.match(
    animationRuntime,
    /const currentAutoplayBlockedCue = autoplayBlockedCue[\s\S]*?audioModule\.audioCues\.some[\s\S]*?cue\.id === autoplayBlockedCue\.id[\s\S]*?cue\.source === autoplayBlockedCue\.source[\s\S]*?audioCueMatchesContext\(cue, audioContext\)/,
    'a stale blocked cue may not become another page identity\'s manual fallback',
  );
  assert.match(
    animationRuntime,
    /<Renderer activeInteractiveAudioId=\{playingInteractiveAudioId\}/,
    'the renderer receives actual HTMLAudio playback state instead of local intent',
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
    /audioEnabled=\{\s*courseRegistration\.descriptor\.releaseId === G5_L4_SHOWCASE_RELEASE_ID\s*&& isG5L4ShowcaseAudioAuthorized\(\)\s*\}/,
    'the server must resolve the independent audio gate before mounting the client player',
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
  assert.match(coursePlayer, /audioEnabled=\{audioEnabled\}/);
  assert.equal(
    coursePlayer.match(/novaTutorMode=\{novaTutorMode\}/g)?.length,
    2,
    'both whole-lesson adapters must receive the fixed Focus Nova mode',
  );
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
