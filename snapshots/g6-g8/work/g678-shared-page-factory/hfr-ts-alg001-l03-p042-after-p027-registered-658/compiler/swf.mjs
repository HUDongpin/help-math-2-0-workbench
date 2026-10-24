// hfr-compile: full SWF 6/7 parser (AVM1 subset used by HELP Math 1.0).
// Produces a structured, JSON-friendly description of the movie. Unsupported
// tags are recorded in `unsupported` so callers can fail closed.
import { inflateSync } from "node:zlib";

class Bits {
  constructor(buf, pos) { this.buf = buf; this.pos = pos; this.bit = 0; }
  ub(n) {
    let v = 0;
    for (let i = 0; i < n; i++) {
      v = v * 2 + ((this.buf[this.pos] >> (7 - this.bit)) & 1);
      if (++this.bit === 8) { this.bit = 0; this.pos++; }
    }
    return v;
  }
  sb(n) { if (n === 0) return 0; const v = this.ub(n); return v >= 2 ** (n - 1) ? v - 2 ** n : v; }
  fb(n) { return this.sb(n) / 65536; }
  align() { if (this.bit) { this.bit = 0; this.pos++; } return this.pos; }
  u8() { this.align(); return this.buf[this.pos++]; }
  u16() { this.align(); const v = this.buf.readUInt16LE(this.pos); this.pos += 2; return v; }
  s16() { this.align(); const v = this.buf.readInt16LE(this.pos); this.pos += 2; return v; }
  u32() { this.align(); const v = this.buf.readUInt32LE(this.pos); this.pos += 4; return v; }
  rect() { this.align(); const n = this.ub(5); const r = { xmin: this.sb(n), xmax: this.sb(n), ymin: this.sb(n), ymax: this.sb(n) }; this.align(); return r; }
  matrix() {
    this.align(); const m = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    if (this.ub(1)) { const n = this.ub(5); m.a = this.fb(n); m.d = this.fb(n); }
    if (this.ub(1)) { const n = this.ub(5); m.b = this.fb(n); m.c = this.fb(n); }
    const n = this.ub(5); m.tx = this.sb(n); m.ty = this.sb(n);
    this.align(); return m;
  }
  cxform(alpha) {
    this.align(); const hasAdd = this.ub(1), hasMult = this.ub(1), n = this.ub(4);
    const c = { rm: 256, gm: 256, bm: 256, am: 256, ra: 0, ga: 0, ba: 0, aa: 0 };
    if (hasMult) { c.rm = this.sb(n); c.gm = this.sb(n); c.bm = this.sb(n); if (alpha) c.am = this.sb(n); }
    if (hasAdd) { c.ra = this.sb(n); c.ga = this.sb(n); c.ba = this.sb(n); if (alpha) c.aa = this.sb(n); }
    this.align(); return c;
  }
  rgb() { this.align(); const r = this.buf[this.pos], g = this.buf[this.pos + 1], b = this.buf[this.pos + 2]; this.pos += 3; return [r, g, b, 255]; }
  rgba() { this.align(); const v = [this.buf[this.pos], this.buf[this.pos + 1], this.buf[this.pos + 2], this.buf[this.pos + 3]]; this.pos += 4; return v; }
  str() { this.align(); const e = this.buf.indexOf(0, this.pos); const s = this.buf.toString("latin1", this.pos, e); this.pos = e + 1; return s; }
}

// ---------------------------------------------------------------- shapes
function readFillStyles(b, shapeVer, morph) {
  let n = b.u8(); if (n === 0xff && (shapeVer >= 2 || morph)) n = b.u16();
  const out = [];
  for (let i = 0; i < n; i++) out.push(readFillStyle(b, shapeVer, morph));
  return out;
}
function readFillStyle(b, shapeVer, morph) {
  const type = b.u8();
  const col = () => (morph ? [b.rgba(), b.rgba()] : shapeVer >= 3 ? b.rgba() : b.rgb());
  if (type === 0x00) return { type: "solid", color: col() };
  if (type === 0x10 || type === 0x12 || type === 0x13) {
    const matrix = morph ? [b.matrix(), b.matrix()] : b.matrix();
    let stops;
    if (morph) {
      const n = b.u8(); stops = [];
      for (let i = 0; i < n; i++) { const r0 = b.u8(), c0 = b.rgba(), r1 = b.u8(), c1 = b.rgba(); stops.push({ ratio: [r0, r1], color: [c0, c1] }); }
    } else {
      b.align(); const spread = b.ub(2), interp = b.ub(2), n = b.ub(4); stops = [];
      for (let i = 0; i < n; i++) { const r = b.u8(); stops.push({ ratio: r, color: shapeVer >= 3 ? b.rgba() : b.rgb() }); }
      void spread; void interp;
    }
    const g = { type: type === 0x10 ? "linear" : "radial", matrix, stops };
    if (type === 0x13) g.focal = b.s16() / 256;
    return g;
  }
  if (type >= 0x40 && type <= 0x43) {
    const id = b.u16(); const matrix = morph ? [b.matrix(), b.matrix()] : b.matrix();
    return { type: "bitmap", id, matrix, repeat: type === 0x40 || type === 0x42, smooth: type === 0x40 || type === 0x41 };
  }
  throw new Error("unknown fill style type 0x" + type.toString(16));
}
function readLineStyles(b, shapeVer, morph) {
  let n = b.u8(); if (n === 0xff) n = b.u16();
  const out = [];
  for (let i = 0; i < n; i++) {
    if (morph) { const w0 = b.u16(), w1 = b.u16(), c0 = b.rgba(), c1 = b.rgba(); out.push({ width: [w0, w1], color: [c0, c1] }); continue; }
    const width = b.u16();
    if (shapeVer === 4) {
      b.align(); b.ub(2); const join = b.ub(2); const hasFill = b.ub(1); b.ub(3); b.ub(5); b.ub(1); b.ub(2);
      if (join === 2) b.u16();
      if (hasFill) { const f = readFillStyle(b, 4, false); out.push({ width, color: f.color ?? [0, 0, 0, 255] }); }
      else out.push({ width, color: b.rgba() });
    } else out.push({ width, color: shapeVer >= 3 ? b.rgba() : b.rgb() });
  }
  return out;
}
// Reads shape records. Returns a flat list of records with absolute coordinates.
function readShapeRecords(b, shapeVer, nFill, nLine, styleGroupCb) {
  const recs = []; let x = 0, y = 0;
  for (;;) {
    const type = b.ub(1);
    if (type === 0) {
      const newStyles = b.ub(1), line = b.ub(1), fill1 = b.ub(1), fill0 = b.ub(1), move = b.ub(1);
      if (!newStyles && !line && !fill1 && !fill0 && !move) break;
      const r = { t: "style" };
      if (move) { const n = b.ub(5); x = b.sb(n); y = b.sb(n); r.move = [x, y]; }
      if (fill0) r.fill0 = b.ub(nFill);
      if (fill1) r.fill1 = b.ub(nFill);
      if (line) r.line = b.ub(nLine);
      if (newStyles) {
        const ns = styleGroupCb(b);
        r.newStyles = ns.group; nFill = ns.nFill; nLine = ns.nLine;
      }
      recs.push(r);
    } else {
      const straight = b.ub(1); const nb = b.ub(4) + 2;
      if (straight) {
        let dx = 0, dy = 0;
        if (b.ub(1)) { dx = b.sb(nb); dy = b.sb(nb); }
        else if (b.ub(1)) dy = b.sb(nb); else dx = b.sb(nb);
        const x0 = x, y0 = y; x += dx; y += dy;
        recs.push({ t: "line", from: [x0, y0], to: [x, y] });
      } else {
        const cx = b.sb(nb), cy = b.sb(nb), ax = b.sb(nb), ay = b.sb(nb);
        const x0 = x, y0 = y; const c = [x + cx, y + cy]; x = c[0] + ax; y = c[1] + ay;
        recs.push({ t: "curve", from: [x0, y0], ctrl: c, to: [x, y] });
      }
    }
  }
  b.align();
  return recs;
}

// Turn records into fill loops + line paths (the classic fill0/fill1 edge assembly).
export function buildShapeDraws(recs, firstGroup) {
  const groups = [firstGroup]; let g = 0;
  const fillEdges = new Map(); const lineEdges = new Map(); // key "g:idx" -> edges
  let fill0 = 0, fill1 = 0, line = 0;
  const add = (map, key, e) => { if (!map.has(key)) map.set(key, []); map.get(key).push(e); };
  for (const r of recs) {
    if (r.t === "style") {
      if (r.newStyles) { groups.push(r.newStyles); g = groups.length - 1; fill0 = fill1 = line = 0; }
      if (r.fill0 !== undefined) fill0 = r.fill0;
      if (r.fill1 !== undefined) fill1 = r.fill1;
      if (r.line !== undefined) line = r.line;
      if (r.move) add(lineEdges, `${g}:${line}`, { move: true, to: r.move });
      continue;
    }
    if (fill1) add(fillEdges, `${g}:${fill1}`, r);
    if (fill0) add(fillEdges, `${g}:${fill0}`, reverseEdge(r));
    if (line) add(lineEdges, `${g}:${line}`, r);
  }
  const draws = [];
  groups.forEach((grp, gi) => {
    grp.fills.forEach((fs, i) => { const edges = fillEdges.get(`${gi}:${i + 1}`); if (edges) draws.push({ fill: fs, path: loopsToPath(connectLoops(edges)) }); });
    grp.lines.forEach((ls, i) => { const edges = lineEdges.get(`${gi}:${i + 1}`); if (edges) { const p = strokePath(edges); if (p) draws.push({ line: ls, path: p }); } });
  });
  return draws;
}
function reverseEdge(e) { return e.t === "line" ? { t: "line", from: e.to, to: e.from } : { t: "curve", from: e.to, ctrl: e.ctrl, to: e.from }; }
const key = (p) => p[0] + "," + p[1];
function connectLoops(edges) {
  const byStart = new Map();
  edges.forEach((e, i) => { const k = key(e.from); if (!byStart.has(k)) byStart.set(k, []); byStart.get(k).push(i); });
  const used = new Uint8Array(edges.length); const loops = [];
  for (let i = 0; i < edges.length; i++) {
    if (used[i]) continue;
    const loop = []; let cur = i;
    while (cur !== undefined && !used[cur]) {
      used[cur] = 1; loop.push(edges[cur]);
      const endK = key(edges[cur].to);
      if (endK === key(edges[i].from)) break;
      const cands = byStart.get(endK); cur = cands?.find((j) => !used[j]);
    }
    loops.push(loop);
  }
  return loops;
}
// Compact relative SVG path data (Path2D accepts it directly).
function nums(arr) { let s = ""; for (const n of arr) s += (s && n >= 0 ? " " : "") + n; return s; }
class PathWriter {
  constructor() { this.s = ""; this.x = 0; this.y = 0; this.started = false; }
  move(p) { this.s += "m" + nums(this.started ? [p[0] - this.x, p[1] - this.y] : [p[0], p[1]]); this.x = p[0]; this.y = p[1]; this.started = true; this.sx = p[0]; this.sy = p[1]; }
  edge(e) {
    if (e.t === "line") this.s += "l" + nums([e.to[0] - this.x, e.to[1] - this.y]);
    else this.s += "q" + nums([e.ctrl[0] - this.x, e.ctrl[1] - this.y, e.to[0] - this.x, e.to[1] - this.y]);
    this.x = e.to[0]; this.y = e.to[1];
  }
  close() { this.s += "z"; this.x = this.sx; this.y = this.sy; }
}
function loopsToPath(loops) {
  const w = new PathWriter();
  for (const loop of loops) { if (!loop.length) continue; w.move(loop[0].from); for (const e of loop) w.edge(e); w.close(); }
  return w.s;
}
function strokePath(edges) {
  // Start every stroke at its first point and move whenever the pen jumps.
  const w = new PathWriter();
  for (const e of edges) {
    if (e.move) continue;
    if (!w.started || w.x !== e.from[0] || w.y !== e.from[1]) w.move(e.from);
    w.edge(e);
  }
  return w.s;
}

function parseShape(buf, t, end, code) {
  const shapeVer = code === 2 ? 1 : code === 22 ? 2 : code === 32 ? 3 : 4;
  const b = new Bits(buf, t);
  const id = b.u16(); const bounds = b.rect();
  if (shapeVer === 4) { b.rect(); b.u8(); }
  const fills = readFillStyles(b, shapeVer, false); const lines = readLineStyles(b, shapeVer, false);
  b.align(); const nFill = b.ub(4), nLine = b.ub(4);
  const recs = readShapeRecords(b, shapeVer, nFill, nLine, (bb) => {
    const f = readFillStyles(bb, shapeVer, false), l = readLineStyles(bb, shapeVer, false); bb.align();
    return { group: { fills: f, lines: l }, nFill: bb.ub(4), nLine: bb.ub(4) };
  });
  return { kind: "shape", id, bounds, draws: buildShapeDraws(recs, { fills, lines }) };
}

// Morph shapes: pair start/end edges, assemble topology from the start edges.
function parseMorph(buf, t, end) {
  const b = new Bits(buf, t);
  const id = b.u16(); const startBounds = b.rect(), endBounds = b.rect();
  const offset = b.u32(); const endEdgesPos = b.pos + offset;
  const fills = readFillStyles(b, 3, true), lines = readLineStyles(b, 3, true);
  b.align(); const nFill = b.ub(4), nLine = b.ub(4);
  const startRecs = readShapeRecords(b, 3, nFill, nLine, () => { throw new Error("new styles in morph"); });
  const be = new Bits(buf, endEdgesPos); be.align(); const ef = be.ub(4), el = be.ub(4);
  const endRecs = readShapeRecords(be, 3, ef, el, () => { throw new Error("new styles in morph end"); });
  // pair edges
  const edges = []; const startOrder = []; let ei = 0; let endPen = [0, 0];
  const endEdgeList = endRecs; const nextEnd = () => {
    while (ei < endEdgeList.length) { const r = endEdgeList[ei++]; if (r.t === "style") { if (r.move) endPen = r.move; continue; } return r; }
    return null;
  };
  for (const r of startRecs) {
    if (r.t === "style") { startOrder.push(r); if (r.move) { const peek = endEdgeList[ei]; if (peek && peek.t === "style" && peek.move) { endPen = peek.move; ei++; } } continue; }
    const er = nextEnd() ?? { t: "line", from: endPen, to: endPen };
    const s = r.t === "curve" ? r : { t: "curve", from: r.from, ctrl: mid(r.from, r.to), to: r.to };
    const e = er.t === "curve" ? er : { t: "curve", from: er.from, ctrl: mid(er.from, er.to), to: er.to };
    const idx = edges.length; edges.push({ s: [s.from, s.ctrl, s.to], e: [e.from, e.ctrl, e.to], straight: r.t === "line" && er.t === "line" });
    startOrder.push({ t: "edge", idx, from: r.from, to: r.to });
  }
  // topology from start edges
  const fillLoops = fills.map(() => []); const lineSegs = lines.map(() => []);
  let f0 = 0, f1 = 0, ln = 0; const fillEdgeLists = fills.map(() => []);
  for (const r of startOrder) {
    if (r.t !== "edge") { if (r.fill0 !== undefined) f0 = r.fill0; if (r.fill1 !== undefined) f1 = r.fill1; if (r.line !== undefined) ln = r.line; continue; }
    if (f1) fillEdgeLists[f1 - 1].push({ idx: r.idx, rev: false, from: r.from, to: r.to });
    if (f0) fillEdgeLists[f0 - 1].push({ idx: r.idx, rev: true, from: r.to, to: r.from });
    if (ln) lineSegs[ln - 1].push(r.idx);
  }
  fillEdgeLists.forEach((list, fi) => {
    const loops = connectLoops(list.map((x) => ({ ...x, t: "line" })));
    fillLoops[fi] = loops.map((loop) => loop.map((x) => (x.rev ? -(x.idx + 1) : x.idx + 1)));
  });
  return { kind: "morph", id, startBounds, endBounds, fills, lines, edges, fillLoops, lineSegs };
}
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

// ---------------------------------------------------------------- fonts & text
function parseFont2(buf, t, end, code) {
  const b = new Bits(buf, t);
  const id = b.u16(); const flags = b.u8(); b.u8();
  const name = buf.toString("latin1", b.pos + 1, b.pos + 1 + buf[b.pos]).replace(/\0+$/, ""); b.pos += 1 + buf[b.pos];
  const n = b.u16(); const wide = !!(flags & 0x08); const tableStart = b.pos;
  const offsets = []; for (let i = 0; i < n; i++) offsets.push(wide ? b.u32() : b.u16());
  const codeTableOffset = wide ? b.u32() : b.u16();
  const glyphs = [];
  for (let i = 0; i < n; i++) {
    const gb = new Bits(buf, tableStart + offsets[i]); gb.align(); const nf = gb.ub(4), nl = gb.ub(4);
    const recs = readShapeRecords(gb, 1, nf, nl, () => { throw new Error("styles in glyph"); });
    const draws = buildShapeDraws(recs, { fills: [{ type: "solid", color: [0, 0, 0, 255] }], lines: [] });
    glyphs.push(draws.map((d) => d.path).join(""));
  }
  b.pos = tableStart + codeTableOffset;
  const codes = []; for (let i = 0; i < n; i++) codes.push(flags & 0x04 ? b.u16() : b.u8());
  const font = { kind: "font", id, name, bold: !!(flags & 1), italic: !!(flags & 2), em: code === 75 ? 20480 : 1024, glyphs, codes };
  if (flags & 0x80) {
    font.ascent = b.u16(); font.descent = b.u16(); font.leading = b.s16();
    font.advances = []; for (let i = 0; i < n; i++) font.advances.push(b.s16());
  }
  return font;
}
function parseText(buf, t, end, code) {
  const b = new Bits(buf, t);
  const id = b.u16(); const bounds = b.rect(); const matrix = b.matrix();
  const gBits = b.u8(), aBits = b.u8();
  const runs = []; let font = 0, color = [0, 0, 0, 255], x = 0, y = 0, height = 0;
  for (;;) {
    const f = b.u8(); if (f === 0) break;
    if (f & 0x08) font = b.u16();
    if (f & 0x04) color = code === 33 ? b.rgba() : b.rgb();
    if (f & 0x01) x = b.s16();
    if (f & 0x02) y = b.s16();
    if (f & 0x08) height = b.u16();
    const n = b.u8(); const glyphs = [];
    for (let i = 0; i < n; i++) { const gi = b.ub(gBits); const adv = b.sb(aBits); glyphs.push([gi, x]); x += adv; }
    b.align();
    runs.push({ font, height, color, y, glyphs });
  }
  return { kind: "text", id, bounds, matrix, runs };
}
function parseEditText(buf, t) {
  const b = new Bits(buf, t);
  const id = b.u16(); const bounds = b.rect(); const f1 = b.u8(), f2 = b.u8();
  const r = { kind: "edittext", id, bounds, wordWrap: !!(f1 & 0x40), multiline: !!(f1 & 0x20), password: !!(f1 & 0x10), readOnly: !!(f1 & 0x08), html: !!(f2 & 0x02), useOutlines: !!(f2 & 0x01), border: !!(f2 & 0x08), noSelect: !!(f2 & 0x10), autoSize: !!(f2 & 0x40) };
  if (f1 & 0x01) r.fontId = b.u16();
  if (f2 & 0x80) b.str();
  if (f1 & 0x01) r.fontHeight = b.u16();
  r.color = f1 & 0x04 ? b.rgba() : [0, 0, 0, 255];
  if (f1 & 0x02) r.maxLength = b.u16();
  if (f2 & 0x20) { r.align = ["left", "right", "center", "justify"][b.u8()] ?? "left"; r.leftMargin = b.u16(); r.rightMargin = b.u16(); r.indent = b.u16(); r.leading = b.s16(); }
  r.variable = b.str();
  if (f1 & 0x80) r.initialText = b.str();
  return r;
}

// ---------------------------------------------------------------- buttons, sounds
function parseButton2(buf, t, end) {
  const b = new Bits(buf, t);
  const id = b.u16(); const trackAsMenu = !!(b.u8() & 1); const actionOffset = b.u16(); const condStart = t + 3 + actionOffset;
  const records = [];
  while (b.pos < end && buf[b.pos] !== 0) {
    const f = b.u8(); const rec = { states: f & 0x0f, charId: b.u16(), depth: b.u16(), matrix: b.matrix(), cxform: b.cxform(true) };
    if (f & 0x10) throw new Error("button filters not supported");
    if (f & 0x20) b.u8();
    records.push(rec);
  }
  const conds = [];
  if (actionOffset) {
    let q = condStart;
    while (q < end) { const size = buf.readUInt16LE(q); conds.push({ b0: buf[q + 2], b1: buf[q + 3], bytes: buf.subarray(q + 4, size ? q + size : end) }); if (!size) break; q += size; }
  }
  return { kind: "button", id, trackAsMenu, records, conds };
}
function readSoundInfo(b) {
  const f = b.u8(); const info = { stop: !!(f & 0x20), noMultiple: !!(f & 0x10) };
  if (f & 0x01) info.inPoint = b.u32();
  if (f & 0x02) info.outPoint = b.u32();
  if (f & 0x04) info.loops = b.u16();
  if (f & 0x08) { const n = b.u8(); for (let i = 0; i < n; i++) { b.u32(); b.u16(); b.u16(); } }
  return info;
}

// ---------------------------------------------------------------- movie
export function parseSwf(file) {
  const sig = file.toString("latin1", 0, 3); const version = file[3];
  const body = sig === "CWS" ? inflateSync(file.subarray(8)) : sig === "FWS" ? file.subarray(8) : null;
  if (!body) throw new Error("unsupported signature " + sig);
  const hb = new Bits(body, 0); const rect = hb.rect(); const p0 = hb.pos;
  const frameRate = body[p0 + 1] + body[p0] / 256; const frameCount = body.readUInt16LE(p0 + 2);
  const dict = {}; const exports = {}; const unsupported = new Map(); let jpegTables = null; let background = [255, 255, 255, 255];
  const streams = []; // { timeline: id (0 = root), head, blocks: [{frame, data}] }
  const buttonSounds = {};

  function timeline(pos, end, tlId) {
    const frames = [[]]; const labels = {}; let stream = null;
    while (pos < end) {
      const h = body.readUInt16LE(pos); pos += 2; const code = h >> 6; let len = h & 0x3f;
      if (len === 0x3f) { len = body.readUInt32LE(pos); pos += 4; }
      const t = pos; pos += len; const cur = frames[frames.length - 1]; const b = new Bits(body, t);
      switch (code) {
        case 0: return done();
        case 1: frames.push([]); break;
        case 9: background = b.rgb(); break;
        case 43: { const name = b.str(); cur.push({ op: "label", name }); labels[name] = frames.length; break; }
        case 12: cur.push({ op: "action", bytes: body.subarray(t, t + len) }); break;
        case 59: cur.push({ op: "init", sprite: body.readUInt16LE(t), bytes: body.subarray(t + 2, t + len) }); break;
        case 26: cur.push(place2(b, t + len)); break;
        case 4: { const charId = b.u16(), depth = b.u16(); cur.push({ op: "place", move: false, depth, charId, matrix: b.matrix() }); break; }
        case 5: cur.push({ op: "remove", depth: body.readUInt16LE(t + 2) }); break;
        case 28: cur.push({ op: "remove", depth: body.readUInt16LE(t) }); break;
        case 39: { const id = b.u16(), fc = b.u16(); dict[id] = { kind: "sprite", id, frameCount: fc, ...timeline(b.pos, t + len, id) }; break; }
        case 2: case 22: case 32: case 83: { const s = parseShape(body, t, t + len, code); dict[s.id] = s; break; }
        case 46: { const m = parseMorph(body, t, t + len); dict[m.id] = m; break; }
        case 48: case 75: { const f = parseFont2(body, t, t + len, code); dict[f.id] = f; break; }
        case 11: case 33: { const x = parseText(body, t, t + len, code); dict[x.id] = x; break; }
        case 37: { const x = parseEditText(body, t); dict[x.id] = x; break; }
        case 34: { const x = parseButton2(body, t, t + len); dict[x.id] = x; break; }
        case 17: { const id = b.u16(); const s = []; for (let i = 0; i < 4; i++) { const sid = b.u16(); s.push(sid ? { id: sid, info: readSoundInfo(b) } : null); } buttonSounds[id] = s; break; }
        case 8: jpegTables = body.subarray(t, t + len); break;
        case 6: dict[b.u16()] = { kind: "bitmap", format: "jpeg-tables", data: body.subarray(t + 2, t + len) }; break;
        case 21: dict[b.u16()] = { kind: "bitmap", format: "jpeg", data: body.subarray(t + 2, t + len) }; break;
        case 35: { const id = b.u16(); const off = b.u32(); dict[id] = { kind: "bitmap", format: "jpeg-alpha", data: body.subarray(t + 6, t + 6 + off), alpha: body.subarray(t + 6 + off, t + len) }; break; }
        case 20: case 36: { const id = b.u16(); const fmt = b.u8(), w = b.u16(), hgt = b.u16(); const cts = fmt === 3 ? b.u8() : 0; dict[id] = { kind: "bitmap", format: "lossless", alpha: code === 36, bitmapFormat: fmt, width: w, height: hgt, colorTableSize: cts, data: body.subarray(b.pos, t + len) }; break; }
        case 14: { const id = b.u16(); b.align(); const fmt = b.ub(4), rate = b.ub(2), size = b.ub(1), stereo = b.ub(1); const samples = b.u32(); dict[id] = { kind: "sound", id, format: fmt, rate, size16: !!size, stereo: !!stereo, samples, data: body.subarray(b.pos, t + len) }; break; }
        case 15: { const id = b.u16(); cur.push({ op: "sound", id, info: readSoundInfo(b) }); break; }
        case 18: case 45: { b.u8(); b.align(); const fmt = b.ub(4), rate = b.ub(2), size = b.ub(1), stereo = b.ub(1); const spb = b.u16(); stream = { timeline: tlId, format: fmt, rate, size16: !!size, stereo: !!stereo, samplesPerBlock: spb, blocks: [] }; streams.push(stream); break; }
        case 19: if (stream) { stream.blocks.push({ frame: frames.length, data: body.subarray(t, t + len) }); cur.push({ op: "stream" }); } break;
        case 56: { const n = b.u16(); for (let i = 0; i < n; i++) { const id = b.u16(); exports[b.str()] = id; } break; }
        case 10: case 13: case 62: case 7: unsupported.set(code, (unsupported.get(code) || 0) + 1); break;
        case 24: case 69: case 77: case 41: case 63: case 64: case 58: case 73: case 88: case 74: case 65: break; // metadata, protection, font names, zones
        default: unsupported.set(code, (unsupported.get(code) || 0) + 1);
      }
    }
    return done();
    function done() { if (frames.length > 1 && frames[frames.length - 1].length === 0) frames.pop(); return { frames, labels }; }
  }
  function place2(b, end) {
    const f = b.u8(); const rec = { op: "place", move: !!(f & 1), depth: b.u16() };
    if (f & 0x02) rec.charId = b.u16();
    if (f & 0x04) rec.matrix = b.matrix();
    if (f & 0x08) rec.cxform = b.cxform(true);
    if (f & 0x10) rec.ratio = b.u16();
    if (f & 0x20) rec.name = b.str();
    if (f & 0x40) rec.clipDepth = b.u16();
    if (f & 0x80) {
      b.u16(); version >= 6 ? b.u32() : b.u16(); rec.clipActions = [];
      for (;;) {
        const flags = version >= 6 ? b.u32() : b.u16(); if (!flags) break;
        const size = b.u32(); const start = b.pos; let key = 0, aStart = start;
        if (flags & 0x20000) { key = body[start]; aStart = start + 1; }
        rec.clipActions.push({ flags, key, bytes: body.subarray(aStart, start + size) }); b.pos = start + size;
      }
    }
    return rec;
  }
  const root = { kind: "sprite", id: 0, frameCount, ...timeline(p0 + 4, body.length, 0) };
  return { version, frameRate, frameCount, rect, background, dict, exports, root, streams, buttonSounds, jpegTables, unsupported: Object.fromEntries(unsupported) };
}
