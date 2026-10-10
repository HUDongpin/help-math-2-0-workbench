// Full static inventory of AVM1 action blocks (frame, init, clip-event and button actions).
// node static-inventory.mjs <manifest.json> <registry.json> <srcRoot> <out.json>
import { readFileSync, writeFileSync } from "node:fs";
import { parseSwf } from "./swf.mjs";
import { OPNAMES } from "./avm1.mjs";
const [manifestPath, registryPath, srcRoot, outPath] = process.argv.slice(2);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const reg = JSON.parse(readFileSync(registryPath, "utf8"));
const regKeys = new Set(reg.calibrations.flatMap((c) => c.entries.map((e) => e.key)));
function blocks(swf) {
  const out = [];
  const tl = (frames) => { for (const f of frames || []) for (const t of f) { if (t.op === "action" || t.op === "init") out.push(t.bytes); if (t.op === "place" && t.clipActions) for (const ca of t.clipActions) out.push(ca.bytes); } };
  tl(swf.root.frames);
  for (const d of swf.dict.values()) { if (d.kind === "sprite") tl(d.frames); if (d.kind === "button") for (const c of d.conds) out.push(c.bytes); }
  return out;
}
function scan(bytes, ops, strs) {
  let p = 0; let pool = [];
  while (p < bytes.length) {
    const code = bytes[p++]; if (code === 0) break; let len = 0;
    if (code >= 0x80) { len = bytes.readUInt16LE(p); p += 2; }
    ops.add(OPNAMES[code] || "0x" + code.toString(16));
    const body = bytes.subarray(p, p + len);
    if (code === 0x88) { const n = body.readUInt16LE(0); let q = 2; pool = []; for (let i = 0; i < n; i++) { const e = body.indexOf(0, q); pool.push(body.toString("latin1", q, e)); q = e + 1; } }
    if (code === 0x96) { let q = 0; while (q < body.length) { const t = body[q++]; if (t === 0) { const e = body.indexOf(0, q); strs.add(body.toString("latin1", q, e)); q = e + 1; } else if (t === 1 || t === 7) q += 4; else if (t === 4 || t === 5) q++; else if (t === 6) q += 8; else if (t === 8) { strs.add(pool[body[q]]); q++; } else if (t === 9) { strs.add(pool[body.readUInt16LE(q)]); q += 2; } } }
    p += len;
  }
}
const FEAT = {
  streamAudio: (sw) => sw.stats.streamBlocks > 0, buttons: (sw) => [...sw.dict.values()].some((d) => d.kind === "button"),
  morphShapes: (sw) => sw.stats.morphs > 0, editText: (sw) => [...sw.dict.values()].some((d) => d.kind === "edittext"),
  glossaryHyperlinks: (sw, o, s) => s.has("DoHyperLinks"), quizTemplate: (sw, o, s) => s.has("showRightFeed") || s.has("quizTryCount") || s.has("disableQuizButton"),
  functions: (sw, o) => o.has("DefineFunction") || o.has("DefineFunction2"), clipEvents: (sw) => { let f = false; const tl = (fr) => { for (const x of fr || []) for (const t of x) if (t.op === "place" && t.clipActions) f = true; }; tl(sw.root.frames); for (const d of sw.dict.values()) if (d.kind === "sprite") tl(d.frames); return f; },
  onEnterFrame: (sw, o, s) => s.has("onEnterFrame"), drawingAPI: (sw, o, s) => s.has("lineTo") || s.has("beginFill"), mxUIComponents: (sw, o, s) => s.has("FUIComponentClass"),
  random: (sw, o, s) => o.has("RandomNumber") || s.has("random"), attachMovie: (sw, o, s) => s.has("attachMovie") || s.has("duplicateMovieClip") || o.has("CloneSprite"),
  setInterval: (sw, o, s) => s.has("setInterval"), getURL: (sw, o) => o.has("GetURL") || o.has("GetURL2"), drag: (sw, o, s) => o.has("StartDrag") || s.has("startDrag"),
  tellTargetWith: (sw, o) => o.has("SetTarget") || o.has("SetTarget2") || o.has("With"), keyListener: (sw, o, s) => s.has("Key"), textSelection: (sw, o, s) => s.has("Selection"),
};
const allOps = new Map(); const featCount = { registered: {}, unregistered: {} }; let nReg = 0, nUn = 0;
for (const rel of manifest.releases) for (const m of rel.members) {
  const sw = parseSwf(readFileSync(srcRoot + "/" + m.source.path.replace(/^HELP_COURSES\//, "")));
  const ops = new Set(), strs = new Set();
  for (const b of blocks(sw)) scan(b, ops, strs);
  for (const o of ops) allOps.set(o, (allOps.get(o) || 0) + 1);
  const bucket = regKeys.has(m.animationId) ? (nReg++, "registered") : (nUn++, "unregistered");
  for (const [k, fn] of Object.entries(FEAT)) if (fn(sw, ops, strs)) featCount[bucket][k] = (featCount[bucket][k] || 0) + 1;
}
const pct = (o, n) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, { pages: v, pct: +(100 * v / n).toFixed(1) }]));
const res = { placements: nReg + nUn, registered: nReg, unregistered: nUn, distinctOpcodes: allOps.size, opcodePages: Object.fromEntries([...allOps].sort((a, b) => b[1] - a[1])), features: { unregistered: pct(featCount.unregistered, nUn), registered: pct(featCount.registered, nReg) } };
writeFileSync(outPath, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ distinctOpcodes: res.distinctOpcodes, unregistered: res.features.unregistered }, null, 0));
