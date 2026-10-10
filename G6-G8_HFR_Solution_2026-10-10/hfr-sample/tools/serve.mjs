// Minimal static file server for the HFR sample viewer.
// Usage: node tools/serve.mjs [port]   → open http://127.0.0.1:8765/viewer/index.html
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { join, normalize, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] ?? 8765);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json", ".ts": "text/plain; charset=utf-8", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".png": "image/png", ".jpg": "image/jpeg", ".css": "text/css", ".md": "text/plain; charset=utf-8" };
createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") { res.writeHead(302, { location: "/viewer/index.html" }); return res.end(); }
  const file = normalize(join(root, p));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try { const st = statSync(file); if (!st.isFile()) throw new Error(); res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "content-length": st.size, "cache-control": "no-cache" }); createReadStream(file).pipe(res); }
  catch { res.writeHead(404); res.end("not found"); }
}).listen(port, "127.0.0.1", () => console.log(`HFR sample viewer: http://127.0.0.1:${port}/viewer/index.html`));
