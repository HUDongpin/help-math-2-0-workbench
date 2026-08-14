'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import {
  boundedNovaHistory,
  prepareNovaFrame,
  type NovaConversationEntry,
} from '@/lib/nova-client';
import {
  NOVA_TUTOR_DISPLAY_NAME,
  NOVA_TUTOR_GATEWAY,
  NOVA_TUTOR_MODEL,
  type NovaTutorModel,
} from '@/lib/nova-provider-contract';
import {
  tutorContextSummary,
  type NovaTutorMode,
  type TutorFrameSnapshot,
  type TutorPageContext,
} from '@/lib/tutor-integration';

export type NovaSupportTab = 'nova' | 'read' | 'words';

const TAB_ORDER: readonly NovaSupportTab[] = ['nova', 'read', 'words'];

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

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

class NovaClientError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'NovaClientError';
  }
}

function SparkleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5C9.1 9.4 11.4 7.1 12 2.5Zm7 12.5c.25 1.75 1.1 2.6 2.85 2.85-1.75.25-2.6 1.1-2.85 2.85-.25-1.75-1.1-2.6-2.85-2.85 1.75-.25 2.6-1.1 2.85-2.85Z" />
  </svg>;
}

function MicrophoneIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11Z" />
  </svg>;
}

function CameraIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3Zm3 5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
  </svg>;
}

export function NovaSparkle() {
  return <span className="lesson-shell2__nova-sparkle"><SparkleIcon /></span>;
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
    case 'VALIDATION_ERROR':
    case 'REQUEST_TOO_LARGE':
      return spanish
        ? 'Esta pregunta no pudo enviarse. Acórtala o quita el fotograma e inténtalo de nuevo.'
        : 'This question could not be sent. Shorten it or remove the frame and try again.';
    default:
      return spanish
        ? 'Nova no pudo responder. Revisa tu conexión e inténtalo de nuevo.'
        : 'Nova could not respond. Check your connection and try again.';
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
          ...(frame ? {frame} : {}),
        }),
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller.signal,
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
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
        : 'NOVA_UNAVAILABLE';
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
  locale,
  onDraft,
  onFinal,
  onNotice,
}: {
  busy: boolean;
  locale: 'en' | 'es';
  onDraft: (transcript: string) => void;
  onFinal: (transcript: string) => void | Promise<void>;
  onNotice: (notice: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;
    recognition.abort();
    recognitionRef.current = null;
  }, []);

  const startListening = useCallback(() => {
    if (busy) return;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
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
    let sent = false;

    const finishWithTranscript = () => {
      const transcript = latestTranscript.trim();
      if (!transcript || sent) return;
      sent = true;
      onDraft(transcript);
      void onFinal(transcript);
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
        recognition.stop();
      }
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        sent = true;
        const denied = event.error === 'not-allowed' ||
          event.error === 'service-not-allowed' ||
          event.error === 'audio-capture';
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
      onNotice(locale === 'es'
        ? 'Escuchando… HELP Math enviará a Nova solo la transcripción.'
        : 'Listening… HELP Math will send only the transcript to Nova.');
    } catch {
      recognitionRef.current = null;
      setListening(false);
      onNotice(locale === 'es'
        ? 'No se pudo iniciar el micrófono. Escribe tu pregunta.'
        : 'The microphone could not start. Type your question instead.');
    }
  }, [busy, locale, onDraft, onFinal, onNotice]);

  return {listening, startListening};
}

/**
 * Focus and Study Nova surface. Conversation is held only in React memory:
 * it is not persisted, and the browser sends voice transcripts rather than
 * application-recorded audio. A frame is sent only after explicit attachment.
 */
export function LessonNovaTutor({
  activeTab: controlledActiveTab,
  context,
  defaultTab = 'nova',
  frameSnapshot,
  id,
  locale,
  modal = false,
  onClose,
  onProviderConfirmed,
  onTabChange,
  placement = 'focus',
  readableContent,
  vocabulary,
}: {
  activeTab?: NovaSupportTab;
  context: TutorPageContext;
  defaultTab?: NovaSupportTab;
  frameSnapshot: TutorFrameSnapshot | null;
  id: string;
  locale: 'en' | 'es';
  modal?: boolean;
  onClose: () => void;
  onProviderConfirmed?: (model: NovaTutorModel) => void;
  onTabChange?: (tab: NovaSupportTab) => void;
  placement?: 'focus' | 'study';
  readableContent?: ReactNode;
  vocabulary: readonly string[];
}) {
  const spanish = locale === 'es';
  const [uncontrolledActiveTab, setUncontrolledActiveTab] =
    useState<NovaSupportTab>(defaultTab);
  const activeTab = controlledActiveTab ?? uncontrolledActiveTab;
  const [question, setQuestion] = useState('');
  const [notice, setNotice] = useState('');
  const [attachedFrame, setAttachedFrame] = useState<TutorFrameSnapshot | null>(null);
  const [framePreparing, setFramePreparing] = useState(false);
  const instanceId = useId().replace(/:/gu, '');
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const frameAnimationRef = useRef(frameSnapshot?.animationId ?? null);
  const contextLabel = tutorContextSummary(context);
  const nova = useNovaConversation({
    context,
    locale,
    mode: placement,
    onProviderConfirmed,
  });
  const currentAttachedFrame = attachedFrame?.animationId === context.animationId
    ? attachedFrame
    : null;
  const quickChoices = spanish
    ? [
        {label: 'Explicación del concepto', prompt: `Ayúdame a entender ${context.pageTitle}.`},
        {label: 'Pista paso a paso', prompt: 'Necesito una pista paso a paso.'},
        {label: 'Revisar mi respuesta', prompt: 'Revisa mi razonamiento sin decirme la respuesta.'},
      ]
    : [
        {label: 'Concept explanation', prompt: `Help me understand ${context.pageTitle}.`},
        {label: 'Step-by-step hint', prompt: 'I need a step-by-step hint.'},
        {label: 'Answer check', prompt: 'Check my reasoning without giving away the answer.'},
      ];

  const sendQuestion = useCallback(async (rawQuestion: string) => {
    const message = rawQuestion.trim();
    if (!message) {
      setNotice(spanish ? 'Escribe o di una pregunta primero.' : 'Type or say a question first.');
      inputRef.current?.focus();
      return;
    }
    setQuestion('');
    setNotice('');
    const frameForRequest = currentAttachedFrame ?? undefined;
    const succeeded = await nova.askNova(message, frameForRequest);
    if (succeeded && frameForRequest) {
      setAttachedFrame(null);
      setNotice(spanish
        ? 'Nova recibió el fotograma de esta pregunta; no quedó adjunto.'
        : 'Nova received the frame for this question; it is no longer attached.');
    }
  }, [currentAttachedFrame, nova, spanish]);

  const speech = useNovaSpeech({
    busy: nova.busy,
    locale,
    onDraft: setQuestion,
    onFinal: sendQuestion,
    onNotice: setNotice,
  });

  const selectTab = (tab: NovaSupportTab) => {
    if (controlledActiveTab === undefined) setUncontrolledActiveTab(tab);
    onTabChange?.(tab);
  };

  const selectTabFromKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    tab: NovaSupportTab,
  ) => {
    const currentIndex = TAB_ORDER.indexOf(tab);
    const delta = event.key === 'ArrowRight' ? 1
      : event.key === 'ArrowLeft' ? -1
        : 0;
    if (!delta && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? TAB_ORDER.length - 1
        : (currentIndex + delta + TAB_ORDER.length) % TAB_ORDER.length;
    const nextTab = TAB_ORDER[nextIndex];
    selectTab(nextTab);
    tabRefs.current[nextIndex]?.focus();
  };

  const toggleFrameAttachment = async () => {
    if (currentAttachedFrame) {
      setAttachedFrame(null);
      setNotice(spanish
        ? 'Fotograma quitado. No se enviará con la próxima pregunta.'
        : 'Frame removed. It will not be sent with the next question.');
      return;
    }
    if (!frameSnapshot) {
      setNotice(spanish
        ? 'Esta página no ofrece un fotograma que Nova pueda adjuntar. Aún puedes preguntar con el contexto de la página.'
        : 'This page does not provide a frame Nova can attach. You can still ask with the page context.');
      return;
    }

    const expectedAnimationId = frameSnapshot.animationId;
    setFramePreparing(true);
    setNotice(spanish ? 'Preparando un fotograma pequeño…' : 'Preparing a small lesson frame…');
    const prepared = await prepareNovaFrame(frameSnapshot);
    setFramePreparing(false);
    if (frameAnimationRef.current !== expectedAnimationId) return;
    if (!prepared) {
      setNotice(spanish
        ? 'El fotograma no pudo prepararse de forma segura. No se adjuntó nada.'
        : 'The frame could not be prepared safely. Nothing was attached.');
      return;
    }
    setAttachedFrame(prepared);
    setNotice(spanish
      ? 'Fotograma adjunto solo para la próxima pregunta. Pulsa de nuevo para quitarlo.'
      : 'Frame attached for the next question only. Press again to remove it.');
  };

  useEffect(() => {
    frameAnimationRef.current = frameSnapshot?.animationId ?? null;
  }, [frameSnapshot?.animationId]);

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
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
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
        : (spanish ? 'Nova está listo cuando preguntes' : 'Nova is ready when you ask');
  const statusDetail = nova.error || (nova.lastModel
    ? `${NOVA_TUTOR_DISPLAY_NAME} · ${spanish ? 'conversación solo en esta sesión' : 'conversation stays in this session'}`
    : (spanish
        ? 'No se afirma una conexión hasta recibir una respuesta real.'
        : 'A connection is not claimed until a real response is received.'));
  const defaultNotice = spanish
    ? 'La conversación no se guarda. HELP Math envía texto escrito o transcrito; el audio no se envía a Nova. Un fotograma se envía solo si lo adjuntas.'
    : 'The conversation is not saved. HELP Math sends typed or transcribed text; audio is not sent to Nova. A frame is sent only when you attach it.';

  return <aside
    aria-modal={modal ? true : undefined}
    aria-label={spanish ? 'Apoyo de Nova Tutor' : 'Nova Tutor support'}
    aria-busy={nova.busy}
    className="lesson-shell2__nova-panel"
    data-tutor-placement={placement}
    data-tutor-frame-snapshot={frameSnapshot ? 'available' : 'unavailable'}
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
    data-tutor-frame-sharing={currentAttachedFrame ? 'attached-for-next-request' : 'local-not-sent'}
    id={id}
    ref={panelRef}
    role={modal ? 'dialog' : undefined}
  >
    <h2 className="sr-only">Nova Tutor</h2>
    {modal
      ? <header className="lesson-shell2__nova-panel-header">
          <div>
            <span><NovaSparkle /> Nova Tutor</span>
            <strong>{spanish ? 'Ayuda con esta página' : 'Help with this page'}</strong>
          </div>
          <button
            aria-label={spanish ? 'Cerrar Nova' : 'Close Nova'}
            className="lesson-shell2__nova-close"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >×</button>
        </header>
      : null}

    <div
      aria-label={spanish ? 'Paneles de apoyo' : 'Support panels'}
      className="lesson-shell2__nova-tabs"
      role="tablist"
    >
      {TAB_ORDER.map((tab, index) => {
        const labels = spanish
          ? {nova: 'Nova Tutor', read: 'Leer', words: 'Palabras'}
          : {nova: 'Nova Tutor', read: 'Read it', words: 'Words'};
        return <button
          aria-controls={`${instanceId}-${tab}-panel`}
          aria-selected={activeTab === tab}
          id={`${instanceId}-${tab}-tab`}
          key={tab}
          onClick={() => selectTab(tab)}
          onKeyDown={(event) => selectTabFromKeyboard(event, tab)}
          ref={(node) => { tabRefs.current[index] = node; }}
          role="tab"
          tabIndex={activeTab === tab ? 0 : -1}
          type="button"
        >{labels[tab]}</button>;
      })}
    </div>

    <section
      aria-labelledby={`${instanceId}-nova-tab`}
      className="lesson-shell2__nova-tab-panel"
      hidden={activeTab !== 'nova'}
      id={`${instanceId}-nova-panel`}
      role="tabpanel"
    >
      <div className="lesson-shell2__nova-context">
        <span
          aria-hidden="true"
          data-tutor-current-frame={frameSnapshot ? 'captured' : 'placeholder'}
          style={frameSnapshot ? {backgroundImage: `url(${frameSnapshot.dataUrl})`} : undefined}
        />
        <p><b>{currentAttachedFrame
          ? (spanish ? 'Fotograma adjunto para la próxima pregunta' : 'Frame attached for the next question')
          : framePreparing
            ? (spanish ? 'Preparando fotograma local' : 'Preparing frame locally')
            : frameSnapshot
              ? (spanish ? 'Fotograma disponible · no enviado' : 'Current frame available · not sent')
              : (spanish ? 'Contexto de página listo' : 'Page context ready')}</b>{' '}{contextLabel}</p>
      </div>

      <div aria-live="polite" className="lesson-shell2__nova-status" role="status">
        <strong>{statusTitle}</strong>
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
        ref={threadRef}
      >
        {nova.conversation.length === 0 && !nova.busy
          ? <div className="lesson-shell2__nova-empty">
              <strong>{spanish ? 'Haz una pregunta' : 'Ask a question'}</strong>
              <span>{spanish
                ? 'Escribe, usa un inicio o habla. Nova recibirá el contexto de esta página.'
                : 'Type, choose a starter, or speak. Nova will receive this page context.'}</span>
            </div>
          : nova.conversation.map((entry, index) => <div
              className="lesson-shell2__nova-message"
              data-nova-message-role={entry.role}
              key={`${entry.role}-${index}`}
            >
              <strong>{entry.role === 'assistant'
                ? 'Nova'
                : (spanish ? 'Tú' : 'You')}</strong>{' '}
              <span>{entry.text}</span>
              {entry.role === 'assistant'
                ? <p>{NOVA_TUTOR_DISPLAY_NAME}</p>
                : null}
            </div>)}
        {nova.busy
          ? <div className="lesson-shell2__nova-message" data-nova-message-role="loading">
              <strong>Nova</strong>{' '}
              <span>{spanish ? 'Pensando en una pista útil…' : 'Thinking of a helpful next step…'}</span>
            </div>
          : null}
      </div>

      <div
        aria-label={spanish ? 'Inicios de pregunta' : 'Question starters'}
        className="lesson-shell2__nova-chips"
        role="group"
      >
        <strong>{spanish ? 'Inicios de pregunta' : 'Question starters'}</strong>
        {quickChoices.map((choice) => <button
          disabled={nova.busy}
          key={choice.label}
          onClick={() => void sendQuestion(choice.prompt)}
          type="button"
        >{choice.label}</button>)}
      </div>

      <form
        className="lesson-shell2__nova-input"
        onSubmit={(event) => {
          event.preventDefault();
          void sendQuestion(question);
        }}
      >
        <button
          aria-label={speech.listening
            ? (spanish ? 'Dejar de escuchar y enviar la transcripción' : 'Stop listening and send the transcript')
            : (spanish ? 'Preguntar a Nova por voz' : 'Ask Nova by voice')}
          aria-pressed={speech.listening}
          className="lesson-shell2__nova-mic"
          disabled={nova.busy}
          onClick={speech.startListening}
          type="button"
        ><MicrophoneIcon /></button>
        <label className="sr-only" htmlFor={`${instanceId}-nova-question`}>
          {spanish ? 'Escribe una pregunta para Nova' : 'Type a question for Nova'}
        </label>
        <input
          id={`${instanceId}-nova-question`}
          onChange={(event) => {
            setQuestion(event.target.value);
            setNotice('');
          }}
          maxLength={1200}
          placeholder={spanish ? 'Pregunta sobre esta página' : 'Ask about this page'}
          ref={inputRef}
          type="text"
          value={question}
        />
        <button
          aria-label={currentAttachedFrame
            ? (spanish ? 'Quitar el fotograma de la próxima pregunta' : 'Remove the frame from the next question')
            : (spanish ? 'Adjuntar el fotograma actual de la lección' : 'Attach the current lesson frame')}
          aria-pressed={Boolean(currentAttachedFrame)}
          className="lesson-shell2__nova-camera"
          disabled={nova.busy || framePreparing}
          onClick={() => void toggleFrameAttachment()}
          title={spanish ? 'No abre la cámara del dispositivo' : 'Does not open the device camera'}
          type="button"
        ><CameraIcon /></button>
        <button
          aria-label={spanish ? 'Enviar pregunta a Nova' : 'Send question to Nova'}
          className="lesson-shell2__nova-send"
          disabled={nova.busy || !question.trim()}
          type="submit"
        >{nova.busy ? (spanish ? 'Enviando…' : 'Sending…') : (spanish ? 'Enviar' : 'Send')}</button>
      </form>
      <p aria-live="polite" className="lesson-shell2__nova-notice">
        {notice || nova.error || defaultNotice}
      </p>
    </section>

    <section
      aria-labelledby={`${instanceId}-read-tab`}
      className="lesson-shell2__nova-tab-panel lesson-shell2__nova-read"
      hidden={activeTab !== 'read'}
      id={`${instanceId}-read-panel`}
      role="tabpanel"
    >
      <h3>{spanish ? 'Leer de nuevo' : 'Read it again'}</h3>
      {readableContent ?? <>
        <strong lang={context.pageTitleUsesEnglishFallback ? 'en' : locale}>
          {context.pageTitle}
        </strong>
        <p>{spanish
          ? 'Esta página no declara una transcripción legible independiente. La animación original permanece como fuente visible.'
          : 'This page does not declare a separate readable transcript. The source-bound animation remains the visible source.'}</p>
      </>}
    </section>

    <section
      aria-labelledby={`${instanceId}-words-tab`}
      className="lesson-shell2__nova-tab-panel lesson-shell2__nova-words"
      hidden={activeTab !== 'words'}
      id={`${instanceId}-words-panel`}
      role="tabpanel"
    >
      <h3>{spanish ? 'Palabras de esta lección' : 'Words in this lesson'}</h3>
      <ul>{vocabulary.map((word) => <li key={word}>
        <button
          disabled={nova.busy}
          onClick={() => {
            selectTab('nova');
            void sendQuestion(spanish
              ? `Ayúdame a entender ${word}.`
              : `Help me understand ${word}.`);
          }}
          type="button"
        >{word}</button>
      </li>)}</ul>
    </section>
  </aside>;
}

/** Projector-scale Classroom placement with one visible, real voice exchange. */
export function LessonNovaClassroomBand({
  context,
  frameSnapshot,
  id,
  locale,
  onClose,
  onProviderConfirmed,
}: {
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
  const [speechDraft, setSpeechDraft] = useState('');
  const [speechNotice, setSpeechNotice] = useState('');
  const nova = useNovaConversation({
    context,
    locale,
    mode: 'classroom',
    onProviderConfirmed,
  });
  const sendQuestion = useCallback(async (rawQuestion: string) => {
    const message = rawQuestion.trim();
    if (!message) {
      setSpeechNotice(spanish
        ? 'Escribe o di una pregunta primero.'
        : 'Type or say a question first.');
      return;
    }
    setQuestion('');
    setSpeechDraft(message);
    setSpeechNotice('');
    await nova.askNova(message);
  }, [nova, spanish]);
  const speech = useNovaSpeech({
    busy: nova.busy,
    locale,
    onDraft: setSpeechDraft,
    onFinal: sendQuestion,
    onNotice: setSpeechNotice,
  });
  const latestUser = [...nova.conversation].reverse().find((entry) => entry.role === 'user');
  const latestAnswer = [...nova.conversation].reverse().find((entry) => entry.role === 'assistant');
  const answer = nova.busy
    ? (spanish ? 'Nova está pensando…' : 'Nova is thinking…')
    : nova.error || latestAnswer?.text || speechNotice || (spanish
        ? 'Usa el micrófono o escribe una pregunta sobre esta página.'
        : 'Use the microphone or type a question about this page.');

  return <section
    aria-label={spanish ? 'Banda de voz de Nova Tutor' : 'Nova Tutor voice band'}
    aria-busy={nova.busy}
    className="lesson-shell2__nova-classroom-band"
    data-tutor-frame-snapshot={frameSnapshot ? 'available' : 'unavailable'}
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
    data-tutor-frame-sharing="local-not-sent"
    id={id}
  >
    <button
      aria-label={speech.listening
        ? (spanish ? 'Dejar de escuchar y enviar la transcripción' : 'Stop listening and send the transcript')
        : (spanish ? 'Preguntar a Nova por voz' : 'Ask Nova by voice')}
      aria-pressed={speech.listening}
      className="lesson-shell2__nova-classroom-mic"
      disabled={nova.busy}
      onClick={speech.startListening}
      type="button"
    ><MicrophoneIcon /></button>
    <div className="lesson-shell2__nova-classroom-copy">
      <p className="lesson-shell2__nova-classroom-context">
        <span
          aria-hidden="true"
          style={frameSnapshot ? {backgroundImage: `url(${frameSnapshot.dataUrl})`} : undefined}
        />
        <b>{frameSnapshot
          ? (spanish ? 'Fotograma local · no enviado' : 'Local frame · not sent')
          : (spanish ? 'Contexto de página listo' : 'Page context ready')}</b>{' '}{contextLabel}
      </p>
      <div aria-live="polite" className="lesson-shell2__nova-classroom-exchange" role="status">
        <p><strong>{spanish ? 'Pregunta del estudiante' : 'Student question'}</strong>
          <span>{speechDraft || latestUser?.text || (spanish
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
            setQuestion(event.target.value);
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
