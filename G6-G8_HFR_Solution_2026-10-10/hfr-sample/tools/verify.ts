// HFR differential verifier: for every page, run the ORIGINAL bytecode (reference
// interpreter) and the GENERATED TypeScript on the same runtime, drive both
// through the same exploration (play to rest, then activate every control),
// and compare shell calls and the final display/variable state.
// Build: esbuild tools/verify.ts --bundle --platform=node --format=esm --outfile=dist/verify.mjs
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Runtime, MovieClip, TextFieldObj } from "../runtime/display";
import { makeHelpers } from "../runtime/helpers";
import { ASObject } from "../runtime/avm";

const [lessonDir, tmpDir, esbuildPath, onlyId] = process.argv.slice(2);
const esbuild = (await import(pathToFileURL(esbuildPath).href)).default;

function makeRuntime(data: any, scripts: any, bytecode: any) {
  const rt = new Runtime(data, { scripts, bytecode });
  rt.helpers = makeHelpers(rt);
  return rt;
}
function explore(rt: Runtime) {
  rt.loadPage();
  const settle = (max: number) => { let quiet = 0, n = 0; while (n < max) { rt.tick(); n++; if (rt.frameAdvances === 0) { if (++quiet >= 24) break; } else quiet = 0; } return n; };
  settle(2400);
  const clicked = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const cands = rt.clickables().map((o) => [o.targetPath(), o] as const).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const pick = cands.find(([p]) => !clicked.has(p)); if (!pick) break;
    clicked.add(pick[0]); rt.click(pick[1]); settle(600);
  }
  return { clicks: clicked.size };
}
function snapshot(rt: Runtime) {
  const objs = rt.allObjects().map((o: any) => {
    const r: any = { p: o.targetPath(), v: o.visible, x: Math.round(o.m.tx), y: Math.round(o.m.ty) };
    if (o instanceof MovieClip) r.f = o.frame;
    if (o instanceof TextFieldObj) r.t = o.textValue;
    return r;
  });
  const g: any = {};
  for (const k of rt.Global.ownKeys()) { const v = rt.Global.get(k); g[k] = v instanceof ASObject ? (v.isDisplay ? v.targetPath() : typeof v) : v; }
  return JSON.stringify({ objs, g, frame: rt.page_.frame });
}

mkdirSync(tmpDir, { recursive: true });
const pagesDir = join(lessonDir, "pages");
const results: any[] = [];
for (const id of readdirSync(pagesDir).sort()) {
  if (onlyId && id !== onlyId) continue;
  const dir = join(pagesDir, id);
  const data = JSON.parse(readFileSync(join(dir, `${id}.data.json`), "utf8"));
  const bc = JSON.parse(readFileSync(join(dir, `${id}.bytecode.json`), "utf8")).scripts;
  const bytecode: any = {}; for (const [k, v] of Object.entries(bc)) bytecode[k] = new Uint8Array(Buffer.from(v as string, "base64"));
  const ts = readFileSync(join(dir, `${id}.ts`), "utf8");
  const js = esbuild.transformSync(ts, { loader: "ts", format: "esm" }).code;
  const modPath = join(tmpDir, `${id}.mjs`); writeFileSync(modPath, js);
  const mod = await import(pathToFileURL(modPath).href + `?t=${Date.now()}`);
  const t0 = performance.now();
  const A = makeRuntime(data, null, bytecode);
  const ra = explore(A); const sa = snapshot(A);
  const B = makeRuntime(data, null, null); B.scripts = mod.default(B.helpers);
  const rb = explore(B); const sb = snapshot(B);
  const logA = JSON.stringify(A.hostLog), logB = JSON.stringify(B.hostLog);
  const same = sa === sb && logA === logB && ra.clicks === rb.clicks;
  let diff = "";
  if (!same) {
    if (logA !== logB) { const la = A.hostLog, lb = B.hostLog; let i = 0; while (i < la.length && JSON.stringify(la[i]) === JSON.stringify(lb[i])) i++; diff = `host log #${i}: ${JSON.stringify(la[i])} vs ${JSON.stringify(lb[i])}`; }
    else { const oa = JSON.parse(sa), ob = JSON.parse(sb); const i = oa.objs.findIndex((o: any, k: number) => JSON.stringify(o) !== JSON.stringify(ob.objs[k])); diff = i >= 0 ? `object ${JSON.stringify(oa.objs[i])} vs ${JSON.stringify(ob.objs[i])}` : `globals/frame differ`; }
  }
  results.push({ id, same, clicks: rb.clicks, hostCalls: B.hostLog.length, ticks: B.tickCount, errorsInterp: A.errors.length, errorsTs: B.errors.length, ms: Math.round(performance.now() - t0), diff, errTs: B.errors.slice(0, 2) });
  process.stderr.write(`${same ? "MATCH   " : "DIFFER  "} ${id} clicks=${rb.clicks} hostCalls=${B.hostLog.length} ticks=${B.tickCount} errors=${A.errors.length}/${B.errors.length} ${diff}\n`);
}
writeFileSync(join(lessonDir, "verification.json"), JSON.stringify({ schema: "hfr-verification/1", method: "differential: reference interpreter (original bytecode) vs generated TypeScript on the same runtime; play to rest, activate every control (max 30), compare shell-call log and final display/variable state", generatedAt: new Date().toISOString(), pages: results, summary: { pages: results.length, match: results.filter((r) => r.same).length } }, null, 1));
console.log(`pages ${results.length}, identical behaviour ${results.filter((r) => r.same).length}`);
