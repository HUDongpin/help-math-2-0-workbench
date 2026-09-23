import {readAuthSession} from '@/lib/clerk-auth-session.server';
import {readNovaClassAccess} from '@/lib/nova-class-policy.server';
import {createNovaPost} from '@/lib/nova-route-handler.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = createNovaPost(async (classId) => {
  if (!classId) return false;
  const session = await readAuthSession();
  const classAccess = await readNovaClassAccess(classId, session);
  return classAccess?.allowed === true;
});
