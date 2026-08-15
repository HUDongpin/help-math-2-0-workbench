'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
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
import {
  tutorContextSummary,
  type NovaTutorMode,
  type TutorFrameSnapshot,
  type TutorPageContext,
} from '@/lib/tutor-integration';

const NOVA_LOCAL_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const NOVA_LOCAL_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

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

function readLocalImageAsDataUrl(file: File) {
  return new Promise<string | null>((resolve) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => resolve(null);
      reader.onabort = () => resolve(null);
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.readAsDataURL(file);
    } catch {
      resolve(null);
    }
  });
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
    case 'VALIDATION_ERROR':
    case 'REQUEST_TOO_LARGE':
      return spanish
        ? 'Esta pregunta no pudo enviarse. Acórtala o quita la imagen e inténtalo de nuevo.'
        : 'This question could not be sent. Shorten it or remove the image and try again.';
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
  context,
  frameSnapshot,
  id,
  locale,
  modal = false,
  onClose,
  onProviderConfirmed,
  placement = 'focus',
}: {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const frameAnimationRef = useRef(context.animationId);
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
        ? 'Nova recibió la imagen de esta pregunta; no quedó adjunta.'
        : 'Nova received the image for this question; it is no longer attached.');
    }
  }, [currentAttachedFrame, nova, spanish]);

  const speech = useNovaSpeech({
    busy: nova.busy,
    locale,
    onDraft: setQuestion,
    onFinal: sendQuestion,
    onNotice: setNotice,
  });

  const removeImageAttachment = () => {
    setAttachedFrame(null);
    setNotice(spanish
      ? 'Imagen quitada. No se enviará con la próxima pregunta.'
      : 'Image removed. It will not be sent with the next question.');
  };

  const attachLocalImage = async (file: File | null) => {
    if (!file || nova.busy || framePreparing) return;
    // A new explicit choice replaces the prior local attachment. Clear first
    // so an invalid replacement can never leave an older image silently queued
    // for the next Nova request.
    setAttachedFrame(null);
    if (!NOVA_LOCAL_IMAGE_TYPES.has(file.type)) {
      setNotice(spanish
        ? 'Elige una imagen PNG o JPEG. No se adjuntó nada.'
        : 'Choose a PNG or JPEG image. Nothing was attached.');
      return;
    }
    if (!file.size || file.size > NOVA_LOCAL_IMAGE_MAX_BYTES) {
      setNotice(spanish
        ? 'La imagen debe tener 8 MB o menos. No se adjuntó nada.'
        : 'The image must be 8 MB or smaller. Nothing was attached.');
      return;
    }

    const expectedAnimationId = context.animationId;
    setFramePreparing(true);
    setNotice(spanish ? 'Preparando la imagen de forma segura…' : 'Preparing the image safely…');
    let prepared: TutorFrameSnapshot | null = null;
    try {
      const dataUrl = await readLocalImageAsDataUrl(file);
      if (dataUrl) {
        prepared = await prepareNovaFrame({
          animationId: expectedAnimationId,
          dataUrl,
          height: 1,
          width: 1,
        });
      }
    } catch {
      prepared = null;
    } finally {
      setFramePreparing(false);
    }
    if (frameAnimationRef.current !== expectedAnimationId) return;
    if (!prepared) {
      setNotice(spanish
        ? 'La imagen no pudo leerse o prepararse de forma segura. No se adjuntó nada.'
        : 'The image could not be read or prepared safely. Nothing was attached.');
      return;
    }
    setAttachedFrame(prepared);
    setNotice(spanish
      ? 'Imagen adjunta solo para la próxima pregunta. Puedes quitarla antes de enviar.'
      : 'Image attached for the next question only. You can remove it before sending.');
  };

  const selectLocalImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    // Clear immediately so choosing the same file again still emits `change`.
    event.currentTarget.value = '';
    void attachLocalImage(file);
  };

  useEffect(() => {
    frameAnimationRef.current = context.animationId;
  }, [context.animationId]);

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
            ? 'attached-image'
            : frameSnapshot
              ? 'captured'
              : 'placeholder'}
          style={currentAttachedFrame
            ? {backgroundImage: `url(${currentAttachedFrame.dataUrl})`}
            : frameSnapshot
              ? {backgroundImage: `url(${frameSnapshot.dataUrl})`}
              : undefined}
        />
        <p><b>{currentAttachedFrame
          ? (spanish ? 'Imagen adjunta para la próxima pregunta' : 'Image attached for the next question')
          : framePreparing
            ? (spanish ? 'Preparando imagen local' : 'Preparing image locally')
            : frameSnapshot
              ? (spanish ? 'Fotograma disponible · no enviado' : 'Current frame available · not sent')
              : (spanish ? 'Contexto de página listo' : 'Page context ready')}</b>{' '}{contextLabel}</p>
        {currentAttachedFrame
          ? <button
              aria-label={spanish
                ? 'Quitar la imagen de la próxima pregunta'
                : 'Remove the image from the next question'}
              className="lesson-shell2__nova-context-remove"
              disabled={nova.busy}
              onClick={removeImageAttachment}
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
            setQuestion(event.target.value);
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
            <button
              aria-label={spanish
                ? 'Adjuntar una imagen o tomar una foto'
                : 'Attach an image or take a photo'}
              className="lesson-shell2__nova-attach"
              disabled={nova.busy || framePreparing}
              onClick={() => fileInputRef.current?.click()}
              title={spanish
                ? 'Elegir una imagen PNG o JPEG; el dispositivo puede ofrecer la cámara'
                : 'Choose a PNG or JPEG image; your device may offer its camera'}
              type="button"
            ><PlusIcon /></button>
            <input
              accept="image/png,image/jpeg"
              className="lesson-shell2__nova-file-input"
              disabled={nova.busy || framePreparing}
              hidden
              onChange={selectLocalImage}
              ref={fileInputRef}
              tabIndex={-1}
              type="file"
            />
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
            <span className="lesson-shell2__nova-input-hint">
              {spanish ? 'Escribe o di una pregunta' : 'Type or speak a question'}
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
