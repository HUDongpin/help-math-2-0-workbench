'use client';

import {track} from '@vercel/analytics';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  boundedNovaHistory,
  prepareNovaFrame,
  type NovaConversationEntry,
} from '@/lib/nova-client';
import {NovaMarkdown} from '@/components/nova-markdown';
import {
  NOVA_TUTOR_DISPLAY_NAME,
  NOVA_TUTOR_GATEWAY,
  NOVA_TUTOR_MODEL,
  type NovaTutorModel,
} from '@/lib/nova-provider-contract';
import type {NovaClientCapabilities} from '@/lib/nova-capabilities';
import type {NovaTutorInputMethod} from '@/lib/nova-request-schema';
import {
  tutorContextSummary,
  type NovaTutorMode,
  type TutorFrameSnapshot,
  type TutorPageContext,
} from '@/lib/tutor-integration';

interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  readonly error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type NovaSpeechTelemetryStatus =
  | 'aborted'
  | 'confirmed-send'
  | 'draft-ready'
  | 'listening-started'
  | 'network-error'
  | 'no-speech'
  | 'permission-denied'
  | 'recognition-error'
  | 'start-failed';

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function subscribeToSpeechRecognitionAvailability() {
  return () => undefined;
}

function speechRecognitionAvailableInBrowser() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function speechRecognitionUnavailableOnServer() {
  return false;
}

function recordNovaSpeechStatus(
  status: NovaSpeechTelemetryStatus,
  locale: 'en' | 'es',
) {
  // Never add transcript, question, context, course, or learner identity here.
  track('nova_speech_status', {locale, status});
}

class NovaClientError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'NovaClientError';
  }
}

function MicrophoneIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11Z" />
  </svg>;
}

function PlusIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M11 5a1 1 0 0 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5Z" />
  </svg>;
}

function tutorPlacementKey(context: TutorPageContext) {
  return `${context.releaseId}:${context.globalPageOrdinal}:${context.animationId}`;
}

function frameMatchesContext(
  frame: TutorFrameSnapshot | null | undefined,
  context: TutorPageContext,
): frame is TutorFrameSnapshot {
  return Boolean(
    frame &&
    frame.releaseId === context.releaseId &&
    frame.globalPageOrdinal === context.globalPageOrdinal &&
    frame.animationId === context.animationId,
  );
}

/**
 * Provider-neutral Nova identity adapted from the concentric-orbit mark in
 * MAIS-MVP's AITutorButton. The mark carries no provider claim; HELP Math's
 * server contract independently remains locked to GPT-5.6 Luna.
 */
export function NovaTutorBrand() {
  return <span aria-hidden="true" className="lesson-shell2__nova-brand">
    <span className="lesson-shell2__nova-orbit">
      <span className="lesson-shell2__nova-orbit-halo" />
      <span className="lesson-shell2__nova-orbit-ring" />
      <span className="lesson-shell2__nova-orbit-core" />
    </span>
    <span className="lesson-shell2__nova-brand-name">Nova Tutor</span>
  </span>;
}

function novaErrorMessage(locale: 'en' | 'es', code: string) {
  const spanish = locale === 'es';
  switch (code) {
    case 'NOVA_NOT_CONFIGURED':
      return spanish
        ? 'Nova no está configurado ahora. Pide ayuda a tu docente e inténtalo más tarde.'
        : 'Nova is not configured right now. Ask your teacher for help and try again later.';
    case 'NOVA_TIMEOUT':
      return spanish
        ? 'Nova tardó demasiado. Inténtalo de nuevo.'
        : 'Nova took too long. Please try again.';
    case 'NOVA_BUSY':
      return spanish
        ? 'Nova está ocupado. Espera un momento e inténtalo de nuevo.'
        : 'Nova is busy. Wait a moment and try again.';
    case 'NOVA_COURSE_NOT_AVAILABLE':
      return spanish
        ? 'Nova no está disponible para esta lección. Sigue usando los apoyos de la página.'
        : 'Nova is not available for this lesson. Keep using the supports on this page.';
    case 'NOVA_FRAME_NOT_AVAILABLE':
      return spanish
        ? 'No se puede compartir el fotograma actual. Quita el fotograma y envía solo el texto.'
        : 'The current lesson frame cannot be shared. Remove it and send text only.';
    case 'VALIDATION_ERROR':
      return spanish
        ? 'Esta pregunta no coincide con la página actual. Actualiza la lección e inténtalo de nuevo.'
        : 'This question does not match the current page. Refresh the lesson and try again.';
    case 'REQUEST_TOO_LARGE':
      return spanish
        ? 'Esta pregunta no pudo enviarse. Acórtala o quita el fotograma e inténtalo de nuevo.'
        : 'This question could not be sent. Shorten it or remove the lesson frame and try again.';
    case 'ORIGIN_DENIED':
      return spanish
        ? 'La comprobación de seguridad de esta sesión falló. Actualiza la página e inténtalo de nuevo.'
        : 'This session failed a security check. Refresh the page and try again.';
    case 'INVALID_RESPONSE':
      return spanish
        ? 'La respuesta de Nova no se pudo leer de forma segura. Inténtalo de nuevo.'
        : 'Nova’s reply could not be read safely. Please try again.';
    case 'NETWORK_ERROR':
      return spanish
        ? 'No se pudo conectar con Nova. Revisa tu conexión e inténtalo de nuevo.'
        : 'Could not connect to Nova. Check your connection and try again.';
    case 'NOVA_UNAVAILABLE':
      return spanish
        ? 'El servicio de Nova no está disponible temporalmente. Inténtalo de nuevo.'
        : 'Nova’s service is temporarily unavailable. Please try again.';
    default:
      return spanish
        ? 'Nova no pudo responder de forma segura. Inténtalo de nuevo.'
        : 'Nova could not respond safely. Please try again.';
  }
}

function useNovaConversation({
  context,
  locale,
  mode,
  onProviderConfirmed,
}: {
  context: TutorPageContext;
  locale: 'en' | 'es';
  mode: NovaTutorMode;
  onProviderConfirmed?: (model: NovaTutorModel) => void;
}) {
  const [conversation, setConversation] = useState<NovaConversationEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastModel, setLastModel] = useState<NovaTutorModel | null>(null);
  const conversationRef = useRef<NovaConversationEntry[]>([]);
  const busyRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  const appendConversation = useCallback((entry: NovaConversationEntry) => {
    const next = [...conversationRef.current, entry];
    conversationRef.current = next;
    if (mountedRef.current) setConversation(next);
  }, []);

  const askNova = useCallback(async (
    rawMessage: string,
    frame?: TutorFrameSnapshot,
    inputMethod: NovaTutorInputMethod = 'typed',
  ) => {
    const message = rawMessage.trim().slice(0, 1_200);
    if (!message || busyRef.current) return false;

    busyRef.current = true;
    setBusy(true);
    setError('');
    const history = boundedNovaHistory(conversationRef.current);
    appendConversation({role: 'user', text: message});
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      const response = await fetch('/api/nova', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          locale,
          mode,
          message,
          history,
          context,
          // Preserve the historical typed-text wire shape. Only a transcript
          // that reached the explicit Send action carries this content-free
          // provenance marker; no raw audio ever enters the request.
          ...(inputMethod === 'speech-to-draft' ? {inputMethod} : {}),
          ...(frame ? {frame: {
            releaseId: frame.releaseId,
            animationId: frame.animationId,
            globalPageOrdinal: frame.globalPageOrdinal,
            dataUrl: frame.dataUrl,
            width: frame.width,
            height: frame.height,
          }} : {}),
        }),
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller.signal,
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        if (response.status === 429) throw new NovaClientError('NOVA_BUSY');
        throw new NovaClientError('INVALID_RESPONSE');
      }

      if (!response.ok) {
        const code = payload && typeof payload === 'object' &&
            'error' in payload && payload.error && typeof payload.error === 'object' &&
            'code' in payload.error && typeof payload.error.code === 'string'
          ? payload.error.code
          : 'NOVA_UNAVAILABLE';
        throw new NovaClientError(code);
      }

      if (
        !payload || typeof payload !== 'object' ||
        !('ok' in payload) || payload.ok !== true ||
        !('reply' in payload) || typeof payload.reply !== 'string' ||
        !payload.reply.trim() ||
        !('model' in payload) || payload.model !== NOVA_TUTOR_MODEL
      ) {
        throw new NovaClientError('INVALID_RESPONSE');
      }

      appendConversation({role: 'assistant', text: payload.reply.trim()});
      if (mountedRef.current) {
        setLastModel(NOVA_TUTOR_MODEL);
        onProviderConfirmed?.(NOVA_TUTOR_MODEL);
      }
      return true;
    } catch (caught) {
      if (controller.signal.aborted) return false;
      const code = caught instanceof NovaClientError
        ? caught.code
        : 'NETWORK_ERROR';
      if (mountedRef.current) setError(novaErrorMessage(locale, code));
      return false;
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  }, [appendConversation, context, locale, mode, onProviderConfirmed]);

  return {askNova, busy, conversation, error, lastModel};
}

function useNovaSpeech({
  busy,
  enabled,
  locale,
  onDraft,
  onNotice,
}: {
  busy: boolean;
  enabled: boolean;
  locale: 'en' | 'es';
  onDraft: (transcript: string) => void;
  onNotice: (notice: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechDraftReadyRef = useRef(false);
  const browserSupportsSpeech = useSyncExternalStore(
    subscribeToSpeechRecognitionAvailability,
    speechRecognitionAvailableInBrowser,
    speechRecognitionUnavailableOnServer,
  );
  const availability = enabled && browserSupportsSpeech
    ? 'available' as const
    : 'unavailable' as const;

  useEffect(() => () => {
    speechDraftReadyRef.current = false;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;
    recognition.abort();
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    if (enabled) return;
    speechDraftReadyRef.current = false;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;
    recognition.abort();
    recognitionRef.current = null;
    setListening(false);
  }, [enabled]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // A rapid second activation can arrive after the browser has already
      // begun stopping the same recognition session. Its onend handler owns
      // the final state cleanup, so there is nothing else to do here.
    }
  }, []);

  const confirmDraftSend = useCallback((): NovaTutorInputMethod => {
    if (!speechDraftReadyRef.current) return 'typed';
    speechDraftReadyRef.current = false;
    recordNovaSpeechStatus('confirmed-send', locale);
    return 'speech-to-draft';
  }, [locale]);

  const reconcileDraftOrigin = useCallback((draft: string) => {
    // Ordinary edits still belong to the learner-confirmed speech-to-draft
    // workflow. Clearing the field ends that provenance so later typed text
    // is not mislabeled as voice input in server observability.
    if (!draft.trim()) speechDraftReadyRef.current = false;
  }, []);

  const startListening = useCallback(() => {
    if (!enabled || availability !== 'available' || busy) return;
    if (recognitionRef.current) {
      stopListening();
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      onNotice(locale === 'es'
        ? 'El reconocimiento de voz no está disponible en este navegador. Escribe tu pregunta.'
        : 'Speech recognition is not available in this browser. Type your question instead.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = locale === 'es' ? 'es-US' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    let latestTranscript = '';
    let finalized = false;

    const finishWithTranscript = () => {
      const transcript = latestTranscript.trim();
      if (!transcript || finalized) return;
      finalized = true;
      onDraft(transcript);
      speechDraftReadyRef.current = true;
      recordNovaSpeechStatus('draft-ready', locale);
      onNotice(locale === 'es'
        ? 'Se añadió la transcripción. Revísala y luego pulsa Enviar.'
        : 'Transcript added. Review it, then press Send.');
    };

    recognition.onresult = (event) => {
      const parts: string[] = [];
      let finalResult = false;
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();
        if (transcript) parts.push(transcript);
        if (result.isFinal) finalResult = true;
      }
      if (parts.length) {
        latestTranscript = parts.join(' ').slice(0, 1_200);
        onDraft(latestTranscript);
      }
      if (finalResult) {
        finishWithTranscript();
        stopListening();
      }
    };
    recognition.onerror = (event) => {
      const denied = event.error === 'not-allowed' ||
        event.error === 'service-not-allowed' ||
        event.error === 'audio-capture';
      recordNovaSpeechStatus(
        denied
          ? 'permission-denied'
          : event.error === 'no-speech'
            ? 'no-speech'
            : event.error === 'network'
              ? 'network-error'
              : event.error === 'aborted'
                ? 'aborted'
                : 'recognition-error',
        locale,
      );
      if (event.error !== 'aborted') {
        finalized = true;
        onNotice(denied
          ? (locale === 'es'
              ? 'El navegador no permitió el micrófono. Permite el acceso o escribe tu pregunta.'
              : 'The browser did not allow microphone access. Allow it or type your question.')
          : (locale === 'es'
              ? 'No se detectó una pregunta clara. Inténtalo de nuevo o escribe.'
              : 'No clear question was detected. Try again or type instead.'));
      }
    };
    recognition.onend = () => {
      finishWithTranscript();
      recognitionRef.current = null;
      setListening(false);
    };

    try {
      recognition.start();
      setListening(true);
      recordNovaSpeechStatus('listening-started', locale);
      onNotice(locale === 'es'
        ? 'Escuchando… La transcripción se añadirá como borrador para que la revises.'
        : 'Listening… The transcript will be added as a draft for your review.');
    } catch {
      recognitionRef.current = null;
      setListening(false);
      recordNovaSpeechStatus('start-failed', locale);
      onNotice(locale === 'es'
        ? 'No se pudo iniciar el micrófono. Escribe tu pregunta.'
        : 'The microphone could not start. Type your question instead.');
    }
  }, [availability, busy, enabled, locale, onDraft, onNotice, stopListening]);

  return {
    availability,
    confirmDraftSend,
    listening,
    reconcileDraftOrigin,
    startListening,
  };
}

/**
 * Focus and Study Nova surface. Conversation is held only in React memory:
 * it is not persisted, and the browser sends voice transcripts rather than
 * application-recorded audio. A frame is sent only after explicit attachment.
 */
export function LessonNovaTutor({
  capabilities,
  context,
  frameSnapshot,
  id,
  locale,
  modal = false,
  onClose,
  onProviderConfirmed,
  placement = 'focus',
}: {
  capabilities: NovaClientCapabilities;
  context: TutorPageContext;
  frameSnapshot: TutorFrameSnapshot | null;
  id: string;
  locale: 'en' | 'es';
  modal?: boolean;
  onClose: () => void;
  onProviderConfirmed?: (model: NovaTutorModel) => void;
  placement?: 'focus' | 'study';
}) {
  const spanish = locale === 'es';
  const [question, setQuestion] = useState('');
  const [notice, setNotice] = useState('');
  const [attachedFrame, setAttachedFrame] = useState<TutorFrameSnapshot | null>(null);
  const [framePreparing, setFramePreparing] = useState(false);
  const instanceId = useId().replace(/:/gu, '');
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const framePlacementRef = useRef(tutorPlacementKey(context));
  const placementKey = tutorPlacementKey(context);
  const contextLabel = tutorContextSummary(context);
  const nova = useNovaConversation({
    context,
    locale,
    mode: placement,
    onProviderConfirmed,
  });
  const currentFrameSnapshot = capabilities.currentLessonFrame &&
      frameMatchesContext(frameSnapshot, context)
    ? frameSnapshot
    : null;
  const currentAttachedFrame = capabilities.currentLessonFrame &&
      frameMatchesContext(attachedFrame, context)
    ? attachedFrame
    : null;
  const speech = useNovaSpeech({
    busy: nova.busy,
    enabled: capabilities.speechToDraft,
    locale,
    onDraft: setQuestion,
    onNotice: setNotice,
  });
  const sendQuestion = useCallback(async (rawQuestion: string) => {
    const message = rawQuestion.trim();
    if (!message) {
      setNotice(capabilities.speechToDraft
        ? (spanish ? 'Escribe o di una pregunta primero.' : 'Type or say a question first.')
        : (spanish ? 'Escribe una pregunta primero.' : 'Type a question first.'));
      inputRef.current?.focus();
      return;
    }
    const inputMethod = speech.confirmDraftSend();
    setQuestion('');
    setNotice('');
    const frameForRequest = currentAttachedFrame ?? undefined;
    const succeeded = await nova.askNova(message, frameForRequest, inputMethod);
    if (succeeded && frameForRequest) {
      setAttachedFrame(null);
      setNotice(spanish
        ? 'Nova recibió el fotograma de esta pregunta; ya no está adjunto.'
        : 'Nova received the lesson frame for this question; it is no longer attached.');
    }
  }, [capabilities.speechToDraft, currentAttachedFrame, nova, spanish, speech]);

  const removeFrameAttachment = () => {
    setAttachedFrame(null);
    setNotice(spanish
      ? 'Fotograma quitado. No se enviará con la próxima pregunta.'
      : 'Lesson frame removed. It will not be sent with the next question.');
  };

  const attachCurrentLessonFrame = async () => {
    if (
      !capabilities.currentLessonFrame ||
      !currentFrameSnapshot ||
      nova.busy ||
      framePreparing
    ) return;
    const expectedPlacement = tutorPlacementKey(context);
    setAttachedFrame(null);
    setFramePreparing(true);
    setNotice(spanish
      ? 'Preparando el fotograma actual de la lección…'
      : 'Preparing the current lesson frame…');
    let prepared: TutorFrameSnapshot | null = null;
    try {
      prepared = await prepareNovaFrame(currentFrameSnapshot);
    } catch {
      prepared = null;
    } finally {
      setFramePreparing(false);
    }
    if (framePlacementRef.current !== expectedPlacement) return;
    if (!prepared) {
      setNotice(spanish
        ? 'El fotograma actual no pudo prepararse de forma segura. No se adjuntó nada.'
        : 'The current lesson frame could not be prepared safely. Nothing was attached.');
      return;
    }
    setAttachedFrame(prepared);
    setNotice(spanish
      ? 'Fotograma adjunto solo para la próxima pregunta. Puedes quitarlo antes de enviar.'
      : 'Lesson frame attached for the next question only. You can remove it before sending.');
  };

  useEffect(() => {
    framePlacementRef.current = placementKey;
  }, [placementKey]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [nova.busy, nova.conversation]);

  useEffect(() => {
    if (!modal) return;
    const panel = panelRef.current;
    if (!panel) return;
    closeRef.current?.focus({preventScroll: true});
    const keepFocusInside = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = [...panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )].filter((control) =>
        !control.hidden && control.offsetParent !== null && control.tabIndex >= 0
      );
      if (!controls.length) return;
      const first = controls[0];
      const last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener('keydown', keepFocusInside);
    return () => panel.removeEventListener('keydown', keepFocusInside);
  }, [modal]);

  const statusTitle = nova.busy
    ? (spanish ? 'Nova está pensando…' : 'Nova is thinking…')
    : nova.error
      ? (spanish ? 'Nova no pudo responder' : 'Nova could not respond')
      : nova.lastModel
        ? (spanish ? 'Última respuesta verificada' : 'Last reply verified')
        : '';
  const statusDetail = nova.error || (nova.lastModel
    ? `${NOVA_TUTOR_DISPLAY_NAME} · ${spanish ? 'conversación solo en esta sesión' : 'conversation stays in this session'}`
    : (spanish
        ? 'Hola, soy el profesor Nova ✦, tu tutor de IA. Puedo ayudarte con esta página. Comparte lo que entiendes hasta ahora y usaré el método socrático para guiarte paso a paso en lugar de simplemente darte la respuesta.'
        : 'Hi, I am Professor Nova ✦, your AI Tutor. I can help with this page. Share what you understand so far, and I’ll use the Socratic method to guide you step by step instead of simply giving away the answer.'));
  return <aside
    aria-modal={modal ? true : undefined}
    aria-label={spanish ? 'Apoyo de Nova Tutor' : 'Nova Tutor support'}
    aria-busy={nova.busy}
    className="lesson-shell2__nova-panel"
    data-tutor-placement={placement}
    data-tutor-frame-snapshot={currentFrameSnapshot ? 'available' : 'unavailable'}
    data-tutor-page-title-en={context.pageTitleEnglish}
    data-tutor-page-title-es={context.pageTitleSpanish ?? 'missing-source-title'}
    data-tutor-product-origin="mais-nova-tutor"
    data-tutor-model={nova.lastModel ?? 'not-yet-confirmed'}
    data-tutor-provider={nova.lastModel ? NOVA_TUTOR_GATEWAY : 'not-yet-confirmed'}
    data-tutor-conversation-state={nova.busy
      ? 'loading'
      : nova.error
        ? 'error'
        : nova.conversation.length
          ? 'active'
          : 'ready-empty'}
    data-tutor-frame-sharing={!capabilities.currentLessonFrame
      ? 'disabled'
      : currentAttachedFrame
        ? 'attached-for-next-request'
        : 'current-frame-not-attached'}
    id={id}
    ref={panelRef}
    role={modal ? 'dialog' : undefined}
  >
    <h2 className="sr-only">Nova Tutor</h2>
    <header className="lesson-shell2__nova-panel-header">
      <div>
        <NovaTutorBrand />
      </div>
      <button
        aria-label={spanish ? 'Cerrar Nova' : 'Close Nova'}
        className="lesson-shell2__nova-close"
        onClick={onClose}
        ref={closeRef}
        type="button"
      >×</button>
    </header>

    <section
      aria-label={spanish ? 'Conversación con Nova Tutor' : 'Nova Tutor conversation'}
      className="lesson-shell2__nova-main"
    >
      <div className="lesson-shell2__nova-context">
        <span
          aria-hidden="true"
          data-tutor-current-frame={currentAttachedFrame
            ? 'attached-frame'
            : currentFrameSnapshot
              ? 'captured'
              : 'placeholder'}
          style={currentAttachedFrame
            ? {backgroundImage: `url(${currentAttachedFrame.dataUrl})`}
            : currentFrameSnapshot
              ? {backgroundImage: `url(${currentFrameSnapshot.dataUrl})`}
              : undefined}
        />
        <p><b>{currentAttachedFrame
          ? (spanish ? 'Fotograma adjunto para la próxima pregunta' : 'Lesson frame attached for the next question')
          : framePreparing
            ? (spanish ? 'Preparando el fotograma actual' : 'Preparing current lesson frame')
            : currentFrameSnapshot
              ? (spanish ? 'Fotograma disponible · no enviado' : 'Current frame available · not sent')
              : (spanish ? 'Contexto de página listo' : 'Page context ready')}</b>{' '}{contextLabel}</p>
        {currentAttachedFrame
          ? <button
              aria-label={spanish
                ? 'Quitar el fotograma de la próxima pregunta'
                : 'Remove the lesson frame from the next question'}
              className="lesson-shell2__nova-context-remove"
              disabled={nova.busy}
              onClick={removeFrameAttachment}
              type="button"
            >×</button>
          : null}
      </div>

      <div
        aria-live="polite"
        className="lesson-shell2__nova-status"
        data-nova-status-state={nova.busy
          ? 'busy'
          : nova.error
            ? 'error'
            : nova.lastModel
              ? 'verified'
              : 'welcome'}
        role="status"
      >
        {statusTitle ? <strong>{statusTitle}</strong> : null}
        <span>{statusDetail}</span>
        {context.assessment
          ? <span>{spanish
              ? 'El modo de evaluación está activo. Nova recibe la instrucción de ofrecer pistas y preguntas de guía en lugar de revelar o confirmar la respuesta.'
              : 'Assessment mode is active. Nova is instructed to offer hints and guiding questions instead of revealing or confirming the answer.'}</span>
          : null}
      </div>

      <div
        aria-label={spanish ? 'Conversación de Nova' : 'Nova conversation'}
        aria-live="polite"
        className="lesson-shell2__nova-thread"
        data-nova-thread-empty={nova.conversation.length === 0 && !nova.busy ? 'true' : 'false'}
        ref={threadRef}
        role="log"
      >
        {nova.conversation.map((entry, index) => <div
              className="lesson-shell2__nova-message"
              data-nova-message-role={entry.role}
              key={`${entry.role}-${index}`}
            >
              <strong>{entry.role === 'assistant'
                ? 'Nova'
                : (spanish ? 'Tú' : 'You')}</strong>
              {' '}
              {entry.role === 'assistant'
                ? <NovaMarkdown text={entry.text} />
                : <span>{entry.text}</span>}
              {entry.role === 'assistant'
                ? <p className="lesson-shell2__nova-message-meta">
                    {NOVA_TUTOR_DISPLAY_NAME}
                  </p>
                : null}
            </div>)}
        {nova.busy
          ? <div className="lesson-shell2__nova-message" data-nova-message-role="loading">
              <strong>Nova</strong>{' '}
              <span>{spanish ? 'Pensando en una pista útil…' : 'Thinking of a helpful next step…'}</span>
            </div>
          : null}
      </div>

      <form
        className="lesson-shell2__nova-input"
        onSubmit={(event) => {
          event.preventDefault();
          void sendQuestion(question);
        }}
      >
        <label className="sr-only" htmlFor={`${instanceId}-nova-question`}>
          {spanish ? 'Escribe una pregunta para Nova' : 'Type a question for Nova'}
        </label>
        <textarea
          id={`${instanceId}-nova-question`}
          maxLength={1200}
          onChange={(event) => {
            const nextQuestion = event.target.value;
            speech.reconcileDraftOrigin(nextQuestion);
            setQuestion(nextQuestion);
            setNotice('');
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey)) return;
            event.preventDefault();
            void sendQuestion(question);
          }}
          placeholder={spanish
            ? 'Pide una pista, una explicación, comentarios o ánimo…'
            : 'Ask for a hint, explanation, feedback, or encouragement…'}
          ref={inputRef}
          rows={5}
          value={question}
        />
        <div className="lesson-shell2__nova-input-actions">
          <div className="lesson-shell2__nova-input-tools">
            {capabilities.currentLessonFrame
              ? <button
                  aria-label={spanish
                    ? 'Adjuntar el fotograma actual de la lección'
                    : 'Attach current lesson frame'}
                  className="lesson-shell2__nova-attach"
                  disabled={nova.busy || framePreparing || !currentFrameSnapshot}
                  onClick={() => void attachCurrentLessonFrame()}
                  title={currentFrameSnapshot
                    ? (spanish
                        ? 'Adjuntar solo el fotograma que ya muestra la lección'
                        : 'Attach only the frame already shown in this lesson')
                    : (spanish
                        ? 'El fotograma actual aún no está disponible'
                        : 'The current lesson frame is not available yet')}
                  type="button"
                ><PlusIcon /></button>
              : null}
            {capabilities.speechToDraft
              ? <>
                  <button
                    aria-describedby={`${instanceId}-nova-speech-support`}
                    aria-label={speech.availability === 'available'
                      ? speech.listening
                        ? (spanish ? 'Dejar de escuchar y revisar la transcripción' : 'Stop listening and review transcript')
                        : (spanish ? 'Dictar un borrador para Nova' : 'Dictate a draft for Nova')
                      : (spanish
                          ? 'El dictado no está disponible en este navegador'
                          : 'Dictation is unavailable in this browser')}
                    aria-pressed={speech.listening}
                    className="lesson-shell2__nova-mic"
                    disabled={nova.busy || speech.availability !== 'available'}
                    onClick={speech.startListening}
                    type="button"
                  ><MicrophoneIcon /></button>
                  <span className="sr-only" id={`${instanceId}-nova-speech-support`}>
                    {speech.availability === 'available'
                      ? (spanish
                          ? 'La transcripción se añade al campo como borrador editable y no se envía automáticamente.'
                          : 'The transcript is added to the field as an editable draft and is not sent automatically.')
                      : (spanish
                          ? 'Este navegador no ofrece reconocimiento de voz. Escribe tu pregunta.'
                          : 'This browser does not provide speech recognition. Type your question instead.')}
                  </span>
                </>
              : null}
            <span className="lesson-shell2__nova-input-hint">
              {capabilities.speechToDraft && speech.availability === 'available'
                ? (spanish ? 'Escribe o dicta un borrador' : 'Type or dictate a draft')
                : (spanish ? 'Escribe una pregunta' : 'Type a question')}
            </span>
          </div>
          <button
            aria-label={spanish ? 'Enviar pregunta a Nova' : 'Send question to Nova'}
            className="lesson-shell2__nova-send"
            disabled={nova.busy || !question.trim()}
            type="submit"
          >{nova.busy ? (spanish ? 'Enviando…' : 'Sending…') : (spanish ? 'Enviar' : 'Send')}</button>
        </div>
      </form>
      {notice || nova.error
        ? <p aria-live="polite" className="lesson-shell2__nova-notice">
            {notice || nova.error}
          </p>
        : null}
    </section>
  </aside>;
}

/** Projector-scale Classroom placement with text and optional speech-to-draft. */
export function LessonNovaClassroomBand({
  capabilities,
  context,
  frameSnapshot,
  id,
  locale,
  onClose,
  onProviderConfirmed,
}: {
  capabilities: NovaClientCapabilities;
  context: TutorPageContext;
  frameSnapshot: TutorFrameSnapshot | null;
  id: string;
  locale: 'en' | 'es';
  onClose: () => void;
  onProviderConfirmed?: (model: NovaTutorModel) => void;
}) {
  const spanish = locale === 'es';
  const contextLabel = tutorContextSummary(context);
  const inputId = useId().replace(/:/gu, '');
  const [question, setQuestion] = useState('');
  const [speechNotice, setSpeechNotice] = useState('');
  const nova = useNovaConversation({
    context,
    locale,
    mode: 'classroom',
    onProviderConfirmed,
  });
  const updateSpeechDraft = useCallback((transcript: string) => {
    setQuestion(transcript);
  }, []);
  const speech = useNovaSpeech({
    busy: nova.busy,
    enabled: capabilities.speechToDraft,
    locale,
    onDraft: updateSpeechDraft,
    onNotice: setSpeechNotice,
  });
  const sendQuestion = useCallback(async (rawQuestion: string) => {
    const message = rawQuestion.trim();
    if (!message) {
      setSpeechNotice(capabilities.speechToDraft
        ? (spanish ? 'Escribe o di una pregunta primero.' : 'Type or say a question first.')
        : (spanish ? 'Escribe una pregunta primero.' : 'Type a question first.'));
      return;
    }
    const inputMethod = speech.confirmDraftSend();
    setQuestion('');
    setSpeechNotice('');
    await nova.askNova(message, undefined, inputMethod);
  }, [capabilities.speechToDraft, nova, spanish, speech]);
  const currentFrameSnapshot = capabilities.currentLessonFrame &&
      frameMatchesContext(frameSnapshot, context)
    ? frameSnapshot
    : null;
  const latestUser = [...nova.conversation].reverse().find((entry) => entry.role === 'user');
  const latestAnswer = [...nova.conversation].reverse().find((entry) => entry.role === 'assistant');
  const answer = nova.busy
    ? (spanish ? 'Nova está pensando…' : 'Nova is thinking…')
    : nova.error || latestAnswer?.text || speechNotice || (capabilities.speechToDraft
      ? (spanish
          ? 'Usa el micrófono o escribe una pregunta sobre esta página.'
          : 'Use the microphone or type a question about this page.')
      : (spanish
          ? 'Escribe una pregunta sobre esta página.'
          : 'Type a question about this page.'));

  return <section
    aria-label={spanish ? 'Banda de voz de Nova Tutor' : 'Nova Tutor voice band'}
    aria-busy={nova.busy}
    className="lesson-shell2__nova-classroom-band"
    data-tutor-frame-snapshot={currentFrameSnapshot ? 'available' : 'unavailable'}
    data-tutor-placement="classroom-voice-band"
    data-tutor-model={nova.lastModel ?? 'not-yet-confirmed'}
    data-tutor-provider={nova.lastModel ? NOVA_TUTOR_GATEWAY : 'not-yet-confirmed'}
    data-tutor-conversation-state={nova.busy
      ? 'loading'
      : nova.error
        ? 'error'
        : nova.lastModel
          ? 'answered'
          : 'ready-empty'}
    data-tutor-frame-sharing={capabilities.currentLessonFrame
      ? 'current-frame-not-attached'
      : 'disabled'}
    id={id}
  >
    {capabilities.speechToDraft
      ? <>
          <button
            aria-describedby={`${inputId}-classroom-speech-support`}
            aria-label={speech.availability === 'available'
              ? speech.listening
                ? (spanish ? 'Dejar de escuchar y revisar la transcripción' : 'Stop listening and review transcript')
                : (spanish ? 'Dictar un borrador para Nova' : 'Dictate a draft for Nova')
              : (spanish
                  ? 'El dictado no está disponible en este navegador'
                  : 'Dictation is unavailable in this browser')}
            aria-pressed={speech.listening}
            className="lesson-shell2__nova-classroom-mic"
            disabled={nova.busy || speech.availability !== 'available'}
            onClick={speech.startListening}
            type="button"
          ><MicrophoneIcon /></button>
          <span className="sr-only" id={`${inputId}-classroom-speech-support`}>
            {speech.availability === 'available'
              ? (spanish
                  ? 'La transcripción se añade al campo como borrador editable y no se envía automáticamente.'
                  : 'The transcript is added to the field as an editable draft and is not sent automatically.')
              : (spanish
                  ? 'Este navegador no ofrece reconocimiento de voz. Escribe tu pregunta.'
                  : 'This browser does not provide speech recognition. Type your question instead.')}
          </span>
        </>
      : null}
    <div className="lesson-shell2__nova-classroom-copy">
      <p className="lesson-shell2__nova-classroom-context">
        <span
          aria-hidden="true"
          style={currentFrameSnapshot
            ? {backgroundImage: `url(${currentFrameSnapshot.dataUrl})`}
            : undefined}
        />
        <b>{currentFrameSnapshot
          ? (spanish
              ? 'Fotograma actual · no adjunto'
              : 'Current frame · not attached')
          : (spanish ? 'Contexto de página listo' : 'Page context ready')}</b>{' '}{contextLabel}
      </p>
      <div aria-live="polite" className="lesson-shell2__nova-classroom-exchange" role="status">
        <p><strong>{spanish ? 'Pregunta del estudiante' : 'Student question'}</strong>
          <span>{question || latestUser?.text || (spanish
            ? 'Aún no se registró una pregunta.'
            : 'No question recorded yet.')}</span></p>
        <p className="lesson-shell2__nova-classroom-answer">
          <strong>{nova.lastModel ? `Nova · ${NOVA_TUTOR_DISPLAY_NAME}` : 'Nova'}</strong>
          <span>{answer}</span>
        </p>
      </div>
      <form
        className="lesson-shell2__nova-input lesson-shell2__nova-classroom-input"
        data-classroom-text-fallback="available"
        onSubmit={(event) => {
          event.preventDefault();
          void sendQuestion(question);
        }}
      >
        <label className="sr-only" htmlFor={`${inputId}-classroom-question`}>
          {spanish
            ? 'Escribe una pregunta del aula para Nova'
            : 'Type a classroom question for Nova'}
        </label>
        <input
          disabled={nova.busy}
          id={`${inputId}-classroom-question`}
          maxLength={1200}
          onChange={(event) => {
            const nextQuestion = event.target.value;
            speech.reconcileDraftOrigin(nextQuestion);
            setQuestion(nextQuestion);
            setSpeechNotice('');
          }}
          placeholder={spanish ? 'Escribe una pregunta' : 'Type a question'}
          type="text"
          value={question}
        />
        <button
          aria-label={spanish
            ? 'Enviar pregunta del aula a Nova'
            : 'Send classroom question to Nova'}
          className="lesson-shell2__nova-send"
          disabled={nova.busy || !question.trim()}
          type="submit"
        >{nova.busy
            ? (spanish ? 'Enviando…' : 'Sending…')
            : (spanish ? 'Preguntar' : 'Ask')}</button>
      </form>
    </div>
    <button
      aria-label={spanish ? 'Cerrar Nova' : 'Close Nova'}
      className="lesson-shell2__nova-classroom-close"
      onClick={onClose}
      type="button"
    >×</button>
  </section>;
}
