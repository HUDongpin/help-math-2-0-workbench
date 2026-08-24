import {Webhook} from 'standardwebhooks';
import {z} from 'zod';

import {recordResendDeliveryEvent} from '@/lib/family/resend-webhook-writer.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

const supportedEvents = Object.freeze({
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.delivered': 'delivered',
  'email.suppressed': 'suppressed',
} as const);

const resendWebhookEventSchema = z.object({
  created_at: z.iso.datetime({offset: true}),
  data: z.object({
    email_id: z.string().min(1).max(255).optional(),
  }).passthrough(),
  type: z.string().min(1).max(120),
}).passthrough();

const MAX_WEBHOOK_BODY_BYTES = 256 * 1_024;

function badRequest() {
  return Response.json({ok: false, error: 'INVALID_WEBHOOK'}, {
    headers: privateHeaders,
    status: 400,
  });
}

async function readBoundedBody(request: Request) {
  const contentLength = request.headers.get('content-length');
  if (
    contentLength
    && (!/^\d+$/u.test(contentLength) || Number(contentLength) > MAX_WEBHOOK_BODY_BYTES)
  ) throw new Error('Invalid webhook body.');
  if (!request.body) throw new Error('Invalid webhook body.');

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_WEBHOOK_BODY_BYTES) {
      await reader.cancel();
      throw new Error('Invalid webhook body.');
    }
    chunks.push(value);
  }
  if (total === 0) throw new Error('Invalid webhook body.');
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const id = request.headers.get('svix-id');
  const timestamp = request.headers.get('svix-timestamp');
  const signature = request.headers.get('svix-signature');
  if (!webhookSecret || !id || !timestamp || !signature) {
    return badRequest();
  }

  let payload: Buffer;
  try {
    payload = await readBoundedBody(request);
  } catch {
    return badRequest();
  }
  let event;
  try {
    event = resendWebhookEventSchema.parse(
      new Webhook(webhookSecret).verify(payload, {
        'webhook-id': id,
        'webhook-signature': signature,
        'webhook-timestamp': timestamp,
      }),
    );
  } catch {
    return badRequest();
  }

  const mapped = supportedEvents[event.type as keyof typeof supportedEvents];
  if (!mapped || !event.data.email_id) {
    return Response.json({ok: true, ignored: true}, {
      headers: privateHeaders,
      status: 202,
    });
  }

  try {
    await recordResendDeliveryEvent({
      eventId: id,
      eventType: mapped,
      occurredAt: event.created_at,
      providerEmailId: event.data.email_id,
    });
    return Response.json({ok: true}, {headers: privateHeaders});
  } catch {
    return Response.json({ok: false, error: 'RETRY_LATER'}, {
      headers: privateHeaders,
      status: 503,
    });
  }
}
