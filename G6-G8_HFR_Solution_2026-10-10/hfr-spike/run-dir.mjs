// node run-dir.mjs <out.jsonl> <workers> <dir>...  — runs every .swf under the given directories
import { readdirSync, statSync, writeFileSync, appendFileSync } from "node:fs";
import { fork } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const [outPath, nw, ...dirs] = process.argv.slice(2);
const files = [];
const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); const s = statSync(p); if (s.isDirectory()) walk(p); else if (n.toLowerCase().endsWith(".swf")) files.push(p); } };
dirs.forEach(walk);
writeFileSync(outPath, "");
let next = 0, done = 0; const t0 = Date.now();
const worker = fileURLToPath(new URL("./run-corpus.mjs", import.meta.url));
for (let i = 0; i < +nw; i++) {
  const w = fork(worker, ["--worker"]);
  w.on("message", (m) => {
    appendFileSync(outPath, JSON.stringify({ id: m.path.split("/").slice(-4).join("/"), section: m.path.split("/").slice(-2, -1)[0], registered: false, ...m.result }) + "\n");
    done++;
    if (next < files.length) w.send({ path: files[next++] }); else w.send("done");
  });
  if (next < files.length) w.send({ path: files[next++] });
}
process.on("exit", () => console.error(`finished ${done}/${files.length} in ${((Date.now() - t0) / 1000).toFixed(0)}s`));
