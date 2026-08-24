import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import React from 'react';

import type {AppLocale} from '@/i18n/routing';

interface FrameProps {
  children: React.ReactNode;
  locale: AppLocale;
  preview: string;
}

function FamilyEmailFrame({children, locale, preview}: FrameProps) {
  return <Html lang={locale}>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Text style={styles.brand}>HELP MATH 2.0</Text>
        {children}
        <Hr style={styles.rule} />
        <Text style={styles.footer}>
          {locale === 'es'
            ? 'Los detalles de aprendizaje permanecen en el portal seguro. No respondas a este correo con datos del estudiante.'
            : 'Learning details stay in the secure portal. Do not reply to this email with student information.'}
        </Text>
      </Container>
    </Body>
  </Html>;
}

function PortalButton({href, label}: {href: string; label: string}) {
  return <Button href={href} style={styles.button}>{label}</Button>;
}

export function GuardianInvitationEmail({
  locale,
  secureLink,
}: Readonly<{locale: AppLocale; secureLink: string}>) {
  const spanish = locale === 'es';
  return <FamilyEmailFrame
    locale={locale}
    preview={spanish
      ? 'Una escuela te invitó a HELP Math'
      : 'A school invited you to HELP Math'}
  >
    <Heading style={styles.heading}>
      {spanish ? 'Invitación a HELP Math' : 'Your HELP Math invitation'}
    </Heading>
    <Text style={styles.text}>
      {spanish
        ? 'Una escuela te invitó a acceder al espacio seguro de Familia de HELP Math. Inicia sesión con la misma dirección de correo electrónico que recibió esta invitación.'
        : 'A school invited you to the secure HELP Math Family workspace. Sign in with the same email address that received this invitation.'}
    </Text>
    <Text style={styles.text}>
      {spanish
        ? 'Este enlace vence en siete días y solo puede usarse una vez.'
        : 'This link expires in seven days and can be used once.'}
    </Text>
    <PortalButton
      href={secureLink}
      label={spanish ? 'Revisar invitación' : 'Review invitation'}
    />
  </FamilyEmailFrame>;
}

export function FamilyMessageNotificationEmail({
  locale,
  portalLink,
}: Readonly<{locale: AppLocale; portalLink: string}>) {
  const spanish = locale === 'es';
  return <FamilyEmailFrame
    locale={locale}
    preview={spanish
      ? 'Tienes un mensaje nuevo en HELP Math'
      : 'You have a new HELP Math message'}
  >
    <Heading style={styles.heading}>
      {spanish ? 'Mensaje nuevo' : 'New secure message'}
    </Heading>
    <Text style={styles.text}>
      {spanish
        ? 'Hay un mensaje nuevo en tu espacio de Familia. Inicia sesión para verlo; por privacidad, el contenido no se incluye en este correo.'
        : 'A new message is waiting in your Family workspace. Sign in to read it; for privacy, the message content is not included here.'}
    </Text>
    <PortalButton
      href={portalLink}
      label={spanish ? 'Abrir HELP Math' : 'Open HELP Math'}
    />
  </FamilyEmailFrame>;
}

export function WeeklyFamilyDigestEmail({
  activityCount,
  locale,
  openAssignmentCount,
  portalLink,
  unreadThreadCount,
}: Readonly<{
  activityCount: number;
  locale: AppLocale;
  openAssignmentCount: number;
  portalLink: string;
  unreadThreadCount: number;
}>) {
  const spanish = locale === 'es';
  return <FamilyEmailFrame
    locale={locale}
    preview={spanish
      ? 'Tu resumen semanal de HELP Math'
      : 'Your weekly HELP Math summary'}
  >
    <Heading style={styles.heading}>
      {spanish ? 'Resumen semanal' : 'Weekly family summary'}
    </Heading>
    <Text style={styles.text}>
      {spanish
        ? `${activityCount} actividades recientes, ${openAssignmentCount} tareas abiertas y ${unreadThreadCount} conversaciones sin leer.`
        : `${activityCount} recent activities, ${openAssignmentCount} open assignments, and ${unreadThreadCount} unread conversations.`}
    </Text>
    <Text style={styles.text}>
      {spanish
        ? 'Los nombres, resultados, habilidades, fechas de entrega y mensajes están disponibles solo después de iniciar sesión.'
        : 'Names, results, skills, due dates, and messages are available only after you sign in.'}
    </Text>
    <PortalButton
      href={portalLink}
      label={spanish ? 'Ver resumen seguro' : 'View secure summary'}
    />
  </FamilyEmailFrame>;
}

export function FamilyAccountSecurityEmail({
  locale,
  portalLink,
}: Readonly<{locale: AppLocale; portalLink: string}>) {
  const spanish = locale === 'es';
  return <FamilyEmailFrame
    locale={locale}
    preview={spanish
      ? 'Cambió tu acceso a HELP Math'
      : 'Your HELP Math access changed'}
  >
    <Heading style={styles.heading}>
      {spanish ? 'Aviso de seguridad de la cuenta' : 'Account security notice'}
    </Heading>
    <Text style={styles.text}>
      {spanish
        ? 'Una escuela cambió una autorización vinculada a tu cuenta. Inicia sesión para revisar tu acceso actual. Si no esperabas este cambio, comunícate con la escuela por su canal oficial.'
        : 'A school changed an authorization connected to your account. Sign in to review your current access. If you did not expect this change, contact the school through its official channel.'}
    </Text>
    <PortalButton
      href={portalLink}
      label={spanish ? 'Revisar acceso' : 'Review access'}
    />
  </FamilyEmailFrame>;
}

const styles = {
  body: {
    backgroundColor: '#f4f2ff',
    color: '#20243a',
    fontFamily: 'Arial, Helvetica, sans-serif',
    margin: 0,
    padding: '32px 12px',
  },
  brand: {
    color: '#5c54c8',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.12em',
  },
  button: {
    backgroundColor: '#3158d6',
    borderRadius: '10px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: 700,
    marginTop: '12px',
    padding: '13px 20px',
    textDecoration: 'none',
  },
  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #dedbf4',
    borderRadius: '18px',
    boxShadow: '0 8px 28px rgba(50, 47, 100, 0.08)',
    margin: '0 auto',
    maxWidth: '560px',
    padding: '32px',
  },
  footer: {
    color: '#656a7f',
    fontSize: '12px',
    lineHeight: '18px',
  },
  heading: {
    color: '#20243a',
    fontSize: '26px',
    lineHeight: '32px',
    margin: '14px 0 18px',
  },
  rule: {
    borderColor: '#e8e6f5',
    margin: '28px 0 18px',
  },
  text: {
    color: '#34384e',
    fontSize: '16px',
    lineHeight: '25px',
  },
} as const;
