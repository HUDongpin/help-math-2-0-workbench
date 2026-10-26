import type {G678PreviewEnvironment} from './g678-preview-policy';
import {isP064QuestionAudioRequest, isP064OptionAudioRequest}
  from './nms-l02-p064-question-audio-access';
import {readP064QuestionAudio, readP064OptionAudio}
  from './nms-l02-p064-question-audio-source';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Vary': 'Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
};

function byteRange(value: string | null, length: number): {start: number; end: number} | null | 'invalid' {
  if (value === null) return null;
  const match = /^bytes=(\d*)-(\d*)$/u.exec(value);
  if (!match || (!match[1] && !match[2])) return 'invalid';
  if (!match[1]) {
    const count = Number(match[2]);
    return Number.isSafeInteger(count) && count > 0
      ? {start: Math.max(0, length - count), end: length - 1} : 'invalid';
  }
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : length - 1;
  return Number.isSafeInteger(start) && Number.isSafeInteger(end)
    && start < length && end >= start ? {start, end: Math.min(end, length - 1)} : 'invalid';
}

function sourceAudioResponse(request: Request, allowed: boolean,
  readSource: () => {readonly bytes: Buffer; readonly sha256: string}): Response {
  const denied = () => new Response(null, {status: 404, headers: privateHeaders});
  if (!allowed) return denied();
  try {
    const source = readSource();
    const headers = new Headers({...privateHeaders, 'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes', ETag: `"${source.sha256}"`});
    const range = byteRange(request.headers.get('range'), source.bytes.length);
    if (range === 'invalid') {
      headers.set('Content-Range', `bytes */${source.bytes.length}`);
      return new Response(null, {status: 416, headers});
    }
    const body = range ? source.bytes.subarray(range.start, range.end + 1) : source.bytes;
    headers.set('Content-Length', String(body.length));
    if (range) headers.set('Content-Range', `bytes ${range.start}-${range.end}/${source.bytes.length}`);
    return new Response(new Uint8Array(body), {status: range ? 206 : 200, headers});
  } catch {return denied();}
}

export function p064QuestionAudioResponse(request: Request, folder: string, question: string,
  workspaceRoot: () => string, env: G678PreviewEnvironment = process.env): Response {
  return sourceAudioResponse(request, isP064QuestionAudioRequest({method: request.method,
    url: new URL(request.url), headers: request.headers}, folder, question, env),
  () => readP064QuestionAudio(workspaceRoot(), folder, Number(question)));
}

export function p064OptionAudioResponse(request: Request, folder: string, question: string,
  option: string, workspaceRoot: () => string,
  env: G678PreviewEnvironment = process.env): Response {
  return sourceAudioResponse(request, isP064OptionAudioRequest({method: request.method,
    url: new URL(request.url), headers: request.headers}, folder, question, option, env),
  () => readP064OptionAudio(workspaceRoot(), folder, Number(question), option));
}
