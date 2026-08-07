import {ArrowRight, KeyRound, LockKeyhole, ShieldAlert} from 'lucide-react';

import {getSiteContent} from '@/content';
import type {Locale} from '@/content/types';
import {Link} from '@/i18n/navigation';

import {Container, Eyebrow, Section} from './ui';

type ExecutivePreviewState = 'authenticated' | 'login' | 'unavailable';
type ExecutivePreviewPageProps = {
  error?: boolean;
  expiresAt?: number;
  locale: Locale;
  state: ExecutivePreviewState;
};

const copy = {
  en: {
    eyebrow: 'Private HELP Math 2.0 executive review',
    title: 'Four controlled private demos',
    loginIntro:
      'Authorized reviewers can open two animation prototypes and two current-JavaScript whole-lesson candidates after entering the separate review passphrase.',
    authenticatedIntro:
      'Your temporary private session is active. Four controlled review items are available below.',
    unavailableIntro:
      'This private review entry is currently closed. No candidate has been made public.',
    restrictedTitle: 'Private review — not for distribution',
    restrictedBody:
      'The Grade 4 and Grade 5 lessons are current-JavaScript candidates, not strict-complete public releases. Original-runtime fidelity, audio acceptance, full visual review, Owner acceptance, rights review, and publication remain separate gates.',
    loginTitle: 'Sign in to open the four review items',
    loginShortcut: 'Enter reviewer passphrase',
    loginBody:
      'Use the review passphrase delivered through the approved private channel. Do not enter a former HELP Math account password. The passphrase is never published by this site, and the review window closes automatically.',
    expiryLabel: 'Review window closes:',
    expiryNote: 'Active sessions cannot continue beyond this time.',
    passphraseLabel: 'Executive preview passphrase',
    submit: 'Open private preview',
    error:
      'Access could not be verified. Check the passphrase or contact the review operator through the approved private channel.',
    unavailableTitle: 'Executive preview is unavailable',
    unavailableBody:
      'Access is closed because the private preview is not configured or its review window has expired.',
    demosTitle: 'Four private review items',
    demosBody:
      'The first two cards are individual JavaScript prototypes. The final two are full-lesson current-JavaScript candidates with explicit evidence boundaries.',
    prototypeLabel: 'Private prototype',
    lessonLabel: 'Private whole-lesson candidate',
    openDemo: 'Open review item',
    logout: 'End private session',
  },
  es: {
    eyebrow: 'Revisión ejecutiva privada de HELP Math 2.0',
    title: 'Cuatro demos privadas controladas',
    loginIntro:
      'Los revisores autorizados pueden abrir dos prototipos de animación y dos lecciones completas candidatas en JavaScript tras introducir la frase de acceso enviada por separado.',
    authenticatedIntro:
      'Tu sesión privada temporal está activa. Hay cuatro elementos de revisión controlada disponibles.',
    unavailableIntro:
      'Esta entrada de revisión privada está cerrada. Ningún candidato se ha hecho público.',
    restrictedTitle: 'Revisión privada — no distribuir',
    restrictedBody:
      'Las lecciones de cuarto y quinto grado son candidatas actuales en JavaScript, no publicaciones públicas estrictamente completas. La fidelidad al entorno original, el audio, la revisión visual, la aceptación del propietario, los derechos y la publicación siguen siendo puertas separadas.',
    loginTitle: 'Inicia sesión para abrir los cuatro elementos',
    loginShortcut: 'Introducir frase de acceso',
    loginBody:
      'Usa la frase de acceso enviada por el canal privado aprobado. No introduzcas una contraseña antigua de HELP Math. El sitio nunca publica la frase y la ventana se cierra automáticamente.',
    expiryLabel: 'La ventana de revisión se cierra:',
    expiryNote: 'Las sesiones activas no pueden continuar después de esta hora.',
    passphraseLabel: 'Frase de acceso para la vista previa ejecutiva',
    submit: 'Abrir vista previa privada',
    error:
      'No se pudo verificar el acceso. Revisa la frase o contacta al responsable por el canal privado aprobado.',
    unavailableTitle: 'La vista previa ejecutiva no está disponible',
    unavailableBody:
      'El acceso está cerrado porque la vista previa no está configurada o su periodo ha vencido.',
    demosTitle: 'Cuatro elementos privados de revisión',
    demosBody:
      'Las dos primeras tarjetas son prototipos JavaScript individuales. Las dos últimas son lecciones completas candidatas con límites de evidencia explícitos.',
    prototypeLabel: 'Prototipo privado',
    lessonLabel: 'Lección completa privada candidata',
    openDemo: 'Abrir elemento',
    logout: 'Cerrar sesión privada',
  },
} as const;

export function ExecutivePreviewPage({
  error = false,
  expiresAt,
  locale,
  state,
}: ExecutivePreviewPageProps) {
  const text = copy[locale];
  const intro = state === 'authenticated'
    ? text.authenticatedIntro
    : state === 'login'
      ? text.loginIntro
      : text.unavailableIntro;

  return <main id="main-content">
    <header className="border-b-2 border-[var(--ink)] bg-[var(--blue-pale)] py-14 md:py-20">
      <Container className="max-w-5xl">
        <Eyebrow>{text.eyebrow}</Eyebrow>
        <div className="flex max-w-3xl items-start gap-4">
          <LockKeyhole aria-hidden="true" className="mt-2 shrink-0 text-[var(--blue)]" size={34} />
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight font-bold tracking-tight md:text-6xl">
              {text.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-[var(--ink-soft)] md:text-xl">
              {intro}
            </p>
            {state === 'login' ? <a
              className="action action--primary mt-6 w-fit"
              href="#executive-preview-login"
            >
              <span>{text.loginShortcut}</span>
              <ArrowRight aria-hidden="true" size={18} strokeWidth={2.4} />
            </a> : null}
          </div>
        </div>
      </Container>
    </header>

    <Section className="section--compact">
      <Container className="max-w-5xl">
        <aside
          className="flex items-start gap-4 border-2 border-[var(--ink)] bg-[var(--yellow-pale)] p-5 shadow-[6px_6px_0_var(--ink)] md:p-7"
          role="note"
        >
          <ShieldAlert aria-hidden="true" className="mt-1 shrink-0 text-[#8a5a00]" size={30} />
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              {text.restrictedTitle}
            </h2>
            <p className="mt-2 text-[var(--ink-soft)]">{text.restrictedBody}</p>
          </div>
        </aside>
      </Container>
    </Section>

    {state === 'authenticated'
      ? <AuthenticatedPreview expiresAt={expiresAt} locale={locale} text={text} />
      : state === 'login'
        ? <LoginPanel error={error} expiresAt={expiresAt} locale={locale} text={text} />
        : <UnavailablePanel text={text} />}
  </main>;
}

function LoginPanel({
  error,
  expiresAt,
  locale,
  text,
}: {
  error: boolean;
  expiresAt?: number;
  locale: Locale;
  text: (typeof copy)[Locale];
}) {
  return <Section className="pt-0">
    <Container className="max-w-3xl">
      <div className="contact-form-shell scroll-mt-24" id="executive-preview-login">
        <div className="flex items-start gap-4">
          <KeyRound aria-hidden="true" className="mt-1 shrink-0 text-[var(--blue)]" size={30} />
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              {text.loginTitle}
            </h2>
            <p className="mt-2 text-[var(--ink-soft)]" id="executive-preview-login-help">
              {text.loginBody}
            </p>
            <ExpiryNotice expiresAt={expiresAt} locale={locale} text={text} />
          </div>
        </div>
        {error ? <p
          className="mt-6 border-2 border-[#b42318] bg-[var(--coral-pale)] p-4 font-bold text-[#7a271a]"
          id="executive-preview-login-error"
          role="alert"
        >{text.error}</p> : null}
        <form action="/api/executive-preview/session" className="mt-7 grid gap-5" method="post">
          <input name="locale" type="hidden" value={locale} />
          <label className="block font-bold" htmlFor="executive-preview-passphrase">
            {text.passphraseLabel}
            <input
              aria-describedby={error
                ? 'executive-preview-login-help executive-preview-login-error'
                : 'executive-preview-login-help'}
              aria-invalid={error}
              autoCapitalize="none"
              autoComplete="off"
              autoFocus={error}
              className="mt-2 min-h-12 w-full rounded-lg border-2 border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)] focus:border-[var(--blue)] focus:outline-none"
              id="executive-preview-passphrase"
              name="passphrase"
              required
              spellCheck={false}
              type="password"
            />
          </label>
          <button className="action action--primary justify-self-start" type="submit">
            {text.submit}
          </button>
        </form>
      </div>
    </Container>
  </Section>;
}

function AuthenticatedPreview({
  expiresAt,
  locale,
  text,
}: {
  expiresAt?: number;
  locale: Locale;
  text: (typeof copy)[Locale];
}) {
  const details = getSiteContent(locale).pages.demoDetails;
  const spanish = locale === 'es';
  const items = [
    {
      href: '/demos/conversion-1-2' as const,
      label: text.prototypeLabel,
      title: details['conversion-1-2'].title,
      body: details['conversion-1-2'].summary,
    },
    {
      href: '/demos/conversion-1-4' as const,
      label: text.prototypeLabel,
      title: details['conversion-1-4'].title,
      body: details['conversion-1-4'].summary,
    },
    {
      href: '/courses/4/3' as const,
      label: text.lessonLabel,
      title: spanish ? 'Grado 4 · Lección 3 · Números negativos' : 'Grade 4 · Lesson 3 · Negative Numbers',
      body: spanish
        ? '39 páginas activas y un shell JavaScript funcional. 0/40 miembros estrictamente completos; no publicada.'
        : '39 active pages and one functional JavaScript shell. 0/40 strict-complete members; unpublished.',
    },
    {
      href: '/courses/5/4' as const,
      label: text.lessonLabel,
      title: spanish ? 'Grado 5 · Lección 4 · Fracciones, decimales y porcentajes' : 'Grade 5 · Lesson 4 · Fractions, Decimals, and Percents',
      body: spanish
        ? '54 páginas activas y un shell JavaScript funcional. 0/55 miembros estrictamente completos; no publicada.'
        : '54 active pages and one functional JavaScript shell. 0/55 strict-complete members; unpublished.',
    },
  ];

  return <Section className="pt-0">
    <Container className="max-w-5xl">
      <div className="mb-7 max-w-3xl">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
          {text.demosTitle}
        </h2>
        <p className="mt-2 text-[var(--ink-soft)]">{text.demosBody}</p>
        <ExpiryNotice expiresAt={expiresAt} locale={locale} text={text} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {items.map((item, index) => <article
          className="flex flex-col border-2 border-[var(--ink)] bg-white p-6 shadow-[5px_5px_0_var(--ink)]"
          key={item.href}
        >
          <Eyebrow>{item.label} {index + 1}/{items.length}</Eyebrow>
          <h3 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            {item.title}
          </h3>
          <p className="mt-2 grow text-[var(--ink-soft)]">{item.body}</p>
          <Link
            aria-label={`${text.openDemo}: ${item.title}`}
            className="action action--secondary mt-6 self-start"
            href={item.href}
            locale={locale}
          >
            <span>{text.openDemo}</span>
            <ArrowRight aria-hidden="true" size={18} strokeWidth={2.4} />
          </Link>
        </article>)}
      </div>
      <form action="/api/executive-preview/session" className="mt-9" method="post">
        <input name="action" type="hidden" value="logout" />
        <input name="locale" type="hidden" value={locale} />
        <button className="action action--quiet" type="submit">{text.logout}</button>
      </form>
    </Container>
  </Section>;
}

function ExpiryNotice({
  expiresAt,
  locale,
  text,
}: {
  expiresAt?: number;
  locale: Locale;
  text: (typeof copy)[Locale];
}) {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  const formatted = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'long',
    timeZone: 'Asia/Taipei',
    timeZoneName: 'short',
    year: 'numeric',
  }).format(expiry);
  return <p className="mt-3 text-sm font-semibold text-[var(--ink-soft)]">
    {text.expiryLabel}{' '}
    <time dateTime={expiry.toISOString()}>{formatted}</time>. {text.expiryNote}
  </p>;
}

function UnavailablePanel({text}: {text: (typeof copy)[Locale]}) {
  return <Section className="pt-0">
    <Container className="max-w-3xl">
      <div
        className="border-2 border-[var(--ink)] bg-white p-6 shadow-[6px_6px_0_var(--ink)] md:p-8"
        role="status"
      >
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          {text.unavailableTitle}
        </h2>
        <p className="mt-3 text-[var(--ink-soft)]">{text.unavailableBody}</p>
      </div>
    </Container>
  </Section>;
}
