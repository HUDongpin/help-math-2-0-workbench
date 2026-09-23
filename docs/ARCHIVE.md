# Legacy Archive Boundary

The full owner-provided HELP Math collection is irreplaceable source evidence. The approximately 3.0 GiB `HELP MATH_ORIGINAL FILES` tree must never be committed to, copied into, or deployed from the website repository. The archive and website use two independent private GitHub repositories:

- `HUDongpin/helpmath-web`: Next.js site, approved JavaScript demos, migration metadata, tests, reviewed derived web assets, and only the small hash-pinned migration inputs that the existing private workbench explicitly requires.
- `HUDongpin/helpmath-legacy-archive`: exact owner-provided FLA, SWF, MP3, XML, ActionScript, image, and related source files, plus integrity manifests.

Do not initialize the archive repository inside `HELP MATH_ORIGINAL FILES`, and do not use that directory as a Vercel project. Any small migration fixture retained by the private workbench remains source evidence, must keep its recorded hash, and is excluded from Vercel by `.vercelignore`. Repository separation is the hard boundary for the full archive; deployment exclusions are defense in depth.

On the current workstation the frozen canonical tree is
`source-assets/flash/HELP MATH_ORIGINAL FILES/`; the top-level name is a
compatibility symbolic link to that directory. All 9,147 regular files are
read-only. `catalog/source-manifest.sha256` is the local freeze manifest, whose
SHA-256 is
`f0a33c8a3d15afd7340e9ea5523385428bae7546bd8d4227a3a8977ab8914318`.
The current tree totals 3,214,585,414 bytes. The reviewed 2026-08-02 Grade 4
active-source promotion and its retained pre-promotion recovery roots are
documented in `reports/g4-active-source-promotion-review-2026-08-02.md` and the
immutable applied receipt under `catalog/source-promotions/`.
Run `npm run verify:sources` before and after every archive transfer.

## Generate a portable archive-repository intake manifest

`scripts/generate-legacy-manifest.mjs` recursively reads regular files, streams each file through SHA-256, and sorts records by portable relative path. Before writing outputs it rescans file paths and metadata, aborting if the source changed during the run. It does not rename, normalize, recompress, or write into the source directory. The top-level `HELP MATH_ORIGINAL FILES` compatibility alias may resolve to its preserved source directory; symbolic links inside the archive and all output paths that resolve into the source tree are rejected.

Run it from the website workbench before copying the archive:

```bash
mkdir -p ../helpmath-legacy-intake
node scripts/generate-legacy-manifest.mjs \
  --source "HELP MATH_ORIGINAL FILES" \
  --csv ../helpmath-legacy-intake/legacy-files.csv \
  --json ../helpmath-legacy-intake/legacy-files.json \
  --sha256 ../helpmath-legacy-intake/legacy-files.sha256
```

The JSON file is the machine-readable authoritative inventory. Its `checksumSetSha256` is the digest of the ordered `[path, bytes, sha256]` record stream, so one value identifies the complete inventory. CSV is for human review. The SHA256 file uses paths relative to the source directory and can be checked from that directory:

```bash
cd "HELP MATH_ORIGINAL FILES"
shasum -a 256 -c ../../helpmath-legacy-intake/legacy-files.sha256
```

Record the command output, file count, byte count, generation time, and `checksumSetSha256` from the JSON manifest in the archive repository's intake note. A read-only scan on 2026-07-21 found 7,919 regular files totaling 2,779,928,841 bytes (about 2.6 GiB), with checksum-set digest `568bf41d7327eab9a61a98eeaa928c08be32b60e8267d9731624d1cf3e26e18f`. Regenerate the manifest and investigate any mismatch rather than treating these observed values as permanent.

## Create the private archive repository

Repository creation and pushing are owner actions; this workbench does not create or modify remote repositories.

1. Create `HUDongpin/helpmath-legacy-archive` as **Private** on GitHub. Do not initialize it with sample content if an independent local staging repository already exists.
2. Clone it into a new sibling directory. Copy the canonical frozen tree into `source/` while preserving names and bytes; do not move, rename, or mutate files in `source-assets/flash/HELP MATH_ORIGINAL FILES/`.
3. Copy `legacy-files.csv`, `legacy-files.json`, and `legacy-files.sha256` into the archive root.
4. Install Git LFS and track the large binary families before staging files:

   ```bash
   git lfs install
   git lfs track "*.fla" "*.swf" "*.mp3" "*.jpg"
   git add .gitattributes
   git add source legacy-files.csv legacy-files.json legacy-files.sha256
   git lfs status
   ```

5. Confirm every FLA, SWF, MP3, and JPG is reported as an LFS object and that XML/ActionScript/manifests remain normal Git text. Inspect `git status --short` before committing.
6. Verify the staged copy before any push:

   ```bash
   cd source
   shasum -a 256 -c ../legacy-files.sha256
   ```

7. After the owner pushes, clone the private repository into a clean temporary directory with Git LFS enabled and repeat the checksum verification. A successful local staging check alone does not prove that all LFS objects reached GitHub.

Git LFS stores every changed version of a large file as a new full object. Do not edit archived source files in place, and review the account's LFS budget and usage before each large push. GitHub currently documents 10 GiB of included LFS storage and bandwidth for personal Free and Pro accounts, but quotas and billing can change; see [Git LFS billing](https://docs.github.com/en/billing/concepts/product-billing/git-lfs).

## Ongoing intake rules

- Place new owner-provided evidence in a dated intake folder; never overwrite an existing object.
- Generate a new manifest for each intake and retain earlier manifests.
- Record provenance, received date, owner, source hashes, missing companion files, and any extraction limitations.
- Keep FLA and shipped SWF together. FLA describes authoring structure; SWF records runtime behavior.
- Never run unknown ActionScript network endpoints. Audit URLs, FlashVars, external XML, fonts, audio, and video before a JavaScript migration.
- Website CI explicitly checks out without LFS objects. The web repository must not depend on the archive repository to build or deploy.

## Boundary verification

Before each website release:

```bash
find apps/web packages -type f \( -iname '*.fla' -o -iname '*.swf' \) -print
```

The command must print nothing. Also inspect the Vercel deployment's Source view and verify that known archive-only paths return `404`. An approved JavaScript demo may include reviewed derivative images, fonts, and audio, but each derivative must trace back to hashes recorded in its migration workspace.
