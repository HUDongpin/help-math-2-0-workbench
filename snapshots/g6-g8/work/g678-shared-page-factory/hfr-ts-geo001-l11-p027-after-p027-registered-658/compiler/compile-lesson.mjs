// hfr-compile: compile every active placement of one lesson.
// node compiler/compile-lesson.mjs <manifest.json> <sourceRoot G6-G8-shared> <MODULE> <lesson> <outDir> [--only id,id]
import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, renameSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { compilePage, COMPILER_VERSION } from "./compile-page.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const [manifestPath, srcRoot, moduleCode, lessonStr, outDir, ...rest] = process.argv.slice(2);
if (!outDir || (rest.length && (rest[0] !== "--only" || !rest[1] || rest.length !== 2))) throw new Error("expected manifest, source root, module, lesson, fresh output directory, and optional --only id,id");
const only = rest[0] === "--only" ? new Set(rest[1].split(",")) : null;
const lesson = Number(lessonStr);
const manifestBytes = readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const rel = manifest.releases.find((r) => r.moduleCode === moduleCode && r.moduleLesson === lesson);
if (!rel) throw new Error(`no release for ${moduleCode} L${lesson}`);
const lessonDir = join(srcRoot, moduleCode, `L${lesson}`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const xmlBytes = readFileSync(join(lessonDir, "index.xml"));
if (hash(xmlBytes) !== rel.sourceLesson.sha256) throw new Error("course XML SHA-256 mismatch");
const xml = xmlBytes.toString("utf8");
const lessonTitle = xml.match(/<LessonName>([^<]*)/)?.[1] ?? "";
const courseName = xml.match(/<CourseName>([^<]*)/)?.[1] ?? moduleCode;
const sections = {};
for (const m of xml.matchAll(/<Section SName="(\w+)"[\s\S]*?<English>([^<]*)<\/English>\s*<Spanish>([^<]*)<\/Spanish>/g)) sections[m[1]] = { en: m[2], es: m[3] };

// Validate the whole selected source set before writing. Every run has a fresh
// destination: neither old candidate evidence nor registered modules are replaced.
const selected = rel.members.filter((m) => !only || only.has(m.animationId));
const ids = new Set(selected.map((m) => m.animationId));
if (!selected.length || ids.size !== selected.length || (only && [...only].some((id) => !ids.has(id)))) throw new Error("empty, duplicate or unknown selected placement");
if (existsSync(outDir)) throw new Error(`output already exists; use a fresh candidate directory: ${outDir}`);
for (const m of selected) {
  const bytes = readFileSync(join(srcRoot, m.source.path.replace(/^HELP_COURSES\//, "")));
  if (hash(bytes) !== m.source.sha256) throw new Error(`source SHA-256 mismatch: ${m.animationId}`);
}
mkdirSync(dirname(resolve(outDir)), { recursive: true });
const staging = mkdtempSync(join(dirname(resolve(outDir)), `.${basename(outDir)}-staging-`));
const pages = []; const t0 = Date.now();
try {
for (const m of selected) {
  const swfPath = join(srcRoot, m.source.path.replace(/^HELP_COURSES\//, ""));
  const pageDir = join(staging, "pages", m.animationId);
  mkdirSync(pageDir, { recursive: true });
  const base = m.source.path.split("/").pop().replace(/\.swf$/i, "");
  const placement = { animationId: m.animationId, module: moduleCode, course: courseName, lesson, lessonTitle, sectionCode: m.sectionCode, sectionName: sections[m.sectionCode]?.en, sectionNameEs: sections[m.sectionCode]?.es, ordinal: m.ordinal, titleEnglish: m.titleEnglish };
  const r = compilePage({ swfPath, outDir: pageDir, placement, runtimeRel: relative(join(resolve(outDir), "pages", m.animationId), join(here, "..", "runtime")), spanishAudio: join(lessonDir, "SA", `${base}.mp3`), sourceRel: m.source.path, expectedSha256: m.source.sha256 });
  pages.push({ ...placement, file: base, dir: `pages/${m.animationId}`, scripts: r.scripts, codeBodies: r.blocks, fallbackBodies: r.fallbacks, sha256: r.sha256 });
  process.stderr.write(`${m.animationId} ${base}: ${r.scripts} scripts, ${r.blocks} bodies, ${r.fallbacks} fallback, ${r.media} media\n`);
}
writeFileSync(join(staging, "lesson.json"), JSON.stringify({ schema: "hfr-lesson/1", compiler: COMPILER_VERSION, generatedAt: new Date().toISOString(), manifestSha256: hash(manifestBytes), sourceLessonSha256: hash(xmlBytes), module: moduleCode, course: courseName, lesson, lessonTitle, sections, pages }, null, 1));
if (existsSync(outDir)) throw new Error(`output appeared during generation: ${outDir}`);
renameSync(staging, resolve(outDir));
} catch (error) {
  process.stderr.write(`failed candidate retained at ${staging}\n`);
  throw error;
}
process.stderr.write(`compiled ${pages.length} pages in ${((Date.now() - t0) / 1000).toFixed(1)} s\n`);
