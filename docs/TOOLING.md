# Flash Migration Tooling

This guide prepares a second computer to audit FLA/SWF files, run the HELP Math project, capture deterministic browser frames, and compare them. Links point to primary project documentation and were checked on 2026-07-21.

## Supported Baseline

Use Node.js 24 LTS for this repository. Node.js lists v24 as an LTS line, while v20 and v18 are end-of-life: <https://nodejs.org/en/about/previous-releases>.

Required for the complete workflow:

- Node.js 24 LTS and the bundled npm.
- Python 3.11 or newer for reproducible extraction/generation helpers.
- A Playwright Chromium browser for native-size frame capture.
- The project dependencies from `package-lock.json`.

Recommended forensic tools:

- JPEXS Free Flash Decompiler (FFDec) for scripts, symbols, fonts, sounds, shapes, and SWF metadata.
- Ruffle for reference playback of SWF content.
- swfmill for deterministic SWF-to-XML inspection.
- FFmpeg for legacy audio/video inspection and conversion.
- ImageMagick for an independent RMSE/difference-image check.
- Adobe Animate when an authorized license is available and the FLA must be inspected in its authoring environment.

## Bootstrap This Project

From the project root:

```bash
node --version
npm --version
python3 --version
npm ci
npx playwright install chromium
npm run doctor
npm run verify:workbench
npm test
npm run build
```

Use the version in `.nvmrc` when a Node version manager is available. Do not copy `node_modules` or `.next` between computers.

## Node.js And Python

Download Node.js from <https://nodejs.org/en/download>. Use the supported LTS line recorded in `.nvmrc`, not an end-of-life release.

Download Python from <https://www.python.org/downloads/>. On Windows, the official Python Install Manager provides the `python` and `py` commands; this project also accepts `python3` on macOS/Linux.

Confirm:

```bash
node --version
npm --version
python3 --version
```

## Playwright

Playwright supports Chromium, Firefox, and WebKit on Windows, macOS, and Linux. This project pins the Node package in `package-lock.json`; browser binaries are installed separately:

```bash
npm ci
npx playwright install chromium
```

Official installation guidance: <https://playwright.dev/docs/intro>.

## Ruffle

The project contains both the npm dependency and a self-hosted Ruffle build under `public/ruffle/`. `npm ci` restores the package; no browser plugin is required. Ruffle documents both npm and self-hosted setups at <https://ruffle.rs/js-docs/master/> and publishes downloads at <https://ruffle.rs/downloads/>.

Use Ruffle to observe legacy behavior and capture a versioned baseline. Do not ship Ruffle as the modern implementation unless the owner explicitly accepts emulation as the product strategy.

## JPEXS Free Flash Decompiler

Download the latest stable FFDec release from <https://github.com/jindrapetrik/jpexs-decompiler/releases>. The project provides Windows, macOS, Linux, and cross-platform packages. Its documented capabilities include exporting scripts, images, shapes, movies, sounds, texts, and fonts from AS1/2 and AS3 SWFs: <https://github.com/jindrapetrik/jpexs-decompiler>.

Prefer the platform installer or app bundle. The generic JAR/ZIP route may require a working Java runtime. After installation, record the exact FFDec version in `migration.json`; CLI launcher names and locations vary by package, so verify them with the installed release's help before scripting exports.

FFDec is recommended rather than mandatory because some environments cannot run Java or a GUI. When it is unavailable, use swfmill plus Ruffle and mark script/font extraction confidence as reduced.

## swfmill

swfmill converts SWF to a structured XML dialect. Its documented command is:

```bash
swfmill swf2xml input.swf output.xml
```

Project and usage documentation: <https://github.com/djcsdy/swfmill>.

macOS users can install the Homebrew package when available:

```bash
brew install swfmill
```

Use XML parsing, not regular-expression scraping, when deriving frame, tag, matrix, or color-transform data.

## FFmpeg And ImageMagick

FFmpeg is optional unless the SWF contains audio or video. Obtain it from the platform links on <https://ffmpeg.org/download.html> and confirm with `ffmpeg -version`.

ImageMagick provides an independent normalized RMSE and diff-image calculation. Official comparison documentation: <https://imagemagick.org/compare/>.

Example:

```bash
magick compare -metric RMSE baseline.png implementation.png difference.png
```

The value in parentheses is normalized RMSE. The repository's `npm run compare:frames` command performs the same class of check in Node and is the portable default.

## Adobe Animate

Adobe Animate is optional and paid. Use it when the FLA is readable and its library, timeline, publishing settings, or test movie resolves ambiguity. Adobe states that Animate remains available in maintenance mode and documents its current requirements at <https://helpx.adobe.com/animate/system-requirements.html>.

Animate can publish HTML5 Canvas/CreateJS, but unsupported ActionScript and document features may be removed or converted. Treat automatic Canvas output as evidence or an asset source, not an automatic final migration: <https://helpx.adobe.com/animate/using/creating-publishing-html5-canvas-document.html>.

## Tool Status Policy

`npm run doctor` exits nonzero when a required tool or project dependency is missing. It reports FFDec, Java, swfmill, FFmpeg, ImageMagick, and Adobe Animate as optional capabilities. Record missing optional tools in the migration brief; never imply that scripts, fonts, or morphs were fully audited when the needed extractor was unavailable.

The exact versions used by the current migration workstation, including the
downloaded FFDec release-asset checksum and the Adobe Animate availability
gate, are recorded in `catalog/toolchain.json`. Update that record whenever a
baseline or audit is regenerated with a different tool version.
