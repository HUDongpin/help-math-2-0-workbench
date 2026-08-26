# G4 L3 Ruffle Forensic Reference Matrix

> Acceptance-neutral only. Ruffle is a local forensic reference. It is not an authoritative original runtime, strict RMSE baseline, production implementation, audio acceptance, human/owner review, fidelity proof, or migration completion.

## Result

- Queue: **40/40** canonical items, each physically re-hashed from the frozen archive.
- Native facts: **40/40** at 800×600, **40/40** at 12 FPS, **440** root frames.
- Local route-load diagnostics ready: **40/40**.
- Retained representative diagnostics: **4/4** exact-source/local-Ruffle loads at 800×600, with **0** external HTTP requests.
- Deterministic frame/domain/language/scenario/seed capture ready: **0**. The current Ruffle route plays naturally and exposes none of the strict capture identity contract.
- Production exposure, authoritative baseline, strict RMSE baseline, and strict completion: **0**.

## Local-only boundary

- Ruffle: `@ruffle-rs/ruffle@0.4.1`, distribution SHA-256 `e4cfa077fb54201a6d883afb7633e1504e9f4d9d87ef6d745832ac7a1ad0e062`.
- The reference page, SWF API, and Ruffle asset API all return `notFound()` in production.
- The SWF API streams the exact catalog-resolved frozen source bytes with `no-store`; no G4 L3 SWF is copied into the product public tree.
- Ruffle runs with `allowNetworking: none`, `allowScriptAccess: false`, and `openUrlMode: deny`.
- English and Spanish URL prefixes change only the surrounding audit UI. No language FlashVars or source-evidenced host entry state are supplied.

## Forensic-only execution boundary

Bound capacity report: `reports/g4-l3-capture-capacity-readiness.json` (SHA-256 `88960a9ca24c4760da5f46a2a30b30472607bb2e3193d01c39ab96ec8b135ddd`).

Full queue execution now: **no**. Only these 4 representative route-load diagnostics are selected:

- `course-g04-l03-ir-001-341242cc`
- `course-g04-l03-in-009`
- `course-g04-l03-gs-002`
- `shell-course-g04-l03-index-local`

Start the local development server:

```bash
npm run dev --workspace @helpmath/web -- --hostname 127.0.0.1 --port 3104
```

Then run an exact per-item command from the JSON matrix. Example:

```bash
node scripts/probe-g4-l3-ruffle-reference.mjs --base-url http://127.0.0.1:3104 --animation-id course-g04-l03-ir-001-341242cc --expected-sha256 2af6431db3ed786d9b48feec5a649887af92fb219a04e5dbd42e7e4b04087df4 --expected-bytes 146730 --expected-width 800 --expected-height 600 --lang en --settle-ms 5000 --output output/playwright/g4-l3-ruffle-reference-diagnostics/course-g04-l03-ir-001-341242cc/en
```

A passing probe means only: exact SWF bytes were served, the forensic-only page and Ruffle player loaded locally, no external HTTP request escaped, and an 800×600 diagnostic PNG was written after a fixed delay. The PNG is not tied to a source frame.

## Representative observations

- Three page SWFs produced uniform-background-only screenshots after 5000 ms. This does not prove why; original shell/global/language entry state remains unresolved.
- The course shell produced a visible nonuniform surface. The probe blocked **3** local legacy/unallowlisted requests before network execution:

  - `GET` `http://127.0.0.1:3104/api/reference/shell-course-g04-l03/IR/L3RW01.swf` (blocked-local-unallowlisted-read)
  - `GET` `http://127.0.0.1:3104/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml` (blocked-local-unallowlisted-read)
  - `POST` `http://127.0.0.1:3104/reference/shell-course-g04-l03-index-local?&Student_ID=&Class_ID=&Lesson_ID=&Section=Introduction&FileName=http://127.0.0.1:3104/api/reference/shell-course-g04-l03/IR/L3RW01.swf&Failure=yes&Close=no&Download_Time=&Book_Mark=0SPLDATA0SPLDATA1SPLDATA2SPLDATAhttp://127.0.0.1:3104/api/reference/shell-course-g04-l03/IR/L3RW01.swf` (blocked-local-non-read-request)

No external or legacy endpoint was contacted. A future dependency sandbox must remain explicit, hash-bound, development-only, and network-denied; this report does not create or authorize one.

## Queue

| # | Animation | Role | Section/page | Source SHA-256 | Root frames | Static risks |
|---:|---|---|---|---|---:|---|
| 1 | `course-g04-l03-ir-001-341242cc` | active-xml-referenced-page | IR/1 | `2af6431db3ed786d9b48feec5a649887af92fb219a04e5dbd42e7e4b04087df4` | 10 | interaction, random, embedded-audio |
| 2 | `course-g04-l03-rw-002` | active-xml-referenced-page | RW/2 | `8b2aa7afd7e82fc582b8e7b936d178c87fea16106b26061f872c81ea7d422785` | 10 | interaction, embedded-audio |
| 3 | `course-g04-l03-rw-003` | active-xml-referenced-page | RW/3 | `783b74b036a7af4031f17ce9e1aab7536665c84a73400b3a980cfa3e89a9a335` | 10 | interaction, embedded-audio |
| 4 | `course-g04-l03-rw-004` | active-xml-referenced-page | RW/4 | `506c062e33d447d5837de2094e2d881581f602d7f10458b6eae2864e3b234710` | 10 | interaction, embedded-audio |
| 5 | `course-g04-l03-vb-002` | active-xml-referenced-page | VB/2 | `0e378f21899cd615107a08a085b4f37b96066e49e409eb9793219f7c953eb4f3` | 10 | interaction, embedded-audio |
| 6 | `course-g04-l03-vb-003` | active-xml-referenced-page | VB/3 | `ab47ed70dd5bba5515011e6f156c5a985fa107ef7e426448fe65507e9927204a` | 10 | interaction, embedded-audio |
| 7 | `course-g04-l03-vb-004` | active-xml-referenced-page | VB/4 | `13bff9e32e20d8fdd7a3b1df03e585d8f0bffbe03f74fca20db99350d7c0ea47` | 10 | interaction, embedded-audio |
| 8 | `course-g04-l03-vb-005` | active-xml-referenced-page | VB/5 | `7595fa85408ef64720006e0e24a02505507aebfd89282a5709bab97e09b162d6` | 10 | interaction, embedded-audio |
| 9 | `course-g04-l03-vb-006` | active-xml-referenced-page | VB/6 | `e83889619f1a162491b2d7bbc720be78c5ca1eda7f6348680a949e5a71e90168` | 10 | interaction, embedded-audio |
| 10 | `course-g04-l03-vb-007` | active-xml-referenced-page | VB/7 | `e3e6c45a56f343b3a8baf8a65dd34b615327029f808eec0c5f9cfee2dd2c1450` | 10 | interaction, embedded-audio |
| 11 | `course-g04-l03-vb-008` | active-xml-referenced-page | VB/8 | `3c61fd04bbaf6b316438691fd59222623bbb1d11a36c731ae7ed9fb862245bcf` | 10 | interaction, embedded-audio |
| 12 | `course-g04-l03-vb-009` | active-xml-referenced-page | VB/9 | `5a6532c1635ecbf29cf1b4bda6727ce3bc858b1a5771223fd629ee3a65df96f8` | 10 | interaction, embedded-audio |
| 13 | `course-g04-l03-in-002` | active-xml-referenced-page | IN/2 | `60a1a78e5e927d6732c69518699caf71307e4f30da3b9e2bab29d0bab241989d` | 10 | interaction, embedded-audio |
| 14 | `course-g04-l03-in-003` | active-xml-referenced-page | IN/3 | `ae967172d85728e42e4338f5ed74710b9b10eeb447fa6c6d86668bd63cc0dc7f` | 10 | embedded-audio |
| 15 | `course-g04-l03-in-004` | active-xml-referenced-page | IN/4 | `2ac5cd71bbc57bd9761668a7c383f821fa52b91f1e68a7b4f14151410857dfad` | 10 | interaction, random, embedded-audio |
| 16 | `course-g04-l03-in-005` | active-xml-referenced-page | IN/5 | `dcbc74e5f8391afb0a307421729c8b5d5f548f3185c429fb40e7aae3cb647048` | 10 | interaction, embedded-audio |
| 17 | `course-g04-l03-in-006` | active-xml-referenced-page | IN/6 | `e303dcdd4dbd48a45625663f8630c546987d1212cb3750cd710da853f25d59ba` | 10 | interaction, random, embedded-audio |
| 18 | `course-g04-l03-in-007` | active-xml-referenced-page | IN/7 | `91c013434558ec9d6b49df67ae29106073b1a98de19099fdda26ab8d5f2d8d45` | 10 | interaction, embedded-audio |
| 19 | `course-g04-l03-in-008` | active-xml-referenced-page | IN/8 | `5462ead920862a48ddbacf7be068f9cadf9e509e7032a2dbbb2659a28e08757f` | 10 | interaction, random, embedded-audio |
| 20 | `course-g04-l03-in-009` | active-xml-referenced-page | IN/9 | `766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c` | 10 | interaction, embedded-audio |
| 21 | `course-g04-l03-in-010` | active-xml-referenced-page | IN/10 | `fab625d5c4028a72a3d5672c65884cc2b83ab4df6a318e26057f70469e9a8011` | 10 | interaction, embedded-audio |
| 22 | `course-g04-l03-in-011` | active-xml-referenced-page | IN/11 | `a106b7a889b5da08377181e0e9d0e9ea2c59163103be0898fd5090f1a13fe1df` | 10 | interaction, embedded-audio |
| 23 | `course-g04-l03-in-012` | active-xml-referenced-page | IN/12 | `fa131c4cfad5619beb1343d0bfbc941bd9ffa59f190ae1b002f81d5f9d8cde55` | 10 | interaction, embedded-audio |
| 24 | `course-g04-l03-ti-002` | active-xml-referenced-page | TI/2 | `e640f8dcbfb6dd6945d97be67890e0015902702239e2bad4bd4283685fb0f807` | 10 | interaction, random, embedded-audio |
| 25 | `course-g04-l03-ti-003` | active-xml-referenced-page | TI/3 | `7abcc6151596b89d7b3142985bf8de2aae1d31ddb6eb47b14d2b9950c095a262` | 10 | interaction, random, embedded-audio |
| 26 | `course-g04-l03-ti-004` | active-xml-referenced-page | TI/4 | `04145dae5f7b295bed7ed882689be12ca7c4d31ef392a496d1c741ba1915a43c` | 10 | interaction, random, embedded-audio |
| 27 | `course-g04-l03-ti-005` | active-xml-referenced-page | TI/5 | `c6c46c779084d0f4a7888e3061310f84461d4858ff32c34c5ff9ffab5435de06` | 10 | interaction, random, embedded-audio |
| 28 | `course-g04-l03-ti-006` | active-xml-referenced-page | TI/6 | `8b1b570cb14dc3fd8f5a73920d0661b8a14c971eb477d5bfb6d8579f5ce842e8` | 10 | interaction, random, embedded-audio |
| 29 | `course-g04-l03-gs-002` | active-xml-referenced-page | GS/2 | `d1786d2ed78cdea13793ae7a61196c97bfb7fa6b8658af0035c1c47bbfb0bf29` | 10 | interaction, random, embedded-audio |
| 30 | `course-g04-l03-ts-002` | active-xml-referenced-page | TS/2 | `777224c6e7c1da786ce6f4af46532cb1617aaa0020c214e15cc6e2539c71e831` | 10 | interaction, embedded-audio |
| 31 | `course-g04-l03-ts-003` | active-xml-referenced-page | TS/3 | `1ff4291c2d5009ad33b877bd03d5c31bf1842e0b8b0ff7acb74ae559b833ce44` | 10 | interaction, embedded-audio |
| 32 | `course-g04-l03-ts-004` | active-xml-referenced-page | TS/4 | `ec56922f78cb0096feb504be6b35a0957e5d178b703e0b586d0ed949f620ab76` | 10 | interaction, embedded-audio |
| 33 | `course-g04-l03-ts-005` | active-xml-referenced-page | TS/5 | `877b15eb4a1454a30fabe607e5dc20b4bacb58364fe589b560daa19b83655312` | 10 | interaction, embedded-audio |
| 34 | `course-g04-l03-ts-006` | active-xml-referenced-page | TS/6 | `fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47` | 10 | embedded-audio |
| 35 | `course-g04-l03-ts-007` | active-xml-referenced-page | TS/7 | `f29b6880fea6e2316d1916bec26dc58050a8dad78a4b082efc19c85720128daf` | 10 | interaction, embedded-audio |
| 36 | `course-g04-l03-ts-008` | active-xml-referenced-page | TS/8 | `9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885` | 10 | interaction, embedded-audio |
| 37 | `course-g04-l03-fq-001` | active-xml-referenced-page | FQ/1 | `a7efda88b3246f34b35df08ef6feb718d00cda4850f458bb777357caa994e832` | 10 | interaction |
| 38 | `course-g04-l03-fq-002` | active-xml-referenced-page | FQ/2 | `ab1940815259d7b73f9e9bf6e1f33351e00d3ec02e37286e480806409955882b` | 10 | interaction, random, external |
| 39 | `course-g04-l03-fq-003` | active-xml-referenced-page | FQ/3 | `f40e24b47e05de7dce02ac98344c8748b5941a67d908f85fc1fe152fe684b7dc` | 10 | interaction, external |
| 40 | `shell-course-g04-l03-index-local` | course-shell | shell/— | `817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e` | 50 | interaction, random, external, embedded-audio |

Static risk signals are candidates only; they do not establish runtime reachability or final scenario coverage.

## Unresolved strict evidence

Every item still needs source-evidenced frame-domain disposition, authoritative English/Spanish entry behavior, all reachable natural interaction traces, original-runtime baselines, deterministic JavaScript captures, full-frame RMSE/diffs, audio acceptance, product QA, human visual review, and owner acceptance.

