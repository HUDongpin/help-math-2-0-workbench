import {notFound} from 'next/navigation';
import {isP053GameFeedbackAudioRequest} from '@/lib/nms-l02-p053-game-resource-access';

const loadSource = () => process.env.NODE_ENV === 'production'
  ? Promise.resolve(null) : import('@/lib/nms-l02-p054-feedback-audio.server');

export const dynamic = 'force-dynamic';

export async function GET(request: Request, {params}: {params: Promise<{kind: string}>}) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const {kind} = await params;
  if (!isP053GameFeedbackAudioRequest({method: request.method, url: new URL(request.url),
    headers: request.headers}, kind)) notFound();
  let bytes: Buffer;
  try {
    const source = await loadSource();
    if (!source) notFound();
    bytes = source.readP054FeedbackAudio(kind);
  } catch {notFound();}
  return new Response(new Uint8Array(bytes), {headers: {
    'Content-Type': 'audio/mpeg',
    'Content-Length': String(bytes.length),
    'Cache-Control': 'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    Vary: 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
