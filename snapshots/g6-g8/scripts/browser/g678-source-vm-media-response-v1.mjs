/** Retain bytes from an already-observed Playwright media response. This sends
 * no HTTP request and never changes the media element. Partial responses are
 * not assembled or relabeled as a complete source file. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export async function retainSourceMediaResponse({page, response, source, sourceUrl, documentId, documentTimeOrigin,
  documentHref, outputDirectory, artifactName}) {
  assert(typeof documentId === 'string' && documentId && Number.isFinite(documentTimeOrigin), 'ACTUAL_MEDIA_DOCUMENT_REQUIRED');
  assert(path.isAbsolute(outputDirectory) && /^[a-z0-9][a-z0-9._-]{0,127}$/.test(artifactName), 'BOUNDED_NEW_MEDIA_RESPONSE_PATH_REQUIRED');
  const request = response.request(), frame = request.frame();
  assert(frame === page.mainFrame() && frame.page() === page && frame.url() === documentHref &&
    request.method() === 'GET' && request.resourceType() === 'media' && request.url() === sourceUrl && response.url() === sourceUrl &&
    request.redirectedFrom() === null, 'ACTUAL_SAME_DOCUMENT_MEDIA_RESPONSE_REQUIRED');
  const finished = await response.finished();
  assert(finished === null, 'MEDIA_RESPONSE_DID_NOT_FINISH');
  const timing = request.timing(), status = response.status(), headers = await response.allHeaders();
  const contentRange = headers['content-range'] ?? null;
  assert(Number.isFinite(timing.startTime) && timing.startTime >= documentTimeOrigin &&
    Number.isFinite(timing.responseEnd) && timing.responseEnd >= 0, 'ACTUAL_MEDIA_RESPONSE_TIMING_REQUIRED');
  assert(status === 200 && contentRange === null || status === 206 && contentRange === `bytes 0-${source.bytes - 1}/${source.bytes}`,
    'COMPLETE_MEDIA_RESPONSE_REQUIRED');
  const bytes = await response.body(), hash = createHash('sha256').update(bytes).digest('hex');
  fs.mkdirSync(outputDirectory, {recursive: true});
  const file = path.join(outputDirectory, artifactName); fs.writeFileSync(file, bytes, {flag: 'wx'});
  const body = {path: file, bytes: bytes.length, sha256: hash};
  const fail = reason => {
    fs.writeFileSync(file + '.failure.json', JSON.stringify({kind:'retained-media-response-failure-v1',reason,
      documentId,documentTimeOrigin,url:sourceUrl,status,contentRange,expectedSource:source,body},null,2)+'\n',{flag:'wx'});
    throw Object.assign(new Error(reason + ': retained ' + file), {retainedBody: body});
  };
  if (bytes.length !== source.bytes || hash !== source.sha256) fail('ACTUAL_MEDIA_RESPONSE_SOURCE_HASH_MISMATCH');
  // Recheck after the asynchronous body read; do not carry an old document's
  // response into its replacement document merely because the URL is equal.
  const current = await page.evaluate(() => ({href: location.href, documentId: window.__g678TechnicalObserver?.records?.documentId,
    documentTimeOrigin: performance.timeOrigin}));
  if (current.href !== documentHref || current.documentId !== documentId || current.documentTimeOrigin !== documentTimeOrigin)
    fail('MEDIA_DOCUMENT_CHANGED_DURING_RESPONSE_READ');
  return {kind: 'browser-media-response-body-v1', documentId, documentTimeOrigin, url: sourceUrl, requestMethod: request.method(),
    resourceType: request.resourceType(), redirected: false, status, contentRange,
    requestStartUnixMs: timing.startTime, responseEndUnixMs: timing.startTime + timing.responseEnd,
    body};
}
