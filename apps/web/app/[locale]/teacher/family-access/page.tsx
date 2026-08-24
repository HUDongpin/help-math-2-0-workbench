import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {TeacherInvitationSuggestionWorkspaceView} from '@/components/family/family-governance-workspaces';
import {isLocale} from '@/content';
import {requireFamilyAuthorization} from '@/lib/family/authorization.server';
import {getTeacherMessagesDemoData} from '@/lib/family/family-demo-data';
import {createFamilyInvitationSuggestion} from '@/lib/family/governance-actions';
import {readTeacherInvitationSuggestionWorkspace} from '@/lib/family/governance-repository.server';
import {handleFamilyPageAccessError, requireFamilyPageFeature} from '@/lib/family/page-access.server';
import {createPageMetadata} from '@/lib/metadata';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function createSuggestion(childId: string, note: string, clientMutationId: string) {
  'use server';
  return createFamilyInvitationSuggestion({clientMutationId, note, studentId: childId});
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  return {...createPageMetadata(locale, locale === 'es'
    ? {title: 'Sugerir acceso familiar', description: 'Flujo docente protegido para sugerir una invitación familiar.'}
    : {title: 'Suggest family access', description: 'Protected teacher workflow for suggesting family access.'}, '/teacher/family-access'), robots: {index: false, follow: false}};
}

export default async function TeacherFamilyAccessPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  requireFamilyPageFeature();
  let workspace;
  try {
    const context = await requireFamilyAuthorization({permissions: ['family:teacher-message'], roles: ['teacher']});
    if (context.synthetic) {
      const demo = getTeacherMessagesDemoData(locale);
      const unique = new Map(demo.threads.map((thread) => [thread.childId, {
        displayName: thread.childLabel, gradeLabel: thread.gradeLabel,
        id: thread.childId, schoolName: demo.tenant.displayName,
      }]));
      workspace = {eligibleChildren: [...unique.values()], suggestions: [], tenant: demo.tenant};
    } else {
      workspace = await readTeacherInvitationSuggestionWorkspace();
    }
  } catch (error) {
    handleFamilyPageAccessError(error, locale, '/teacher/family-access');
  }
  return <TeacherInvitationSuggestionWorkspaceView
    locale={locale}
    onCreateAction={createSuggestion}
    workspace={workspace}
  />;
}
