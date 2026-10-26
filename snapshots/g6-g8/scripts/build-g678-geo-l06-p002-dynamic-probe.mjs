/** Rebuild a local-only interactive frame probe; never a product route. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IR = path.join(ROOT, 'packages/demos/src/generated/geo001-l06-p002-display-ir-v1.json');
const SHEET = path.join(ROOT, 'migrations/shared-geo001-l06-p002/audit/source-symbol-sheet-v1.svg');
const DEFAULT_OUTPUT = path.join(ROOT, 'output/playwright/geo-l06-p002-dynamic-probe-v5.html');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const args = process.argv.slice(2);
assert(args.length === 1 || args.length === 3,
  'Usage: build-g678-geo-l06-p002-dynamic-probe.mjs --write|--check [--output path]');
assert(['--write', '--check'].includes(args[0]) && (args.length === 1 || args[1] === '--output'));
const output = args.length === 3 ? path.resolve(args[2]) : DEFAULT_OUTPUT;
assert.equal(sha(await readFile(IR)), '246882213eb272296b844db0f6ef0e8c968a12b4c8185dc63aa9eabde5504923');
assert.equal(sha(await readFile(SHEET)), 'ae5c6fb9ba4e7c5b4acb1ee1187739a2bf6c1c81ff6d0c9129c428a1f9094c7c');
const built = await esbuild.build({
  entryPoints: [path.join(ROOT, 'scripts/geo-l06-p002-dynamic-probe-client.ts')],
  bundle: true, format: 'iife', platform: 'browser', target: 'es2022', write: false,
  logLevel: 'silent',
});
assert.equal(built.outputFiles.length, 1);
const bundle = built.outputFiles[0].text.replaceAll('</script', '<\\/script');
const html = `<!doctype html><html lang="en"><meta charset="utf-8">` +
  `<meta name="robots" content="noindex,nofollow"><title>GEO L6 P002 local dynamic probe</title>` +
  `<style>body{font:16px system-ui,sans-serif;margin:1rem;color:#16324c}` +
  `.notice{max-width:800px;background:#fff2d4;padding:.75rem;margin-bottom:1rem}` +
  `.stage{width:min(100%,800px)}svg{width:100%;height:auto;display:block}` +
  `.teaching{margin-top:.65rem;padding:.75rem;background:#fffaf0;border:1px solid #cbd6e4;border-radius:.5rem}` +
  `.teaching p{margin:.35rem 0;line-height:1.45;overflow-wrap:anywhere}` +
  `.teaching #teaching-definition,.teaching #teaching-terms{font-size:clamp(1.1rem,2.5vw,1.7rem)}` +
  `.source-highlight{color:#812273;font-weight:750;text-decoration:underline}` +
  `.glossary{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.8rem}` +
  `[hidden]{display:none!important}dialog{max-width:min(90vw,38rem);border:1px solid #567;border-radius:.7rem;line-height:1.5}` +
  `dialog::backdrop{background:rgb(12 28 54 / .5)}` +
  `.controls{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;margin-top:1rem}` +
  `input{width:6rem;font:inherit}button,select{font:inherit;padding:.4rem .65rem}` +
  `output{min-width:5rem}</style><body>` +
  `<p class="notice">Local engineering candidate only. Source graphics, semantic teaching text, ` +
  `source-index glossary, and a user-started source-MP3 transport test. Audio synchronization, ` +
  `original-host glossary flow, fidelity, and product admission are not accepted.</p>` +
  `<main class="stage"><svg id="stage" xmlns="http://www.w3.org/2000/svg" ` +
  `width="800" height="600" viewBox="0 0 800 600" role="img" aria-label="Source kitchen scene" ` +
  `data-flash-animation-id="shared-geo001-l06-p002" data-flash-frame-domain="sprite-230">` +
  `<defs id="source-symbols"></defs>` +
  `<defs><clipPath id="source-mask" clipPathUnits="userSpaceOnUse">` +
  `<rect x="-303.35" y="-195" width="602.15" height="352.8"/></clipPath></defs>` +
  `<rect width="800" height="600" fill="#b8d8f7"/>` +
  `<g transform="translate(412.4 303.3)"><g id="masked-objects" clip-path="url(#source-mask)"></g>` +
  `<g id="unmasked-objects"></g></g></svg>` +
  `<section class="teaching" aria-label="Source teaching text"><p id="teaching-fallback" lang="es" hidden>` +
  `El texto original de esta animación está en inglés.</p>` +
  `<p id="teaching-definition" lang="en" hidden></p><p id="teaching-terms" lang="en" hidden></p>` +
  `<div id="glossary-controls" class="glossary" aria-label="Source glossary" hidden></div></section>` +
  `<div class="controls"><label for="locale-input">UI language</label>` +
  `<select id="locale-input" disabled><option value="en">English</option><option value="es">Español</option></select>` +
  `<label for="frame-input">Source frame</label>` +
  `<input id="frame-input" type="number" min="1" max="1216" value="1" disabled>` +
  `<output id="frame-output">1/1216</output>` +
  `<button id="play" disabled>Play</button><button id="pause" disabled>Pause</button>` +
  `<button id="replay" disabled>Replay</button></div>` +
  `<p><output id="status">Loading source symbols</output></p></main>` +
  `<dialog id="glossary-dialog" aria-labelledby="glossary-title">` +
  `<h2 id="glossary-title"></h2><p id="glossary-definition"></p>` +
  `<p id="glossary-conflict" hidden>Source note: English “Surface” differs between two legacy indexes; ` +
  `this candidate uses the English index for English and the Spanish index for Spanish.</p>` +
  `<button id="glossary-close" type="button">Close</button></dialog>` +
  `<script>${bundle}</script></body></html>\n`;
const bytes = Buffer.from(html);
if (args[0] === '--write') await writeFile(output, bytes, {flag: 'wx'});
else assert.deepEqual(await readFile(output), bytes, 'dynamic probe drift');
console.log(JSON.stringify({bytes: bytes.length, sha256: sha(bytes),
  claimBoundary: 'local graphics, teaching, glossary, and source-MP3 transport candidate only; not My Lesson or audio synchronization acceptance'}));
