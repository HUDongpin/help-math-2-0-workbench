// HFR runtime · Canvas 2D renderer and geometry hit testing.
// Coordinates are SWF twips (1/20 px); the stage transform maps them to device pixels.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DisplayObject, MovieClip, ButtonObj, TextFieldObj, mul, invert, apply, type Matrix, type Runtime } from "./display";

type CX = number[]; // [rm, gm, bm, am, ra, ga, ba, aa] (multipliers are /256)
const IDCX: CX = [256, 256, 256, 256, 0, 0, 0, 0];
const combine = (p: CX, c: CX): CX => [(p[0] * c[0]) / 256, (p[1] * c[1]) / 256, (p[2] * c[2]) / 256, (p[3] * c[3]) / 256, (p[0] * c[4]) / 256 + p[4], (p[1] * c[5]) / 256 + p[5], (p[2] * c[6]) / 256 + p[6], (p[3] * c[7]) / 256 + p[7]];
const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
function color(c: number[], cx: CX): string {
  const r = clamp((c[0] * cx[0]) / 256 + cx[4]), g = clamp((c[1] * cx[1]) / 256 + cx[5]), b = clamp((c[2] * cx[2]) / 256 + cx[6]), a = clamp(((c[3] ?? 255) * cx[3]) / 256 + cx[7]);
  return `rgba(${r | 0},${g | 0},${b | 0},${(a / 255).toFixed(3)})`;
}
const toM = (m?: number[]): Matrix => (m ? { a: m[0], b: m[1], c: m[2], d: m[3], tx: m[4], ty: m[5] } : { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export class Renderer {
  ctx: CanvasRenderingContext2D; hitCtx: CanvasRenderingContext2D; base: Matrix = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
  paths = new Map<string, Path2D>(); images = new Map<string, HTMLCanvasElement | HTMLImageElement>(); pending = new Set<string>(); baseUrl: string; rt!: Runtime; scale = 1;
  constructor(public canvas: HTMLCanvasElement, baseUrl: string) {
    this.ctx = canvas.getContext("2d")!; this.baseUrl = baseUrl;
    const hc = document.createElement("canvas"); hc.width = hc.height = 1; this.hitCtx = hc.getContext("2d")!;
  }
  path(key: string, d: string): Path2D { let p = this.paths.get(key); if (!p) { p = new Path2D(d); this.paths.set(key, p); } return p; }
  async preload(page: any): Promise<void> {
    const jobs: Promise<void>[] = [];
    for (const [id, d] of Object.entries<any>(page.dictionary)) if (d.kind === "bitmap") jobs.push(this.loadBitmap(id, d));
    await Promise.all(jobs);
  }
  async loadBitmap(id: string, d: any): Promise<void> {
    const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = this.baseUrl + src; });
    try {
      const img = await load(d.src);
      if (!d.alpha) { this.images.set(id, img); return; }
      const a = await load(d.alpha); const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const x = c.getContext("2d")!; x.drawImage(img, 0, 0); const px = x.getImageData(0, 0, c.width, c.height);
      const ac = document.createElement("canvas"); ac.width = a.width; ac.height = a.height; const ax = ac.getContext("2d")!; ax.drawImage(a, 0, 0); const ap = ax.getImageData(0, 0, a.width, a.height).data;
      for (let i = 0; i < px.data.length; i += 4) px.data[i + 3] = ap[i];
      x.putImageData(px, 0, 0); this.images.set(id, c);
    } catch { /* missing bitmap: drawn as empty */ }
  }

  // ---------------------------------------------------------------- frame
  render(rt: Runtime): void {
    this.rt = rt; const { canvas, ctx } = this;
    const sw = rt.page.stage.width * 20, sh = rt.page.stage.height * 20;
    this.scale = Math.min(canvas.width / sw, canvas.height / sh);
    this.base = { a: this.scale, b: 0, c: 0, d: this.scale, tx: (canvas.width - sw * this.scale) / 2, ty: (canvas.height - sh * this.scale) / 2 };
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bg = rt.page.stage.background; ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
    ctx.fillRect(this.base.tx, this.base.ty, sw * this.scale, sh * this.scale);
    ctx.save(); ctx.beginPath(); ctx.rect(this.base.tx, this.base.ty, sw * this.scale, sh * this.scale); ctx.clip();
    this.drawClip(rt.shell, this.base, IDCX);
    ctx.restore();
  }
  setM(m: Matrix): void { this.ctx.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty); }
  drawObject(o: DisplayObject, pm: Matrix, pcx: CX): void {
    if (!o.visible || o.removed) return;
    const m = mul(pm, o.m); const cx = combine(pcx, o.cx);
    if (cx[3] <= 0 && cx[7] <= 0) return;
    if (o instanceof MovieClip) this.drawClip(o, m, cx);
    else if (o instanceof ButtonObj) for (const c of o.stateChildren) this.drawObject(c, m, cx);
    else if (o instanceof TextFieldObj) this.drawEditText(o, m, cx);
    else this.drawLeaf(o, m, cx);
  }
  drawClip(c: MovieClip, m: Matrix, cx: CX): void {
    if (c.graphics.length) this.drawGraphics(c.graphics, m, cx);
    const kids = c.sortedChildren(); let i = 0;
    while (i < kids.length) {
      const k = kids[i];
      if (k.clipDepth > 0) {
        const maskPath = new Path2D(); this.collectMask(k, mul(m, k.m), maskPath);
        const ctx = this.ctx; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clip(maskPath, "nonzero");
        i++;
        while (i < kids.length && kids[i].depth <= k.clipDepth) { this.drawObject(kids[i], m, cx); i++; }
        ctx.restore(); continue;
      }
      this.drawObject(k, m, cx); i++;
    }
  }
  collectMask(o: DisplayObject, m: Matrix, out: Path2D): void {
    if (o.removed) return;
    if (o instanceof MovieClip) { for (const k of o.sortedChildren()) this.collectMask(k, mul(m, k.m), out); return; }
    if (o instanceof ButtonObj) { for (const k of o.stateChildren) this.collectMask(k, mul(m, k.m), out); return; }
    const d = o.def; const dm = new DOMMatrix([m.a, m.b, m.c, m.d, m.tx, m.ty]);
    if (d.kind === "shape") d.draws.forEach((dr: any, i: number) => { if (dr.fill) out.addPath(this.path(`${o.charId}:${i}`, dr.path), dm); });
    else if (d.kind === "morph") { const r = this.morph(o, d); for (const f of r.fills) out.addPath(f.path, dm); }
    else if (d.kind === "text" || d.kind === "edittext") { const b = d.bounds; const p = new Path2D(); p.rect(b.xmin, b.ymin, b.xmax - b.xmin, b.ymax - b.ymin); out.addPath(p, dm); }
  }
  drawLeaf(o: DisplayObject, m: Matrix, cx: CX): void {
    const d = o.def;
    if (d.kind === "shape") this.drawShape(o.charId, d.draws, m, cx);
    else if (d.kind === "morph") { const r = this.morph(o, d); this.drawFills(r.fills, m, cx); for (const l of r.lines) this.stroke(l.path, l.w, l.c, m, cx); }
    else if (d.kind === "text") this.drawText(d, m, cx);
  }
  drawShape(id: number, draws: any[], m: Matrix, cx: CX): void {
    draws.forEach((dr, i) => {
      const p = this.path(`${id}:${i}`, dr.path);
      if (dr.fill) this.fill(p, dr.fill, m, cx); else this.stroke(p, dr.line.w, dr.line.c, m, cx);
    });
  }
  drawFills(fills: { path: Path2D; fill: any }[], m: Matrix, cx: CX): void { for (const f of fills) this.fill(f.path, f.fill, m, cx); }
  fill(p: Path2D, f: any, m: Matrix, cx: CX): void {
    const ctx = this.ctx; this.setM(m);
    if (f.t === "s") { ctx.fillStyle = color(f.c, cx); ctx.fill(p, "evenodd"); return; }
    ctx.save(); ctx.clip(p, "evenodd");
    if (f.t === "l" || f.t === "r") {
      const gm = toM(f.m); ctx.transform(gm.a, gm.b, gm.c, gm.d, gm.tx, gm.ty);
      const g = f.t === "l" ? ctx.createLinearGradient(-16384, 0, 16384, 0) : ctx.createRadialGradient(0, 0, 0, 0, 0, 16384);
      for (const s of f.s) g.addColorStop(Math.min(1, s[0] / 255), color([s[1], s[2], s[3], s[4]], cx));
      ctx.fillStyle = g; ctx.fillRect(-16384, -16384, 32768, 32768);
    } else if (f.t === "b") {
      const img = this.images.get(String(f.id));
      if (img) {
        const bm = toM(f.m); ctx.transform(bm.a, bm.b, bm.c, bm.d, bm.tx, bm.ty);
        ctx.imageSmoothingEnabled = f.sm !== false; ctx.globalAlpha = Math.max(0, Math.min(1, cx[3] / 256));
        if (f.rep) { const pat = ctx.createPattern(img, "repeat"); if (pat) { ctx.fillStyle = pat; ctx.fillRect(-16384, -16384, 32768, 32768); } }
        else ctx.drawImage(img, 0, 0);
      }
    }
    ctx.restore();
  }
  stroke(p: Path2D, w: number, c: number[], m: Matrix, cx: CX): void {
    const ctx = this.ctx; this.setM(m);
    const scale = Math.hypot(m.a, m.b) || 1e-6;
    ctx.lineWidth = Math.max(w, 1 / scale); ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = color(c, cx); ctx.stroke(p);
  }
  morph(o: DisplayObject, d: any): { fills: { path: Path2D; fill: any }[]; lines: { path: Path2D; w: number; c: number[] }[] } {
    const key = `${o.charId}@${o.ratio}`; const cached = (d as any)._cache?.get(key); if (cached) return cached;
    const t = (o.ratio || 0) / 65535; const E = d.edges;
    const pt = (e: number[], k: number) => [lerp(e[k], e[k + 6], t), lerp(e[k + 1], e[k + 7], t)];
    const edgeAt = (ref: number) => { const e = E[Math.abs(ref) - 1]; const a = pt(e, 0), c = pt(e, 2), b = pt(e, 4); return ref < 0 ? { from: b, ctrl: c, to: a, straight: e[12] } : { from: a, ctrl: c, to: b, straight: e[12] }; };
    const lerpC = (c: number[][]) => c[0].map((v: number, i: number) => lerp(v, c[1][i], t));
    const lerpM = (ms: number[][]) => ms[0].map((v: number, i: number) => lerp(v, ms[1][i], t));
    const fills = d.fills.map((f: any, fi: number) => {
      const p = new Path2D();
      for (const loop of d.fillLoops[fi] || []) { loop.forEach((ref: number, i: number) => { const e = edgeAt(ref); if (i === 0) p.moveTo(e.from[0], e.from[1]); if (e.straight) p.lineTo(e.to[0], e.to[1]); else p.quadraticCurveTo(e.ctrl[0], e.ctrl[1], e.to[0], e.to[1]); }); p.closePath(); }
      const fill = f.t === "s" ? { t: "s", c: lerpC(f.c) } : f.t === "b" ? { t: "b", id: f.id, m: lerpM(f.m), rep: f.rep, sm: f.sm } : { t: f.t, m: lerpM(f.m), s: f.s.map((s: any) => [lerp(s[0][0], s[0][1], t), ...lerpC(s[1])]) };
      return { path: p, fill };
    });
    const lines = d.lines.map((l: any, li: number) => {
      const p = new Path2D(); let pen: number[] | null = null;
      for (const idx of d.lineSegs[li] || []) { const e = edgeAt(idx + 1); if (!pen || pen[0] !== e.from[0] || pen[1] !== e.from[1]) p.moveTo(e.from[0], e.from[1]); if (e.straight) p.lineTo(e.to[0], e.to[1]); else p.quadraticCurveTo(e.ctrl[0], e.ctrl[1], e.to[0], e.to[1]); pen = e.to; }
      return { path: p, w: lerp(l.w[0], l.w[1], t), c: lerpC(l.c) };
    });
    const r = { fills, lines }; ((d as any)._cache ??= new Map()).set(key, r); return r;
  }
  drawText(d: any, m: Matrix, cx: CX): void {
    const tm = mul(m, toM(d.m)); const ctx = this.ctx;
    for (const run of d.runs) {
      const font = this.rt.page.dictionary[run.f]; if (!font) continue;
      const s = run.h / font.em; ctx.fillStyle = color(run.c, cx);
      for (const [gi, x] of run.g) {
        const gpath = font.glyphs[gi]; if (!gpath) continue;
        this.setM(mul(tm, { a: s, b: 0, c: 0, d: s, tx: x, ty: run.y }));
        ctx.fill(this.path(`f${run.f}:${gi}`, gpath), "evenodd");
      }
    }
  }
  drawEditText(o: TextFieldObj, m: Matrix, cx: CX): void {
    const d = o.def; const ctx = this.ctx; const b = d.bounds; if (!b) return;
    this.setM(m);
    if (o.border) { ctx.lineWidth = 20; ctx.strokeStyle = color([0, 0, 0, 255], cx); ctx.strokeRect(b.xmin, b.ymin, b.xmax - b.xmin, b.ymax - b.ymin); }
    const text = o.textValue; if (!text) return;
    const size = (o.format.size ? Number(o.format.size) * 20 : d.fontHeight) || 240;
    const col = o.textColor ?? (o.htmlValue ? htmlColor(o.htmlValue) : null) ?? d.color ?? [0, 0, 0, 255];
    ctx.fillStyle = color(col, cx);
    const font = d.fontId !== undefined ? this.rt.page.dictionary[d.fontId] : null;
    const pad = 40; const width = b.xmax - b.xmin - pad * 2;
    const glyphOf = (ch: string) => (font?.codes ? font.codes.indexOf(ch.charCodeAt(0)) : -1);
    const adv = (ch: string) => { const gi = glyphOf(ch); if (font && gi >= 0 && font.advances) return (font.advances[gi] * size) / font.em; ctx.font = `${size}px Arial, Helvetica, sans-serif`; return ctx.measureText(ch).width; };
    const lines: string[] = [];
    for (const para of text.split(/\r\n|\r|\n/)) {
      if (!(d.wordWrap || d.multiline) || width <= 0) { lines.push(para); continue; }
      let line = ""; let w = 0;
      for (const word of para.split(/(\s+)/)) { const ww = [...word].reduce((a, ch) => a + adv(ch), 0); if (w + ww > width && line.trim()) { lines.push(line); line = word.trimStart(); w = [...line].reduce((a, ch) => a + adv(ch), 0); } else { line += word; w += ww; } }
      lines.push(line);
    }
    const ascent = font?.ascent ? (font.ascent * size) / font.em : size * 0.8; const lineH = font?.ascent ? ((font.ascent + font.descent + (font.leading || 0)) * size) / font.em + (d.leading || 0) : size * 1.15;
    const align = o.format.align ?? d.align ?? "left";
    lines.forEach((line, li) => {
      const lw = [...line].reduce((a, ch) => a + adv(ch), 0);
      let x = b.xmin + pad + (align === "center" ? (width - lw) / 2 : align === "right" ? width - lw : 0);
      const y = b.ymin + pad / 2 + ascent + li * lineH;
      for (const ch of line) {
        const gi = glyphOf(ch);
        if (font && gi >= 0 && font.glyphs[gi] !== undefined && font.advances) {
          const s = size / font.em; this.setM(mul(m, { a: s, b: 0, c: 0, d: s, tx: x, ty: y }));
          if (font.glyphs[gi]) ctx.fill(this.path(`f${d.fontId}:${gi}`, font.glyphs[gi]), "evenodd");
        } else { this.setM(m); ctx.font = `${o.format.bold || font?.bold ? "bold " : ""}${size}px Arial, Helvetica, sans-serif`; ctx.fillText(ch, x, y); }
        x += adv(ch);
      }
    });
  }
  drawGraphics(g: any[], m: Matrix, cx: CX): void {
    const ctx = this.ctx; this.setM({ ...m, a: m.a * 20, b: m.b * 20, c: m.c * 20, d: m.d * 20 });
    let line: any = null, fill: any = null; let p = new Path2D(); let fp = new Path2D();
    const flushFill = () => { if (fill) { ctx.fillStyle = color([(fill[1] >> 16) & 255, (fill[1] >> 8) & 255, fill[1] & 255, ((fill[2] ?? 100) / 100) * 255], cx); ctx.fill(fp, "evenodd"); } fp = new Path2D(); };
    const flushLine = () => { if (line && line[1] !== undefined) { const scale = Math.hypot(m.a * 20, m.b * 20) || 1; ctx.lineWidth = Math.max(line[1] || 0, 1 / scale); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = color([(line[2] >> 16) & 255, (line[2] >> 8) & 255, line[2] & 255, ((line[3] ?? 100) / 100) * 255], cx); ctx.stroke(p); } p = new Path2D(); };
    for (const c of g) {
      switch (c[0]) {
        case "ls": flushLine(); line = c; break;
        case "mt": p.moveTo(c[1], c[2]); fp.moveTo(c[1], c[2]); break;
        case "lt": p.lineTo(c[1], c[2]); fp.lineTo(c[1], c[2]); break;
        case "ct": p.quadraticCurveTo(c[1], c[2], c[3], c[4]); fp.quadraticCurveTo(c[1], c[2], c[3], c[4]); break;
        case "bf": flushFill(); fill = c; break;
        case "ef": flushFill(); fill = null; break;
      }
    }
    flushFill(); flushLine();
  }

  // ---------------------------------------------------------------- hit testing (stage px)
  hitTest(o: DisplayObject, x: number, y: number): boolean {
    const tw = [x * 20, y * 20];
    const parentM = o.parentClip ? o.parentClip.worldMatrix() : { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    if (o instanceof ButtonObj) {
      const recs = o.def.records.filter((r: any) => r.states & 8); const use = recs.length ? recs : o.def.records.filter((r: any) => r.states & 1);
      const bm = mul(parentM, o.m);
      return use.some((r: any) => this.hitChar(r.charId, mul(bm, toM(r.m)), tw, 0));
    }
    return this.hitTree(o, mul(parentM, o.m), tw);
  }
  hitTree(o: DisplayObject, m: Matrix, tw: number[]): boolean {
    if (!o.visible || o.removed) return false;
    if (o instanceof MovieClip) {
      if (o.graphics.length) { const b = o.graphicsBounds(); if (b) { const [lx, ly] = apply(invert(m), tw[0], tw[1]); if (lx >= b.xmin && lx <= b.xmax && ly >= b.ymin && ly <= b.ymax) return true; } }
      for (const k of o.sortedChildren()) if (!k.clipDepth && this.hitTree(k, mul(m, k.m), tw)) return true;
      return false;
    }
    if (o instanceof ButtonObj) return o.stateChildren.some((k) => this.hitTree(k, mul(m, k.m), tw));
    return this.hitChar(o.charId, m, tw, o.ratio, o);
  }
  hitChar(charId: number, m: Matrix, tw: number[], ratio: number, inst?: DisplayObject): boolean {
    const d = this.rt.page.dictionary[charId]; if (!d) return false;
    const [lx, ly] = apply(invert(m), tw[0], tw[1]);
    if (d.kind === "sprite") { const tmp = inst as MovieClip | undefined; if (tmp) return this.hitTree(tmp, m, tw); for (const fr of d.frames.slice(0, 1)) for (const t of fr) if (t.op === "place" && t.charId !== undefined && this.hitChar(t.charId, mul(m, toM(t.m)), tw, t.ratio ?? 0)) return true; return false; }
    if (d.kind === "shape") return d.draws.some((dr: any, i: number) => dr.fill ? this.hitCtx.isPointInPath(this.path(`${charId}:${i}`, dr.path), lx, ly, "evenodd") : (this.hitCtx.lineWidth = Math.max(dr.line.w, 40), this.hitCtx.isPointInStroke(this.path(`${charId}:${i}`, dr.path), lx, ly)));
    if (d.kind === "morph") { const r = this.morph({ charId, ratio } as any, d); return r.fills.some((f) => this.hitCtx.isPointInPath(f.path, lx, ly, "evenodd")); }
    const b = d.bounds ?? d.sb; return !!b && lx >= b.xmin && lx <= b.xmax && ly >= b.ymin && ly <= b.ymax;
  }
}
function htmlColor(html: string): number[] | null { const m = /color\s*=\s*["']?#([0-9a-f]{6})/i.exec(html); if (!m) return null; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]; }
