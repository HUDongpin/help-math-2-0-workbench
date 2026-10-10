// hfr-compile: one SWF page → { <id>.ts, <id>.data.json, media files, <id>.bytecode.json }.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import { parseSwf } from "./swf.mjs";
import { decompileBlock } from "./decompile.mjs";
import { convertBitmap, convertStream, convertEventSound } from "./media.mjs";

export const COMPILER_VERSION = "hfr-compile 0.1.0";
const EVENTS = [[0x1, "load"], [0x2, "enterFrame"], [0x4, "unload"], [0x8, "mouseMove"], [0x10, "mouseDown"], [0x20, "mouseUp"], [0x40, "keyDown"], [0x80, "keyUp"], [0x100, "data"], [0x200, "initialize"], [0x400, "press"], [0x800, "release"], [0x1000, "releaseOutside"], [0x2000, "rollOver"], [0x4000, "rollOut"], [0x8000, "dragOver"], [0x10000, "dragOut"], [0x20000, "keyPress"], [0x40000, "construct"]];
const CONDS = [[0x01, "rollOver"], [0x02, "rollOut"], [0x04, "press"], [0x08, "release"], [0x10, "dragOut"], [0x20, "dragOver"], [0x40, "releaseOutside"], [0x80, "pressOutside"]];
const M = (m) => (m ? [round(m.a), round(m.b), round(m.c), round(m.d), m.tx, m.ty] : undefined);
const CX = (c) => (c ? [c.rm, c.gm, c.bm, c.am, c.ra, c.ga, c.ba, c.aa] : undefined);
const round = (v) => Math.round(v * 100000) / 100000;

export function compilePage({ swfPath, outDir, placement, runtimeRel, spanishAudio, sourceRel }) {
  const file = readFileSync(swfPath); const sha256 = createHash("sha256").update(file).digest("hex");
  const swf = parseSwf(file);
  if (Object.keys(swf.unsupported).length) throw new Error("unsupported tags: " + JSON.stringify(swf.unsupported));
  mkdirSync(join(outDir, "media"), { recursive: true });
  const id = placement.animationId;
  const scripts = []; const bytecode = {}; const usedNames = new Set(); const helpers = new Set(); let fallbacks = 0, blocks = 0;
  const instNames = {}; // charId -> [ "name (in sprite S frame N)" ]
  const spriteLabel = (tl) => (tl === 0 ? "root timeline" : `sprite ${tl}`);
  const uniq = (n) => { let x = n, k = 2; while (usedNames.has(x)) x = `${n}_${k++}`; usedNames.add(x); return x; };
  const addScript = (name, doc, bytes) => {
    const r = decompileBlock(bytes, 3); const nm = uniq(name);
    r.helpers.forEach((h) => helpers.add(h)); fallbacks += r.fallbacks; blocks += r.blocks;
    scripts.push({ name: nm, doc, code: r.code }); bytecode[nm] = Buffer.from(bytes).toString("base64");
    return nm;
  };
  // collect instance names first (for documentation comments)
  const scan = (frames, tl) => frames.forEach((fr, fi) => fr.forEach((t) => { if (t.op === "place" && t.charId !== undefined) (instNames[t.charId] ??= []).push(`${t.name ? `"${t.name}"` : "unnamed"} in ${spriteLabel(tl)} frame ${fi + 1}`); }));
  scan(swf.root.frames, 0); for (const d of Object.values(swf.dict)) if (d.kind === "sprite") scan(d.frames, d.id);

  const convTimeline = (frames, tl) => frames.map((fr, fi) => {
    let ak = 0;
    return fr.map((t) => {
      const where = `${spriteLabel(tl)}, frame ${fi + 1}`;
      switch (t.op) {
        case "action": { const n = addScript(tl === 0 ? `frame${fi + 1}${ak ? `_${ak + 1}` : ""}` : `sprite${tl}_frame${fi + 1}${ak ? `_${ak + 1}` : ""}`, `Frame script: ${where}`, t.bytes); ak++; return { op: "action", script: n }; }
        case "init": return { op: "init", sprite: t.sprite, script: addScript(`init_sprite${t.sprite}`, `#initclip for sprite ${t.sprite} (runs once, before the frame's scripts)`, t.bytes) };
        case "label": return { op: "label", name: t.name };
        case "remove": return { op: "remove", depth: t.depth };
        case "stream": return { op: "stream" };
        case "sound": return { op: "sound", id: t.id, info: t.info };
        case "place": {
          const p = { op: "place", depth: t.depth };
          if (t.move) p.move = true;
          if (t.charId !== undefined) p.charId = t.charId;
          if (t.matrix) p.m = M(t.matrix);
          if (t.cxform) p.cx = CX(t.cxform);
          if (t.ratio !== undefined) p.ratio = t.ratio;
          if (t.name !== undefined) p.name = t.name;
          if (t.clipDepth !== undefined) p.clipDepth = t.clipDepth;
          if (t.clipActions) p.clipActions = t.clipActions.map((ca) => {
            const ev = EVENTS.filter(([f]) => ca.flags & f).map(([, n]) => n);
            const base = `${tl === 0 ? "root" : `sprite${tl}`}_f${fi + 1}_${t.name ? t.name.replace(/\W/g, "_") : `depth${t.depth}`}_${ev.join("_")}`;
            return { flags: ca.flags, key: ca.key || undefined, script: addScript(base, `onClipEvent/on(${ev.join(", ")}) on ${t.name ? `instance "${t.name}"` : `depth ${t.depth}`} (${where})`, ca.bytes) };
          });
          return p;
        }
        default: throw new Error("op " + t.op);
      }
    });
  });

  // dictionary → render data
  const dict = {}; const media = [];
  const fillOut = (f) => f.type === "solid" ? { t: "s", c: f.color } : f.type === "bitmap" ? { t: "b", id: f.id, m: M(f.matrix), rep: f.repeat, sm: f.smooth } : { t: f.type === "linear" ? "l" : "r", m: M(f.matrix), s: f.stops.map((s) => [s.ratio, ...s.color]) };
  const morphFill = (f) => f.type === "solid" ? { t: "s", c: f.color } : f.type === "bitmap" ? { t: "b", id: f.id, m: f.matrix.map(M), rep: f.repeat, sm: f.smooth } : { t: f.type === "linear" ? "l" : "r", m: f.matrix.map(M), s: f.stops.map((s) => [s.ratio, s.color]) };
  const ids = Object.keys(swf.dict).map(Number).sort((a, b) => a - b);
  for (const cid of ids) {
    const d = swf.dict[cid];
    switch (d.kind) {
      case "shape": dict[cid] = { kind: "shape", bounds: d.bounds, draws: d.draws.map((x) => (x.fill ? { fill: fillOut(x.fill), path: x.path } : { line: { w: x.line.width, c: x.line.color }, path: x.path })) }; break;
      case "morph": dict[cid] = { kind: "morph", sb: d.startBounds, eb: d.endBounds, fills: d.fills.map(morphFill), lines: d.lines.map((l) => ({ w: l.width, c: l.color })), edges: d.edges.map((e) => [...e.s.flat(), ...e.e.flat(), e.straight ? 1 : 0]), fillLoops: d.fillLoops, lineSegs: d.lineSegs }; break;
      case "font": dict[cid] = { kind: "font", name: d.name, bold: d.bold, italic: d.italic, em: d.em, glyphs: d.glyphs, codes: d.codes, advances: d.advances, ascent: d.ascent, descent: d.descent, leading: d.leading }; break;
      case "text": dict[cid] = { kind: "text", bounds: d.bounds, m: M(d.matrix), runs: d.runs.map((r) => ({ f: r.font, h: r.height, c: r.color, y: r.y, g: r.glyphs, str: r.glyphs.map(([gi]) => String.fromCharCode(swf.dict[r.font]?.codes?.[gi] ?? 63)).join("") })) }; break;
      case "edittext": { const { id: _i, ...rest } = d; dict[cid] = rest; break; }
      case "bitmap": { const r = convertBitmap(cid, d, swf.jpegTables); for (const f of r.files) media.push(f); dict[cid] = { kind: "bitmap", src: `media/${r.src}`, alpha: r.alpha ? `media/${r.alpha}` : undefined, w: r.width, h: r.height }; break; }
      case "sound": { const f = convertEventSound(cid, d); media.push(f); dict[cid] = { kind: "sound", src: `media/${f.name}` }; break; }
      case "button": {
        dict[cid] = { kind: "button", records: d.records.map((r) => ({ states: r.states, charId: r.charId, depth: r.depth, m: M(r.matrix), cx: CX(r.cxform) })), sounds: swf.buttonSounds[cid] ?? undefined };
        const placed = instNames[cid]?.slice(0, 3).join("; ") ?? "not placed on a timeline";
        dict[cid].conds = d.conds.map((c) => {
          const names = CONDS.filter(([f]) => c.b0 & f).map(([, n]) => n); if (c.b1 & 1) names.push("releaseOutsideIdle"); if (c.b1 >> 1) names.push(`keyPress${c.b1 >> 1}`);
          return { b0: c.b0, b1: c.b1, script: addScript(`button${cid}_${names.join("_") || "cond"}`, `on(${names.join(", ")}) for button #${cid} (placed as ${placed})`, c.bytes) };
        });
        break;
      }
      case "sprite": break; // converted below (needs script naming order)
      default: break;
    }
  }
  const root = { frameCount: swf.frameCount, frames: convTimeline(swf.root.frames, 0), labels: swf.root.labels };
  for (const cid of ids) { const d = swf.dict[cid]; if (d.kind === "sprite") dict[cid] = { kind: "sprite", frameCount: d.frameCount, frames: convTimeline(d.frames, cid), labels: d.labels }; }
  const streams = [];
  for (const [k, st] of swf.streams.entries()) { const r = convertStream(st, `stream${k}_tl${st.timeline}`); if (!r) continue; media.push(r.file); streams.push({ timeline: st.timeline, src: `media/${r.file.name}`, rate: r.rate, frames: r.frames, samples: r.samples }); }
  for (const f of media) writeFileSync(join(outDir, "media", f.name), f.data);
  let spanish;
  if (spanishAudio && existsSync(spanishAudio)) { copyFileSync(spanishAudio, join(outDir, "media", "spanish.mp3")); spanish = "media/spanish.mp3"; }

  const data = {
    schema: "hfr-page/1", compiler: COMPILER_VERSION, placement, source: { path: sourceRel, sha256, bytes: file.length, swfVersion: swf.version },
    stage: { width: (swf.rect.xmax - swf.rect.xmin) / 20, height: (swf.rect.ymax - swf.rect.ymin) / 20, fps: swf.frameRate, background: swf.background },
    module: `${id}.js`, dictionary: dict, root, exports: swf.exports, streams, spanishAudio: spanish,
    stats: { scripts: scripts.length, codeBodies: blocks, fallbackBodies: fallbacks, characters: ids.length, mediaFiles: media.length },
  };
  writeFileSync(join(outDir, `${id}.data.json`), JSON.stringify(data));
  writeFileSync(join(outDir, `${id}.bytecode.json`), JSON.stringify({ schema: "hfr-bytecode/1", note: "Original AVM1 bytecode per script, kept only for differential verification.", scripts: bytecode }));
  writeFileSync(join(outDir, `${id}.ts`), emitModule({ id, placement, sourceRel, sha256, swf, scripts, helpers, runtimeRel, fallbacks, blocks }));
  return { id, sha256, scripts: scripts.length, blocks, fallbacks, media: media.length };
}

function emitModule({ id, placement, sourceRel, sha256, swf, scripts, helpers, runtimeRel, fallbacks, blocks }) {
  const h = [...helpers].sort();
  const head = [
    "/**",
    ` * HELP Math 2.0 · HFR page module · ${id}`,
    ` * ${placement.lessonTitle ?? ""} · ${placement.sectionName ?? placement.sectionCode} · ${placement.titleEnglish ?? ""}`.replace(/ · $/, ""),
    " *",
    ` * Source: ${sourceRel} (SWF ${swf.version}, sha256 ${sha256.slice(0, 16)}…)`,
    ` * Generated by ${COMPILER_VERSION}. The page logic below is translated automatically`,
    " * from the original ActionScript bytecode. Drawings, timelines and text are in",
    ` * ${id}.data.json. Do not edit by hand: regenerate, or add a reviewed overlay.`,
    ` * Code bodies: ${blocks}; structured: ${blocks - fallbacks}; explicit-stack fallback: ${fallbacks}.`,
    " */",
    `import type { Helpers, PageScripts } from "${runtimeRel}/types";`,
    "",
    "export default function page(h: Helpers): PageScripts {",
    h.length ? `  const { ${h.join(", ")} } = h;` : "  void h;",
    "  return {",
  ];
  const body = scripts.map((s) => [`    /** ${s.doc} */`, `    ${s.name}: ($, $$) => {`, s.code, "    },"].join("\n"));
  return [...head, ...body, "  };", "}", ""].join("\n");
}
