import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(root, 'migrations/shared-alg001-l12-p006');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const mp3 = readFileSync(path.join(base, 'audio-source-v1/sprite-53-source-stream.mp3'));
const pcm = readFileSync(path.join(base, 'audio-pcm-v1/sprite-53-untrimmed.f32le'));
assert.equal(sha(mp3), '801d34dc684341a2644a7fcc3373bea98cbc14bdf91f4364db0e37c30e7c1803');
assert.equal(sha(pcm), '9a654d4f943435147639c57ce65dc524204a84d99d04580c3b9491138acbc1bd');
const decoderInput = readFileSync(path.join(root, 'packages/demos/src/alg-l12-p006-audio-decode.ts'));
const bundle = await build({stdin: {contents: `
import {decodeP006Audio} from './packages/demos/src/alg-l12-p006-audio-decode';
window.runProbe = async () => {
  const context = new OfflineAudioContext(1, 624384, 22050);
  try {
    const encoded = await (await fetch('/source.mp3')).arrayBuffer();
    const reference = new DataView(await (await fetch('/reference.f32le')).arrayBuffer());
    const decoded = await decodeP006Audio(context, encoded);
    const samples = decoded.getChannelData(0);
    let peak=0, nonzero=0, differing=0, maximum=0, squared=0;
    for (let i=0; i<samples.length; i++) {
      const value=samples[i], expected=reference.getFloat32(i*4,true);
      if (!Number.isFinite(value)) throw Error('nonfinite sample');
      const delta=Math.abs(value-expected);
      peak=Math.max(peak,Math.abs(value)); if(value!==0) nonzero++;
      if(delta!==0) differing++; maximum=Math.max(maximum,delta); squared+=delta*delta;
    }
    if(nonzero===0) throw Error('silent decode');
    window.result={status:'passed',decoderImplementationSha256:'${sha(decoderInput)}',
      encodedSha256:'${sha(mp3)}',referencePcmSha256:'${sha(pcm)}',
      browser:navigator.userAgent,rate:decoded.sampleRate,channels:decoded.numberOfChannels,
      samples:decoded.length,peak,nonzero,differingSamples:differing,
      maximumAbsoluteDifference:maximum,rmsDifference:Math.sqrt(squared/samples.length),
      audiblePlayback:false,hostIntegration:false,synchronizationAccepted:false,audioAccepted:false};
  } catch(error) {window.result={status:'failed',error:String(error)};}
  document.getElementById('result').textContent=JSON.stringify(window.result,null,2);
};`, resolveDir: root, loader: 'ts'}, bundle: true, write: false, format: 'iife', platform: 'browser'});
const html = '<!doctype html><html lang="en"><meta charset="utf-8"><title>P006 decoder check</title><h1>P006 offline source decode</h1><p>No audible playback or listening acceptance.</p><button onclick="this.disabled=true;runProbe()">Compare browser decode</button><pre id="result">Not started</pre><script src="/probe.js"></script></html>';
const files = new Map([['/', [html, 'text/html']], ['/probe.js', [bundle.outputFiles[0].contents, 'text/javascript']],
  ['/source.mp3', [mp3, 'audio/mpeg']], ['/reference.f32le', [pcm, 'application/octet-stream']]]);
const server = createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'");
  if (req.method !== 'GET' || req.headers.host !== `127.0.0.1:${server.address().port}` ||
      req.headers['sec-fetch-site'] === 'cross-site' || !files.has(req.url)) {res.writeHead(404);res.end();return;}
  const [body, type] = files.get(req.url); res.writeHead(200, {'Content-Type': type}); res.end(body);
});
server.listen(0, '127.0.0.1', () => console.log(JSON.stringify({url:`http://127.0.0.1:${server.address().port}/`})));
