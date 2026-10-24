// HFR differential verifier: for every page, run the ORIGINAL bytecode (reference
// interpreter) and the GENERATED TypeScript on the same runtime, drive both
// through the same exploration (play to rest, then activate every control),
// and compare shell calls and deep state after load, every tick and every click.
// This compares two executions on the same HFR runtime, not original Flash.
// Build: esbuild tools/verify.ts --bundle --platform=node --format=esm --outfile=dist/verify.mjs
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Runtime } from "../runtime/display";
import { makeHelpers } from "../runtime/helpers";
import { createStateTrace, runtimeDiagnostics } from "./verification-state";

const [lessonDir, tmpDir, esbuildPath, onlyId] = process.argv.slice(2);
const esbuild = (await import(pathToFileURL(esbuildPath).href)).default;

function makeRuntime(data: any, scripts: any, bytecode: any) {
  const rt = new Runtime(data, { scripts, bytecode });
  rt.helpers = makeHelpers(rt);
  return rt;
}
function explore(rt: Runtime) {
  const trace = createStateTrace();
  rt.loadPage(); let state = trace.record(rt, "load");
  const settle = (max: number) => { let quiet = 0, n = 0; while (n < max) { rt.tick(); n++; state = trace.record(rt, "tick"); if (rt.frameAdvances === 0) { if (++quiet >= 24) break; } else quiet = 0; } return n; };
  settle(2400);
  const clicked = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const cands = rt.clickables().map((o) => [o.targetPath(), o] as const).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const pick = cands.find(([p]) => !clicked.has(p)); if (!pick) break;
    clicked.add(pick[0]); rt.click(pick[1]); state = trace.record(rt, `click:${pick[0]}`); settle(600);
  }
  return { clicks: clicked.size, state, steps: trace.steps, traceSha256: trace.digest() };
}

mkdirSync(tmpDir, { recursive: true });
const pagesDir = join(lessonDir, "pages");
const results: any[] = [];
for (const id of readdirSync(pagesDir).sort()) {
  if (onlyId && id !== onlyId) continue;
  const t0 = performance.now();
  let phase = "read-input";
  let A: Runtime | null = null, B: Runtime | null = null;
  try {
  const dir = join(pagesDir, id);
  const data = JSON.parse(readFileSync(join(dir, `${id}.data.json`), "utf8"));
  const bc = JSON.parse(readFileSync(join(dir, `${id}.bytecode.json`), "utf8")).scripts;
  const bytecode: any = {}; for (const [k, v] of Object.entries(bc)) bytecode[k] = new Uint8Array(Buffer.from(v as string, "base64"));
  phase = "construct-interpreter";
  A = makeRuntime(data, null, bytecode);
  phase = "explore-interpreter";
  const ra = explore(A); const sa = ra.state;
  phase = "reference-runtime-errors";
  if (A.errors.length) throw new Error(`Reference execution recorded ${A.errors.length} runtime errors; generated execution was not attempted`);
  const ts = readFileSync(join(dir, `${id}.ts`), "utf8");
  phase = "transform-typescript";
  const js = esbuild.transformSync(ts, { loader: "ts", format: "esm" }).code;
  const modPath = join(tmpDir, `${id}.mjs`); writeFileSync(modPath, js);
  phase = "import-typescript";
  const mod = await import(pathToFileURL(modPath).href + `?t=${Date.now()}`);
  phase = "construct-typescript";
  B = makeRuntime(data, null, null); B.scripts = mod.default(B.helpers);
  phase = "explore-typescript";
  const rb = explore(B); const sb = rb.state;
  phase = "compare-and-record";
  const logA = JSON.stringify(A.hostLog), logB = JSON.stringify(B.hostLog);
  const same = A.errors.length === 0 && B.errors.length === 0 && sa === sb && logA === logB && ra.clicks === rb.clicks && ra.traceSha256 === rb.traceSha256;
  const diagnostics = { interpreter: runtimeDiagnostics(A), typescript: runtimeDiagnostics(B) };
  const diagnosticsClean = diagnostics.interpreter.clean && diagnostics.typescript.clean;
  const passed = same && diagnosticsClean;
  const traceMismatch = Array.from({ length: Math.max(ra.steps.length, rb.steps.length) }, (_, i) => i).find(i => JSON.stringify(ra.steps[i]) !== JSON.stringify(rb.steps[i]));
  let diff = "";
  if (!same) {
    if (A.errors.length || B.errors.length) diff = `runtime errors: interpreter=${A.errors.length}, typescript=${B.errors.length}`;
    else if (logA !== logB) { const la = A.hostLog, lb = B.hostLog; let i = 0; while (i < la.length && JSON.stringify(la[i]) === JSON.stringify(lb[i])) i++; diff = `host log #${i}: ${JSON.stringify(la[i])} vs ${JSON.stringify(lb[i])}`; }
    else if (traceMismatch !== undefined) diff = `state trajectory step #${traceMismatch}: ${JSON.stringify(ra.steps[traceMismatch])} vs ${JSON.stringify(rb.steps[traceMismatch])}`;
    else diff = "deep final state or click count differs";
  }
  if (same && !diagnosticsClean) diff = "matching observed trajectories contain unclassified missing calls or runtime notes";
  const traceFile = join(tmpDir, `${id}.trace.json`);
  writeFileSync(traceFile, JSON.stringify({ schema: "hfr-state-trace/1", interpreter: ra.steps, typescript: rb.steps }, null, 1));
  if (sa !== sb) writeFileSync(join(tmpDir, `${id}.final-state-diff.json`), JSON.stringify({ interpreter: JSON.parse(sa), typescript: JSON.parse(sb) }, null, 1));
  results.push({ id, same, diagnosticsClean, passed, diagnostics, clicks: rb.clicks, hostCalls: B.hostLog.length, ticks: B.tickCount, errorsInterp: A.errors.length, errorsTs: B.errors.length, ms: Math.round(performance.now() - t0), diff, errTs: B.errors.slice(0, 2), trace: { interpreterSha256: ra.traceSha256, typescriptSha256: rb.traceSha256, interpreterSteps: ra.steps.length, typescriptSteps: rb.steps.length, firstDifference: traceMismatch ?? null, file: traceFile } });
  process.stderr.write(`${passed ? "PASS    " : same ? "DIAGNOSTIC" : "DIFFER  "} ${id} clicks=${rb.clicks} hostCalls=${B.hostLog.length} ticks=${B.tickCount} errors=${A.errors.length}/${B.errors.length} ${diff}\n`);
  } catch (error) {
    const failure = { phase, message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : null };
    results.push({ id, same: false, diagnosticsClean: false, passed: false, failure, errorsInterp: A?.errors.length ?? null, errorsTs: B?.errors.length ?? null, errInterp: A?.errors ?? [], errTs: B?.errors ?? [], ticksInterp: A?.tickCount ?? null, ticksTs: B?.tickCount ?? null, ms: Math.round(performance.now() - t0) });
    process.stderr.write(`FAILED   ${id} phase=${phase}: ${failure.message}\n`);
  }
}
writeFileSync(join(lessonDir, "verification.json"), JSON.stringify({ schema: "hfr-verification/2", method: "differential: reference interpreter bytecode vs generated TypeScript on the same HFR runtime; play to rest, activate controls (max 30), compare shell-call log, deep ASObject/array/global/display/page state and SHA-256 trajectory after load, each tick and click; both executions must have zero runtime errors and clean missing-call/runtime-note diagnostics", limitations: "Bounded shared-runtime differential test; not original Flash equivalence, exhaustive interaction coverage, visual/audio fidelity or product admission. Function bodies are observed through execution, not compared as source. Unclassified content/shell/builtin omissions are reported even when both sides match; no exceptions are assumed.", generatedAt: new Date().toISOString(), pages: results, summary: { pages: results.length, match: results.filter((r) => r.same).length, diagnosticsClean: results.filter((r) => r.diagnosticsClean).length, passed: results.filter((r) => r.passed).length } }, null, 1));
console.log(`pages ${results.length}, matched observed HFR trajectories ${results.filter((r) => r.same).length}, clean differential passes ${results.filter((r) => r.passed).length}`);

if (results.length === 0 || results.some((r) => !r.passed)) process.exitCode = 1;
