import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {lstat, open, realpath} from "node:fs/promises";
import path from "node:path";

import {
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
} from "./lesson-animate-production-trust.mjs";

export const LESSON_ANIMATE_EXECUTION_CODE_CLOSURE_SCHEMA_VERSION = 1;
export const LESSON_ANIMATE_EXECUTION_CODE_CLOSURE_RELEASE_ID =
  "lesson-g04-l10-perimeter-area";

const MANIFEST_KIND = "lesson-animate-execution-code-closure";
const TOOLCHAIN_KEYS = Object.freeze([
  "aclProbe",
  "nodeExecutable",
  "processProbe",
  "jsfl",
  "animateExecutable",
  "replayLockHelper",
]);
const ALLOWED_NODE_BUILTINS = new Set([
  "node:child_process",
  "node:crypto",
  "node:fs",
  "node:fs/promises",
  "node:os",
  "node:path",
  "node:url",
  "node:util",
]);
const AUTHORITY_BOUNDARY = Object.freeze({
  animateExecution: false,
  originalRuntimeBehavior: false,
  ruffleBaseline: false,
  audioCueAcceptance: false,
  javascriptFidelity: false,
  humanVisualReview: false,
  ownerAcceptance: false,
  strictAcceptance: false,
  wholeLessonIntegration: false,
  publication: false,
});
const VALIDATED_CONTEXTS = new WeakMap();
const REPLAY_LOCK_HELPER_AUTHORITIES = Object.freeze({
  diagnostic: "diagnostic-project-fixture",
  production: "fixed-root-owned-production",
});

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`Lesson Animate execution code closure: ${message}`);
  }
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map((entry) => canonicalize(entry));
  if (value && typeof value === "object") {
    invariant(Object.getPrototypeOf(value) === Object.prototype,
      "canonical JSON accepts only plain objects and arrays");
    return Object.fromEntries(Object.keys(value).sort().map((key) => {
      invariant(value[key] !== undefined, `canonical JSON field ${key} is undefined`);
      return [key, canonicalize(value[key])];
    }));
  }
  invariant(value === null || ["string", "number", "boolean"].includes(typeof value),
    "canonical JSON contains an unsupported value");
  invariant(typeof value !== "number" || Number.isFinite(value),
    "canonical JSON contains a non-finite number");
  return value;
}

export function canonicalLessonAnimateExecutionCodeClosureJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function sha256LessonAnimateExecutionCodeClosure(value) {
  const bytes = Buffer.isBuffer(value) || value instanceof Uint8Array
    ? value
    : Buffer.from(canonicalLessonAnimateExecutionCodeClosureJson(value), "utf8");
  return sha256Bytes(bytes);
}

function portableRelativePath(projectRoot, absoluteFile) {
  const relative = path.relative(projectRoot, absoluteFile);
  invariant(relative && !path.isAbsolute(relative),
    `file is not below project root: ${absoluteFile}`);
  invariant(relative !== ".." && !relative.startsWith(`..${path.sep}`),
    `file escapes project root: ${absoluteFile}`);
  invariant(!relative.includes("\\"),
    `project-relative path is not portable: ${relative}`);
  return relative.split(path.sep).join("/");
}

function validateProjectRelativePath(file, label, extension = null) {
  invariant(typeof file === "string" && file.length > 0, `${label} must be a non-empty string`);
  invariant(!file.includes("\\"), `${label} must use portable forward slashes`);
  invariant(!path.posix.isAbsolute(file), `${label} must be project-relative`);
  invariant(!/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(file), `${label} must not be a URL`);
  invariant(path.posix.normalize(file) === file, `${label} must be normalized`);
  invariant(file !== "." && file !== ".." && !file.startsWith("../") && !file.includes("/../"),
    `${label} must not escape the project`);
  if (extension) invariant(path.posix.extname(file) === extension,
    `${label} must end in ${extension}`);
  return file;
}

function fileIdentity(info) {
  return {
    dev: info.dev,
    ino: info.ino,
    size: info.size,
    mtimeNs: info.mtimeNs,
    ctimeNs: info.ctimeNs,
    mode: info.mode,
    nlink: info.nlink,
    uid: info.uid,
    gid: info.gid,
  };
}

function sameIdentityAndVersion(left, right) {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs
    && left.mode === right.mode
    && left.nlink === right.nlink
    && left.uid === right.uid
    && left.gid === right.gid;
}

function assertOrdinarySingleLink(info, label) {
  invariant(info.isFile() && !info.isSymbolicLink(), `${label} must be an ordinary file`);
  invariant(info.nlink === 1n, `${label} must have exactly one physical link`);
}

async function readStablePhysicalFile(absoluteFile, label) {
  invariant(path.isAbsolute(absoluteFile), `${label} must resolve to an absolute path`);
  invariant(Number.isInteger(fsConstants.O_NOFOLLOW), "O_NOFOLLOW is unavailable on this platform");

  const before = await lstat(absoluteFile, {bigint: true});
  assertOrdinarySingleLink(before, label);
  invariant(await realpath(absoluteFile) === absoluteFile,
    `${label} or one of its ancestors is a symbolic link`);

  const handle = await open(absoluteFile, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const descriptorBefore = await handle.stat({bigint: true});
    assertOrdinarySingleLink(descriptorBefore, label);
    invariant(sameIdentityAndVersion(fileIdentity(before), fileIdentity(descriptorBefore)),
      `${label} changed between lstat and open`);

    const bytes = await handle.readFile();
    const descriptorAfter = await handle.stat({bigint: true});
    assertOrdinarySingleLink(descriptorAfter, label);
    invariant(sameIdentityAndVersion(fileIdentity(descriptorBefore), fileIdentity(descriptorAfter)),
      `${label} changed while its descriptor was read`);
    invariant(descriptorAfter.size === BigInt(bytes.length),
      `${label} descriptor size does not match bytes read`);

    const after = await lstat(absoluteFile, {bigint: true});
    assertOrdinarySingleLink(after, label);
    invariant(sameIdentityAndVersion(fileIdentity(descriptorAfter), fileIdentity(after)),
      `${label} changed between descriptor read and final lstat`);
    invariant(await realpath(absoluteFile) === absoluteFile,
      `${label} became or acquired a symbolic-link ancestor while read`);

    return Object.freeze({
      bytes,
      sha256: sha256Bytes(bytes),
      size: bytes.length,
      mode: Number(after.mode & 0o7777n).toString(8).padStart(4, "0"),
    });
  } finally {
    await handle.close();
  }
}

async function resolveProjectRoot(projectRoot) {
  invariant(typeof projectRoot === "string" && path.isAbsolute(projectRoot),
    "projectRoot must be absolute");
  const absolute = path.resolve(projectRoot);
  invariant(await realpath(absolute) === absolute,
    "projectRoot or one of its ancestors is a symbolic link");
  const info = await lstat(absolute, {bigint: true});
  invariant(info.isDirectory() && !info.isSymbolicLink(), "projectRoot must be a real directory");
  return absolute;
}

export async function describeLessonAnimateExecutionFile({
  projectRoot,
  file,
  scope = "project",
  executable = false,
}) {
  const root = await resolveProjectRoot(projectRoot);
  invariant(scope === "project" || scope === "absolute", "descriptor scope is invalid");
  let manifestFile;
  let absoluteFile;
  if (scope === "project") {
    manifestFile = validateProjectRelativePath(file, "descriptor file");
    absoluteFile = path.resolve(root, ...manifestFile.split("/"));
    invariant(portableRelativePath(root, absoluteFile) === manifestFile,
      "descriptor file does not resolve canonically below projectRoot");
  } else {
    invariant(typeof file === "string" && path.isAbsolute(file),
      "absolute descriptor file must be absolute");
    absoluteFile = path.resolve(file);
    invariant(absoluteFile === file, "absolute descriptor file must be normalized");
    manifestFile = absoluteFile;
  }
  const physical = await readStablePhysicalFile(absoluteFile, `descriptor ${manifestFile}`);
  invariant(!executable || (Number.parseInt(physical.mode, 8) & 0o111) !== 0,
    `descriptor ${manifestFile} must have an executable mode`);
  return Object.freeze({
    file: manifestFile,
    sha256: physical.sha256,
    bytes: physical.size,
    mode: physical.mode,
  });
}

function isIdentifierStart(character) {
  return /[A-Za-z_$]/u.test(character);
}

function isIdentifierPart(character) {
  return /[A-Za-z0-9_$]/u.test(character);
}

function regexMayStartAfter(previous) {
  if (!previous) return true;
  if (previous.type === "punct") {
    return ["(", "[", "{", ",", ";", ":", "=", "!", "?", "&", "|", "+", "-", "*",
      "%", "^", "~", "<", ">", "${", "control)"].includes(previous.value);
  }
  return previous.type === "identifier"
    && ["return", "throw", "case", "delete", "void", "typeof", "instanceof", "in", "of",
      "yield", "await", "else", "do"].includes(previous.value);
}

function tokenizeModule(source, label) {
  const tokens = [];
  const parenthesisKinds = [];
  const length = source.length;

  function token(type, value, escaped = false) {
    tokens.push({type, value, escaped});
  }

  function scanQuoted(start, quote) {
    let index = start + 1;
    let value = "";
    let escaped = false;
    while (index < length) {
      const character = source[index];
      if (character === quote) {
        token("string", value, escaped);
        return index + 1;
      }
      invariant(character !== "\n" && character !== "\r", `${label} has an unterminated string`);
      if (character === "\\") {
        escaped = true;
        invariant(index + 1 < length, `${label} has an unterminated string escape`);
        const next = source[index + 1];
        const simple = {n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", 0: "\0"};
        value += Object.hasOwn(simple, next) ? simple[next] : next;
        index += 2;
      } else {
        value += character;
        index += 1;
      }
    }
    throw new Error(`Lesson Animate execution code closure: ${label} has an unterminated string`);
  }

  function scanRegex(start) {
    let index = start + 1;
    let inClass = false;
    while (index < length) {
      const character = source[index];
      invariant(character !== "\n" && character !== "\r", `${label} has an unterminated regex literal`);
      if (character === "\\") {
        invariant(index + 1 < length, `${label} has an unterminated regex escape`);
        index += 2;
      } else if (character === "[") {
        inClass = true;
        index += 1;
      } else if (character === "]") {
        inClass = false;
        index += 1;
      } else if (character === "/" && !inClass) {
        index += 1;
        while (index < length && /[A-Za-z]/u.test(source[index])) index += 1;
        return index;
      } else {
        index += 1;
      }
    }
    throw new Error(`Lesson Animate execution code closure: ${label} has an unterminated regex literal`);
  }

  function scanTemplate(start) {
    let index = start + 1;
    while (index < length) {
      const character = source[index];
      if (character === "\\") {
        invariant(index + 1 < length, `${label} has an unterminated template escape`);
        index += 2;
      } else if (character === "`") {
        token("template", "`...`");
        return index + 1;
      } else if (character === "$" && source[index + 1] === "{") {
        token("punct", "${");
        index = scanCode(index + 2, true);
        token("punct", "}");
      } else {
        index += 1;
      }
    }
    throw new Error(`Lesson Animate execution code closure: ${label} has an unterminated template literal`);
  }

  function scanCode(start, stopAtTemplateBrace) {
    let index = start;
    let braceDepth = 0;
    while (index < length) {
      const character = source[index];
      if (/\s/u.test(character)) {
        index += 1;
        continue;
      }
      if (character === "/" && source[index + 1] === "/") {
        index += 2;
        while (index < length && source[index] !== "\n" && source[index] !== "\r") index += 1;
        continue;
      }
      if (character === "/" && source[index + 1] === "*") {
        const end = source.indexOf("*/", index + 2);
        invariant(end >= 0, `${label} has an unterminated block comment`);
        index = end + 2;
        continue;
      }
      if (character === "\"" || character === "'") {
        index = scanQuoted(index, character);
        continue;
      }
      if (character === "`") {
        index = scanTemplate(index);
        continue;
      }
      if (isIdentifierStart(character)) {
        let end = index + 1;
        while (end < length && isIdentifierPart(source[end])) end += 1;
        token("identifier", source.slice(index, end));
        index = end;
        continue;
      }
      if (/[0-9]/u.test(character)) {
        let end = index + 1;
        while (end < length && /[A-Za-z0-9_.]/u.test(source[end])) end += 1;
        token("number", source.slice(index, end));
        index = end;
        continue;
      }
      const doublePunctuator = source.slice(index, index + 2);
      if (doublePunctuator === "++" || doublePunctuator === "--") {
        token("punct", doublePunctuator);
        index += 2;
        continue;
      }
      if (character === "(") {
        const previous = tokens.at(-1);
        const beforePrevious = tokens.at(-2);
        const control = previous?.type === "identifier"
          && (["if", "while", "for", "with"].includes(previous.value)
            || (previous.value === "await" && beforePrevious?.type === "identifier"
              && beforePrevious.value === "for"));
        parenthesisKinds.push(control ? "control" : "ordinary");
        token("punct", "(");
        index += 1;
        continue;
      }
      if (character === ")") {
        const kind = parenthesisKinds.pop();
        token("punct", kind === "control" ? "control)" : ")");
        index += 1;
        continue;
      }
      if (character === "/" && regexMayStartAfter(tokens.at(-1))) {
        index = scanRegex(index);
        token("regex", "/.../");
        continue;
      }
      if (character === "{" && stopAtTemplateBrace) {
        braceDepth += 1;
        token("punct", character);
        index += 1;
        continue;
      }
      if (character === "}" && stopAtTemplateBrace) {
        if (braceDepth === 0) return index + 1;
        braceDepth -= 1;
        token("punct", character);
        index += 1;
        continue;
      }
      token("punct", character);
      index += 1;
    }
    invariant(!stopAtTemplateBrace, `${label} has an unterminated template expression`);
    return index;
  }

  scanCode(0, false);
  return tokens;
}

function staticModuleSpecifiers(source, label) {
  const tokens = tokenizeModule(source, label);
  const specifiers = [];

  function recordString(index, syntax) {
    const value = tokens[index];
    invariant(value?.type === "string", `${label} has malformed ${syntax}`);
    invariant(!value.escaped, `${label} uses an escaped ${syntax} specifier`);
    specifiers.push(value.value);
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const current = tokens[index];
    if (current.type === "identifier" && current.value === "require"
      && tokens[index + 1]?.type === "punct" && tokens[index + 1]?.value === "(") {
      throw new Error(`Lesson Animate execution code closure: ${label} uses require()`);
    }
    if (current.type === "identifier" && current.value === "createRequire"
      && tokens[index + 1]?.type === "punct" && tokens[index + 1]?.value === "(") {
      throw new Error(`Lesson Animate execution code closure: ${label} uses createRequire()`);
    }
    if (current.type === "identifier" && current.value === "getBuiltinModule"
      && tokens[index + 1]?.type === "punct" && tokens[index + 1]?.value === "(") {
      throw new Error(`Lesson Animate execution code closure: ${label} uses process.getBuiltinModule()`);
    }
    if (current.type === "identifier" && current.value === "register"
      && tokens[index - 1]?.type === "punct" && tokens[index - 1]?.value === "."
      && tokens[index - 2]?.type === "identifier" && tokens[index - 2]?.value === "module"
      && tokens[index + 1]?.type === "punct" && tokens[index + 1]?.value === "(") {
      throw new Error(`Lesson Animate execution code closure: ${label} uses module.register()`);
    }
    if (current.type !== "identifier" || current.value !== "import") continue;
    if (tokens[index - 1]?.type === "punct" && tokens[index - 1]?.value === ".") continue;
    const next = tokens[index + 1];
    if (next?.type === "punct" && next.value === "(") {
      throw new Error(`Lesson Animate execution code closure: ${label} uses dynamic import()`);
    }
    if (next?.type === "punct" && next.value === ".") continue;
    if (next?.type === "string") {
      recordString(index + 1, "import");
      continue;
    }
    let fromIndex = -1;
    for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
      if (tokens[cursor].type === "punct" && tokens[cursor].value === ";") break;
      if (tokens[cursor].type === "identifier" && tokens[cursor].value === "from") {
        fromIndex = cursor;
        break;
      }
    }
    invariant(fromIndex >= 0, `${label} has an unsupported or malformed import declaration`);
    recordString(fromIndex + 1, "import-from");
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const current = tokens[index];
    if (current.type !== "identifier" || current.value !== "export") continue;
    const next = tokens[index + 1];
    if (next?.type === "punct" && next.value === "*") {
      let fromIndex = -1;
      for (let cursor = index + 2; cursor < tokens.length; cursor += 1) {
        if (tokens[cursor].type === "punct" && tokens[cursor].value === ";") break;
        if (tokens[cursor].type === "identifier" && tokens[cursor].value === "from") {
          fromIndex = cursor;
          break;
        }
      }
      invariant(fromIndex >= 0, `${label} has a malformed export-from declaration`);
      recordString(fromIndex + 1, "export-from");
      continue;
    }
    if (next?.type !== "punct" || next.value !== "{") continue;
    let depth = 0;
    let closeIndex = -1;
    for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
      if (tokens[cursor].type === "punct" && tokens[cursor].value === "{") depth += 1;
      if (tokens[cursor].type === "punct" && tokens[cursor].value === "}") {
        depth -= 1;
        if (depth === 0) {
          closeIndex = cursor;
          break;
        }
      }
    }
    invariant(closeIndex >= 0, `${label} has a malformed named export declaration`);
    if (tokens[closeIndex + 1]?.type === "identifier" && tokens[closeIndex + 1].value === "from") {
      recordString(closeIndex + 2, "export-from");
    }
  }
  return specifiers;
}

function resolveStaticSpecifier(projectRoot, importer, specifier) {
  if (specifier.startsWith("node:")) {
    invariant(ALLOWED_NODE_BUILTINS.has(specifier),
      `${importer} imports a Node builtin outside the execution allowlist: ${specifier}`);
    return null;
  }
  invariant(!/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(specifier),
    `${importer} imports a URL or local file URL: ${specifier}`);
  invariant(!path.posix.isAbsolute(specifier) && !/^[A-Za-z]:[\\/]/u.test(specifier),
    `${importer} imports an absolute path: ${specifier}`);
  invariant(specifier.startsWith("./") || specifier.startsWith("../"),
    `${importer} imports a bare package: ${specifier}`);
  invariant(!specifier.includes("?") && !specifier.includes("#"),
    `${importer} imports a query or fragment path: ${specifier}`);
  invariant(!specifier.includes("%"),
    `${importer} import must not use URL percent-encoding: ${specifier}`);
  invariant(!specifier.includes("\\"), `${importer} import path is not portable: ${specifier}`);

  const importerAbsolute = path.resolve(projectRoot, ...importer.split("/"));
  const resolved = path.resolve(path.dirname(importerAbsolute), ...specifier.split("/"));
  const relative = portableRelativePath(projectRoot, resolved);
  invariant(path.posix.extname(relative) === ".mjs",
    `${importer} import must resolve to an explicit .mjs file: ${specifier}`);
  return relative;
}

async function describeModule(projectRoot, file) {
  validateProjectRelativePath(file, "module file", ".mjs");
  const absolute = path.resolve(projectRoot, ...file.split("/"));
  invariant(portableRelativePath(projectRoot, absolute) === file,
    `module file does not resolve canonically: ${file}`);
  const physical = await readStablePhysicalFile(absolute, `module ${file}`);
  let source;
  try {
    source = new TextDecoder("utf-8", {fatal: true}).decode(physical.bytes);
  } catch {
    throw new Error(`Lesson Animate execution code closure: module ${file} is not valid UTF-8 text`);
  }
  const imports = [...new Set(staticModuleSpecifiers(source, `module ${file}`)
    .map((specifier) => resolveStaticSpecifier(projectRoot, file, specifier))
    .filter(Boolean))].sort();
  return Object.freeze({
    entry: Object.freeze({
      file,
      sha256: physical.sha256,
      bytes: physical.size,
      mode: physical.mode,
      imports,
    }),
    imports,
  });
}

async function discoverModuleGraph(projectRoot, entrypoint) {
  const pending = new Set([entrypoint]);
  const modules = new Map();
  while (pending.size > 0) {
    const file = [...pending].sort()[0];
    pending.delete(file);
    if (modules.has(file)) continue;
    const described = await describeModule(projectRoot, file);
    modules.set(file, described.entry);
    for (const imported of described.imports) {
      if (!modules.has(imported)) pending.add(imported);
    }
  }
  return [...modules.values()].sort((left, right) => {
    if (left.file < right.file) return -1;
    if (left.file > right.file) return 1;
    return 0;
  });
}

async function normalizeToolchain(projectRoot, toolchain) {
  invariant(toolchain && typeof toolchain === "object" && !Array.isArray(toolchain),
    "toolchain must be an object");
  invariant(Object.keys(toolchain).sort().join("\0") === [...TOOLCHAIN_KEYS].sort().join("\0"),
    "toolchain keys do not match the fixed schema");

  invariant(typeof toolchain.aclProbe === "string" && path.isAbsolute(toolchain.aclProbe),
    "aclProbe must be absolute");
  const fixedAclProbe = await realpath("/bin/ls");
  const suppliedAclProbe = await realpath(toolchain.aclProbe);
  invariant(suppliedAclProbe === fixedAclProbe,
    "aclProbe must identify /bin/ls or its fixed realpath");

  invariant(typeof toolchain.nodeExecutable === "string" && path.isAbsolute(toolchain.nodeExecutable),
    "nodeExecutable must be absolute");
  const expectedNode = await realpath(process.execPath);
  const suppliedNode = await realpath(toolchain.nodeExecutable);
  invariant(suppliedNode === expectedNode, "nodeExecutable does not identify the running Node.js binary");

  invariant(typeof toolchain.processProbe === "string" && path.isAbsolute(toolchain.processProbe),
    "processProbe must be absolute");
  const fixedProcessProbe = await realpath("/bin/ps");
  const suppliedProcessProbe = await realpath(toolchain.processProbe);
  invariant(suppliedProcessProbe === fixedProcessProbe,
    "processProbe must identify /bin/ps or its fixed realpath");

  const jsfl = validateProjectRelativePath(toolchain.jsfl, "jsfl", ".jsfl");
  invariant(typeof toolchain.replayLockHelper === "string"
    && toolchain.replayLockHelper.length > 0, "replayLockHelper must be a non-empty string");
  let replayLockHelper;
  let replayLockHelperScope;
  let replayLockHelperAuthority;
  if (path.isAbsolute(toolchain.replayLockHelper)) {
    invariant(path.resolve(toolchain.replayLockHelper) === toolchain.replayLockHelper,
      "absolute replayLockHelper must be normalized");
    invariant(toolchain.replayLockHelper === LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
      "absolute replayLockHelper must be the fixed production helper path");
    replayLockHelper = toolchain.replayLockHelper;
    replayLockHelperScope = "absolute";
    replayLockHelperAuthority = REPLAY_LOCK_HELPER_AUTHORITIES.production;
  } else {
    replayLockHelper = validateProjectRelativePath(toolchain.replayLockHelper,
      "replayLockHelper");
    replayLockHelperScope = "project";
    replayLockHelperAuthority = REPLAY_LOCK_HELPER_AUTHORITIES.diagnostic;
  }
  invariant(typeof toolchain.animateExecutable === "string"
    && path.isAbsolute(toolchain.animateExecutable), "animateExecutable must be absolute");
  invariant(path.resolve(toolchain.animateExecutable) === toolchain.animateExecutable,
    "animateExecutable must be normalized");

  return Object.freeze({
    aclProbe: fixedAclProbe,
    nodeExecutable: expectedNode,
    processProbe: fixedProcessProbe,
    jsfl,
    animateExecutable: toolchain.animateExecutable,
    replayLockHelper,
    replayLockHelperScope,
    replayLockHelperAuthority,
  });
}

async function describeToolchain(projectRoot, normalized) {
  const descriptors = {};
  descriptors.aclProbe = await describeLessonAnimateExecutionFile({
    projectRoot,
    file: normalized.aclProbe,
    scope: "absolute",
    executable: true,
  });
  descriptors.nodeExecutable = await describeLessonAnimateExecutionFile({
    projectRoot,
    file: normalized.nodeExecutable,
    scope: "absolute",
    executable: true,
  });
  descriptors.processProbe = await describeLessonAnimateExecutionFile({
    projectRoot,
    file: normalized.processProbe,
    scope: "absolute",
    executable: true,
  });
  descriptors.jsfl = await describeLessonAnimateExecutionFile({
    projectRoot,
    file: normalized.jsfl,
    scope: "project",
  });
  descriptors.animateExecutable = await describeLessonAnimateExecutionFile({
    projectRoot,
    file: normalized.animateExecutable,
    scope: "absolute",
    executable: true,
  });
  descriptors.replayLockHelper = await describeLessonAnimateExecutionFile({
    projectRoot,
    file: normalized.replayLockHelper,
    scope: normalized.replayLockHelperScope,
    executable: true,
  });
  return Object.freeze(descriptors);
}

export async function buildLessonAnimateExecutionCodeClosureManifest({
  projectRoot,
  entrypoint,
  toolchain,
}) {
  const root = await resolveProjectRoot(projectRoot);
  const normalizedEntrypoint = validateProjectRelativePath(entrypoint, "entrypoint", ".mjs");
  const modules = await discoverModuleGraph(root, normalizedEntrypoint);
  const normalizedToolchain = await normalizeToolchain(root, toolchain);
  const toolchainDescriptors = await describeToolchain(root, normalizedToolchain);
  return Object.freeze({
    schemaVersion: LESSON_ANIMATE_EXECUTION_CODE_CLOSURE_SCHEMA_VERSION,
    kind: MANIFEST_KIND,
    releaseId: LESSON_ANIMATE_EXECUTION_CODE_CLOSURE_RELEASE_ID,
    entrypoint: normalizedEntrypoint,
    platform: process.platform,
    arch: process.arch,
    modules,
    toolchain: toolchainDescriptors,
    replayLockHelperAuthority: normalizedToolchain.replayLockHelperAuthority,
    authorityBoundary: AUTHORITY_BOUNDARY,
  });
}

function manifestToolchainInput(manifest) {
  invariant(manifest.toolchain && typeof manifest.toolchain === "object"
    && !Array.isArray(manifest.toolchain), "manifest toolchain is missing");
  invariant(Object.keys(manifest.toolchain).sort().join("\0")
    === [...TOOLCHAIN_KEYS].sort().join("\0"), "manifest toolchain keys do not match the schema");
  return Object.fromEntries(TOOLCHAIN_KEYS.map((key) => {
    const descriptor = manifest.toolchain[key];
    invariant(descriptor && typeof descriptor === "object" && !Array.isArray(descriptor),
      `manifest toolchain descriptor ${key} is invalid`);
    invariant(typeof descriptor.file === "string" && descriptor.file.length > 0,
      `manifest toolchain descriptor ${key} has no file`);
    return [key, descriptor.file];
  }));
}

export async function validateLessonAnimateExecutionCodeClosureManifest({projectRoot, manifest}) {
  invariant(manifest && typeof manifest === "object" && !Array.isArray(manifest),
    "manifest must be an object");
  invariant(manifest.schemaVersion === LESSON_ANIMATE_EXECUTION_CODE_CLOSURE_SCHEMA_VERSION,
    "manifest schemaVersion is not v1");
  invariant(manifest.kind === MANIFEST_KIND, "manifest kind is invalid");
  invariant(manifest.releaseId === LESSON_ANIMATE_EXECUTION_CODE_CLOSURE_RELEASE_ID,
    "manifest releaseId is invalid");
  invariant(Object.values(REPLAY_LOCK_HELPER_AUTHORITIES)
    .includes(manifest.replayLockHelperAuthority),
  "manifest replayLockHelperAuthority is invalid");
  invariant(canonicalLessonAnimateExecutionCodeClosureJson(manifest.authorityBoundary)
    === canonicalLessonAnimateExecutionCodeClosureJson(AUTHORITY_BOUNDARY),
  "manifest authorityBoundary must be the fixed all-false boundary");
  invariant(Object.values(manifest.authorityBoundary).every((value) => value === false),
    "manifest authorityBoundary contains authority");

  const rebuilt = await buildLessonAnimateExecutionCodeClosureManifest({
    projectRoot,
    entrypoint: manifest.entrypoint,
    toolchain: manifestToolchainInput(manifest),
  });
  const expectedJson = canonicalLessonAnimateExecutionCodeClosureJson(rebuilt);
  const actualJson = canonicalLessonAnimateExecutionCodeClosureJson(manifest);
  invariant(actualJson === expectedJson,
    "manifest does not exactly match the rediscovered execution-code closure");
  const manifestSha256 = sha256Bytes(Buffer.from(expectedJson, "utf8"));
  const token = Object.freeze({
    ok: true,
    releaseId: rebuilt.releaseId,
    moduleCount: rebuilt.modules.length,
    manifestSha256,
  });
  const publicContext = Object.freeze({
    projectRoot: await resolveProjectRoot(projectRoot),
    releaseId: rebuilt.releaseId,
    entrypoint: rebuilt.entrypoint,
    platform: rebuilt.platform,
    arch: rebuilt.arch,
    moduleCount: rebuilt.modules.length,
    manifestSha256,
    toolchainDescriptors: rebuilt.toolchain,
    replayLockHelperDescriptor: rebuilt.toolchain.replayLockHelper,
    productionReplayLockHelperBound:
      rebuilt.replayLockHelperAuthority === REPLAY_LOCK_HELPER_AUTHORITIES.production,
  });
  VALIDATED_CONTEXTS.set(token, Object.freeze({
    publicContext,
    expectedCanonicalJson: expectedJson,
  }));
  return token;
}

export function getValidatedLessonAnimateExecutionCodeClosureContext(token) {
  const internal = token && typeof token === "object" ? VALIDATED_CONTEXTS.get(token) : null;
  invariant(internal, "validated context token is absent, stale, or forged");
  return internal.publicContext;
}

export function getValidatedLessonAnimateReplayLockHelperDescriptor(token) {
  return getValidatedLessonAnimateExecutionCodeClosureContext(token).replayLockHelperDescriptor;
}

export async function assertValidatedLessonAnimateExecutionCodeClosureStillBound(token) {
  const internal = token && typeof token === "object" ? VALIDATED_CONTEXTS.get(token) : null;
  invariant(internal, "validated context token is absent, stale, or forged");
  const context = internal.publicContext;
  const rebuilt = await buildLessonAnimateExecutionCodeClosureManifest({
    projectRoot: context.projectRoot,
    entrypoint: context.entrypoint,
    toolchain: Object.fromEntries(TOOLCHAIN_KEYS.map((key) => [
      key,
      context.toolchainDescriptors[key].file,
    ])),
  });
  const actualCanonicalJson = canonicalLessonAnimateExecutionCodeClosureJson(rebuilt);
  invariant(actualCanonicalJson === internal.expectedCanonicalJson,
    "validated execution-code closure is no longer physically bound");
  const reboundToken = Object.freeze({
    ok: true,
    stillBound: true,
    releaseId: rebuilt.releaseId,
    moduleCount: rebuilt.modules.length,
    manifestSha256: sha256Bytes(Buffer.from(actualCanonicalJson, "utf8")),
  });
  VALIDATED_CONTEXTS.set(reboundToken, Object.freeze({
    publicContext: Object.freeze({
      ...context,
      toolchainDescriptors: rebuilt.toolchain,
      replayLockHelperDescriptor: rebuilt.toolchain.replayLockHelper,
      productionReplayLockHelperBound:
        rebuilt.replayLockHelperAuthority === REPLAY_LOCK_HELPER_AUTHORITIES.production,
    }),
    expectedCanonicalJson: internal.expectedCanonicalJson,
  }));
  return reboundToken;
}
