import {
  createCspReportBudget,
  MAX_CSP_REPORT_BYTES,
  parseCspReports,
} from '@/lib/csp-report.server';

export const dynamic = 'force-dynamic';

const budget = createCspReportBudget();
const ACCEPTED_TYPES = ['application/csp-report', 'application/reports+json', 'application/json'];

function noContent(status = 204) {
  return new Response(null, {status, headers: {'Cache-Control': 'no-store'}});
}

/**
 * Reads the body chunk by chunk and stops at the cap, so a missing or false
 * Content-Length (e.g. chunked encoding) cannot make us buffer more.
 */
async function readCapped(request: Request): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_CSP_REPORT_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function POST(request: Request) {
  const type = (request.headers.get('content-type') ?? '').split(';')[0]!.trim().toLowerCase();
  if (!ACCEPTED_TYPES.includes(type)) return noContent(415);
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_CSP_REPORT_BYTES) return noContent(413);
  let payload: unknown;
  try {
    const bytes = await readCapped(request);
    if (!bytes) return noContent(413);
    payload = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
  } catch {
    return noContent(400);
  }
  const reports = parseCspReports(payload);
  if (!reports.length) return noContent(400);
  const granted = budget(reports.length);
  for (const report of reports.slice(0, granted)) {
    console.info(`csp-report-only ${JSON.stringify(report)}`);
  }
  // Reports over budget are dropped silently; browsers do not retry them.
  return noContent();
}
