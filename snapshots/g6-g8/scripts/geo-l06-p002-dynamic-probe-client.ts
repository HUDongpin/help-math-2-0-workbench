/** Local-only dynamic source-vector probe. Not a registered lesson renderer. */
import {geoL06P002MainState} from '../packages/demos/src/geo-l06-p002-display-state-v1';
import {geoL06P002TeachingState} from '../packages/demos/src/geo-l06-p002-teaching-state-v1';
import {geoL06P002VisibleGlossaryTerms} from '../packages/demos/src/geo-l06-p002-glossary-v1';
import {GEO_L06_P002_AUDIO_CLOCK, geoL06P002AudioAtFrame} from
  '../packages/demos/src/geo-l06-p002-audio-clock-v1';

const NS = 'http://www.w3.org/2000/svg';
const MAX_FRAME = 1216;
const AUDIO_PATH = '/migrations/shared-geo001-l06-p002/audit/sprite-230-source-stream-v1.mp3';
const stage = document.querySelector<SVGSVGElement>('#stage')!;
const symbols = document.querySelector<SVGDefsElement>('#source-symbols')!;
const masked = document.querySelector<SVGGElement>('#masked-objects')!;
const unmasked = document.querySelector<SVGGElement>('#unmasked-objects')!;
const frameInput = document.querySelector<HTMLInputElement>('#frame-input')!;
const frameOutput = document.querySelector<HTMLOutputElement>('#frame-output')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const playButton = document.querySelector<HTMLButtonElement>('#play')!;
const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
const replayButton = document.querySelector<HTMLButtonElement>('#replay')!;
const localeInput = document.querySelector<HTMLSelectElement>('#locale-input')!;
const definition = document.querySelector<HTMLParagraphElement>('#teaching-definition')!;
const terms = document.querySelector<HTMLParagraphElement>('#teaching-terms')!;
const fallback = document.querySelector<HTMLParagraphElement>('#teaching-fallback')!;
const glossary = document.querySelector<HTMLDivElement>('#glossary-controls')!;
const glossaryDialog = document.querySelector<HTMLDialogElement>('#glossary-dialog')!;
const glossaryTitle = document.querySelector<HTMLHeadingElement>('#glossary-title')!;
const glossaryDefinition = document.querySelector<HTMLParagraphElement>('#glossary-definition')!;
const glossaryConflict = document.querySelector<HTMLParagraphElement>('#glossary-conflict')!;
const glossaryClose = document.querySelector<HTMLButtonElement>('#glossary-close')!;
const availableCharacters = new Set<number>();
let frame = 1;
let replay = 0;
let playing = false;
let startFrame = 1;
let startTime = 0;
let animationHandle = 0;
let locale: 'en' | 'es' = 'en';
let opener: HTMLButtonElement | null = null;
let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;
let starting = false;
let playbackToken = 0;
const audioSources = new Set<AudioBufferSourceNode>();

function stop() {
  playbackToken += 1;
  starting = false;
  playing = false;
  cancelAnimationFrame(animationHandle);
  for (const source of audioSources) source.stop();
  audioSources.clear();
  playButton.disabled = false;
  pauseButton.disabled = true;
  stage.dataset.sourceAudioState = 'stopped';
}

async function prepareAudio() {
  audioContext ??= new AudioContext({sampleRate: GEO_L06_P002_AUDIO_CLOCK.sampleRate});
  if (audioContext.sampleRate !== GEO_L06_P002_AUDIO_CLOCK.sampleRate) {
    throw Error('GEO_P002_AUDIO_RATE_UNSUPPORTED');
  }
  await audioContext.resume();
  if (audioBuffer) return;
  const response = await fetch(AUDIO_PATH);
  if (!response.ok) throw Error(`GEO_P002_AUDIO_FETCH_${response.status}`);
  const encoded = await response.arrayBuffer();
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoded))]
    .map(value => value.toString(16).padStart(2, '0')).join('');
  if (digest !== GEO_L06_P002_AUDIO_CLOCK.sourceMp3Sha256) throw Error('GEO_P002_AUDIO_HASH_DRIFT');
  const decoded = await audioContext.decodeAudioData(encoded);
  if (decoded.numberOfChannels !== 1 ||
      decoded.sampleRate !== GEO_L06_P002_AUDIO_CLOCK.sampleRate ||
      decoded.length !== GEO_L06_P002_AUDIO_CLOCK.decodedSamples) {
    throw Error('GEO_P002_AUDIO_DECODE_DRIFT');
  }
  audioBuffer = decoded;
}

function scheduleAudioFrom(firstFrame: number) {
  if (!audioContext || !audioBuffer) throw Error('GEO_P002_AUDIO_NOT_READY');
  const origin = audioContext.currentTime;
  for (const segment of GEO_L06_P002_AUDIO_CLOCK.segments) {
    const frame = Math.max(firstFrame, segment.firstFrame);
    if (frame >= segment.endFrame) continue;
    const position = geoL06P002AudioAtFrame(frame);
    if (!position || position.segment !== segment) throw Error('GEO_P002_AUDIO_SEGMENT_DRIFT');
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => audioSources.delete(source);
    audioSources.add(source);
    source.start(origin + (frame - firstFrame) / 12,
      position.decodedSample / GEO_L06_P002_AUDIO_CLOCK.sampleRate,
      (segment.endDecodedSample - position.decodedSample) / GEO_L06_P002_AUDIO_CLOCK.sampleRate);
  }
  stage.dataset.sourceAudioState = 'scheduled';
}

function closeGlossary(restoreFocus: boolean) {
  if (glossaryDialog.open) glossaryDialog.close();
  const prior = opener;
  opener = null;
  if (restoreFocus && prior?.isConnected) prior.focus();
}

function renderTeaching(nextFrame: ReturnType<typeof geoL06P002MainState>) {
  const teaching = geoL06P002TeachingState(nextFrame);
  definition.replaceChildren(...teaching.parts.map(part => {
    const span = document.createElement('span');
    span.textContent = part.text;
    if (part.key) span.dataset.sourceKey = part.key;
    if (part.highlighted) span.className = 'source-highlight';
    return span;
  }));
  definition.hidden = !teaching.definitionVisible;
  definition.style.opacity = String(teaching.definitionOpacity);
  terms.hidden = !teaching.termsVisible;
  terms.style.opacity = String(teaching.termsOpacity);
  terms.replaceChildren();
  for (const [index, label] of ['radius', 'diameter'].entries()) {
    if (index) terms.append(', ');
    const span = document.createElement('span');
    span.textContent = label;
    if (teaching.highlightedTerm === label) span.className = 'source-highlight';
    terms.append(span);
  }
  fallback.hidden = !(teaching.spanishSourceFallback &&
    (teaching.definitionVisible || teaching.termsVisible));
  const visibleTerms = geoL06P002VisibleGlossaryTerms(nextFrame);
  if (visibleTerms.length === 0) {
    closeGlossary(false);
    glossary.replaceChildren();
  } else {
    const existing = new Map([...glossary.querySelectorAll<HTMLButtonElement>('button')]
      .map(button => [button.dataset.sourceId, button]));
    const controls = visibleTerms.map(term => {
      const button = existing.get(String(term.sourceCharacterId)) ?? document.createElement('button');
      button.type = 'button';
      button.dataset.sourceId = String(term.sourceCharacterId);
      button.dataset.sourceKey = term.sourceKeyAttribute;
      button.textContent = term.label;
      button.onclick = () => {
        stop();
        opener = button;
        glossaryTitle.textContent = term.label;
        glossaryDefinition.textContent = term.definition;
        glossaryDefinition.lang = locale;
        glossaryConflict.hidden = !term.sourceDefinitionConflict;
        glossaryDialog.showModal();
        glossaryClose.focus();
      };
      return button;
    });
    glossary.replaceChildren(...controls);
  }
  glossary.hidden = visibleTerms.length === 0;
}

function draw(nextFrame: number) {
  const state = geoL06P002MainState(nextFrame, {
    frame: nextFrame, frameDomain: 'sprite-230', scenario: 'default', lang: locale, seed: 0, replay,
  });
  const under: SVGUseElement[] = [];
  const over: SVGUseElement[] = [];
  for (const object of state.objects) {
    if (object.depth === 1 && object.characterId === 4 && object.clipDepth === 668) continue;
    if ([211, 212, 213, 214].includes(object.characterId)) continue;
    if (object.characterId >= 209 && object.characterId <= 229 &&
        !availableCharacters.has(object.characterId)) continue;
    if (!availableCharacters.has(object.characterId)) {
      throw Error(`GEO_P002_UNSUPPORTED_CHARACTER_${object.characterId}`);
    }
    const color = object.colorTransform;
    if (color.addAlpha !== undefined ||
        ['factorRed', 'factorGreen', 'factorBlue'].some(key =>
          color[key] !== undefined && Number(color[key]) !== 256)) {
      throw Error(`GEO_P002_UNSUPPORTED_COLOR_${object.characterId}`);
    }
    const alpha = color.factorAlpha === undefined ? 1 : Number(color.factorAlpha) / 256;
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw Error('GEO_P002_ALPHA_DRIFT');
    const transform = object.transform;
    const matrix = [transform.scaleX ?? '1', transform.skewY ?? '0',
      transform.skewX ?? '0', transform.scaleY ?? '1',
      String(Number(transform.transX ?? 0) / 20), String(Number(transform.transY ?? 0) / 20)];
    if (!matrix.every(value => Number.isFinite(Number(value)))) throw Error('GEO_P002_MATRIX_DRIFT');
    const use = document.createElementNS(NS, 'use');
    use.setAttribute('href', `#geo-p002-character-${object.characterId}`);
    use.setAttribute('transform', `matrix(${matrix.join(' ')})`);
    use.setAttribute('opacity', String(alpha));
    use.setAttribute('data-source-depth', String(object.depth));
    (object.depth <= 668 ? under : over).push(use);
  }
  masked.replaceChildren(...under);
  unmasked.replaceChildren(...over);
  frame = nextFrame;
  frameInput.value = String(frame);
  frameOutput.value = `${frame}/${MAX_FRAME}`;
  stage.dataset.flashFrame = String(frame);
  stage.dataset.flashReplay = String(replay);
  stage.dataset.flashLanguage = locale;
  stage.dataset.sourceTextIds = state.sourceTextIds.join(',');
  stage.dataset.sourceGlossaryButtonIds = state.sourceGlossaryButtonIds.join(',');
  renderTeaching(state);
  status.value = `source objects ${under.length + over.length}; source MP3 transport candidate, sync unaccepted`;
}

function tick(now: number) {
  if (!playing) return;
  const nextFrame = Math.min(MAX_FRAME, Math.max(startFrame,
    startFrame + Math.floor((now - startTime) * 12 / 1000)));
  if (nextFrame !== frame) draw(nextFrame);
  if (nextFrame === MAX_FRAME) stop();
  else animationHandle = requestAnimationFrame(tick);
}

frameInput.addEventListener('change', () => {
  const requested = Number(frameInput.value);
  if (!Number.isSafeInteger(requested) || requested < 1 || requested > MAX_FRAME) {
    frameInput.value = String(frame);
    return;
  }
  stop();
  draw(requested);
});
playButton.addEventListener('click', async () => {
  if (playing || starting) return;
  if (frame === MAX_FRAME) draw(1);
  const token = ++playbackToken;
  starting = true;
  playButton.disabled = true;
  status.value = 'Loading exact source MP3 for local transport test';
  try {
    await prepareAudio();
    if (token !== playbackToken) return;
    scheduleAudioFrom(frame);
    startFrame = frame;
    startTime = performance.now();
    playing = true;
    starting = false;
    pauseButton.disabled = false;
    animationHandle = requestAnimationFrame(tick);
  } catch (error) {
    if (token === playbackToken) {
      stop();
      status.value = error instanceof Error ? error.message : 'GEO_P002_AUDIO_START_FAILED';
    }
  }
});
pauseButton.addEventListener('click', stop);
replayButton.addEventListener('click', () => {
  stop();
  closeGlossary(false);
  replay += 1;
  draw(1);
});
localeInput.addEventListener('change', () => {
  if (localeInput.value !== 'en' && localeInput.value !== 'es') throw Error('GEO_P002_INVALID_LOCALE');
  stop();
  closeGlossary(false);
  locale = localeInput.value;
  draw(frame);
});
glossaryClose.addEventListener('click', () => closeGlossary(true));
glossaryDialog.addEventListener('cancel', event => {
  event.preventDefault();
  closeGlossary(true);
});
addEventListener('pagehide', () => {
  stop();
  void audioContext?.close();
  audioContext = null;
  audioBuffer = null;
});

async function initialize() {
  const response = await fetch('/migrations/shared-geo001-l06-p002/audit/source-symbol-sheet-v1.svg');
  if (!response.ok) throw Error(`GEO_P002_SYMBOL_FETCH_${response.status}`);
  const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  if (source.querySelector('parsererror')) throw Error('GEO_P002_SYMBOL_PARSE');
  const sourceDefs = source.querySelector('defs');
  if (!sourceDefs || sourceDefs.children.length !== 207) throw Error('GEO_P002_SYMBOL_COUNT');
  for (const item of sourceDefs.children) {
    const match = /^geo-p002-character-(\d+)$/.exec(item.id);
    if (!match) throw Error('GEO_P002_SYMBOL_ID');
    availableCharacters.add(Number(match[1]));
  }
  if (availableCharacters.size !== 207) throw Error('GEO_P002_SYMBOL_DUPLICATE');
  symbols.replaceChildren(...[...sourceDefs.children].map(item => document.importNode(item, true)));
  draw(1);
  frameInput.disabled = false;
  playButton.disabled = false;
  replayButton.disabled = false;
  localeInput.disabled = false;
}
initialize().catch(error => { status.value = error instanceof Error ? error.message : 'GEO_P002_INIT_FAILED'; });
