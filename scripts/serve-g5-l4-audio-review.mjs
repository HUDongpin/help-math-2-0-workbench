#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, realpath, stat} from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const REVIEW_REPORT = "reports/g5-l4-current-js-audio-listening-review-v1.json";
const DEFAULT_PRODUCT_URL =
  "http://127.0.0.1:3211/courses/5/4?mode=focus";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function validateProductUrl(value) {
  const url = new URL(value);
  invariant(url.protocol === "http:", "product URL must use loopback HTTP");
  invariant(LOOPBACK_HOSTS.has(url.hostname), "product URL must be loopback-only");
  invariant(
    url.username === "" && url.password === "" && url.hash === "" &&
      url.pathname === "/courses/5/4" && url.search === "?mode=focus",
    "product URL must be the G5 L4 focus route",
  );
  return url.href;
}

async function readTrack(projectRoot, track) {
  const absolute = path.resolve(projectRoot, track.outputPath);
  invariant(isWithin(projectRoot, absolute), `${track.id}: path escapes project`);
  invariant(
    track.outputPath.startsWith(
      "apps/web/server-assets/flash-assets/courses/",
    ) && track.outputPath.endsWith(".mp3"),
    `${track.id}: path is outside the server-only MP3 closure`,
  );
  const [rootReal, fileReal, fileStat, bytes] = await Promise.all([
    realpath(projectRoot),
    realpath(absolute),
    stat(absolute),
    readFile(absolute),
  ]);
  invariant(isWithin(rootReal, fileReal), `${track.id}: real path escapes project`);
  invariant(
    fileStat.isFile() && fileStat.nlink === 1 &&
      bytes.length === track.bytes && sha256(bytes) === track.sha256,
    `${track.id}: audio bytes do not match the listening packet`,
  );
  return {...track, bytes};
}

function renderSelect(name, options) {
  return `<label>${escapeHtml(name)} <select data-field="${escapeHtml(name)}">` +
    options.map(([value, label]) =>
      `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`,
    ).join("") + "</select></label>";
}

function renderTrack(track) {
  const options = [
    ["pending", "Pending"],
    ["pass", "Pass"],
    ["fail", "Fail"],
    ["not-applicable", "N/A"],
  ];
  return `<article class="track" data-track-id="${escapeHtml(track.id)}">
    <h3>${escapeHtml(track.id)}</h3>
    <p><b>Candidate:</b> ${escapeHtml(track.candidateLanguage)} · ${escapeHtml(track.kind)} · ${track.machineProbe.decodedDurationMs} ms · <code>${escapeHtml(track.sha256)}</code></p>
    <audio controls preload="none" src="/asset/${encodeURIComponent(track.id)}"></audio>
    <div class="decisions">
      ${renderSelect("language", options)}
      ${renderSelect("content", options)}
      ${renderSelect("intelligibility", options)}
      ${renderSelect("technicalQuality", options)}
      ${renderSelect("decision", options)}
    </div>
    <label>Notes <textarea data-field="notes" rows="2"></textarea></label>
  </article>`;
}

function renderPage(page) {
  const disabled = page.reviewTemplate === null ? " disabled" : "";
  return `<article class="page" data-page-id="${escapeHtml(page.animationId)}">
    <h3>${page.ordinal}. ${escapeHtml(page.animationId)}</h3>
    <p>${escapeHtml(page.protocolId)} · ${escapeHtml(page.reviewStatus)}</p>
    ${page.blocker ? `<p class="warning">${escapeHtml(page.blocker)}</p>` : ""}
    <label>Page trigger/sync decision <select data-field="decision"${disabled}>
      <option value="pending">Pending</option><option value="pass">Pass</option><option value="fail">Fail</option><option value="not-applicable">N/A</option>
    </select></label>
    <label>Notes <textarea data-field="notes" rows="2"${disabled}></textarea></label>
  </article>`;
}

function renderHtml({report, reportSha256, productUrl}) {
  const trackHtml = report.tracks.map(renderTrack).join("\n");
  const pageHtml = report.pages.map(renderPage).join("\n");
  const embedded = JSON.stringify({
    reviewId: report.reviewId,
    reviewReport: {path: REVIEW_REPORT, sha256: reportSha256},
    requiredTrackDecisionCount: report.summary.uniqueTrackCount,
    requiredPageDecisionCount: report.summary.reviewablePageCount,
    productUrl,
  }).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/favicon.ico">
<title>G5 L4 local audio review</title>
<style>
body{font:16px/1.45 system-ui,sans-serif;margin:0;background:#f5f7fb;color:#172033}main{max-width:1180px;margin:auto;padding:24px}h1,h2{color:#163a63}.warning{background:#fff2c7;border-left:5px solid #a85f00;padding:12px}.boundary{background:#e8f3ff;border:1px solid #96bce5;padding:16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:14px}.track,.page{background:white;border:1px solid #ccd6e2;border-radius:10px;padding:14px}.track h3,.page h3{overflow-wrap:anywhere}audio{width:100%}.decisions{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;margin:12px 0}label{display:block;font-weight:600}select,textarea,input{box-sizing:border-box;margin-top:4px;padding:7px;width:100%}code{font-size:11px;overflow-wrap:anywhere}button{background:#174f87;color:white;border:0;border-radius:7px;padding:10px 16px;font-weight:700}a{color:#075aa8}
</style></head><body><main>
<h1>G5 L4 local audio review</h1>
<p class="boundary"><b>Local-only, unsigned review worksheet.</b> Audio controls below prove neither Current-JS synchronization nor acceptance. Start the product separately with <code>${escapeHtml(report.reviewSurface.productCommand)}</code>, then use the exact <a href="${escapeHtml(productUrl)}">loopback product route</a> for page trigger/sync review. Exported JSON remains an unsigned reviewer input until independently validated and adopted.</p>
<section><h2>Reviewer</h2><div class="grid"><label>Reviewer identity<input id="reviewerIdentity" autocomplete="name"></label><label>Reviewer role<input id="reviewerRole"></label><label>Exact commit SHA<input id="commitSha" pattern="[a-f0-9]{40}"></label></div></section>
<section><h2>Page trigger and synchronization — ${report.summary.reviewablePageCount} reviewable</h2><div class="grid">${pageHtml}</div></section>
<section><h2>Direct content listening — ${report.summary.uniqueTrackCount} exact tracks</h2><div class="grid">${trackHtml}</div></section>
<p><button id="export">Export unsigned worksheet JSON</button></p>
<script type="application/json" id="review-contract">${embedded}</script>
<script>
const contract=JSON.parse(document.getElementById('review-contract').textContent);
function rows(selector,idAttribute){return [...document.querySelectorAll(selector)].map(node=>({id:node.dataset[idAttribute],...Object.fromEntries([...node.querySelectorAll('[data-field]')].map(field=>[field.dataset.field,field.value]))}));}
document.getElementById('export').addEventListener('click',()=>{
  const record={schemaVersion:1,artifactType:'g5-l4-audio-human-review-worksheet',status:'unsigned-reviewer-export',acceptanceEffect:'none-until-independent-validation-and-adoption',reviewId:contract.reviewId,reviewReport:contract.reviewReport,productUrl:contract.productUrl,reviewerIdentity:document.getElementById('reviewerIdentity').value.trim()||null,reviewerRole:document.getElementById('reviewerRole').value.trim()||null,exactCommitSha:document.getElementById('commitSha').value.trim()||null,exportedAt:new Date().toISOString(),trackReviews:rows('.track','trackId'),pageReviews:rows('.page','pageId')};
  const blob=new Blob([JSON.stringify(record,null,2)+'\\n'],{type:'application/json'});const anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download='g5-l4-audio-human-review-worksheet-unsigned.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1000);
});
</script></main></body></html>`;
}

function parseRange(value, length) {
  if (!value) return null;
  const match = /^bytes=(\d+)-(\d*)$/.exec(value);
  if (!match) return false;
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : length - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start < 0 || end < start || start >= length) return false;
  return {start, end: Math.min(end, length - 1)};
}

export async function loadG5L4AudioReviewState({
  projectRoot = DEFAULT_PROJECT_ROOT,
  productUrl = DEFAULT_PRODUCT_URL,
} = {}) {
  const root = path.resolve(projectRoot);
  const reportPath = path.resolve(root, REVIEW_REPORT);
  invariant(isWithin(root, reportPath), "review report escapes project root");
  const reportBytes = await readFile(reportPath);
  const report = JSON.parse(reportBytes.toString("utf8"));
  invariant(
    report?.status === "unsigned-pending-human-listening-and-sync-review" &&
      report?.summary?.uniqueTrackCount === 185 &&
      report?.summary?.reviewablePageCount === 53 &&
      report?.summary?.humanReviewedTrackCount === 0 &&
      report?.summary?.humanReviewedPageCount === 0 &&
      report?.reviewSurface?.productCommand ===
        "CURRENT_JS_SHOWCASE_G5_L4_ENABLED=true CURRENT_JS_SHOWCASE_G5_L4_AUDIO_ENABLED=true npm run dev --workspace @helpmath/web -- --hostname 127.0.0.1 --port 3211",
    "listening packet identity or unsigned boundary changed",
  );
  const tracks = await Promise.all(
    report.tracks.map((track) => readTrack(root, track)),
  );
  invariant(new Set(tracks.map((track) => track.id)).size === 185, "track IDs changed");
  return {
    report,
    reportSha256: sha256(reportBytes),
    productUrl: validateProductUrl(productUrl),
    trackById: new Map(tracks.map((track) => [track.id, track])),
  };
}

export async function createG5L4AudioReviewServer({
  projectRoot = DEFAULT_PROJECT_ROOT,
  productUrl = DEFAULT_PRODUCT_URL,
  host = "127.0.0.1",
  port = 0,
} = {}) {
  invariant(host === "127.0.0.1", "review server must bind IPv4 loopback only");
  invariant(Number.isSafeInteger(port) && port >= 0 && port <= 65_535, "invalid port");
  const state = await loadG5L4AudioReviewState({projectRoot, productUrl});
  const html = Buffer.from(renderHtml(state));
  const server = http.createServer((request, response) => {
    const finish = (status, headers, body = Buffer.alloc(0)) => {
      response.writeHead(status, {
        "Cache-Control": "private, no-store",
        "Content-Security-Policy": "default-src 'self'; media-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff",
        ...headers,
      });
      if (request.method === "HEAD") response.end();
      else response.end(body);
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      finish(405, {Allow: "GET, HEAD", "Content-Type": "text/plain"}, Buffer.from("Method not allowed"));
      return;
    }
    const url = new URL(request.url || "/", "http://127.0.0.1");
    if (url.pathname === "/") {
      finish(200, {"Content-Type": "text/html; charset=utf-8", "Content-Length": html.length}, html);
      return;
    }
    if (url.pathname === "/health") {
      const body = Buffer.from(JSON.stringify({status: "ready", authority: "local-unsigned-review-only", tracks: 185, pages: 53}) + "\n");
      finish(200, {"Content-Type": "application/json", "Content-Length": body.length}, body);
      return;
    }
    if (url.pathname === "/favicon.ico") {
      finish(204, {"Content-Type": "image/x-icon", "Content-Length": 0});
      return;
    }
    if (url.pathname.startsWith("/asset/")) {
      const encodedId = url.pathname.slice("/asset/".length);
      let id;
      try { id = decodeURIComponent(encodedId); } catch { finish(404, {"Content-Type": "text/plain"}); return; }
      const track = state.trackById.get(id);
      if (!track || encodedId.includes("/")) { finish(404, {"Content-Type": "text/plain"}); return; }
      const range = parseRange(request.headers.range, track.bytes.length);
      if (range === false) {
        finish(416, {"Content-Range": `bytes */${track.bytes.length}`, "Content-Type": "text/plain"});
        return;
      }
      const body = range ? track.bytes.subarray(range.start, range.end + 1) : track.bytes;
      finish(range ? 206 : 200, {
        "Accept-Ranges": "bytes",
        "Content-Type": "audio/mpeg",
        "Content-Length": body.length,
        ...(range ? {"Content-Range": `bytes ${range.start}-${range.end}/${track.bytes.length}`} : {}),
        "X-Audio-Sha256": track.sha256,
      }, body);
      return;
    }
    finish(404, {"Content-Type": "text/plain"}, Buffer.from("Not found"));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  invariant(address && typeof address === "object", "review server address unavailable");
  return {
    server,
    url: `http://${host}:${address.port}/`,
    state,
    close: () => new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()),
    ),
  };
}

function parseCli(argv) {
  let port = 3210;
  let productUrl = DEFAULT_PRODUCT_URL;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--port") port = Number(argv[++index]);
    else if (argument === "--product-url") productUrl = argv[++index];
    else throw new Error("usage: [--port N] [--product-url LOOPBACK_URL]");
  }
  return {port, productUrl};
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  try {
    const options = parseCli(process.argv.slice(2));
    const review = await createG5L4AudioReviewServer(options);
    process.stdout.write(
      `G5 L4 local unsigned audio review: ${review.url}\n` +
      `Product sync route: ${review.state.productUrl}\n`,
    );
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
    process.exitCode = 1;
  }
}
