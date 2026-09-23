import {
  readNovaPolicyRoute,
  updateNovaPolicyRoute,
} from '@/lib/nova-policy-route.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = {params: Promise<{classId: string}>};

export async function GET(_request: Request, {params}: Context) {
  const {classId} = await params;
  return readNovaPolicyRoute('class', classId);
}

export async function PUT(request: Request, {params}: Context) {
  const {classId} = await params;
  return updateNovaPolicyRoute('class', classId, request);
}
