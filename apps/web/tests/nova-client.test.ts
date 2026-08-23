import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'node:test';
import {NOVA_REQUEST_LIMITS} from '../lib/nova-request-schema';
import {
  NOVA_CLIENT_LIMITS,
  boundedNovaHistory,
  novaFrameDataUrlByteLength,
  novaFrameFitsRequest,
  prepareNovaFrame,
} from '../lib/nova-client';

describe('Nova client request boundaries', () => {
  it('stays locked to the server history and frame limits', () => {
    assert.deepEqual(NOVA_CLIENT_LIMITS, {
      historyMessages: NOVA_REQUEST_LIMITS.historyMessages,
      historyMessageCharacters: NOVA_REQUEST_LIMITS.historyMessageCharacters,
      historyTotalCharacters: NOVA_REQUEST_LIMITS.historyTotalCharacters,
      frameBytes: NOVA_REQUEST_LIMITS.frameBytes,
      frameDataUrlCharacters: NOVA_REQUEST_LIMITS.frameDataUrlCharacters,
    });
  });

  it('keeps only newest history under every count and character limit', () => {
    const history = boundedNovaHistory(Array.from({length: 12}, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      text: `${index}:`.padEnd(1_002, String(index % 10)),
    })));
    assert.ok(history.length <= 8);
    assert.ok(history.every((entry) => entry.text.length <= 800));
    assert.ok(history.reduce((sum, entry) => sum + entry.text.length, 0) <= 4_800);
    assert.match(history.at(-1)?.text ?? '', /^11:/);
    assert.doesNotMatch(history.map((entry) => entry.text).join('|'), /^0:/);
  });

  it('drops blank history and correctly bounds base64 frame bytes', () => {
    assert.deepEqual(boundedNovaHistory([
      {role: 'user', text: '   '},
      {role: 'assistant', text: ' useful reply '},
    ]), [{role: 'assistant', text: 'useful reply'}]);

    const onePixelPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    assert.equal(novaFrameDataUrlByteLength(onePixelPng), 68);
    assert.equal(novaFrameFitsRequest(onePixelPng), true);
    assert.equal(novaFrameFitsRequest('data:image/svg+xml;base64,PHN2Zz4='), false);
    assert.equal(novaFrameFitsRequest(
      `data:image/jpeg;base64,${'A'.repeat(24_580)}`,
    ), false);
  });

  it('preserves exact placement identity while preparing the current lesson frame', async () => {
    const priorDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const priorImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
    class ReadyFrameImage {
      decoding = 'async';
      naturalHeight = 600;
      naturalWidth = 800;
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    Object.defineProperty(globalThis, 'Image', {
      configurable: true,
      value: ReadyFrameImage,
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        createElement: () => ({
          getContext: () => ({
            drawImage: () => undefined,
            fillRect: () => undefined,
            fillStyle: '',
          }),
          height: 0,
          toDataURL: () => 'data:image/jpeg;base64,AAAA',
          width: 0,
        }),
      },
    });

    try {
      assert.deepEqual(await prepareNovaFrame({
        releaseId: 'lesson-g04-l03-negative-numbers',
        animationId: 'course-g04-l03-rw-003',
        globalPageOrdinal: 7,
        dataUrl: 'data:image/png;base64,AAAA',
        height: 600,
        width: 800,
      }), {
        releaseId: 'lesson-g04-l03-negative-numbers',
        animationId: 'course-g04-l03-rw-003',
        globalPageOrdinal: 7,
        dataUrl: 'data:image/jpeg;base64,AAAA',
        height: 360,
        width: 480,
      });
    } finally {
      if (priorDocument) Object.defineProperty(globalThis, 'document', priorDocument);
      else Reflect.deleteProperty(globalThis, 'document');
      if (priorImage) Object.defineProperty(globalThis, 'Image', priorImage);
      else Reflect.deleteProperty(globalThis, 'Image');
    }
  });

  it('fails closed when a browser refuses to draw an attached frame', async () => {
    const priorDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const priorImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
    class FailingFrameImage {
      decoding = 'async';
      naturalHeight = 600;
      naturalWidth = 800;
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    Object.defineProperty(globalThis, 'Image', {
      configurable: true,
      value: FailingFrameImage,
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        createElement: () => ({
          getContext: () => ({
            drawImage: () => {
              throw new Error('synthetic draw failure');
            },
            fillRect: () => undefined,
            fillStyle: '',
          }),
          height: 0,
          width: 0,
        }),
      },
    });

    try {
      assert.equal(await prepareNovaFrame({
        releaseId: 'lesson-g04-l03-negative-numbers',
        animationId: 'course-g04-l03-rw-003',
        globalPageOrdinal: 7,
        dataUrl: 'data:image/png;base64,AAAA',
        height: 600,
        width: 800,
      }), null);
    } finally {
      if (priorDocument) Object.defineProperty(globalThis, 'document', priorDocument);
      else Reflect.deleteProperty(globalThis, 'document');
      if (priorImage) Object.defineProperty(globalThis, 'Image', priorImage);
      else Reflect.deleteProperty(globalThis, 'Image');
    }
  });

  it('rejects an excessive decoded image before allocating a canvas', async () => {
    const priorDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const priorImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
    let canvasAllocations = 0;
    class OversizedFrameImage {
      decoding = 'async';
      naturalHeight = 13_000;
      naturalWidth = 13_000;
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    Object.defineProperty(globalThis, 'Image', {
      configurable: true,
      value: OversizedFrameImage,
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        createElement: () => {
          canvasAllocations += 1;
          return {};
        },
      },
    });

    try {
      assert.equal(await prepareNovaFrame({
        releaseId: 'lesson-g04-l03-negative-numbers',
        animationId: 'course-g04-l03-rw-003',
        globalPageOrdinal: 7,
        dataUrl: 'data:image/jpeg;base64,AAAA',
        height: 13_000,
        width: 13_000,
      }), null);
      assert.equal(canvasAllocations, 0);
    } finally {
      if (priorDocument) Object.defineProperty(globalThis, 'document', priorDocument);
      else Reflect.deleteProperty(globalThis, 'document');
      if (priorImage) Object.defineProperty(globalThis, 'Image', priorImage);
      else Reflect.deleteProperty(globalThis, 'Image');
    }
  });

  it('keeps one Nova surface with explicit lesson-frame sharing and speech-to-draft', async () => {
    const [source, styles, client] = await Promise.all([
      readFile(new URL('../components/lesson-nova-tutor.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
      readFile(new URL('../lib/nova-client.ts', import.meta.url), 'utf8'),
    ]);
    assert.match(source, /fetch\('\/api\/nova'/);
    assert.match(source, /window\.SpeechRecognition/);
    assert.match(source, /prepareNovaFrame/);
    assert.match(source, /mode: 'classroom'/);
    assert.doesNotMatch(source, /quickChoices|Question starters|Inicios de pregunta/);
    assert.doesNotMatch(source, /Concept explanation|Step-by-step hint|Answer check/);
    assert.match(source, /Nova is instructed to offer hints and guiding questions/);
    assert.match(source, /className="lesson-shell2__nova-main"/);
    assert.match(source, /function NovaTutorBrand/);
    assert.match(source, /lesson-shell2__nova-orbit/);
    assert.match(source, /lesson-shell2__nova-brand-name">Nova Tutor/);
    assert.doesNotMatch(
      source,
      /<h3>\{spanish \? 'Profesor Nova' : 'Professor Nova'\}<\/h3>/,
    );
    assert.match(source, /aria-label=\{spanish \? 'Conversación con Nova Tutor' : 'Nova Tutor conversation'\}/);
    assert.doesNotMatch(source, /NovaSupportTab|role="tablist"|role="tab"|role="tabpanel"/);
    assert.doesNotMatch(source, /Read it|Leer de nuevo|Words in this lesson|Palabras de esta lección/);
    assert.doesNotMatch(source, /The conversation is not saved|La conversación no se guarda/);
    assert.match(source, /notice \|\| nova\.error[\s\S]*lesson-shell2__nova-notice/);
    assert.match(source, /NOVA_COURSE_NOT_AVAILABLE/);
    assert.match(source, /NOVA_FRAME_NOT_AVAILABLE/);
    assert.match(source, /Nova is not available for this lesson/);
    assert.match(source, /Nova no está disponible para esta lección/);
    assert.match(source, /The current lesson frame cannot be shared/);
    assert.match(source, /No se puede compartir el fotograma actual/);
    assert.match(source, /response\.status === 429[\s\S]*NOVA_BUSY/);
    assert.match(source, /className="lesson-shell2__nova-attach"/);
    assert.match(source, /function PlusIcon/);
    assert.match(source, /<textarea[\s\S]*rows=\{5\}/);
    assert.match(source, /Hi, I am Professor Nova ✦, your AI Tutor\./);
    assert.match(source, /Hola, soy el profesor Nova ✦, tu tutor de IA\./);
    assert.doesNotMatch(source, /A connection is not claimed until a real response is received/);
    assert.doesNotMatch(source, /No se afirma una conexión hasta recibir una respuesta real/);
    assert.match(source, /Attach current lesson frame/);
    assert.match(source, /Adjuntar el fotograma actual de la lección/);
    assert.match(source, /current-frame-not-attached/);
    assert.doesNotMatch(source, /local-not-sent|Local frame|Fotograma local/);
    assert.match(source, /releaseId: frame\.releaseId/);
    assert.match(source, /globalPageOrdinal: frame\.globalPageOrdinal/);
    assert.match(source, /enabled: capabilities\.speechToDraft/);
    assert.match(source, /Transcript added\. Review it, then press Send\./);
    assert.match(source, /setQuestion\(transcript\)/);
    assert.match(source, /speech\.availability !== 'available'/);
    assert.match(source, /Dictation is unavailable in this browser/);
    assert.match(source, /aria-describedby=\{`\$\{instanceId\}-nova-speech-support`\}/);
    assert.match(source, /aria-describedby=\{`\$\{inputId\}-classroom-speech-support`\}/);
    assert.doesNotMatch(source, /onFinal|sendQuestion\(transcript\)/);
    assert.ok(
      [...source.matchAll(/void sendQuestion\(question\)/g)].length >= 2,
      'Focus and Classroom must both retain an explicit submit path',
    );
    assert.match(
      source,
      /className="lesson-shell2__nova-attach"[\s\S]*className="lesson-shell2__nova-mic"[\s\S]*className="lesson-shell2__nova-send"/,
    );
    assert.doesNotMatch(
      source,
      /type="file"|accept="image\/|readLocalImage|NOVA_LOCAL_IMAGE|getUserMedia|mediaDevices|CameraIcon|lesson-shell2__nova-camera/,
    );
    assert.match(styles, /--lesson-nova-inline-space: clamp\(1\.25rem, 1\.8vw, 1\.75rem\)/);
    assert.match(styles, /--lesson-nova-panel-track: 27\.1875rem/);
    assert.match(styles, /\.lesson-shell2__nova-orbit-halo/);
    assert.match(styles, /\.lesson-shell2__nova-orbit-ring/);
    assert.match(styles, /\.lesson-shell2__nova-orbit-core/);
    assert.match(styles, /\.lesson-shell2__nova-main \{[\s\S]*padding-inline: var\(--lesson-nova-inline-space\)/);
    assert.doesNotMatch(styles, /lesson-shell2__nova-tabs|lesson-shell2__nova-tab-panel/);
    assert.doesNotMatch(styles, /lesson-shell2__nova-chips/);
    assert.match(styles, /lesson-shell2__nova-input textarea \{[\s\S]*min-height: clamp\(8rem, 17vh, 11rem\)/);
    assert.match(styles, /lesson-shell2__nova-input-actions \{[\s\S]*display: flex/);
    assert.match(styles, /lesson-shell2__nova-input-tools \{[\s\S]*gap: \.5rem/);
    assert.match(styles, /lesson-shell2__nova-mic,[\s\S]*lesson-shell2__nova-attach,[\s\S]*height: 52px;[\s\S]*width: 52px/);
    assert.match(styles, /lesson-shell2__nova-attach svg \{[\s\S]*height: 24px;[\s\S]*width: 24px/);
    assert.match(styles, /max\(var\(--lesson-nova-inline-space\), env\(safe-area-inset-right\)\)/);
    assert.match(client, /NOVA_FRAME_DECODE_TIMEOUT_MS = 8_000/);
    assert.match(client, /NOVA_FRAME_MAX_SOURCE_DIMENSION = 12_000/);
    assert.match(client, /NOVA_FRAME_MAX_SOURCE_PIXELS = 40_000_000/);
  });
});
