export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, {params}: {
  params: Promise<{folder: string; question: string}>;
}) {
  if (process.env.NODE_ENV !== 'development') return new Response(null, {status: 404});
  const [{getWorkspaceRoot}, {p064QuestionAudioResponse}] = await Promise.all([
    import('@/lib/catalog'),
    import('@/lib/nms-l02-p064-question-audio-response'),
  ]);
  const {folder, question} = await params;
  return p064QuestionAudioResponse(request, folder, question, getWorkspaceRoot);
}
