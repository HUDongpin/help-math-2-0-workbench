// Run one page headlessly: play to quiescence, then explore clickable controls.
import { readFileSync } from "node:fs";
import { parseSwf } from "./swf.mjs";
import { Runtime } from "./runtime.mjs";
import { OPNAMES } from "./avm1.mjs";
import { pathToFileURL } from "node:url";

export function runPage(path, opts = {}) {
  const t0 = performance.now();
  const out = { path, ok: false };
  let rt;
  try {
    const swf = parseSwf(readFileSync(path));
    out.version = swf.version;
    rt = new Runtime(swf, { seed: opts.seed ?? 12345 });
    rt.opBudget = opts.opBudget ?? 60_000_000;
    rt.loadPage();
    const settle = (maxTicks) => {
      let quiet = 0, n = 0;
      while (n < maxTicks) {
        rt.tick(); n++;
        if (rt.frameAdvances === 0) { if (++quiet >= 24) break; } else quiet = 0;
      }
      return n;
    };
    out.initialTicks = settle(opts.maxInitialTicks ?? 2400);
    const clicked = new Set(); out.clicks = [];
    for (let i = 0; i < (opts.maxClicks ?? 30); i++) {
      const cands = rt.clickables().map((o) => [o.targetPath(), o]).sort((a, b) => (a[0] < b[0] ? -1 : 1));
      const pick = cands.find(([p]) => !clicked.has(p));
      if (!pick) break;
      clicked.add(pick[0]);
      rt.click(pick[1]);
      const ticks = settle(opts.maxClickTicks ?? 600);
      out.clicks.push([pick[0], ticks]);
    }
    out.ok = true;
  } catch (e) {
    out.fatal = String(e?.message || e);
  }
  if (rt) {
    out.ticks = rt.tickCount; out.ops = rt.opsExecuted;
    out.errors = rt.errors;
    out.missingBuiltin = Object.fromEntries(rt.missing.builtin);
    out.missingShell = Object.fromEntries(rt.missing.shell);
    out.missingContentCalls = rt.missing.content.size;
    out.undefinedReceiver = Object.fromEntries([...rt.missing.undefinedReceiver].slice(0, 20));
    out.notes = Object.fromEntries([...rt.notes].slice(0, 40));
    const hostKinds = {};
    for (const h of rt.hostLog) hostKinds[h[1]] = (hostKinds[h[1]] || 0) + 1;
    out.host = hostKinds;
    out.opcodes = Object.fromEntries([...rt.opCoverage].map(([k, v]) => [OPNAMES[k] || k, v]));
    out.streamFrames = rt.streamFrames;
  }
  out.ms = Math.round(performance.now() - t0);
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = runPage(process.argv[2], { maxClicks: +(process.argv[3] ?? 30) });
  console.log(JSON.stringify(r, null, 1));
}
