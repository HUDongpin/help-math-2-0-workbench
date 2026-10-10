// HFR feasibility spike: minimal SWF 6/7 parser (headless).
// Parses only what a display-list + AVM1 runtime needs. Shapes, fonts and
// sounds are recorded as opaque definitions with their bounds.
import { inflateSync } from "node:zlib";

class Bits {
  constructor(buf, pos) { this.buf = buf; this.pos = pos; this.bit = 0; }
  ub(n) {
    let v = 0;
    for (let i = 0; i < n; i++) {
      const byte = this.buf[this.pos];
      v = v * 2 + ((byte >> (7 - this.bit)) & 1);
      if (++this.bit === 8) { this.bit = 0; this.pos++; }
    }
    return v;
  }
  sb(n) { if (n === 0) return 0; const v = this.ub(n); return v >= 2 ** (n - 1) ? v - 2 ** n : v; }
  fb(n) { return this.sb(n) / 65536; }
  align() { if (this.bit) { this.bit = 0; this.pos++; } return this.pos; }
}

export function readRect(buf, pos) {
  const b = new Bits(buf, pos); const n = b.ub(5);
  const r = { xmin: b.sb(n), xmax: b.sb(n), ymin: b.sb(n), ymax: b.sb(n) };
  return [r, b.align()];
}
function readMatrix(buf, pos) {
  const b = new Bits(buf, pos); const m = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
  if (b.ub(1)) { const n = b.ub(5); m.a = b.fb(n); m.d = b.fb(n); }
  if (b.ub(1)) { const n = b.ub(5); m.b = b.fb(n); m.c = b.fb(n); }
  const n = b.ub(5); m.tx = b.sb(n); m.ty = b.sb(n);
  return [m, b.align()];
}
function readCxform(buf, pos, alpha) {
  const b = new Bits(buf, pos); const hasAdd = b.ub(1), hasMult = b.ub(1), n = b.ub(4);
  const c = { rm: 256, gm: 256, bm: 256, am: 256, ra: 0, ga: 0, ba: 0, aa: 0 };
  if (hasMult) { c.rm = b.sb(n); c.gm = b.sb(n); c.bm = b.sb(n); if (alpha) c.am = b.sb(n); }
  if (hasAdd) { c.ra = b.sb(n); c.ga = b.sb(n); c.ba = b.sb(n); if (alpha) c.aa = b.sb(n); }
  return [c, b.align()];
}
function cstr(buf, pos) { const e = buf.indexOf(0, pos); return [buf.toString("latin1", pos, e), e + 1]; }

export function parseSwf(file) {
  const sig = file.toString("latin1", 0, 3);
  const version = file[3];
  let body;
  if (sig === "CWS") body = inflateSync(file.subarray(8));
  else if (sig === "FWS") body = file.subarray(8);
  else throw new Error("unsupported signature " + sig);
  const [rect, p0] = readRect(body, 0);
  const frameRate = body[p0 + 1] + body[p0] / 256;
  const frameCount = body.readUInt16LE(p0 + 2);
  const dict = new Map();
  const exports = new Map();
  const initActions = [];
  const stats = { streamBlocks: 0, sounds: 0, morphs: 0 };
  const root = { kind: "sprite", id: 0, frameCount, frames: parseTimeline(body, p0 + 4, body.length, true) };

  function parseTimeline(buf, pos, end, isRoot) {
    const frames = [[]]; const labels = {};
    while (pos < end) {
      const h = buf.readUInt16LE(pos); pos += 2;
      const code = h >> 6; let len = h & 0x3f;
      if (len === 0x3f) { len = buf.readUInt32LE(pos); pos += 4; }
      const t = pos; pos += len;
      const cur = frames[frames.length - 1];
      switch (code) {
        case 0: return finish();
        case 1: frames.push([]); break;
        case 12: cur.push({ op: "action", bytes: buf.subarray(t, t + len) }); break;
        case 59: {
          const spriteId = buf.readUInt16LE(t);
          const rec = { op: "init", spriteId, bytes: buf.subarray(t + 2, t + len) };
          cur.push(rec); initActions.push(rec); break;
        }
        case 43: { const [name] = cstr(buf, t); cur.push({ op: "label", name }); labels[name.toLowerCase()] = frames.length; break; }
        case 26: cur.push(parsePlace2(buf, t, t + len)); break;
        case 5: cur.push({ op: "remove", depth: buf.readUInt16LE(t + 2) }); break;
        case 28: cur.push({ op: "remove", depth: buf.readUInt16LE(t) }); break;
        case 4: { const id = buf.readUInt16LE(t), depth = buf.readUInt16LE(t + 2); const [m] = readMatrix(buf, t + 4); cur.push({ op: "place", move: false, depth, charId: id, matrix: m }); break; }
        case 39: {
          const id = buf.readUInt16LE(t), fc = buf.readUInt16LE(t + 2);
          dict.set(id, { kind: "sprite", id, frameCount: fc, frames: parseTimeline(buf, t + 4, t + len, false) });
          break;
        }
        case 2: case 22: case 32: case 83: { const id = buf.readUInt16LE(t); const [r] = readRect(buf, t + 2); dict.set(id, { kind: "shape", id, bounds: r }); break; }
        case 46: case 84: { const id = buf.readUInt16LE(t); const [r] = readRect(buf, t + 2); dict.set(id, { kind: "morph", id, bounds: r }); stats.morphs++; break; }
        case 11: case 33: { const id = buf.readUInt16LE(t); const [r] = readRect(buf, t + 2); dict.set(id, { kind: "text", id, bounds: r }); break; }
        case 37: dict.set(buf.readUInt16LE(t), parseEditText(buf, t)); break;
        case 34: dict.set(buf.readUInt16LE(t), parseButton2(buf, t, t + len)); break;
        case 7: dict.set(buf.readUInt16LE(t), { kind: "button", id: buf.readUInt16LE(t), records: [], conds: [] }); break;
        case 6: case 21: case 35: case 20: case 36: case 90: dict.set(buf.readUInt16LE(t), { kind: "bitmap", id: buf.readUInt16LE(t) }); break;
        case 10: case 48: case 75: case 91: dict.set(buf.readUInt16LE(t), { kind: "font", id: buf.readUInt16LE(t) }); break;
        case 14: dict.set(buf.readUInt16LE(t), { kind: "sound", id: buf.readUInt16LE(t) }); stats.sounds++; break;
        case 19: stats.streamBlocks++; cur.push({ op: "stream" }); break;
        case 56: {
          let q = t; const n = buf.readUInt16LE(q); q += 2;
          for (let i = 0; i < n; i++) { const id = buf.readUInt16LE(q); q += 2; const [name, q2] = cstr(buf, q); q = q2; exports.set(name.toLowerCase(), id); }
          break;
        }
        default: break;
      }
    }
    return finish();
    function finish() {
      if (frames.length > 1 && frames[frames.length - 1].length === 0) frames.pop();
      frames.labels = labels; return frames;
    }
  }

  function parsePlace2(buf, t, end) {
    const f = buf[t]; let q = t + 1;
    const rec = { op: "place", move: !!(f & 1), depth: buf.readUInt16LE(q) }; q += 2;
    if (f & 0x02) { rec.charId = buf.readUInt16LE(q); q += 2; }
    if (f & 0x04) { [rec.matrix, q] = readMatrix(buf, q); }
    if (f & 0x08) { [rec.cxform, q] = readCxform(buf, q, true); }
    if (f & 0x10) { rec.ratio = buf.readUInt16LE(q); q += 2; }
    if (f & 0x20) { [rec.name, q] = cstr(buf, q); }
    if (f & 0x40) { rec.clipDepth = buf.readUInt16LE(q); q += 2; }
    if (f & 0x80) {
      q += 2; // reserved
      const wide = version >= 6;
      q += wide ? 4 : 2; // all event flags
      rec.clipActions = [];
      while (q < end) {
        const flags = wide ? buf.readUInt32LE(q) : buf.readUInt16LE(q); q += wide ? 4 : 2;
        if (flags === 0) break;
        const size = buf.readUInt32LE(q); q += 4;
        let key = 0, aStart = q;
        if (flags & 0x20000) { key = buf[q]; aStart = q + 1; }
        rec.clipActions.push({ flags, key, bytes: buf.subarray(aStart, q + size) });
        q += size;
      }
    }
    return rec;
  }

  function parseEditText(buf, t) {
    const id = buf.readUInt16LE(t); let [bounds, q] = readRect(buf, t + 2);
    const f1 = buf[q], f2 = buf[q + 1]; q += 2;
    const rec = { kind: "edittext", id, bounds, html: !!(f2 & 0x02), readOnly: !!(f1 & 0x08), multiline: !!(f1 & 0x20) };
    if (f1 & 0x01) { rec.fontId = buf.readUInt16LE(q); q += 2; }
    if (f2 & 0x80) { [, q] = cstr(buf, q); }
    if (f1 & 0x01) { rec.fontHeight = buf.readUInt16LE(q); q += 2; }
    if (f1 & 0x04) { rec.color = buf.readUInt32BE(q); q += 4; }
    if (f1 & 0x02) { rec.maxLength = buf.readUInt16LE(q); q += 2; }
    if (f2 & 0x20) { q += 9; }
    [rec.variable, q] = cstr(buf, q);
    if (f1 & 0x80) { [rec.initialText, q] = cstr(buf, q); }
    return rec;
  }

  function parseButton2(buf, t, end) {
    const id = buf.readUInt16LE(t); const trackAsMenu = !!(buf[t + 2] & 1);
    const actionOffset = buf.readUInt16LE(t + 3); let q = t + 5;
    const records = [];
    while (q < end && buf[q] !== 0) {
      const f = buf[q]; q++;
      const r = { states: f & 0x0f, charId: buf.readUInt16LE(q), depth: buf.readUInt16LE(q + 2) }; q += 4;
      [r.matrix, q] = readMatrix(buf, q);
      [r.cxform, q] = readCxform(buf, q, true);
      if (f & 0x10) { const n = buf[q]; q++; for (let i = 0; i < n; i++) q += filterLen(buf, q); }
      if (f & 0x20) q++;
      records.push(r);
    }
    const conds = [];
    if (actionOffset) {
      q = t + 3 + actionOffset;
      while (q < end) {
        const size = buf.readUInt16LE(q);
        const b0 = buf[q + 2], b1 = buf[q + 3];
        conds.push({ b0, b1, key: b1 >> 1, bytes: buf.subarray(q + 4, size ? q + size : end) });
        if (!size) break; q += size;
      }
    }
    return { kind: "button", id, trackAsMenu, records, conds };
  }
  function filterLen() { throw new Error("button filters (SWF8) not supported in spike"); }

  return { version, frameRate, frameCount, rect, dict, exports, initActions, root, stats };
}
