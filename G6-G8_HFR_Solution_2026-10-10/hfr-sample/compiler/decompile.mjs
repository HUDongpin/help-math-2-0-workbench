// hfr-compile: AVM1 bytecode → readable TypeScript.
//
// Strategy: (1) disassemble, (2) rebuild expressions from the operand stack and
// structured control flow (if/else, while, do-while, for(;;), for-in, &&, ||,
// ?:) from the jump pattern the Flash MX compiler emits, (3) print TypeScript
// that calls a small runtime helper set with exact ActionScript semantics.
// Any block the structurer cannot prove is translated by the "explicit stack"
// fallback instead, which is mechanical but always exact.

const PROPS = ["_x", "_y", "_xscale", "_yscale", "_currentframe", "_totalframes", "_alpha", "_visible", "_width", "_height", "_rotation", "_target", "_framesloaded", "_name", "_droptarget", "_url", "_highquality", "_focusrect", "_soundbuftime", "_quality", "_xmouse", "_ymouse"];
const ID_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const ROOTS = new Set(["_global", "this", "_root", "_level0"]);

// ------------------------------------------------------------------ disassembly
export function disassemble(bytes, inheritedPool = []) {
  const out = []; let pool = inheritedPool; let p = 0;
  while (p < bytes.length) {
    const off = p; const op = bytes[p++]; if (op === 0) { out.push({ off, end: p, op: 0 }); break; }
    let len = 0; if (op >= 0x80) { len = bytes.readUInt16LE(p); p += 2; }
    const a = p; const end = p + len; const ins = { off, end, op };
    const cstr = (q) => { const e = bytes.indexOf(0, q); return [bytes.toString("latin1", q, e), e + 1]; };
    switch (op) {
      case 0x88: { const n = bytes.readUInt16LE(a); let q = a + 2; pool = []; for (let i = 0; i < n; i++) { const [s, q2] = cstr(q); pool.push(s); q = q2; } ins.pool = pool; break; }
      case 0x96: {
        const vals = []; let q = a;
        while (q < end) {
          const t = bytes[q++];
          if (t === 0) { const [s, q2] = cstr(q); vals.push({ k: "lit", v: s }); q = q2; }
          else if (t === 1) { vals.push({ k: "lit", v: bytes.readFloatLE(q) }); q += 4; }
          else if (t === 2) vals.push({ k: "lit", v: null });
          else if (t === 3) vals.push({ k: "lit", v: undefined });
          else if (t === 4) { vals.push({ k: "reg", n: bytes[q] }); q++; }
          else if (t === 5) { vals.push({ k: "lit", v: bytes[q] !== 0 }); q++; }
          else if (t === 6) { const b = Buffer.alloc(8); bytes.copy(b, 0, q + 4, q + 8); bytes.copy(b, 4, q, q + 4); vals.push({ k: "lit", v: b.readDoubleLE(0) }); q += 8; }
          else if (t === 7) { vals.push({ k: "lit", v: bytes.readInt32LE(q) }); q += 4; }
          else if (t === 8) { vals.push({ k: "lit", v: pool[bytes[q]] }); q++; }
          else if (t === 9) { vals.push({ k: "lit", v: pool[bytes.readUInt16LE(q)] }); q += 2; }
          else throw new Error("bad push type " + t);
        }
        ins.vals = vals; break;
      }
      case 0x99: case 0x9d: ins.target = end + bytes.readInt16LE(a); break;
      case 0x81: ins.frame = bytes.readUInt16LE(a); break;
      case 0x83: { const [u, q] = cstr(a); ins.url = u; ins.target = cstr(q)[0]; ins.tgt = ins.target; delete ins.target; break; }
      case 0x87: ins.reg = bytes[a]; break;
      case 0x8b: case 0x8c: ins.name = cstr(a)[0]; break;
      case 0x9a: ins.flags = bytes[a]; break;
      case 0x9f: ins.play = !!(bytes[a] & 1); ins.bias = bytes[a] & 2 ? bytes.readUInt16LE(a + 1) : 0; break;
      case 0x94: ins.size = bytes.readUInt16LE(a); ins.withEnd = end + ins.size; break;
      case 0x8a: ins.skip = bytes[a + 2]; break;
      case 0x8d: ins.skip = bytes[a]; break;
      case 0x9b: case 0x8e: {
        let q = a; const [name, q1] = cstr(q); q = q1; const np = bytes.readUInt16LE(q); q += 2;
        let regCount = 0, flags = 0; const params = [];
        if (op === 0x8e) { regCount = bytes[q]; const f = bytes.readUInt16BE(q + 1); flags = ((f >> 8) & 0xff) | ((f & 1) << 8); q += 3; }
        for (let i = 0; i < np; i++) { let reg = 0; if (op === 0x8e) reg = bytes[q++]; const [pn, q2] = cstr(q); params.push({ name: pn, reg }); q = q2; }
        const size = bytes.readUInt16LE(q);
        Object.assign(ins, { name, params, regCount, flags, df2: op === 0x8e, body: disassemble(bytes.subarray(end, end + size), pool) });
        ins.end = end + size; p = end + size; out.push(ins); continue;
      }
      default: break;
    }
    out.push(ins); p = end;
  }
  return out;
}

// ------------------------------------------------------------------ expressions
const SIDE = new Set(["call", "new", "callh"]);
const hasSide = (e) => e && (SIDE.has(e.k) || (e.k === "logic" && (hasSide(e.a) || hasSide(e.b))) || (e.k === "cond" && (hasSide(e.c) || hasSide(e.a) || hasSide(e.b))) || (e.k === "bin" && (hasSide(e.a) || hasSide(e.b))) || (e.k === "un" && hasSide(e.x)) || (e.k === "mem" && (hasSide(e.obj) || hasSide(e.name))));
const BOOLOPS = new Set(["eq", "seq", "lt", "gt", "numEq", "numLt", "strEq", "strLt", "strGt", "instanceOf", "legacyAnd", "legacyOr"]);
const isBool = (e) => (e.k === "bin" && BOOLOPS.has(e.op)) || (e.k === "un" && (e.op === "not" || e.op === "bool")) || (e.k === "lit" && typeof e.v === "boolean") || (e.k === "logic" && isBool(e.a) && isBool(e.b));
const lit = (v) => ({ k: "lit", v });
const neg = (c) => (c.k === "un" && c.op === "not" ? { k: "un", op: "bool", x: c.x } : { k: "un", op: "not", x: c });

class Fail extends Error {}

// ------------------------------------------------------------------ structurer
class FnContext {
  constructor(regNames, depth) { this.regNames = regNames; this.depth = depth; this.usedRegs = new Set(); this.temp = 0; this.helpers = new Set(); this.fallbacks = 0; this.blocks = 0; }
  reg(n) { this.usedRegs.add(n); return this.regNames[n] ?? `r${n}`; }
}

class Structurer {
  constructor(ins, fx) { this.ins = ins; this.fx = fx; this.idx = new Map(ins.map((x, i) => [x.off, i])); }
  ti(off) { const i = this.idx.get(off); if (i === undefined) { if (off === (this.ins.at(-1)?.end ?? 0)) return this.ins.length; throw new Fail("jump into instruction"); } return i; }
  lastBackJump(i, hi) {
    const off = this.ins[i].off; let best = -1;
    for (let j = i; j < hi; j++) { const x = this.ins[j]; if ((x.op === 0x99 || x.op === 0x9d) && x.target === off) best = j; }
    return best;
  }
  // Process [lo, hi). Returns { st: statements, stack }.
  run(lo, hi, loop, stack, exprOnly = false) {
    const st = []; const S = stack.slice(); let i = lo;
    const emit = (s) => { if (exprOnly) throw new Fail("statement in expression"); this.flush(S, st); st.push(s); };
    const pop = () => { if (!S.length) throw new Fail("stack underflow"); return S.pop(); };
    const popN = () => { const n = pop(); if (n.k !== "lit" || typeof n.v !== "number" || n.v < 0 || n.v > 255) throw new Fail("dynamic arg count"); const a = []; for (let k = 0; k < n.v; k++) a.push(pop()); return a; };
    while (i < hi) {
      const x = this.ins[i];
      // ----- loops
      const back = exprOnly ? -1 : this.lastBackJump(i, hi);
      if (back !== -1) {
        const tail = this.ins[back]; const exitOff = tail.end; const exitIdx = this.ti(exitOff);
        const topEnum = S.length && S[S.length - 1].k === "enum";
        if (topEnum && x.op === 0x87 && this.ins[i + 1]?.op === 0x96 && this.ins[i + 1].vals.length === 1 && this.ins[i + 1].vals[0].v === null && this.ins[i + 2]?.op === 0x49 && this.ins[i + 3]?.op === 0x9d && this.ins[i + 3].target === exitOff && tail.op === 0x99) {
          const en = S.pop(); this.flush(S, st);
          const body = this.run(i + 4, back, { exit: exitOff, cont: x.off }, []);
          if (body.stack.length) throw new Fail("for-in body stack");
          st.push({ s: "forin", v: this.fx.reg(x.reg), obj: en.obj, body: body.st });
          i = back + 1; continue;
        }
        if (S.length) throw new Fail("stack at loop head");
        if (tail.op === 0x99) {
          let k = -1;
          for (let q = i; q < back; q++) { const y = this.ins[q]; if (y.op === 0x9d && y.target === exitOff) { k = q; break; } if (y.op === 0x99 || y.op === 0x9d || y.op === 0x94 || y.op === 0x9b || y.op === 0x8e) break; }
          let cond = null;
          if (k !== -1) { try { const r = this.run(i, k, null, [], true); if (r.stack.length === 1) cond = r.stack[0]; } catch (e) { if (!(e instanceof Fail)) throw e; } }
          if (cond) {
            const body = this.run(k + 1, back, { exit: exitOff, cont: x.off }, []);
            if (body.stack.length) throw new Fail("while body stack");
            st.push({ s: "while", cond: neg(cond), body: body.st });
          } else {
            const body = this.run(i, back, { exit: exitOff, cont: x.off }, []);
            if (body.stack.length) throw new Fail("loop body stack");
            st.push({ s: "for", body: body.st });
          }
          i = back + 1; continue;
        }
        // do-while
        const body = this.run(i, back, { exit: exitOff, cont: null }, []);
        if (body.stack.length !== 1) throw new Fail("do-while cond");
        st.push({ s: "do", body: body.st, cond: body.stack[0] });
        i = back + 1; continue;
      }
      // ----- single instructions
      switch (x.op) {
        case 0: i = hi; continue;
        case 0x88: break;
        case 0x96: for (const v of x.vals) S.push(v.k === "reg" ? { k: "reg", n: v.n, name: this.fx.reg(v.n) } : v); break;
        case 0x17: { const v = pop(); if (hasSide(v)) emit({ s: "expr", e: v }); break; }
        case 0x4c: { // PushDuplicate: try && / ||
          const a = S[S.length - 1]; if (!a) throw new Fail("dup underflow");
          let j = i + 1; let isAnd = false;
          if (this.ins[j]?.op === 0x12) { isAnd = true; j++; }
          const iff = this.ins[j];
          if (iff?.op === 0x9d && this.ins[j + 1]?.op === 0x17 && iff.target > iff.off) {
            const tIdx = this.ti(iff.target);
            if (tIdx <= hi) {
              try {
                const r = this.run(j + 2, tIdx, null, [], true);
                if (r.stack.length === 1) { S.pop(); S.push({ k: "logic", op: isAnd ? "&&" : "||", a, b: r.stack[0] }); i = tIdx; continue; }
              } catch (e) { if (!(e instanceof Fail)) throw e; }
            }
          }
          if (exprOnly && hasSide(a)) throw new Fail("dup side effect in expr");
          if (hasSide(a) || (a.k !== "lit" && a.k !== "reg" && a.k !== "temp" && a.k !== "var")) {
            if (exprOnly) throw new Fail("dup complex in expr");
            S.pop(); const t = { k: "temp", name: `t${this.fx.temp++}` }; this.flush(S, st); st.push({ s: "let", name: t.name, e: a }); S.push(t, t);
          } else S.push(a);
          break;
        }
        case 0x4d: { const b = pop(), a = pop(); S.push(b, a); break; }
        case 0x87: { // StoreRegister
          const v = S.length ? S[S.length - 1] : lit(undefined); const name = this.fx.reg(x.reg);
          if (exprOnly) throw new Fail("register store in expr");
          S.pop(); this.flush(S, st); st.push({ s: "assignReg", name, e: v }); S.push({ k: "reg", n: x.reg, name });
          break;
        }
        case 0x1c: S.push({ k: "var", name: pop() }); break;
        case 0x1d: { const v = pop(); const n = pop(); emit({ s: "setVar", name: n, e: v }); break; }
        case 0x4e: { const n = pop(); const o = pop(); S.push({ k: "mem", obj: o, name: n }); break; }
        case 0x4f: { const v = pop(); const n = pop(); const o = pop(); emit({ s: "setMem", obj: o, name: n, e: v }); break; }
        case 0x3d: { const n = pop(); const args = popN(); S.push({ k: "call", fn: { k: "var", name: n }, args }); break; }
        case 0x52: { const n = pop(); const o = pop(); const args = popN(); S.push({ k: "call", fn: n.k === "lit" && (n.v === undefined || n.v === null || n.v === "") ? o : { k: "mem", obj: o, name: n }, args }); break; }
        case 0x40: { const n = pop(); const args = popN(); S.push({ k: "new", ctor: { k: "var", name: n }, args }); break; }
        case 0x53: { const n = pop(); const o = pop(); const args = popN(); S.push({ k: "new", ctor: n.k === "lit" && (n.v === undefined || n.v === "") ? o : { k: "mem", obj: o, name: n }, args }); break; }
        case 0x42: { const n = pop(); if (n.k !== "lit") throw new Fail("dynamic array"); const items = []; for (let k = 0; k < n.v; k++) items.push(pop()); S.push({ k: "arr", items }); break; }
        case 0x43: { const n = pop(); if (n.k !== "lit") throw new Fail("dynamic object"); const pairs = []; for (let k = 0; k < n.v; k++) { const v = pop(); const key = pop(); pairs.push([key, v]); } S.push({ k: "obj", pairs }); break; }
        case 0x3c: { const v = pop(); const n = pop(); emit({ s: "local", name: n, e: v }); break; }
        case 0x41: { const n = pop(); emit({ s: "declare", name: n }); break; }
        case 0x3a: { const n = pop(); const o = pop(); S.push({ k: "callh", h: "del", args: [o, n] }); break; }
        case 0x3b: { const n = pop(); S.push({ k: "callh", h: "deleteVar", scope: true, args: [n] }); break; }
        case 0x3e: { const v = S.length ? pop() : lit(undefined); emit({ s: "return", e: v }); break; }
        case 0x46: { const n = pop(); S.push({ k: "enum", obj: { k: "var", name: n } }); break; }
        case 0x55: { const o = pop(); S.push({ k: "enum", obj: o }); break; }
        // arithmetic / logic
        case 0x47: case 0x0b: case 0x0c: case 0x0d: case 0x3f: case 0x49: case 0x66: case 0x48: case 0x67:
        case 0x0a: case 0x0e: case 0x0f: case 0x10: case 0x11: case 0x13: case 0x29: case 0x68: case 0x21:
        case 0x60: case 0x61: case 0x62: case 0x63: case 0x64: case 0x65: {
          const op = { 0x47: "add", 0x0b: "sub", 0x0c: "mul", 0x0d: "div", 0x3f: "mod", 0x49: "eq", 0x66: "seq", 0x48: "lt", 0x67: "gt", 0x0a: "numAdd", 0x0e: "numEq", 0x0f: "numLt", 0x10: "legacyAnd", 0x11: "legacyOr", 0x13: "strEq", 0x29: "strLt", 0x68: "strGt", 0x21: "concat", 0x60: "bitAnd", 0x61: "bitOr", 0x62: "bitXor", 0x63: "shl", 0x64: "shr", 0x65: "ushr" }[x.op];
          const b = pop(), a = pop(); S.push({ k: "bin", op, a, b }); break;
        }
        case 0x54: { const c = pop(), o = pop(); S.push({ k: "bin", op: "instanceOf", a: o, b: c }); break; }
        case 0x12: S.push({ k: "un", op: "not", x: pop() }); break;
        case 0x50: S.push({ k: "un", op: "inc", x: pop() }); break;
        case 0x51: S.push({ k: "un", op: "dec", x: pop() }); break;
        case 0x4a: S.push({ k: "un", op: "num", x: pop() }); break;
        case 0x4b: S.push({ k: "un", op: "str", x: pop() }); break;
        case 0x18: S.push({ k: "un", op: "int", x: pop() }); break;
        case 0x44: S.push({ k: "un", op: "typeOf", x: pop() }); break;
        case 0x14: S.push({ k: "un", op: "strlen", x: pop() }); break;
        case 0x45: S.push({ k: "un", op: "targetPath", x: pop() }); break;
        case 0x15: { const c = pop(), idx = pop(), s = pop(); S.push({ k: "callh", h: "substr", args: [s, idx, c] }); break; }
        case 0x30: S.push({ k: "callh", h: "random", scope: true, args: [pop()] }); break;
        case 0x34: S.push({ k: "callh", h: "getTimer", scope: true, args: [] }); break;
        case 0x22: { const idx = pop(), t = pop(); S.push({ k: "callh", h: "getProperty", scope: true, args: [t, idx.k === "lit" && PROPS[idx.v] ? lit(PROPS[idx.v]) : idx] }); break; }
        case 0x23: { const v = pop(), idx = pop(), t = pop(); emit({ s: "expr", e: { k: "callh", h: "setProperty", scope: true, args: [t, idx.k === "lit" && PROPS[idx.v] ? lit(PROPS[idx.v]) : idx, v] } }); break; }
        case 0x24: { const d = pop(), n = pop(), src = pop(); emit({ s: "expr", e: { k: "callh", h: "duplicateMovieClip", scope: true, args: [src, n, d] } }); break; }
        case 0x25: emit({ s: "expr", e: { k: "callh", h: "removeMovieClip", scope: true, args: [pop()] } }); break;
        case 0x26: emit({ s: "expr", e: { k: "callh", h: "trace", scope: true, args: [pop()] } }); break;
        case 0x27: { const t = pop(), lock = pop(), c = pop(); const args = [t, lock]; if (c.k === "lit" && c.v === false) {} else { if (c.k !== "lit") throw new Fail("dynamic constrain"); const y2 = pop(), x2 = pop(), y1 = pop(), x1 = pop(); args.push(x1, y1, x2, y2); } emit({ s: "expr", e: { k: "callh", h: "startDrag", scope: true, args } }); break; }
        case 0x28: emit({ s: "expr", e: { k: "callh", h: "stopDrag", scope: true, args: [] } }); break;
        case 0x09: emit({ s: "expr", e: { k: "callh", h: "stopAllSounds", scope: true, args: [] } }); break;
        case 0x04: emit({ s: "expr", e: { k: "callh", h: "nextFrame", scope: true, args: [] } }); break;
        case 0x05: emit({ s: "expr", e: { k: "callh", h: "prevFrame", scope: true, args: [] } }); break;
        case 0x06: emit({ s: "expr", e: { k: "callh", h: "play", scope: true, args: [] } }); break;
        case 0x07: emit({ s: "expr", e: { k: "callh", h: "stop", scope: true, args: [] } }); break;
        case 0x81: emit({ s: "expr", e: { k: "callh", h: "gotoAndStop", scope: true, args: [lit(x.frame + 1)] } }); break;
        case 0x8c: emit({ s: "expr", e: { k: "callh", h: "gotoLabel", scope: true, args: [lit(x.name)] } }); break;
        case 0x9f: { const f = pop(); const args = [f]; if (x.bias) args.push(lit(x.bias)); emit({ s: "expr", e: { k: "callh", h: x.play ? "gotoAndPlay" : "gotoAndStop", scope: true, args } }); break; }
        case 0x83: emit({ s: "expr", e: { k: "callh", h: "getURL", scope: true, args: [lit(x.url), lit(x.tgt)] } }); break;
        case 0x9a: { const t = pop(), u = pop(); emit({ s: "expr", e: { k: "callh", h: "getURL", scope: true, args: [u, t, lit(x.flags)] } }); break; }
        case 0x9e: emit({ s: "expr", e: { k: "callh", h: "callFrame", scope: true, args: [pop()] } }); break;
        case 0x8b: emit({ s: "setTarget", e: lit(x.name) }); break;
        case 0x20: emit({ s: "setTarget", e: pop() }); break;
        case 0x8a: case 0x8d: if (x.op === 0x8d) pop(); break; // all frames are loaded
        case 0x94: { // with
          const o = pop(); const wEnd = this.ti(x.withEnd);
          if (this.containsOp(i + 1, wEnd, 0x3e)) throw new Fail("return inside with");
          const body = this.run(i + 1, wEnd, null, []);
          if (body.stack.length) throw new Fail("with body stack");
          emit({ s: "with", obj: o, body: body.st }); i = wEnd; continue;
        }
        case 0x9b: case 0x8e: {
          const fnExpr = { k: "fn", src: decompileFunction(x, this.fx.depth + 1, this.fx) };
          if (x.name) emit({ s: "local", name: lit(x.name), e: fnExpr }); else S.push(fnExpr);
          break;
        }
        case 0x99: { // Jump
          if (loop && x.target === loop.exit) { emit({ s: "break" }); break; }
          if (loop && loop.cont !== null && x.target === loop.cont) { emit({ s: "continue" }); break; }
          throw new Fail("unstructured jump");
        }
        case 0x9d: { // If
          const c = pop();
          if (loop && x.target === loop.exit) { emit({ s: "if", cond: c, then: [{ s: "break" }], else: null }); break; }
          if (loop && loop.cont !== null && x.target === loop.cont) { emit({ s: "if", cond: c, then: [{ s: "continue" }], else: null }); break; }
          if (x.target <= x.off) throw new Fail("backward if");
          const tIdx = this.ti(x.target); if (tIdx > hi) throw new Fail("if leaves region");
          const prev = this.ins[tIdx - 1];
          const elseJump = prev && prev.op === 0x99 && prev.target > x.target && tIdx - 1 > i && !(loop && (prev.target === loop.exit || prev.target === loop.cont)) ? prev : null;
          // ternary?
          if (elseJump) {
            const t2 = this.ti(elseJump.target);
            if (t2 <= hi) {
              try {
                const fa = this.run(i + 1, tIdx - 1, null, [], true), tb = this.run(tIdx, t2, null, [], true);
                if (fa.stack.length === 1 && tb.stack.length === 1) { S.push({ k: "cond", c, a: tb.stack[0], b: fa.stack[0] }); i = t2; continue; }
              } catch (e) { if (!(e instanceof Fail)) throw e; }
            }
          }
          if (exprOnly) throw new Fail("if in expression");
          this.flush(S, st);
          if (S.length) throw new Fail("stack at if");
          if (elseJump) {
            const t2 = this.ti(elseJump.target); if (t2 > hi) throw new Fail("else leaves region");
            const th = this.run(i + 1, tIdx - 1, loop, []), el = this.run(tIdx, t2, loop, []);
            if (th.stack.length || el.stack.length) throw new Fail("branch stack");
            st.push({ s: "if", cond: neg(c), then: th.st, else: el.st }); i = t2; continue;
          }
          const th = this.run(i + 1, tIdx, loop, []);
          if (th.stack.length) throw new Fail("then stack");
          st.push({ s: "if", cond: neg(c), then: th.st, else: null }); i = tIdx; continue;
        }
        default: throw new Fail("unsupported opcode 0x" + x.op.toString(16));
      }
      i++;
    }
    return { st, stack: S };
  }
  containsOp(lo, hi, op) { for (let k = lo; k < hi; k++) if (this.ins[k].op === op) return true; return false; }
  // Before a statement is emitted, keep evaluation order: spill pending side effects.
  flush(S, st) {
    for (let k = 0; k < S.length; k++) if (hasSide(S[k])) { const t = { k: "temp", name: `t${this.fx.temp++}` }; st.push({ s: "let", name: t.name, e: S[k] }); S[k] = t; }
  }
}

// ------------------------------------------------------------------ printing
class Printer {
  constructor(fx) { this.fx = fx; }
  q(s) { return JSON.stringify(s); }
  litStr(v) {
    if (v === undefined) return "undefined";
    if (v === null) return "null";
    if (typeof v === "number") return Object.is(v, -0) ? "-0" : Number.isFinite(v) ? String(v) : Number.isNaN(v) ? "NaN" : v > 0 ? "Infinity" : "-Infinity";
    if (typeof v === "boolean") return String(v);
    return this.q(v);
  }
  // variable read
  varRef(nameExpr) {
    if (nameExpr.k !== "lit" || typeof nameExpr.v !== "string") return `$[${this.e(nameExpr)}]`;
    const n = nameExpr.v;
    if (n.includes("/") || n.includes(":")) return `$[${this.q(n)}]`;
    if (n.includes(".")) { const parts = n.split("."); if (parts.every((p) => ID_RE.test(p))) { let s = `$.${parts[0]}`; for (let k = 1; k < parts.length; k++) s += (k === 1 && ROOTS.has(parts[0]) ? "." : "?.") + parts[k]; return s; } return `$[${this.q(n)}]`; }
    return ID_RE.test(n) ? `$.${n}` : `$[${this.q(n)}]`;
  }
  isRootRef(e) { return e.k === "var" && e.name.k === "lit" && ROOTS.has(e.name.v); }
  memRef(o, nameExpr, optional = true) {
    const os = this.wrapPostfix(o); const dot = optional && !this.isRootRef(o) ? "?." : ".";
    if (nameExpr.k === "lit" && typeof nameExpr.v === "string" && ID_RE.test(nameExpr.v)) return `${os}${dot}${nameExpr.v}`;
    return `${os}${optional && !this.isRootRef(o) ? "?." : ""}[${this.e(nameExpr)}]`;
  }
  wrapPostfix(o) { const s = this.e(o); return ["var", "mem", "call", "reg", "temp", "lit", "callh", "arr"].includes(o.k) && !(o.k === "lit" && typeof o.v === "number" && o.v < 0) ? s : `(${s})`; }
  bool(c) { if (isBool(c)) return this.e(c, true); this.fx.helpers.add("truthy"); return `truthy(${this.e(c)})`; }
  e(x, boolCtx = false) {
    switch (x.k) {
      case "lit": return this.litStr(x.v);
      case "reg": return x.name;
      case "temp": return x.name;
      case "var": return this.varRef(x.name);
      case "mem": return this.memRef(x.obj, x.name);
      case "call": {
        const args = x.args.map((a) => this.e(a)).join(", ");
        if (x.fn.k === "var") return `${this.varRef(x.fn.name)}?.(${args})`;
        if (x.fn.k === "mem") return `${this.memRef(x.fn.obj, x.fn.name)}?.(${args})`;
        return `${this.wrapPostfix(x.fn)}?.(${args})`;
      }
      case "new": { this.fx.helpers.add("newObj"); return `newObj(${[this.e(x.ctor), ...x.args.map((a) => this.e(a))].join(", ")})`; }
      case "bin": {
        this.fx.helpers.add(x.op === "legacyAnd" || x.op === "legacyOr" ? "truthy" : x.op);
        if (x.op === "legacyAnd") return `(${this.bool(x.a)} && ${this.bool(x.b)})`;
        if (x.op === "legacyOr") return `(${this.bool(x.a)} || ${this.bool(x.b)})`;
        return `${x.op}(${this.e(x.a)}, ${this.e(x.b)})`;
      }
      case "un": {
        if (x.op === "not") { if (isBool(x.x)) return `!${this.wrapUnary(x.x)}`; this.fx.helpers.add("truthy"); return `!truthy(${this.e(x.x)})`; }
        if (x.op === "bool") return this.bool(x.x);
        this.fx.helpers.add(x.op); return `${x.op}(${this.e(x.x)})`;
      }
      case "logic": {
        if (boolCtx || (isBool(x.a) && isBool(x.b))) { const side = (c) => (c.k === "logic" && c.op !== x.op ? `(${this.bool(c)})` : this.bool(c)); const s = `${side(x.a)} ${x.op} ${side(x.b)}`; return boolCtx ? s : `(${s})`; }
        const h = x.op === "&&" ? "and" : "or"; this.fx.helpers.add(h); return `${h}(${this.e(x.a)}, () => ${this.e(x.b)})`;
      }
      case "cond": return `(${this.bool(x.c)} ? ${this.e(x.a)} : ${this.e(x.b)})`;
      case "arr": this.fx.helpers.add("arr"); return `arr(${x.items.map((a) => this.e(a)).join(", ")})`;
      case "obj": { this.fx.helpers.add("obj"); return `obj({ ${x.pairs.map(([k, v]) => `${k.k === "lit" && typeof k.v === "string" && ID_RE.test(k.v) ? k.v : `[${this.e(k)}]`}: ${this.e(v)}`).join(", ")} })`; }
      case "callh": { this.fx.helpers.add(x.h); return `${x.h}(${[...(x.scope ? ["$"] : []), ...x.args.map((a) => this.e(a))].join(", ")})`; }
      case "fn": return x.src;
      case "enum": throw new Fail("enum value escaped");
      default: throw new Error("print " + x.k);
    }
  }
  wrapUnary(x) { const s = this.e(x); return /^[\w$.?]+\(.*\)$/.test(s) || /^[\w$.]+$/.test(s) ? s : `(${s})`; }
  arrLit(x) { return x; }
  stmts(list, ind) {
    const out = []; const I = "  ".repeat(ind);
    for (const s of list) {
      switch (s.s) {
        case "expr": out.push(`${I}${this.e(s.e)};`); break;
        case "let": out.push(`${I}const ${s.name} = ${this.e(s.e)};`); break;
        case "assignReg": out.push(`${I}${s.name} = ${this.e(s.e)};`); break;
        case "setVar": {
          const n = s.name;
          if (n.k === "lit" && typeof n.v === "string" && n.v.includes(".") && !n.v.includes("/") && !n.v.includes(":")) {
            const i = n.v.lastIndexOf("."); const base = { k: "var", name: lit(n.v.slice(0, i)) };
            out.push(this.setMemLine(I, base, lit(n.v.slice(i + 1)), s.e));
          } else out.push(`${I}${this.varRef(n)} = ${this.e(s.e)};`);
          break;
        }
        case "setMem": out.push(this.setMemLine(I, s.obj, s.name, s.e)); break;
        case "local": out.push(`${I}${s.name.k === "lit" && ID_RE.test(s.name.v) ? `$$.${s.name.v}` : `$$[${this.e(s.name)}]`} = ${this.e(s.e)};`); break;
        case "declare": this.fx.helpers.add("declare"); out.push(`${I}declare($$, ${this.e(s.name)});`); break;
        case "return": out.push(`${I}return ${this.e(s.e)};`); break;
        case "break": out.push(`${I}break;`); break;
        case "continue": out.push(`${I}continue;`); break;
        case "setTarget": this.fx.helpers.add("tellTarget"); out.push(`${I}$ = tellTarget($, ${this.e(s.e)});`); break;
        case "if": {
          out.push(`${I}if (${this.bool(s.cond)}) {`, ...this.stmts(s.then, ind + 1));
          if (s.else && s.else.length) {
            if (s.else.length === 1 && s.else[0].s === "if") { const inner = this.stmts(s.else, ind); inner[0] = `${I}} else ${inner[0].trimStart()}`; out.push(...inner); continue; }
            out.push(`${I}} else {`, ...this.stmts(s.else, ind + 1));
          }
          out.push(`${I}}`); break;
        }
        case "while": out.push(`${I}while (${this.bool(s.cond)}) {`, ...this.stmts(s.body, ind + 1), `${I}}`); break;
        case "for": out.push(`${I}for (;;) {`, ...this.stmts(s.body, ind + 1), `${I}}`); break;
        case "do": out.push(`${I}do {`, ...this.stmts(s.body, ind + 1), `${I}} while (${this.bool(s.cond)});`); break;
        case "forin": this.fx.helpers.add("keys"); out.push(`${I}for (${s.v} of keys(${this.e(s.obj)})) {`, ...this.stmts(s.body, ind + 1), `${I}}`); break;
        case "with": this.fx.helpers.add("withScope"); out.push(`${I}withScope($, ${this.e(s.obj)}, ($, $$) => {`, ...this.stmts(s.body, ind + 1), `${I}});`); break;
        default: throw new Error("stmt " + s.s);
      }
    }
    return out;
  }
  setMemLine(I, o, n, v) {
    if (this.isRootRef(o)) return `${I}${this.memRef(o, n, false)} = ${this.e(v)};`;
    this.fx.helpers.add("set");
    return `${I}set(${this.e(o)}, ${this.e(n)}, ${this.e(v)});`;
  }
}

// ------------------------------------------------------------------ fallback: explicit stack
function fallback(ins, fx, ind) {
  fx.fallbacks++;
  const I = "  ".repeat(ind); const out = [`${I}// Structured translation was not possible for this block; this is an exact`, `${I}// instruction-by-instruction translation using an explicit operand stack.`, `${I}const S: any[] = []; let pc = 0;`, `${I}dispatch: for (;;) switch (pc) {`];
  const targets = new Set([ins[0]?.off ?? 0]);
  for (const x of ins) if (x.op === 0x99 || x.op === 0x9d) targets.add(x.target);
  const withEnds = new Map(); for (const x of ins) if (x.op === 0x94) withEnds.set(x.withEnd, (withEnds.get(x.withEnd) || 0) + 1);
  const J = I + "    "; const lit2 = (v) => new Printer(fx).litStr(v);
  const P = (s) => out.push(J + s); const h = (n) => { fx.helpers.add(n); return n; };
  for (const x of ins) {
    if (targets.has(x.off)) out.push(`${I}  case ${x.off}:`);
    for (let k = 0; k < (withEnds.get(x.off) || 0); k++) P(`$ = ${h("endWith")}($);`);
    switch (x.op) {
      case 0: P("return;"); break;
      case 0x88: break;
      case 0x96: P(`S.push(${x.vals.map((v) => (v.k === "reg" ? fx.reg(v.n) : lit2(v.v))).join(", ")});`); break;
      case 0x17: P("S.pop();"); break;
      case 0x4c: P("S.push(S[S.length - 1]);"); break;
      case 0x4d: P("{ const b = S.pop(), a = S.pop(); S.push(b, a); }"); break;
      case 0x87: P(`${fx.reg(x.reg)} = S[S.length - 1];`); break;
      case 0x1c: P(`S.push(${h("getVar")}($, S.pop()));`); break;
      case 0x1d: P(`{ const v = S.pop(); ${h("setVar")}($, S.pop(), v); }`); break;
      case 0x4e: P(`{ const n = S.pop(); S.push(${h("getMem")}(S.pop(), n)); }`); break;
      case 0x4f: P(`{ const v = S.pop(), n = S.pop(); ${h("set")}(S.pop(), n, v); }`); break;
      case 0x3d: P(`{ const n = S.pop(); S.push(${h("callVar")}($, n, ${h("popArgs")}(S))); }`); break;
      case 0x52: P(`{ const n = S.pop(), o = S.pop(); S.push(${h("callMethod")}(o, n, ${h("popArgs")}(S))); }`); break;
      case 0x40: P(`{ const n = S.pop(); S.push(${h("newObj")}(${h("getVar")}($, n), ...${h("popArgs")}(S))); }`); break;
      case 0x53: P(`{ const n = S.pop(), o = S.pop(); S.push(${h("newObj")}(n === undefined || n === "" ? o : ${h("getMem")}(o, n), ...${h("popArgs")}(S))); }`); break;
      case 0x42: P(`S.push(${h("popArgs")}(S));`); break;
      case 0x43: P(`{ const n = S.pop(), o: any = {}; for (let k = 0; k < n; k++) { const v = S.pop(); o[S.pop()] = v; } S.push(${h("obj")}(o)); }`); break;
      case 0x3c: P(`{ const v = S.pop(); $$[S.pop()] = v; }`); break;
      case 0x41: P(`${h("declare")}($$, S.pop());`); break;
      case 0x3a: P(`{ const n = S.pop(); S.push(${h("del")}(S.pop(), n)); }`); break;
      case 0x3b: P(`S.push(${h("deleteVar")}($, S.pop()));`); break;
      case 0x3e: P("return S.pop();"); break;
      case 0x46: P(`{ const o = ${h("getVar")}($, S.pop()); S.push(null, ...${h("keys")}(o).reverse()); }`); break;
      case 0x55: P(`{ const o = S.pop(); S.push(null, ...${h("keys")}(o).reverse()); }`); break;
      case 0x12: P(`S.push(!${h("truthy")}(S.pop()));`); break;
      case 0x9d: P(`if (${h("truthy")}(S.pop())) { pc = ${x.target}; continue dispatch; }`); break;
      case 0x99: P(`pc = ${x.target}; continue dispatch;`); break;
      case 0x94: P(`$ = ${h("beginWith")}($, S.pop());`); break;
      case 0x9b: case 0x8e: { const src = decompileFunction(x, fx.depth + 1, fx); if (x.name) P(`$$[${JSON.stringify(x.name)}] = ${src};`); else P(`S.push(${src});`); break; }
      default: {
        const bin = { 0x47: "add", 0x0b: "sub", 0x0c: "mul", 0x0d: "div", 0x3f: "mod", 0x49: "eq", 0x66: "seq", 0x48: "lt", 0x67: "gt", 0x0a: "numAdd", 0x0e: "numEq", 0x0f: "numLt", 0x13: "strEq", 0x29: "strLt", 0x68: "strGt", 0x21: "concat", 0x60: "bitAnd", 0x61: "bitOr", 0x62: "bitXor", 0x63: "shl", 0x64: "shr", 0x65: "ushr", 0x54: "instanceOf" }[x.op];
        if (bin) { P(`{ const b = S.pop(), a = S.pop(); S.push(${h(bin)}(a, b)); }`); break; }
        const un = { 0x50: "inc", 0x51: "dec", 0x4a: "num", 0x4b: "str", 0x18: "int", 0x44: "typeOf", 0x14: "strlen", 0x45: "targetPath" }[x.op];
        if (un) { P(`S.push(${h(un)}(S.pop()));`); break; }
        if (x.op === 0x10 || x.op === 0x11) { P(`{ const b = S.pop(), a = S.pop(); S.push(${h("truthy")}(a) ${x.op === 0x10 ? "&&" : "||"} ${h("truthy")}(b)); }`); break; }
        const scoped = { 0x04: "nextFrame", 0x05: "prevFrame", 0x06: "play", 0x07: "stop", 0x09: "stopAllSounds", 0x28: "stopDrag" }[x.op];
        if (scoped) { P(`${h(scoped)}($);`); break; }
        if (x.op === 0x81) { P(`${h("gotoAndStop")}($, ${x.frame + 1});`); break; }
        if (x.op === 0x8c) { P(`${h("gotoLabel")}($, ${JSON.stringify(x.name)});`); break; }
        if (x.op === 0x9f) { P(`${h(x.play ? "gotoAndPlay" : "gotoAndStop")}($, S.pop()${x.bias ? `, ${x.bias}` : ""});`); break; }
        if (x.op === 0x83) { P(`${h("getURL")}($, ${JSON.stringify(x.url)}, ${JSON.stringify(x.tgt)});`); break; }
        if (x.op === 0x9a) { P(`{ const t = S.pop(), u = S.pop(); ${h("getURL")}($, u, t, ${x.flags}); }`); break; }
        if (x.op === 0x8b) { P(`$ = ${h("tellTarget")}($, ${JSON.stringify(x.name)});`); break; }
        if (x.op === 0x20) { P(`$ = ${h("tellTarget")}($, S.pop());`); break; }
        if (x.op === 0x30) { P(`S.push(${h("random")}($, S.pop()));`); break; }
        if (x.op === 0x34) { P(`S.push(${h("getTimer")}($));`); break; }
        if (x.op === 0x26) { P(`${h("trace")}($, S.pop());`); break; }
        if (x.op === 0x22) { P(`{ const i = S.pop(), t = S.pop(); S.push(${h("getProperty")}($, t, i)); }`); break; }
        if (x.op === 0x23) { P(`{ const v = S.pop(), i = S.pop(), t = S.pop(); ${h("setProperty")}($, t, i, v); }`); break; }
        if (x.op === 0x24) { P(`{ const d = S.pop(), n = S.pop(), s = S.pop(); ${h("duplicateMovieClip")}($, s, n, d); }`); break; }
        if (x.op === 0x25) { P(`${h("removeMovieClip")}($, S.pop());`); break; }
        if (x.op === 0x27) { P(`{ const t = S.pop(), l = S.pop(), c = S.pop(); if (${h("truthy")}(c)) { const y2 = S.pop(), x2 = S.pop(), y1 = S.pop(), x1 = S.pop(); ${h("startDrag")}($, t, l, x1, y1, x2, y2); } else ${h("startDrag")}($, t, l); }`); break; }
        if (x.op === 0x15) { P(`{ const c = S.pop(), i = S.pop(); S.push(${h("substr")}(S.pop(), i, c)); }`); break; }
        if (x.op === 0x9e) { P(`${h("callFrame")}($, S.pop());`); break; }
        if (x.op === 0x8a || x.op === 0x8d) { if (x.op === 0x8d) P("S.pop();"); break; }
        throw new Error("fallback: unsupported opcode 0x" + x.op.toString(16));
      }
    }
  }
  out.push(`${I}  default: return;`, `${I}}`);
  return out;
}

// ------------------------------------------------------------------ functions and blocks
function bodyLines(ins, fx, ind) {
  fx.blocks++;
  try {
    const s = new Structurer(ins, fx); const r = s.run(0, ins.length, null, []);
    if (r.stack.some((v) => hasSide(v))) for (const v of r.stack) if (hasSide(v)) r.st.push({ s: "expr", e: v });
    return new Printer(fx).stmts(r.st, ind);
  } catch (e) {
    if (!(e instanceof Fail)) throw e;
    (globalThis.__hfrFailReasons ??= new Map()).set(e.message, (globalThis.__hfrFailReasons.get(e.message) || 0) + 1);
    return fallback(ins, fx, ind);
  }
}

// Macromedia's component compiler saves registers on the operand stack at
// function entry (Push r1, r2…) and restores them before leaving
// (StoreRegister rN; Pop …). Generated TypeScript gives every call fresh
// register variables, so the save/restore pair is redundant and is removed.
function stripRegisterSave(ins) {
  const first = ins[0];
  if (!first || first.op !== 0x96 || !first.vals.length || first.vals[0].k !== "reg") return ins;
  let nSaved = 0; while (nSaved < first.vals.length && first.vals[nSaved].k === "reg") nSaved++;
  const saved = first.vals.slice(0, nSaved).map((v) => v.n);
  if (nSaved < first.vals.length) { // the save was merged with the next push: keep the rest
    const rest = { ...first, vals: first.vals.slice(nSaved) };
    const r = stripRegisterSave([{ ...first, vals: first.vals.slice(0, nSaved) }, rest, ...ins.slice(1)]);
    return r.length && r[0] === rest ? r : r[0]?.op === 0x96 && r[0].vals === rest.vals ? r : ins;
  }
  let end = ins.length; while (end > 0 && ins[end - 1].op === 0) end--;
  // Form B: "return x" sites jump to a shared exit block:
  //   StoreRegister rR; Pop; (StoreRegister rN; Pop)*; Push rR; Return
  if (ins[end - 1]?.op === 0x3e && ins[end - 2]?.op === 0x96 && ins[end - 2].vals.length === 1 && ins[end - 2].vals[0].k === "reg") {
    const R = ins[end - 2].vals[0].n; let k = end - 2; let ok = true;
    for (let n = 0; n < saved.length; n++) { const pop = ins[k - 1], store = ins[k - 2]; if (!pop || !store || pop.op !== 0x17 || store.op !== 0x87 || store.reg !== saved[n]) { ok = false; break; } k -= 2; }
    if (ok && ins[k - 1]?.op === 0x17 && ins[k - 2]?.op === 0x87 && ins[k - 2].reg === R) {
      let eStart = k - 2; const exitOffs = new Set([ins[eStart].off]);
      while (eStart > 1 && ins[eStart - 1].op === 0x96 && ins[eStart - 1].vals.length === 0) { eStart--; exitOffs.add(ins[eStart].off); }
      const body = ins.slice(1, eStart).map((x) => (x.op === 0x99 && exitOffs.has(x.target) ? { off: x.off, end: x.end, op: 0x3e } : x));
      const last = body[body.length - 1];
      if (!last || (last.op !== 0x3e && last.op !== 0x99)) body.push({ off: ins[eStart].off, end: ins[eStart].off, op: 0x3e });
      for (const x of body) if ((x.op === 0x99 || x.op === 0x9d) && exitOffs.has(x.target)) return ins;
      return body;
    }
  }
  const tail = []; let k = end;
  for (let n = 0; n < saved.length; n++) {
    const pop = ins[k - 1], store = ins[k - 2];
    if (!pop || !store || pop.op !== 0x17 || store.op !== 0x87 || store.reg !== saved[n]) return ins;
    k -= 2; tail.push(store);
  }
  // Every return must also restore; only strip when there are no early returns.
  for (let q = 1; q < k; q++) if (ins[q].op === 0x3e) return ins;
  return ins.slice(1, k);
}

const PRELOAD = [[0x0001, "_this"], [0x0004, "_arguments"], [0x0010, "_super"], [0x0040, "_root"], [0x0080, "_parent"], [0x0100, "_global"]];
export function decompileFunction(x, depth, parentFx) {
  const regNames = {};
  if (x.df2) {
    let r = 1; for (const [flag, name] of PRELOAD) if (x.flags & flag) regNames[r++] = name;
    for (const p of x.params) if (p.reg) regNames[p.reg] = safeIdent(p.name, regNames);
  }
  const fx = new FnContext(regNames, depth); fx.temp = 0;
  const lines = bodyLines(stripRegisterSave(x.body), fx, depth + 1);
  for (const h of fx.helpers) parentFx.helpers.add(h);
  parentFx.fallbacks += fx.fallbacks; parentFx.blocks += fx.blocks;
  const I = "  ".repeat(depth);
  const decl = declareRegs(fx, x.df2 ? x.regCount : 4, x.df2, regNames, depth + 1);
  parentFx.helpers.add(x.df2 ? "fn2" : "fn");
  const name = JSON.stringify(x.name || "");
  if (x.df2) {
    const spec = `{ params: ${JSON.stringify(x.params.map((p) => p.name))}, paramRegs: ${JSON.stringify(x.params.map((p) => p.reg))}, regs: ${x.regCount}, flags: 0x${x.flags.toString(16)} }`;
    return `fn2($, ${name}, ${spec}, ($, $$, R) => {\n${decl}${lines.join("\n")}\n${I}})`;
  }
  return `fn($, ${name}, ${JSON.stringify(x.params.map((p) => p.name))}, ($, $$) => {\n${decl}${lines.join("\n")}\n${I}})`;
}
function safeIdent(name, taken) { let n = ID_RE.test(name) && !/^(R|S|pc|\$|\$\$)$/.test(name) ? name : `p_${name.replace(/\W/g, "_")}`; while (Object.values(taken).includes(n)) n += "_"; return n; }
function declareRegs(fx, count, df2, regNames, ind) {
  const I = "  ".repeat(ind); const used = [...fx.usedRegs].sort((a, b) => a - b);
  if (!used.length && !df2) return "";
  if (df2) {
    const names = new Set(); const parts = [];
    for (const r of used) { const n = fx.reg(r); if (!names.has(n)) { names.add(n); parts.push(`${n} = R[${r}]`); } }
    return parts.length ? `${I}let ${parts.join(", ")};\n` : "";
  }
  return `${I}let ${used.map((r) => `${fx.reg(r)}: any`).join(", ")};\n`;
}

// Decompile a top-level action block (frame, init, clip event or button action).
export function decompileBlock(bytes, ind = 2) {
  const ins = disassemble(bytes);
  const fx = new FnContext({}, ind - 1);
  const lines = bodyLines(ins, fx, ind);
  const decl = declareRegs(fx, 4, false, {}, ind);
  return { code: decl + lines.join("\n"), helpers: fx.helpers, fallbacks: fx.fallbacks, blocks: fx.blocks };
}
