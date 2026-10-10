// hfr-compile: compile every active placement of one lesson.
// node compiler/compile-lesson.mjs <manifest.json> <sourceRoot G6-G8-shared> <MODULE> <lesson> <outDir> [--only id,id]
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compilePage, COMPILER_VERSION } from "./compile-page.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const [manifestPath, srcRoot, moduleCode, lessonStr, outDir, ...rest] = process.argv.slice(2);
const only = rest[0] === "--only" ? new Set(rest[1].split(",")) : null;
const lesson = Number(lessonStr);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const rel = manifest.releases.find((r) => r.moduleCode === moduleCode && r.moduleLesson === lesson);
if (!rel) throw new Error(`no release for ${moduleCode} L${lesson}`);
const lessonDir = join(srcRoot, moduleCode, `L${lesson}`);
const xml = readFileSync(join(lessonDir, "index.xml"), "utf8");
const lessonTitle = xml.match(/<LessonName>([^<]*)/)?.[1] ?? "";
const courseName = xml.match(/<CourseName>([^<]*)/)?.[1] ?? moduleCode;
const sections = {};
for (const m of xml.matchAll(/<Section SName="(\w+)"[\s\S]*?<English>([^<]*)<\/English>\s*<Spanish>([^<]*)<\/Spanish>/g)) sections[m[1]] = { en: m[2], es: m[3] };

mkdirSync(outDir, { recursive: true });
const pages = []; const t0 = Date.now();
for (const m of rel.members) {
  if (only && !only.has(m.animationId)) continue;
  const swfPath = join(srcRoot, m.source.path.replace(/^HELP_COURSES\//, ""));
  const pageDir = join(outDir, "pages", m.animationId);
  rmSync(pageDir, { recursive: true, force: true }); mkdirSync(pageDir, { recursive: true });
  const base = m.source.path.split("/").pop().replace(/\.swf$/i, "");
  const placement = { animationId: m.animationId, module: moduleCode, course: courseName, lesson, lessonTitle, sectionCode: m.sectionCode, sectionName: sections[m.sectionCode]?.en, sectionNameEs: sections[m.sectionCode]?.es, ordinal: m.ordinal, titleEnglish: m.titleEnglish };
  const r = compilePage({ swfPath, outDir: pageDir, placement, runtimeRel: relative(pageDir, join(here, "..", "runtime")), spanishAudio: join(lessonDir, "SA", `${base}.mp3`), sourceRel: m.source.path });
  pages.push({ ...placement, file: base, dir: `pages/${m.animationId}`, scripts: r.scripts, codeBodies: r.blocks, fallbackBodies: r.fallbacks, sha256: r.sha256 });
  process.stderr.write(`${m.animationId} ${base}: ${r.scripts} scripts, ${r.blocks} bodies, ${r.fallbacks} fallback, ${r.media} media\n`);
}
writeFileSync(join(outDir, "lesson.json"), JSON.stringify({ schema: "hfr-lesson/1", compiler: COMPILER_VERSION, generatedAt: new Date().toISOString(), module: moduleCode, course: courseName, lesson, lessonTitle, sections, pages }, null, 1));
process.stderr.write(`compiled ${pages.length} pages in ${((Date.now() - t0) / 1000).toFixed(1)} s\n`);
