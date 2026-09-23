# HELP Math active-page Flash compiler pilot

This is a fail-closed, five-page compiler experiment. It answers a narrow
engineering question: which existing open-source backend removes the most
repetitive visual reconstruction work while preserving enough source evidence
to build a HELP-specific behavior and audio layer?

It is deliberately **not** a legacy course-shell converter. HELP Math 2.0 keeps
its modern course/My Lesson UI. Every formal input must be a current catalog
entry with `referenced=true`, `unreferenced=false`, `variant=false`, and
`shell=false`. The active course-page occurrence denominator is 1,751. The
formal corpus contains five of those pages and zero shells.

## Formal corpus

The exact paths, bytes, SHA-256 values, FLA pairings, XML occurrences, expected
root/nested frame domains, script locations, button counts, and sound-tag
counts are frozen in `corpus.json`.

The five roles are:

1. small visual baseline with paired FLA;
2. paired-FLA 193-frame vocabulary page;
3. paired-FLA 203-frame vocabulary page;
4. active complex page with shared Flash-v2 components plus random/eval;
5. active SWF-only 339-frame streaming-audio page.

The validator also pins the active G5 L4 `IR/L4RW01.swf` placement. It rejects
the byte-identical but unreferenced alias and rejects the previously considered
unreferenced `L4IR01.swf` and `L8RE01.swf` variants.

## What the runner builds

`run.mjs` has three backend adapters:

- **FFDec Canvas + P-code** exports executable Canvas drawing/timeline HTML,
  ActionScript source, P-code, shapes, sprites, button visual states, images,
  and sound bytes. Chromium captures deterministic root and longest-nested
  frames. The adapter then writes a non-executable AVM1 lowering plan whose
  unknown-script policy is fail-closed.
- **Next2D worker IR** downloads one pinned MIT worker source file, verifies its
  SHA-256, runs it headlessly in Node twice, and compares the event-stream
  hashes. It is a structural cross-check, not a complete renderer.
- **OpenFL SWF Animate IR** invokes a pinned temporary Haxe/OpenFL toolchain
  twice, removes the exporter UUID from semantic identity, compares normalized
  hashes, and blocks any dangling symbol reference. Morph gaps therefore do
  not pass merely because the upstream command exits zero.

All raw outputs go below ignored `work/flash-compiler-pilot/`. The formal
human-readable and JSON conclusions are under `reports/flash-compiler-pilot/`.
No runner path writes into `source-assets`, a migration workspace, the product
registry, or the modern course UI.

## Reproduce

Prerequisites managed by the existing project tooling:

```bash
npm run doctor
npm run verify:sources
```

FFDec and Next2D need no additional project-local dependency. The OpenFL
backend needs the external, temporary, pinned toolchain described below.

Build all three backends and the report:

```bash
node tools/flash-compiler-pilot/run.mjs build \
  --output work/flash-compiler-pilot/run-v1 \
  --backend all \
  --openfl-toolchain /absolute/path/to/pinned-openfl-toolchain \
  --report reports/flash-compiler-pilot
```

Verify the corpus lock, every raw output hash, and a freshly derived copy of
both reports:

```bash
node tools/flash-compiler-pilot/run.mjs check \
  --output work/flash-compiler-pilot/run-v1 \
  --report reports/flash-compiler-pilot
```

Run focused tests:

```bash
node --test tools/flash-compiler-pilot/flash-compiler-pilot.test.mjs
```

The build is create-exclusive. It stages into a PID-specific sibling and uses
an atomic rename only after every selected backend succeeds. A failed staging
tree is retained as diagnostics; it is never relabeled as a successful run.

## Pinned OpenFL toolchain

`toolchain-lock.json` contains the exact URLs, versions, commits, and hashes.
The formal macOS arm64 pilot used Haxe 4.3.7, Neko 2.4.1, Lime 8.3.2, OpenFL
9.5.2, and `openfl/swf` 3.4.0 at commit
`82b3aa5864030580c74316de30c9cce1fce7f377`. The toolchain belongs in a
temporary directory outside the repository. A minimal acquisition sequence is:

```bash
pilot_toolchain_root=/tmp/help-math-openfl-toolchain-v1
mkdir -p "$pilot_toolchain_root/downloads" \
  "$pilot_toolchain_root/toolchain" \
  "$pilot_toolchain_root/haxelib" \
  "$pilot_toolchain_root/repos"

curl -fL \
  https://github.com/HaxeFoundation/haxe/releases/download/4.3.7/haxe-4.3.7-osx.tar.gz \
  -o "$pilot_toolchain_root/downloads/haxe-4.3.7-osx.tar.gz"
curl -fL \
  https://github.com/HaxeFoundation/neko/releases/download/v2-4-1/neko-2.4.1-osx-arm64.tar.gz \
  -o "$pilot_toolchain_root/downloads/neko-2.4.1-osx-arm64.tar.gz"

printf '%s  %s\n' \
  1d355cb28bc25784b33acce023caeb28d50ccb14e953134a62b889697947efdc \
  "$pilot_toolchain_root/downloads/haxe-4.3.7-osx.tar.gz" | shasum -a 256 -c -
printf '%s  %s\n' \
  511fe81fa73fa813464b4e0296ec1e7121d6a6434ca25df59e7ba19849a64173 \
  "$pilot_toolchain_root/downloads/neko-2.4.1-osx-arm64.tar.gz" | shasum -a 256 -c -

tar -xzf "$pilot_toolchain_root/downloads/haxe-4.3.7-osx.tar.gz" \
  -C "$pilot_toolchain_root/toolchain"
tar -xzf "$pilot_toolchain_root/downloads/neko-2.4.1-osx-arm64.tar.gz" \
  -C "$pilot_toolchain_root/toolchain"

haxe_dir=$(find "$pilot_toolchain_root/toolchain" -maxdepth 1 \
  -type d -name 'haxe_*' -print -quit)
neko_dir="$pilot_toolchain_root/toolchain/neko-2.4.1-osx-arm64"
install_name_tool -change @rpath/libneko.2.dylib \
  "$neko_dir/libneko.2.dylib" "$haxe_dir/haxelib"

export PATH="$haxe_dir:$neko_dir:$PATH"
export HAXELIB_PATH="$pilot_toolchain_root/haxelib"
export NEKOPATH="$neko_dir:$pilot_toolchain_root/haxelib/lime/8,3,2/ndll/MacArm64"

yes | haxelib install format 3.8.0
yes | haxelib install hxp 1.3.1
yes | haxelib install lime 8.3.2
yes | haxelib install openfl 9.5.2

git clone --filter=blob:none https://github.com/openfl/swf.git \
  "$pilot_toolchain_root/repos/openfl-swf"
git -C "$pilot_toolchain_root/repos/openfl-swf" checkout --detach \
  82b3aa5864030580c74316de30c9cce1fce7f377
haxelib dev swf "$pilot_toolchain_root/repos/openfl-swf"
(cd "$pilot_toolchain_root/repos/openfl-swf" && haxe rebuild.hxml)
```

Recheck the resulting `run.n` and license hashes against
`toolchain-lock.json` before passing that root to the runner.

## Result interpretation

The formal pilot result is summarized in
`reports/flash-compiler-pilot/SUMMARY.zh-CN.md`:

- FFDec: executable visual code on 5/5, AVM1 behavior 0/5, integrated stream
  audio 0/5;
- Next2D: deterministic structure IR on 5/5, complete renderable artifact 0/5;
- OpenFL: deterministic normalized IR on 5/5, structurally unblocked on 3/5,
  Morph-blocked on 2/5, complete renderable artifact 0/5.

The 50 static AVM1 locations reduce to 30 mechanical locations, five shared
preloader-policy locations, nine shared host-button bindings, four copies of
two shared component files, and two page-specific dynamic locations. This is a
pilot observation, not a course-wide extrapolation. A full active-SWF scan is
required before estimating the 1,751-page tail.

## License and acceptance boundaries

Next2D and OpenFL inputs used here are MIT-licensed. FFDec is GPL-3.0 and
swfmill is GPL-2.0-or-later. Before distributing generated helper/runtime code,
obtain a project-specific license review; this workbench does not assume that
invoking a tool resolves the licensing status of every generated file.

No output in this pilot is Flash fidelity, original-runtime, behavior, audio,
human visual, owner, strict-completion, release, or publication acceptance.
Every manifest carries an explicit all-false acceptance-effects object.
