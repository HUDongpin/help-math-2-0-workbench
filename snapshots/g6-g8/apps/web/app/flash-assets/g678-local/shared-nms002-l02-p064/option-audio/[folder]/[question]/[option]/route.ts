export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, {params}: {
  params: Promise<{folder: string; question: string; option: string}>;
}) {
  if (process.env.NODE_ENV !== 'development') return new Response(null, {status: 404});
  const [{getWorkspaceRoot}, {p064OptionAudioResponse}] = await Promise.all([
    import('@/lib/catalog'),
    import('@/lib/nms-l02-p064-question-audio-response'),
  ]);
  const {folder, question, option} = await params;
  return p064OptionAudioResponse(request, folder, question, option, getWorkspaceRoot);
}
