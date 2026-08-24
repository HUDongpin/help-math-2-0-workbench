import type {
  AdminFamilyAccessDemoDto,
  FamilyInvitationAcceptDemoDto,
  FamilyPortalLocale,
  FamilyPortalUiDto,
  FamilySelectedChild,
  FamilySignalTone,
  TeacherMessagesDemoDto,
} from './family-demo-data';
import {
  getAdminFamilyAccessDemoData,
  getFamilyInvitationAcceptDemoData,
  getFamilyDemoData,
  getTeacherMessagesDemoData,
} from './family-demo-data';
import type {
  AdminFamilyAccessWorkspace,
  FamilyAssignmentStatus,
  FamilyMessageTopic,
  FamilySkillBand,
  FamilyWorkspace,
  TeacherAnnouncementSchools,
  TeacherFamilyInbox,
} from './types';

export function getAuthorizedFamilyInvitationAcceptData(
  locale: FamilyPortalLocale,
): FamilyInvitationAcceptDemoDto {
  const base = getFamilyInvitationAcceptDemoData(locale);
  const spanish = locale === 'es';
  return {
    ...base,
    synthetic: false,
    acceptLabel: spanish ? 'Aceptar invitación' : 'Accept invitation',
    acceptedBody: spanish
      ? 'Se verificó la invitación y se activó la relación familiar autorizada. La escuela o la persona adulta pueden revocar el acceso.'
      : 'The invitation was verified and the authorized family relationship is active. The school or adult can revoke access.',
    acceptedTitle: spanish ? 'Invitación aceptada' : 'Invitation accepted',
    declineLabel: spanish ? 'No aceptar' : 'Do not accept',
    declinedBody: spanish
      ? 'No se activó el acceso. Puedes pedir a la escuela que revoque o reemplace la invitación pendiente.'
      : 'Access was not activated. You can ask the school to revoke or replace the pending invitation.',
    declinedTitle: spanish ? 'Invitación no aceptada' : 'Invitation not accepted',
    syntheticBadge: spanish ? 'Acceso protegido' : 'Protected access',
    syntheticBody: spanish
      ? 'El token permanece en esta pestaña y nunca se envía en la URL de la solicitud. El servidor vuelve a verificar la sesión, el correo, el grupo y el estudiante antes de activar el acceso.'
      : 'The token stays in this tab and is never sent in the request URL. The server rechecks the session, email, tenant, and learner before activating access.',
  };
}

function dateLabel(locale: FamilyPortalLocale, value: string | null): string {
  if (!value) return locale === 'es' ? 'Sin actividad reciente' : 'No recent activity';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function initials(displayName: string): string {
  const words = displayName.trim().split(/\s+/u).filter(Boolean);
  return words.slice(0, 2).map((word) => [...word][0] ?? '').join('').toUpperCase()
    || '?';
}

function percent(reviewed: number, total: number): number {
  return Math.max(0, Math.min(100, Math.round((reviewed / total) * 100)));
}

function assignmentStatusLabel(
  locale: FamilyPortalLocale,
  status: FamilyAssignmentStatus,
): string {
  const labels = locale === 'es'
    ? {
        completed: 'Completada',
        in_progress: 'En curso',
        not_started: 'No iniciada',
        overdue: 'Vencida',
      }
    : {
        completed: 'Completed',
        in_progress: 'In progress',
        not_started: 'Not started',
        overdue: 'Overdue',
      };
  return labels[status];
}

function skillPresentation(
  locale: FamilyPortalLocale,
  band: FamilySkillBand,
): {label: string; tone: FamilySignalTone} {
  const labels = locale === 'es'
    ? {
        growing: 'En desarrollo',
        insufficient_evidence: 'Aún no hay suficiente evidencia',
        starting: 'Inicial',
        strong: 'Sólida',
      }
    : {
        growing: 'Growing',
        insufficient_evidence: 'Not enough evidence',
        starting: 'Starting',
        strong: 'Strong',
      };
  const tones: Record<FamilySkillBand, FamilySignalTone> = {
    growing: 'blue',
    insufficient_evidence: 'grape',
    starting: 'sun',
    strong: 'mint',
  };
  return {label: labels[band], tone: tones[band]};
}

function topicLabel(
  locale: FamilyPortalLocale,
  topic: FamilyMessageTopic,
): string {
  const labels = locale === 'es'
    ? {
        access: 'Acceso familiar',
        assignment: 'Tarea',
        other: 'Conversación familiar',
        progress: 'Progreso de aprendizaje',
        technical: 'Ayuda técnica',
      }
    : {
        access: 'Family access',
        assignment: 'Assignment',
        other: 'Family conversation',
        progress: 'Learning progress',
        technical: 'Technical help',
      };
  return labels[topic];
}

function authorizedFamilyCopy(locale: FamilyPortalLocale): FamilyPortalUiDto['copy'] {
  const base = getFamilyDemoData(locale).copy;
  const spanish = locale === 'es';
  return {
    ...base,
    childSelectorHint: spanish
      ? 'Cambia entre estudiantes con una relación familiar activa verificada por el servidor.'
      : 'Switch between learners with an active server-verified family relationship.',
    demoAccountLabel: spanish ? 'Sesión familiar protegida' : 'Protected family session',
    syntheticBadge: spanish ? 'Acceso autorizado' : 'Authorized access',
    syntheticTitle: spanish
      ? 'El servidor vuelve a comprobar el acceso en cada solicitud'
      : 'The server rechecks access on every request',
    syntheticBody: spanish
      ? 'Esta vista contiene únicamente campos familiares permitidos para el grupo y estudiante seleccionados. No permite entrar a la lección como el estudiante.'
      : 'This view contains only family-allowlisted fields for the selected tenant and learner. It never lets an adult enter a lesson as the learner.',
    screenIntros: {
      ...base.screenIntros,
      assignments: spanish
        ? 'Revisa fechas, estado y notas familiares de las tareas autorizadas.'
        : 'Review dates, status, and family notes for authorized assignments.',
      messages: spanish
        ? 'Lee y responde conversaciones en texto simple con participantes autorizados.'
        : 'Read and reply to plain-text conversations with authorized participants.',
      settings: spanish
        ? 'Administra el idioma, la apariencia y las preferencias disponibles para esta relación familiar.'
        : 'Manage language, appearance, and the preferences available to this family relationship.',
    },
    overview: {
      ...base.overview,
      learningSignalsIntro: spanish
        ? 'Evidencia limitada y explicable de proyecciones familiares autorizadas.'
        : 'Limited, explainable evidence from authorized family projections.',
      privateReplySent: spanish
        ? 'La respuesta privada se guardó en una conversación nueva.'
        : 'The private reply was saved in a new conversation.',
      sendPrivateReply: spanish ? 'Enviar respuesta privada' : 'Send private reply',
      upcomingIntro: spanish
        ? 'Tareas autorizadas que pueden necesitar atención familiar.'
        : 'Authorized assignments that may need family attention.',
    },
    assignments: {
      ...base.assignments,
      emptyBody: spanish
        ? 'No hay tareas autorizadas para el filtro seleccionado.'
        : 'There are no authorized assignments for the selected filter.',
      emptyTitle: spanish ? 'No hay tareas en esta vista' : 'No assignments in this view',
    },
    messages: {
      ...base.messages,
      actionFailed: spanish
        ? 'No se pudo completar la acción. No se cambió ningún dato.'
        : 'The action could not be completed. No data was changed.',
      closedAnnouncement: spanish ? 'Conversación cerrada.' : 'Conversation closed.',
      demoNotice: spanish
        ? 'Los mensajes son texto simple y el servidor vuelve a verificar el participante, el estudiante y el grupo antes de cada cambio. Esta vista no confirma la entrega de correo.'
        : 'Messages are plain text, and the server rechecks participant, learner, and tenant before every change. This view does not imply email delivery.',
      newThreadHint: spanish
        ? 'Para continuar, inicia una conversación nueva mediante un flujo autorizado.'
        : 'To continue, start a new conversation through an authorized flow.',
      noMessagesBody: spanish
        ? 'No hay conversaciones autorizadas para el filtro seleccionado.'
        : 'There are no authorized conversations for the selected filter.',
      noMessagesTitle: spanish ? 'No hay mensajes en esta vista' : 'No messages in this view',
      readAnnouncement: spanish ? 'Mensaje marcado como leído.' : 'Message marked as read.',
      replyAnnouncement: spanish
        ? 'La respuesta se guardó en la conversación.'
        : 'The reply was saved to the conversation.',
      replyDemoLabel: spanish ? 'Tú' : 'You',
      replyLabel: spanish ? 'Respuesta en texto simple' : 'Plain-text reply',
      replyPlaceholder: spanish ? 'Escribe una respuesta…' : 'Write a reply…',
      sendReply: spanish ? 'Enviar respuesta' : 'Send reply',
    },
    settings: {
      ...base.settings,
      accessBody: spanish
        ? 'Solo se muestran relaciones activas verificadas por el servidor. La vista familiar no modifica el expediente del estudiante.'
        : 'Only active server-verified relationships are shown. The Family workspace does not edit the learner record.',
      actionFailed: spanish
        ? 'No se pudo completar la acción. No se cambió ningún dato.'
        : 'The action could not be completed. No data was changed.',
      browserOnlyLabel: spanish
        ? 'Preferencia guardada en el servidor; la entrega depende de controles separados.'
        : 'Server-held preference; delivery remains subject to separate controls.',
      demoActionAnnouncement: spanish
        ? 'Este flujo no está disponible desde el espacio familiar.'
        : 'This workflow is not available from the Family workspace.',
      previewPreferencesBody: spanish
        ? 'Cambia únicamente preferencias permitidas para la persona adulta autenticada.'
        : 'Change only the preferences allowed for the authenticated adult.',
      previewPreferencesTitle: spanish ? 'Preferencias de notificación' : 'Notification preferences',
      relinquishAccessBody: spanish
        ? 'Retirar el acceso requiere una relación opaca autorizada; nunca modifica el expediente del estudiante.'
        : 'Removing access requires an authorized opaque relationship resource and never edits the learner record.',
    },
    print: {
      ...base.print,
      footer: spanish
        ? 'Este resumen familiar no es una calificación oficial, boleta, expediente ni decisión de ubicación.'
        : 'This family summary is not an official grade, report card, transcript, or placement decision.',
      syntheticLabel: spanish ? 'ESPACIO FAMILIAR AUTORIZADO' : 'AUTHORIZED FAMILY WORKSPACE',
    },
  };
}

export function getAuthorizedFamilyPortalData(
  locale: FamilyPortalLocale,
  workspace: FamilyWorkspace,
): FamilyPortalUiDto {
  const spanish = locale === 'es';
  const copy = authorizedFamilyCopy(locale);
  const childSummary = workspace.children.find((child) => (
    child.id === workspace.selectedChildId
  ));
  if (!childSummary) throw new Error('The selected child is missing from the family DTO.');

  const courses = workspace.lessons.map((lesson) => ({
    completionLabel: spanish
      ? `${lesson.reviewedPages} de ${lesson.totalPages} páginas visitadas`
      : `${lesson.reviewedPages} of ${lesson.totalPages} pages visited`,
    completionPercent: percent(lesson.reviewedPages, lesson.totalPages),
    id: lesson.assignmentId ?? lesson.lessonReleaseId,
    lastActivityLabel: dateLabel(locale, lesson.lastActivityAt),
    nextConversationPrompt: workspace.overview.supportActivity?.description
      ?? (spanish
        ? 'Pregunta qué estrategia ayudó en la actividad más reciente.'
        : 'Ask which strategy helped in the most recent activity.'),
    title: lesson.lessonTitle,
    unitLabel: spanish
      ? `Proyección familiar · ${lesson.lessonReleaseId}`
      : `Family projection · ${lesson.lessonReleaseId}`,
  }));
  const skills = workspace.skills.map((skill) => {
    const presentation = skillPresentation(locale, skill.band);
    return {
      band: skill.band,
      evidenceLabel: skill.explanation,
      id: skill.skillId,
      label: skill.skillName,
      levelLabel: presentation.label,
      tone: presentation.tone,
    };
  });
  const assignments = workspace.assignments.map((assignment) => ({
    courseLabel: assignment.lessonTitle,
    dueLabel: assignment.dueAt
      ? dateLabel(locale, assignment.dueAt)
      : (spanish ? 'Sin fecha' : 'No due date'),
    familyNote: assignment.familyNote
      ?? (spanish ? 'No hay nota familiar.' : 'No family note is available.'),
    id: assignment.id,
    status: assignment.status,
    statusLabel: assignmentStatusLabel(locale, assignment.status),
    title: assignment.title,
  }));
  const messages = workspace.threads.map((thread) => {
    const latest = thread.messages.at(-1);
    return {
      body: latest?.body ?? (spanish
        ? 'No hay contenido visible en esta conversación.'
        : 'No visible message content is available in this conversation.'),
      id: thread.id,
      history: thread.messages.map((message) => ({
        body: message.body,
        id: message.id,
        mine: message.mine,
        redacted: message.redacted,
        senderLabel: message.senderLabel,
        sentAtLabel: dateLabel(locale, message.sentAt),
      })),
      initiallyClosed: thread.status === 'closed',
      initiallyRead: thread.unreadCount === 0,
      senderLabel: latest?.senderLabel ?? thread.participantLabel,
      sentAtLabel: dateLabel(locale, latest?.sentAt ?? thread.lastMessageAt),
      subject: topicLabel(locale, thread.topic),
    };
  });
  const recentActivity = workspace.lessons
    .filter((lesson) => lesson.lastActivityAt !== null)
    .sort((left, right) => (
      right.lastActivityAt!.localeCompare(left.lastActivityAt!)
    ))
    .slice(0, 3)
    .map((lesson) => ({
      dateLabel: dateLabel(locale, lesson.lastActivityAt),
      detail: spanish
        ? `${lesson.reviewedPages} de ${lesson.totalPages} páginas visitadas`
        : `${lesson.reviewedPages} of ${lesson.totalPages} pages visited`,
      id: `${lesson.lessonReleaseId}:${lesson.lastActivityAt}`,
      title: lesson.lessonTitle,
    }));
  const selectedChild: FamilySelectedChild = {
    announcements: workspace.overview.announcements.map((announcement) => ({
      body: announcement.body,
      id: announcement.id,
      publishedAtLabel: dateLabel(locale, announcement.publishedAt),
      publisherLabel: announcement.publisherLabel,
      title: announcement.title,
    })),
    assignments,
    courses,
    displayName: childSummary.displayName,
    gradeLabel: childSummary.gradeLabel,
    greeting: spanish
      ? `Hola, familia de ${childSummary.displayName}`
      : `Hello, ${childSummary.displayName}’s family`,
    id: childSummary.id,
    initials: initials(childSummary.displayName),
    messages,
    overviewIntro: spanish
      ? 'Este resumen utiliza únicamente proyecciones familiares autorizadas y no sustituye un registro escolar oficial.'
      : 'This summary uses only authorized family projections and does not replace an official school record.',
    programLabel: childSummary.schoolName,
    progressEvidence: {
      computedAtLabel: dateLabel(
        locale,
        workspace.skills[0]?.computedAt ?? workspace.lessons[0]?.computedAt
          ?? workspace.overview.dataUpdatedAt,
      ),
      projectionVersion: 'skill_projection_v1',
      releaseVersion: workspace.lessons[0]?.lessonReleaseId
        ?? (spanish ? 'No disponible' : 'Not available'),
      stale: workspace.skills.some((skill) => skill.stale)
        || workspace.lessons.some((lesson) => lesson.stale),
      statusLabel: workspace.skills.some((skill) => skill.stale)
        || workspace.lessons.some((lesson) => lesson.stale)
        ? (spanish ? 'Puede tener retraso' : 'May be delayed')
        : (spanish ? 'Actual para esta instantánea' : 'Current for this snapshot'),
      whyStatusLabel: spanish
        ? 'El estado refleja únicamente proyecciones vigentes devueltas por el servicio familiar autorizado.'
        : 'Status reflects only current projections returned by the authorized family service.',
    },
    recentActivity,
    skills,
    stats: [
      {
        detail: spanish ? 'Actividad registrada esta semana' : 'Activity recorded this week',
        id: `${childSummary.id}:weekly-pages`,
        label: spanish ? 'Páginas esta semana' : 'Pages this week',
        tone: 'blue',
        value: String(workspace.overview.completedLessonPagesThisWeek),
      },
      {
        detail: spanish ? 'Proyecciones de lecciones vigentes' : 'Current lesson projections',
        id: `${childSummary.id}:paths`,
        label: spanish ? 'Rutas de aprendizaje' : 'Learning paths',
        tone: 'mint',
        value: String(workspace.lessons.length),
      },
      {
        detail: spanish ? 'Tareas aún no completadas' : 'Assignments not yet completed',
        id: `${childSummary.id}:assignments`,
        label: spanish ? 'Tareas abiertas' : 'Open assignments',
        tone: 'sun',
        value: String(workspace.assignments.filter((item) => item.status !== 'completed').length),
      },
      {
        detail: spanish ? 'Conversaciones autorizadas' : 'Authorized conversations',
        id: `${childSummary.id}:unread`,
        label: spanish ? 'Mensajes no leídos' : 'Unread messages',
        tone: 'grape',
        value: String(workspace.overview.unreadMessageCount),
      },
    ],
  };

  return {
    children: workspace.children.map((child) => ({
      displayName: child.displayName,
      gradeLabel: child.gradeLabel,
      id: child.id,
      initials: initials(child.displayName),
      programLabel: child.schoolName,
    })),
    copy,
    demoKind: 'authorized-family-portal',
    locale,
    navigation: [
      {label: copy.screenTitles.overview, view: 'overview'},
      {label: copy.screenTitles.progress, view: 'progress'},
      {label: copy.screenTitles.assignments, view: 'assignments'},
      {label: copy.screenTitles.messages, view: 'messages'},
      {label: copy.screenTitles.settings, view: 'settings'},
    ],
    messageContacts: workspace.messageContacts.map((contact) => ({
      childId: contact.childId,
      enrollmentId: contact.enrollmentId,
      staffDisplayName: contact.staffDisplayName,
      staffUserId: contact.staffUserId,
    })),
    notificationPreference: workspace.notificationPreference,
    schemaVersion: 1,
    selectedChild,
    snapshotLabel: dateLabel(locale, workspace.overview.dataUpdatedAt),
    synthetic: false,
    tenant: workspace.tenant,
  };
}

export function getAuthorizedTeacherMessagesData(
  locale: FamilyPortalLocale,
  inbox: TeacherFamilyInbox,
  announcementSchools?: TeacherAnnouncementSchools,
): TeacherMessagesDemoDto {
  const base = getTeacherMessagesDemoData(locale);
  const spanish = locale === 'es';
  const availableAnnouncementSchools = announcementSchools?.tenant.id === inbox.tenant.id
    ? announcementSchools.schools
    : [];
  return {
    ...base,
    actionFailed: spanish
      ? 'No se pudo completar la acción. No se cambió ningún dato.'
      : 'The action could not be completed. No data was changed.',
    announcementPublished: spanish
      ? 'El anuncio escolar se publicó para las familias autorizadas.'
      : 'The school announcement was published for authorized families.',
    announcementPublishingAvailable: Boolean(
      availableAnnouncementSchools.length,
    ),
    announcementSchools: availableAnnouncementSchools,
    announcementUnavailable: spanish
      ? 'La publicación de anuncios no está disponible. No se guardará ningún dato.'
      : 'Announcement publishing is unavailable. No data will be saved.',
    addReply: spanish ? 'Enviar respuesta' : 'Send reply',
    closedAnnouncement: spanish ? 'Conversación cerrada.' : 'Conversation closed.',
    intro: spanish
      ? 'Lee, responde y cierra únicamente conversaciones vinculadas a tus asignaciones docentes activas.'
      : 'Read, reply to, and close only conversations tied to your active teaching assignments.',
    localReplyLabel: spanish ? 'Tú' : 'You',
    newThreadHint: spanish
      ? 'Para continuar, inicia una conversación nueva mediante un flujo autorizado.'
      : 'To continue, start a new conversation through an authorized flow.',
    noSelectionLabel: spanish
      ? 'No hay conversaciones familiares autorizadas.'
      : 'No authorized family conversations are available.',
    readAnnouncement: spanish ? 'Conversación marcada como leída.' : 'Conversation marked as read.',
    replyAnnouncement: spanish
      ? 'La respuesta se guardó en la conversación.'
      : 'The reply was saved to the conversation.',
    replyLabel: spanish ? 'Respuesta docente en texto simple' : 'Plain-text teacher reply',
    replyPlaceholder: spanish ? 'Escribe una respuesta…' : 'Write a reply…',
    publishAnnouncement: spanish ? 'Publicar anuncio' : 'Publish announcement',
    synthetic: false,
    syntheticBadge: spanish ? 'Acceso autorizado' : 'Authorized access',
    syntheticBody: spanish
      ? 'El servidor vuelve a comprobar el grupo, la asignación docente, el estudiante y la relación familiar antes de cada lectura o cambio.'
      : 'The server rechecks tenant, teaching assignment, learner, and family relationship before every read or change.',
    syntheticTitle: spanish
      ? 'Bandeja limitada a participantes autorizados'
      : 'Inbox limited to authorized participants',
    tenant: inbox.tenant,
    threadListLabel: spanish ? 'Conversaciones familiares' : 'Family conversations',
    threads: inbox.threads.map((thread) => ({
      childId: thread.childId,
      childLabel: thread.childLabel,
      gradeLabel: thread.gradeLabel,
      guardianLabel: thread.guardianLabel,
      id: thread.id,
      messages: thread.messages.map((message) => ({
        body: message.body,
        id: message.id,
        mine: message.mine,
        senderLabel: message.senderLabel,
        sentAtLabel: dateLabel(locale, message.sentAt),
      })),
      status: thread.status,
      subject: topicLabel(locale, thread.topic),
      unreadCount: thread.unreadCount,
    })),
  };
}

export function getAuthorizedAdminFamilyAccessData(
  locale: FamilyPortalLocale,
  workspace: AdminFamilyAccessWorkspace,
  options: Readonly<{
    invitationCreationEnabled?: boolean;
    invitationRecipientPolicy?:
      | 'disabled'
      | 'school-verified-production'
      | 'synthetic-invalid-only';
  }> = {},
): AdminFamilyAccessDemoDto {
  const base = getAdminFamilyAccessDemoData(locale);
  const spanish = locale === 'es';
  const invitationCreationEnabled =
    options.invitationCreationEnabled === true;
  const invitationRecipientPolicy = invitationCreationEnabled
    ? options.invitationRecipientPolicy ?? 'disabled'
    : 'disabled';
  const productionInvitation =
    invitationRecipientPolicy === 'school-verified-production';
  const statusLabels = spanish
    ? {accepted: 'Aceptada', pending: 'Pendiente', revoked: 'Revocada'}
    : {accepted: 'Accepted', pending: 'Pending', revoked: 'Revoked'};
  return {
    ...base,
    accessListIntro: spanish
      ? 'Los datos de contacto, identificadores de proveedor, ciphertext y resúmenes nunca aparecen en este DTO.'
      : 'Contact data, provider identifiers, ciphertext, and digests never appear in this DTO.',
    actionFailed: spanish
      ? 'No se pudo completar la acción. No se cambió ningún dato.'
      : 'The action could not be completed. No data was changed.',
    children: workspace.children.map((child) => ({
      displayName: child.displayName,
      gradeLabel: child.gradeLabel,
      id: child.id,
      initials: initials(child.displayName),
      programLabel: child.schoolName,
    })),
    createIntro: spanish
      ? invitationCreationEnabled
        ? productionInvitation
          ? 'Usa únicamente el correo de la persona adulta que la escuela ya verificó. El servidor vuelve a comprobar la política, el rol, la escuela y el estudiante antes de emitir una invitación de un solo uso.'
          : 'Usa únicamente una dirección sintética con el dominio exacto @helpmath.invalid. El servidor vuelve a comprobar la política, el rol, la escuela y el estudiante.'
        : 'La emisión permanece cerrada hasta que la política sintética, el correo y la capacidad de servidor con privilegios mínimos estén disponibles.'
      : invitationCreationEnabled
        ? productionInvitation
          ? 'Use only the adult email already verified by the school. The server rechecks policy, role, school, and learner before issuing a one-time invitation.'
          : 'Use only a synthetic address at the exact @helpmath.invalid domain. The server rechecks policy, role, school, and learner.'
        : 'Issuance remains closed until the synthetic policy, email, and least-privilege server capability are available.',
    createTitle: spanish
      ? invitationCreationEnabled
        ? productionInvitation
          ? 'Crear invitación verificada por la escuela'
          : 'Crear invitación sintética de integración'
        : 'Emisión de invitaciones no disponible'
      : invitationCreationEnabled
        ? productionInvitation
          ? 'Create school-verified invitation'
          : 'Create synthetic integration invitation'
        : 'Invitation issuance unavailable',
    intro: spanish
      ? 'Revisa invitaciones enmascaradas y relaciones familiares dentro del ámbito escolar autorizado.'
      : 'Review masked invitations and family relationships within the authorized school scope.',
    adultEmailHint: spanish
      ? productionInvitation
        ? 'Introduce solo el correo que la escuela verificó mediante su proceso controlado. El correo nunca aparece en la lista de acceso.'
        : 'Solo se acepta una parte local válida seguida del dominio exacto @helpmath.invalid.'
      : productionInvitation
        ? 'Enter only the address verified through the school-controlled process. The address is never shown in the access list.'
        : 'Only a valid local part followed by the exact @helpmath.invalid domain is accepted.',
    adultEmailLabel: spanish
      ? productionInvitation
        ? 'Correo verificado de la persona adulta'
        : 'Dirección adulta sintética'
      : productionInvitation
        ? 'School-verified adult email'
        : 'Synthetic adult address',
    adultEmailPlaceholder: productionInvitation
      ? 'adult@family-domain.org'
      : 'adult@helpmath.invalid',
    createInvitation: spanish
      ? productionInvitation
        ? 'Crear invitación segura'
        : 'Crear invitación sintética'
      : productionInvitation
        ? 'Create secure invitation'
        : 'Create synthetic invitation',
    invitationCreated: spanish
      ? productionInvitation
        ? 'Se creó la invitación. Esta vista no confirma la entrega del correo.'
        : 'Se creó la invitación sintética. La entrega externa no se confirma en esta vista.'
      : productionInvitation
        ? 'The invitation was created. This view does not confirm email delivery.'
        : 'The synthetic invitation was created. This view does not confirm external delivery.',
    invitationCreationEnabled,
    invitationRecipientPolicy,
    invitationCreationUnavailable: spanish
      ? 'La emisión está cerrada. Esta página no recopila ni envía una dirección.'
      : 'Issuance is closed. This page does not collect or send an address.',
    invalidEmailLabel: spanish
      ? productionInvitation
        ? 'Usa un correo válido verificado por la escuela; no se admiten dominios reservados para pruebas.'
        : 'Usa una dirección sintética válida que termine exactamente en @helpmath.invalid.'
      : productionInvitation
        ? 'Use a valid school-verified address; reserved testing domains are not accepted.'
        : 'Use a valid synthetic address ending exactly in @helpmath.invalid.',
    invitations: workspace.invitations.map((invitation) => ({
      childDisplayName: invitation.childDisplayName,
      childId: invitation.childId,
      destinationLabel: invitation.destinationLabel,
      expiresLabel: invitation.expiresAt
        ? dateLabel(locale, invitation.expiresAt)
        : statusLabels[invitation.status],
      gradeLabel: invitation.gradeLabel,
      guardianLabel: invitation.guardianLabel,
      guardianLinkId: invitation.guardianLinkId ?? undefined,
      id: invitation.id,
      status: invitation.status,
      statusLabel: statusLabels[invitation.status],
    })),
    resend: spanish ? 'Reenviar invitación' : 'Resend invitation',
    resentAnnouncement: spanish
      ? 'La invitación sintética se renovó para el buzón de integración controlado.'
      : 'The synthetic invitation was renewed for the controlled integration inbox.',
    revokedAnnouncement: spanish ? 'Acceso revocado.' : 'Access revoked.',
    synthetic: false,
    syntheticBadge: spanish ? 'Acceso autorizado' : 'Authorized access',
    syntheticBody: spanish
      ? 'El servidor vuelve a comprobar el rol administrativo, la escuela y el estudiante. Los destinos permanecen enmascarados y la emisión de invitaciones está cerrada.'
      : 'The server rechecks administrative role, school, and learner. Destinations stay masked, and invitation issuance remains closed.',
    syntheticTitle: spanish
      ? 'Acceso limitado al ámbito administrativo autorizado'
      : 'Access limited to the authorized administrative scope',
    tenant: workspace.tenant,
  };
}
