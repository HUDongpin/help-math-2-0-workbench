import {
  readNovaPolicyRoute,
  updateNovaPolicyRoute,
} from '@/lib/nova-policy-route.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = {params: Promise<{schoolId: string}>};

export async function GET(_request: Request, {params}: Context) {
  const {schoolId} = await params;
  return readNovaPolicyRoute('school', schoolId);
}

export async function PUT(request: Request, {params}: Context) {
  const {schoolId} = await params;
  return updateNovaPolicyRoute('school', schoolId, request);
}
