/**
 * HELP Math 2.0 — logo system generator.
 *
 * Every asset in this folder is emitted from the geometry below, so the hand,
 * the letterforms and the palette can never drift between the app icon, the
 * horizontal lockup and the one-colour versions.
 *
 *   node design/brand/build-logo.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const mode = args[0] ?? "canonical";

if (
  args.length > 1 ||
  ![
    "canonical",
    "--review-high-contrast-v1",
    "--review-high-contrast-v2",
    "--review-high-contrast-v3",
    "--review-high-contrast-v4",
  ].includes(mode)
) {
  throw new Error(
    "Usage: node design/brand/build-logo.mjs [--review-high-contrast-v1|--review-high-contrast-v2|--review-high-contrast-v3|--review-high-contrast-v4]",
  );
}

/* ---------------------------------------------------------------- palette */

const C = {
  navy: "#12386b", // --navy
  blue: "#1768d4", // --blue
  ink: "#14213d", // --ink
  orange: "#f7941e", // heritage HELP orange, carried over from 1.0
  goldHi: "#ffd873",
  goldLo: "#f2b02f",
  gold: "#f8cb4b", // --yellow
  mint: "#4fc6a6", // --mint
  mintHi: "#79e0c6",
  sky: "#cdeafa", // --sky
  paper: "#fffdf7", // --paper
  white: "#ffffff",
};

/* ------------------------------------------------------------------- hand */
/*
 * One hand, drawn once: a mitten-round palm, five stubby capsule fingers, and
 * a bulb at each fingertip so the tips read rounder than the fingers.
 *
 * Two rules keep it clean:
 *   - the gold gradient is userSpaceOnUse in *hand* coordinates, so one ramp
 *     runs across palm and fingers instead of restarting on every shape;
 *   - the outlined hand is a mask (silhouette grown, minus silhouette), never
 *     a set of stroked parts — so no capsule seams show inside the palm.
 */

const PALM =
  "M62 104H158a28 28 0 0 1 28 28v24a62 62 0 0 1-62 62H96a62 62 0 0 1-62-62v-24a28 28 0 0 1 28-28Z";

/* Fingers are narrower than the palm can seat four of them, and splayed, so
   the notches between them survive the outline dilation. */
const FINGERS = [
  { w: 30, h: 119.29, cx: 56, cy: 89, a: -15.6 }, // index
  { w: 30, h: 132.08, cx: 102, cy: 79, a: -2.24 }, // middle
  { w: 30, h: 117.48, cx: 148, cy: 89, a: 10.54 }, // ring
  { w: 30, h: 82, cx: 182, cy: 124, a: 22.62 }, // little
  { w: 34, h: 92.14, cx: 36, cy: 163, a: -63.43 }, // thumb
];

/** Fingertips: [x, y, bulb radius]. The bulb is a touch wider than the finger. */
const TIPS = [
  [44, 46, 16.5],
  [100, 28, 16.5],
  [156, 46, 16.5],
  [192, 100, 16.5],
  [10, 150, 18.5],
];
const HAND_CENTER = [100, 115]; // optical centre of the union bounding box

const handShapes = (indent) =>
  [
    `${indent}<path d="${PALM}"/>`,
    ...FINGERS.map(
      (f) =>
        `${indent}<rect x="${-f.w / 2}" y="${(-f.h / 2).toFixed(2)}" width="${f.w}" height="${f.h}" rx="${f.w / 2}" transform="translate(${f.cx} ${f.cy}) rotate(${f.a})"/>`,
    ),
    ...TIPS.map(([x, y, r]) => `${indent}<circle cx="${x}" cy="${y}" r="${r}"/>`),
  ].join("\n");

/** Place a hand: local HAND_CENTER lands on (cx,cy) at the given angle + scale. */
const place = (cx, cy, rot, scale) =>
  `translate(${cx} ${cy}) rotate(${rot}) scale(${scale}) translate(${-HAND_CENTER[0]} ${-HAND_CENTER[1]})`;

const solidHand = (t, fill, indent = "    ") =>
  `${indent}<g transform="${t}" fill="${fill}">\n${handShapes(indent + "  ")}\n${indent}</g>`;

/**
 * The helper hand: the same silhouette, drawn as an outline of light with a
 * lit node at each fingertip. Nothing else — no palm mesh, no glow behind the
 * nodes. The outline comes from a mask (the silhouette grown by `weight`,
 * minus the silhouette itself) so what you see is the true union contour with
 * nothing showing through where the fingers meet the palm.
 *
 * `detail` drops the nodes at sizes where they close up into specks.
 */
const aiHand = (id, t, { paint, node, weight = 13, detail = true, indent = "  " }) =>
  [
    `${indent}<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">`,
    `${indent}  <g transform="${t}" fill="#fff" stroke="#fff" stroke-width="${weight}" stroke-linejoin="round">`,
    handShapes(indent + "    "),
    `${indent}  </g>`,
    `${indent}  <g transform="${t}" fill="#000">`,
    handShapes(indent + "    "),
    `${indent}  </g>`,
    `${indent}</mask>`,
    `${indent}<rect width="512" height="512" fill="${paint}" mask="url(#${id})"/>`,
    detail
      ? `${indent}<g transform="${t}" fill="${node}">${TIPS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join("")}</g>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

/** The positive: a plus made of light where the two hands meet. */
const plus = (cx, cy, arm, weight, { ink = C.white, halo = null, indent = "  " } = {}) =>
  [
    `${indent}<g transform="translate(${cx} ${cy})">`,
    halo ? `${indent}  <circle r="${(arm * 1.65).toFixed(1)}" fill="${halo}" fill-opacity="0.13"/>` : "",
    halo ? `${indent}  <circle r="${(arm * 1.09).toFixed(1)}" fill="${halo}" fill-opacity="0.2"/>` : "",
    `${indent}  <path d="M0-${arm}V${arm}M-${arm} 0H${arm}" fill="none" stroke="${ink}" stroke-width="${weight}" stroke-linecap="round"/>`,
    `${indent}</g>`,
  ]
    .filter(Boolean)
    .join("\n");

/* -------------------------------------------------------------- wordmark */
/* Drawn as outlines, not type, so the mark never depends on a font being
   installed. Geometric, cap height 100, stem 26 — the weight of HELP Math 1.0. */

const GLYPH = {
  H: { w: 86, d: "M0 0h26v37h34V0h26v100H60V63H26v37H0Z" },
  E: { w: 74, d: "M0 0h74v24H26v14h38v24H26v14h48v24H0Z" },
  L: { w: 66, d: "M0 0h26v76h40v24H0Z" },
  P: { w: 78, d: "M0 0h46a32 32 0 0 1 0 64H26v36H0Z M26 22h20a10 10 0 0 1 0 20H26Z" },
  M: { w: 98, d: "M0 0h28l21 44 21-44h28v100H76V52L54 100H44L22 52v48H0Z" },
  A: { w: 84, d: "M29 0h26l29 100H58l-6-22H32l-6 22H0Z M42 26l8 34H34Z" },
  T: { w: 80, d: "M0 0h80v24H53v76H27V24H0Z" },
};

const wordWidth = (s, track) =>
  [...s].reduce((w, ch) => w + GLYPH[ch].w, 0) + track * (s.length - 1);

const wordPaths = (s, track, indent) => {
  let x = 0;
  return [...s]
    .map((ch) => {
      const p = `${indent}<path${x ? ` transform="translate(${x} 0)"` : ""} d="${GLYPH[ch].d}"/>`;
      x += GLYPH[ch].w + track;
      return p;
    })
    .join("\n");
};

/* HELP is tracked open and MATH tracked tight so the two stacked words share
   an optical width without changing stroke weight. */
const STACK = { HELP: 24, MATH: 10 };

const stackedWord = (s, x, y, scale, indent = "    ") =>
  `${indent}<g transform="translate(${x} ${y}) scale(${scale})">\n${wordPaths(s, STACK[s], indent + "  ")}\n${indent}</g>`;

/* --------------------------------------------------------------- chrome  */

const defsField = (id) => `
    <linearGradient id="${id}-field" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.blue}"/>
      <stop offset="1" stop-color="${C.navy}"/>
    </linearGradient>
    <radialGradient id="${id}-glow" cx="0.28" cy="0.2" r="0.85">
      <stop offset="0" stop-color="${C.white}" stop-opacity="0.2"/>
      <stop offset="1" stop-color="${C.white}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-gold" gradientUnits="userSpaceOnUse" x1="8" y1="24" x2="178" y2="212">
      <stop offset="0" stop-color="${C.goldHi}"/>
      <stop offset="1" stop-color="${C.goldLo}"/>
    </linearGradient>
    <linearGradient id="${id}-ai" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${C.mint}"/>
      <stop offset="0.55" stop-color="${C.mintHi}"/>
      <stop offset="1" stop-color="${C.sky}"/>
    </linearGradient>
`;

const field = (id, size, radius) =>
  [
    `  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#${id}-field)"/>`,
    `  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#${id}-glow)"/>`,
  ].join("\n");

const doc = ({ w, h, title, desc, defs, body }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
  <title id="t">${title}</title>
  <desc id="d">${desc}</desc>${defs ? `\n  <defs>${defs}\n  </defs>` : ""}
${body}
</svg>
`;

const emit = (name, svg) => {
  writeFileSync(join(OUT, name), svg);
  console.log("wrote", name);
};

const emitReview = (name, svg) => {
  const outputPath = join(OUT, name);

  if (existsSync(outputPath)) {
    if (readFileSync(outputPath, "utf8") !== svg) {
      throw new Error(
        `${name} already exists with different bytes; preserve it and create a new review version`,
      );
    }

    console.log("verified", name);
    return;
  }

  writeFileSync(outputPath, svg, { flag: "wx" });
  console.log("wrote", name);
};

const DESC =
  "A learner's gold hand beside a helping hand drawn as a network of light, meeting at a plus sign.";

/* ============================================================ 1. primary */

const helpX = (512 - wordWidth("HELP", STACK.HELP) * 0.92) / 2;
const mathX = (512 - wordWidth("MATH", STACK.MATH) * 0.92) / 2;

/* ------------------------------------------------ review-only candidate */
/*
 * These additive modes emit one owner-review candidate and exit before any
 * canonical asset is rewritten. It deliberately changes colour only:
 *
 *   node design/brand/build-logo.mjs --review-high-contrast-v1
 *   node design/brand/build-logo.mjs --review-high-contrast-v2
 *   node design/brand/build-logo.mjs --review-high-contrast-v3
 *   node design/brand/build-logo.mjs --review-high-contrast-v4
 *
 * The adopted header PNG and every existing primary/mark/lockup remain
 * untouched until the owner explicitly approves a replacement.
 */
const REVIEW_V1 = {
  id: "rv1",
  file: "helpmath2-logo-high-contrast-review-v1.svg",
  label: "v1",
  title: "HELP Math 2.0 — high-contrast review candidate",
  fieldLight: "#2c7bc9",
  fieldDark: "#18599a",
  aiLight: "#ffffff",
  aiMid: "#d6fff5",
  aiDark: "#a7f3d0",
};

const REVIEW_V2 = {
  ...REVIEW_V1,
  id: "rv2",
  file: "helpmath2-logo-high-contrast-review-v2.svg",
  label: "v2",
  title: "HELP Math 2.0 — high-contrast review candidate v2",
  fieldDark: "#164a84",
};

const REVIEW_V3 = {
  id: "rv3",
  file: "helpmath2-logo-high-contrast-review-v3.svg",
  label: "v3",
  title: "HELP Math 2.0 — high-contrast review candidate v3",
  desc: `${DESC} The AI helper is drawn in near-white mint on a brighter blue field for clearer recognition at header size.`,
  aiLight: C.white,
  aiMid: "#f0fdfa",
  aiDark: "#e2fff7",
  compactSections: true,
  preserveCanonicalFieldGlow: true,
};

const REVIEW_V4 = {
  ...REVIEW_V3,
  id: "rv4",
  file: "helpmath2-logo-high-contrast-review-v4.svg",
  label: "v4",
  title: "HELP Math 2.0 — rich-blue review candidate v4",
  desc: `${DESC} The canonical blue field and glow are retained while only the AI helper changes to near-white mint for clearer recognition at header size.`,
  compactSections: false,
};

const reviewLegacyDefs = (id, palette) => `
    <linearGradient id="${id}-field" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.fieldLight}"/>
      <stop offset="1" stop-color="${palette.fieldDark}"/>
    </linearGradient>
    <linearGradient id="${id}-gold" gradientUnits="userSpaceOnUse" x1="8" y1="24" x2="178" y2="212">
      <stop offset="0" stop-color="${C.goldHi}"/>
      <stop offset="1" stop-color="${C.goldLo}"/>
    </linearGradient>
    <linearGradient id="${id}-ai" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${palette.aiDark}"/>
      <stop offset="0.55" stop-color="${palette.aiMid}"/>
      <stop offset="1" stop-color="${palette.aiLight}"/>
    </linearGradient>
`;

const reviewCanonicalFieldDefs = (id, palette) => `
    <linearGradient id="${id}-field" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.blue}"/>
      <stop offset="1" stop-color="${C.navy}"/>
    </linearGradient>
    <radialGradient id="${id}-glow" cx="0.28" cy="0.2" r="0.85">
      <stop offset="0" stop-color="${C.white}" stop-opacity="0.2"/>
      <stop offset="1" stop-color="${C.white}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-gold" gradientUnits="userSpaceOnUse" x1="8" y1="24" x2="178" y2="212">
      <stop offset="0" stop-color="${C.goldHi}"/>
      <stop offset="1" stop-color="${C.goldLo}"/>
    </linearGradient>
    <linearGradient id="${id}-ai" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${palette.aiDark}"/>
      <stop offset="0.55" stop-color="${palette.aiMid}"/>
      <stop offset="1" stop-color="${palette.aiLight}"/>
    </linearGradient>
`;

const reviewDefs = (palette) =>
  palette.preserveCanonicalFieldGlow
    ? reviewCanonicalFieldDefs(palette.id, palette)
    : reviewLegacyDefs(palette.id, palette);

const reviewSvg = (palette) => {
  const background = palette.preserveCanonicalFieldGlow
    ? field(palette.id, 512, 96)
    : `  <rect width="512" height="512" rx="96" fill="url(#${palette.id}-field)"/>`;

  const sections = [
    background,
    "",
    "  <!-- review candidate: exact helper geometry, higher colour separation -->",
    aiHand(`${palette.id}-ring`, place(153, 259, 14, 0.64), {
      paint: `url(#${palette.id}-ai)`,
      node: palette.aiLight,
    }),
    "",
    solidHand(place(355, 255, -6, 0.72), `url(#${palette.id}-gold)`, "  "),
    "",
    plus(254, 218, 24, 14),
    "",
    `  <g fill="${C.orange}" fill-rule="evenodd">`,
    stackedWord("HELP", +helpX.toFixed(1), 52, 0.92),
    stackedWord("MATH", +mathX.toFixed(1), 366, 0.92),
    "  </g>",
  ];

  return doc({
    w: 512,
    h: 512,
    title: palette.title,
    desc:
      palette.desc ??
      `${DESC} The AI helper is drawn in near-white mint on a brighter blue field for clearer recognition at header size.`,
    defs: reviewDefs(palette),
    body: (palette.compactSections ? sections.filter(Boolean) : sections).join("\n"),
  });
};

const reviewByMode = new Map([
  ["--review-high-contrast-v1", REVIEW_V1],
  ["--review-high-contrast-v2", REVIEW_V2],
  ["--review-high-contrast-v3", REVIEW_V3],
  ["--review-high-contrast-v4", REVIEW_V4],
]);
const activeReview = reviewByMode.get(mode) ?? null;

if (activeReview) {
  emitReview(activeReview.file, reviewSvg(activeReview));
  process.exit(0);
}

emit(
  "helpmath2-logo-primary.svg",
  doc({
    w: 512,
    h: 512,
    title: "HELP Math 2.0",
    desc: `${DESC} HELP is set above and MATH below, on a blue field.`,
    defs: defsField("p"),
    body: [
      field("p", 512, 96),
      "",
      "  <!-- the helper: behind, leaning in -->",
      aiHand("p-ring", place(153, 259, 14, 0.64), { paint: "url(#p-ai)", node: C.sky }),
      "",
      "  <!-- the learner: in front, larger, in charge -->",
      solidHand(place(355, 255, -6, 0.72), "url(#p-gold)", "  "),
      "",
      "  <!-- the positive -->",
      plus(254, 218, 24, 14),
      "",
      "  <!-- wordmark -->",
      `  <g fill="${C.orange}" fill-rule="evenodd">`,
      stackedWord("HELP", +helpX.toFixed(1), 52, 0.92),
      stackedWord("MATH", +mathX.toFixed(1), 366, 0.92),
      "  </g>",
    ].join("\n"),
  }),
);

/* =============================================================== 2. mark */
/* App icon / avatar: the hands alone, cropped in tighter. */

const markBody = (id, { detail = true } = {}) =>
  [
    field(id, 512, 96),
    "",
    aiHand(`${id}-ring`, place(148, 266, 14, 0.68), {
      paint: `url(#${id}-ai)`,
      node: C.sky,
      detail,
    }),
    solidHand(place(358, 256, -6, 0.77), `url(#${id}-gold)`, "  "),
    plus(254, 222, 26, 15),
  ].join("\n");

emit(
  "helpmath2-mark.svg",
  doc({
    w: 512,
    h: 512,
    title: "HELP Math 2.0 mark",
    desc: DESC,
    defs: defsField("m"),
    body: markBody("m"),
  }),
);

emit(
  "helpmath2-mark-small.svg",
  doc({
    w: 512,
    h: 512,
    title: "HELP Math 2.0 mark (small sizes)",
    desc: `${DESC} Simplified for favicons and small app icons.`,
    defs: defsField("s"),
    body: markBody("s", { detail: false }),
  }),
);

/* ============================================================ 2b. favicon */
/* At 16 px two hands are one blur. The favicon keeps the learner's hand and
   the positive only — the two shapes that still read at that size. */

emit(
  "helpmath2-favicon.svg",
  doc({
    w: 512,
    h: 512,
    title: "HELP Math 2.0 favicon",
    desc: "A gold hand and a plus sign of light on a blue field.",
    defs: defsField("f"),
    body: [
      field("f", 512, 96),
      solidHand(place(292, 266, -4, 1.14), "url(#f-gold)", "  "),
      plus(126, 180, 40, 23),
    ].join("\n"),
  }),
);

/* ========================================================== 3. one-colour */
/* One ink. The learner's hand carries a background-coloured keyline so it
   stays separable from the outlined helper behind it when colour is gone. */

const monoBody = (ink, bg) => {
  const paper = bg || C.paper;
  const t1 = place(148, 266, 14, 0.68);
  const t2 = place(358, 256, -6, 0.77);
  return [
    bg ? `  <rect width="512" height="512" rx="96" fill="${bg}"/>` : "",
    `  <mask id="mono-ring" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">`,
    `    <g transform="${t1}" fill="#fff" stroke="#fff" stroke-width="13" stroke-linejoin="round">`,
    handShapes("      "),
    "    </g>",
    `    <g transform="${t1}" fill="#000">`,
    handShapes("      "),
    "    </g>",
    "  </mask>",
    `  <rect width="512" height="512" fill="${ink}" mask="url(#mono-ring)"/>`,
    `  <g transform="${t2}" fill="${paper}" stroke="${paper}" stroke-width="26" stroke-linejoin="round">`,
    handShapes("    "),
    "  </g>",
    solidHand(t2, ink, "  "),
    `  <g transform="translate(254 222)" fill="none" stroke-linecap="round">`,
    `    <path d="M0-28V28M-28 0H28" stroke="${paper}" stroke-width="30"/>`,
    `    <path d="M0-28V28M-28 0H28" stroke="${ink}" stroke-width="16"/>`,
    "  </g>",
  ]
    .filter(Boolean)
    .join("\n");
};

emit(
  "helpmath2-mark-mono-ink.svg",
  doc({
    w: 512,
    h: 512,
    title: "HELP Math 2.0 mark, one colour",
    desc: `${DESC} Single-ink version for light backgrounds.`,
    body: monoBody(C.ink, null),
  }),
);

emit(
  "helpmath2-mark-mono-knockout.svg",
  doc({
    w: 512,
    h: 512,
    title: "HELP Math 2.0 mark, knockout",
    desc: `${DESC} Single-ink version reversed out of a solid field.`,
    body: monoBody(C.paper, C.ink),
  }),
);

/* ========================================================= 4. horizontal */

const LINE_TRACK = 12;
const CAP = 54;
const SCALE = CAP / 100;
const WORD_GAP = 30;
const MARK = 116;
const MARK_GAP = 34;
const LOCK_W = Math.round(
  MARK +
    MARK_GAP +
    wordWidth("HELP", LINE_TRACK) * SCALE +
    WORD_GAP +
    wordWidth("MATH", LINE_TRACK) * SCALE,
);

const horizontal = (id, wordInk, bg) =>
  doc({
    w: LOCK_W,
    h: MARK,
    title: "HELP Math 2.0 horizontal lockup",
    desc: `${DESC} Shown beside the HELP MATH wordmark.`,
    defs: defsField(id),
    body: [
      bg ? `  <rect x="-40" y="-40" width="${LOCK_W + 80}" height="${MARK + 80}" fill="${bg}"/>` : "",
      `  <g transform="scale(${(MARK / 512).toFixed(6)})">`,
      markBody(id, { detail: false })
        .split("\n")
        .map((l) => (l ? "  " + l : l))
        .join("\n"),
      "  </g>",
      `  <g fill="${wordInk}" fill-rule="evenodd" transform="translate(${MARK + MARK_GAP} ${(MARK - CAP) / 2}) scale(${SCALE})">`,
      wordPaths("HELP", LINE_TRACK, "    "),
      `    <g transform="translate(${(wordWidth("HELP", LINE_TRACK) + WORD_GAP / SCALE).toFixed(1)} 0)">`,
      wordPaths("MATH", LINE_TRACK, "      "),
      "    </g>",
      "  </g>",
    ]
      .filter(Boolean)
      .join("\n"),
  });

emit("helpmath2-lockup-horizontal.svg", horizontal("h", C.navy, null));
emit("helpmath2-lockup-horizontal-dark.svg", horizontal("hd", C.orange, C.ink));

/* ============================================== concept geometry helpers */

const CS = 1.2;
const CR = (-3 * Math.PI) / 180;
const cPt = ([x, y]) => {
  const dx = (x - HAND_CENTER[0]) * CS;
  const dy = (y - HAND_CENTER[1]) * CS;
  return [
    256 + dx * Math.cos(CR) - dy * Math.sin(CR),
    262 + dx * Math.sin(CR) + dy * Math.cos(CR),
  ];
};

/* ========================================================== 5. concept B */
/* "In your hand" — one open palm holding the positive. Reads at 16 px. */

const palmCentre = cPt([110, 161]);

emit(
  "helpmath2-concept-b-open-palm.svg",
  doc({
    w: 512,
    h: 512,
    title: "HELP Math 2.0 — concept B, In Your Hand",
    desc: "A single open gold hand on a blue field, holding a plus sign of light in its palm.",
    defs: defsField("b"),
    body: [
      field("b", 512, 96),
      solidHand(place(256, 262, -3, CS), "url(#b-gold)", "  "),
      `  <g transform="translate(${palmCentre[0].toFixed(1)} ${palmCentre[1].toFixed(1)})">`,
      `    <circle r="58" fill="${C.navy}" fill-opacity="0.92"/>`,
      `    <circle r="58" fill="none" stroke="${C.mintHi}" stroke-width="6"/>`,
      `    <path d="M0-29V29M-29 0H29" fill="none" stroke="${C.sky}" stroke-width="16" stroke-linecap="round"/>`,
      "  </g>",
    ].join("\n"),
  }),
);

/* ========================================================== 6. concept C */
/* "Counting on" — five fingertips as nodes on a rising line. */

const order = [4, 0, 1, 2, 3].map((i) => cPt(TIPS[i]));
const cT = place(256, 262, -3, CS);

emit(
  "helpmath2-concept-c-counting-constellation.svg",
  doc({
    w: 512,
    h: 512,
    title: "HELP Math 2.0 — concept C, Counting Constellation",
    desc: "An outlined gold hand whose five fingertips are nodes joined by a rising line of light.",
    defs: defsField("c"),
    body: [
      field("c", 512, 96),
      `  <mask id="c-ring" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">`,
      `    <g transform="${cT}" fill="#fff" stroke="#fff" stroke-width="13" stroke-linejoin="round">`,
      handShapes("      "),
      "    </g>",
      `    <g transform="${cT}" fill="#000">`,
      handShapes("      "),
      "    </g>",
      "  </mask>",
      `  <rect width="512" height="512" fill="url(#c-gold-flat)" mask="url(#c-ring)"/>`,
      `  <path d="M${order.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}" fill="none" stroke="${C.mintHi}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
      ...order.map(
        ([x, y], i) =>
          `  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${10 + i * 1.6}" fill="${C.sky}"/>`,
      ),
      plus(...cPt(TIPS[3]).map((v, i) => (i === 0 ? v + 46 : v - 52)), 22, 13),
    ]
      .join("\n")
      .replace(
        "</defs>",
        "</defs>",
      ),
  }).replace(
    "</defs>",
    `  <linearGradient id="c-gold-flat" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.goldHi}"/>
      <stop offset="1" stop-color="${C.goldLo}"/>
    </linearGradient>
  </defs>`,
  ),
);
