import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {TeacherFamilyMessagesDemo} from '@/components/family/family-companion-surfaces';
import {isLocale} from '@/content';
import {getTeacherMessagesDemoData} from '@/lib/family/family-demo-data';
import {getAuthorizedTeacherMessagesData} from '@/lib/family/family-ui-data';
import {
  closeFamilyThread,
  markFamilyThreadRead,
  publishSchoolAnnouncement,
  sendFamilyMessage,
} from '@/lib/family/actions';
import {requireFamilyAuthorization} from '@/lib/family/authorization.server';
import {
  handleFamilyPageAccessError,
  requireFamilyPageFeature,
} from '@/lib/family/page-access.server';
import {readTeacherFamilyInbox} from '@/lib/family/teacher-family-repository.server';
import {readTeacherAnnouncementSchools} from '@/lib/family/teacher-announcement-repository.server';
import {createPageMetadata} from '@/lib/metadata';

async function sendMessageFromTeacherInbox(
  threadId: string,
  body: string,
  clientMutationId: string,
) {
  'use server';
  return sendFamilyMessage({body, clientMutationId, threadId});
}

async function markThreadReadFromTeacherInbox(
  threadId: string,
  clientMutationId: string,
) {
  'use server';
  return markFamilyThreadRead({clientMutationId, threadId});
}

async function closeThreadFromTeacherInbox(
  threadId: string,
  clientMutationId: string,
) {
  'use server';
  return closeFamilyThread({clientMutationId, status: 'closed', threadId});
}

async function publishAnnouncementFromTeacherInbox(
  schoolId: string,
  title: string,
  body: string,
  clientMutationId: string,
) {
  'use server';
  return publishSchoolAnnouncement({
    body,
    clientMutationId,
    schoolId,
    title,
  });
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const page = locale === 'es'
    ? {title: 'Mensajes para familias', description: 'Bandeja protegida de mensajería docente para familias autorizadas.'}
    : {title: 'Family messages', description: 'Protected teacher inbox for authorized family conversations.'};
  return {...createPageMetadata(locale, page, '/teacher/messages'), robots: {index: false, follow: false}};
}

export default async function TeacherMessagesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  requireFamilyPageFeature('messaging');
  let context;
  let data;
  try {
    context = await requireFamilyAuthorization({
      permissions: ['family:teacher-message'],
      roles: ['teacher'],
    });
    if (!context.messagingEnabled) notFound();
    if (context.synthetic) {
      data = getTeacherMessagesDemoData(locale);
    } else {
      const inbox = await readTeacherFamilyInbox();
      let announcementSchools;
      try {
        announcementSchools = await readTeacherAnnouncementSchools();
      } catch {
        // Inbox access remains useful when the narrower announcement
        // allowlist is temporarily unavailable. Composition stays disabled.
      }
      data = getAuthorizedTeacherMessagesData(
        locale,
        inbox,
        announcementSchools,
      );
    }
  } catch (error) {
    handleFamilyPageAccessError(error, locale, '/teacher/messages');
  }
  return <TeacherFamilyMessagesDemo
    data={data}
    onCloseThreadAction={closeThreadFromTeacherInbox}
    onMarkThreadReadAction={markThreadReadFromTeacherInbox}
    onPublishAnnouncementAction={data.announcementPublishingAvailable
      && !data.synthetic
      ? publishAnnouncementFromTeacherInbox
      : undefined}
    onSendMessageAction={sendMessageFromTeacherInbox}
  />;
}
