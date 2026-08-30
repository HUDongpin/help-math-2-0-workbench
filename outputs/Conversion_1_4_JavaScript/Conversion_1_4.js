(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const MOVIE = Object.freeze({ width: 780, height: 379, fps: 12, frames: 67 });
  const SURFACE_Y_TWIPS = Object.freeze([
    4679, 4576, 4473, 4369, 4266, 4163, 4060, 3957, 3853, 3750, 3647,
    3544, 3440, 3337, 3234, 3131, 3028, 2924, 2821, 2718, 2615, 2512,
    2408, 2305, 2202, 2099, 1995, 1892, 1789, 1709, 1629, 1549,
  ]);
  const MARKS = Object.freeze([
    ["100", 225.05, 228.6],
    ["200", 208.05, 212.05],
    ["300", 191.55, 195.55],
    ["400", 175.05, 179.05],
    ["500", 158.55, 162.55],
    ["600", 142.05, 146.05],
    ["700", 125.55, 129.55],
    ["800", 109, 113.05],
    ["900", 93, 96.55],
    ["1,000", 76.5, 80.05],
  ]);

  // Vector outlines extracted from the Bauhaus Md BT font embedded in the SWF.
  const GLYPHS = Object.freeze({
    0: "",
    1: "M425 -246L425 -475Q425 -547 383 -594Q341 -642 279 -642Q217 -642 175 -594Q132 -546 132 -475L132 -246Q132 -173 174 -125Q216 -78 279 -78Q342 -78 384 -125Q425 -173 425 -246L425 -246ZM37 -490Q37 -592 107 -660Q176 -728 279 -728Q382 -728 451 -660Q520 -592 520 -490L520 -225Q520 -123 452 -55Q383 13 279 13Q175 13 106 -55Q37 -123 37 -225L37 -490Z",
    2: "M255 0L255 -625L126 -625L157 -716L353 -716L353 0L255 0Z",
    3: "M726 -240L726 -171L127 -171L127 -240L726 -240ZM726 -439L726 -369L127 -369L127 -439L726 -439Z",
    4: "M59 0L59 -459Q59 -584 121 -656Q183 -728 292 -728Q389 -728 454 -669Q518 -611 518 -526Q518 -475 494 -435Q469 -395 422 -369Q478 -354 503 -312Q529 -271 529 -194L529 0L434 0L434 -158Q434 -248 405 -281Q376 -313 299 -313L191 -313L191 -400L275 -400Q344 -400 383 -432Q421 -463 421 -520Q421 -573 385 -606Q349 -640 291 -640Q228 -640 190 -597Q153 -554 153 -480L153 0L59 0Z",
    5: "M435 0L435 -244Q435 -321 392 -369Q348 -417 279 -417Q210 -417 166 -369Q121 -322 121 -248Q121 -172 167 -123Q212 -75 283 -75Q315 -75 345 -86Q375 -97 406 -120L406 -25Q376 -8 343 0L273 8L203 -2Q169 -13 141 -33Q88 -69 60 -124Q32 -179 32 -246Q32 -356 101 -427Q171 -499 278 -499Q348 -499 407 -464Q465 -428 497 -366L518 -305L524 -206L524 0L435 0Z",
    6: "M526 -217Q507 -112 441 -51Q374 10 279 10L215 2Q183 -7 155 -24Q96 -60 63 -118Q31 -176 31 -246Q31 -297 50 -343Q68 -389 104 -426Q139 -462 185 -481Q230 -500 280 -500Q354 -500 413 -461Q472 -422 508 -347L187 -169L150 -235L388 -368L339 -405Q311 -418 279 -418Q213 -418 168 -368Q122 -319 122 -247Q122 -175 168 -125Q213 -76 279 -76Q341 -76 384 -117Q426 -158 436 -230L526 -217Z",
    7: "M61 0L61 -490L149 -490L149 0L61 0ZM51 -630Q51 -652 67 -667Q82 -683 105 -683Q127 -683 143 -667Q158 -652 158 -630Q158 -607 143 -591Q127 -575 105 -575Q83 -575 67 -591Q51 -607 51 -630L51 -630Z",
    8: "M61 0L61 -716L149 -716L149 0L61 0Z",
    9: "M53 0L53 -283Q53 -383 106 -441Q158 -499 247 -499Q293 -499 331 -480Q370 -461 398 -424Q427 -461 465 -480Q503 -499 548 -499Q636 -499 689 -441Q742 -383 742 -283L742 0L655 0L655 -300Q655 -351 625 -383Q596 -414 548 -414Q501 -414 471 -383Q442 -351 442 -300L442 0L355 0L355 -300Q355 -351 325 -383Q295 -414 247 -414Q199 -414 170 -383Q141 -351 141 -300L141 0L53 0Z",
    10: "M52 218L52 -206Q52 -268 59 -303Q65 -337 79 -366Q110 -429 169 -464Q227 -499 299 -499Q406 -499 476 -427Q545 -356 545 -246Q545 -196 528 -150Q511 -105 478 -69Q445 -32 399 -12Q353 8 303 8L234 0Q200 -8 170 -25L170 -120Q200 -97 231 -86Q262 -75 294 -75Q365 -75 410 -123Q456 -172 456 -248Q456 -322 411 -369Q367 -417 297 -417Q228 -417 184 -369Q141 -321 141 -244L141 218L52 218Z",
    11: "M60 0L60 -490L141 -490L141 -418Q163 -461 203 -480Q242 -499 309 -499L332 -499L332 -414L319 -414Q228 -414 188 -371Q148 -328 148 -231L148 0L60 0Z",
    12: "M36 -84L248 -84Q280 -84 299 -96Q317 -109 317 -131Q317 -149 303 -162L251 -191L167 -225Q93 -255 65 -286Q37 -318 37 -366Q37 -426 80 -458Q122 -490 202 -490L383 -490L383 -408L178 -408Q153 -408 139 -397Q125 -386 125 -366Q125 -351 138 -339Q150 -327 179 -315L268 -279Q350 -245 379 -214Q408 -182 408 -134Q408 -66 357 -33Q307 0 202 0L36 0L36 -84Z",
    13: "M55 -620L143 -620L143 -490L291 -490L291 -407L143 -407L143 -197Q143 -138 172 -111Q200 -84 263 -84L291 -84L291 0L262 0Q158 0 107 -45Q55 -91 55 -182L55 -620Z",
    14: "M470 -490L470 -223Q470 -129 429 -72Q388 -15 305 5L305 218L217 218L217 5Q134 -15 94 -72Q53 -128 53 -223L53 -490L141 -490L141 -207Q141 -149 175 -112Q209 -76 262 -76Q316 -76 350 -112Q383 -149 383 -207L383 -490L470 -490Z",
  });
  const FORMULA_RUN = Object.freeze([
    [2, 0], [0, 10.9], [8, 16.35], [7, 20.45], [13, 24.55], [6, 30.85],
    [11, 41.7], [0, 48.2], [3, 53.65], [0, 70.3], [2, 75.75], [1, 86.65],
    [1, 97.55], [1, 108.45], [0, 119.35], [9, 124.8], [7, 140.35],
    [8, 144.45], [8, 148.55], [7, 152.65], [8, 156.75], [7, 160.85],
    [13, 164.95], [6, 171.25], [11, 182.1], [12, 188.6],
  ]);
  const REPLAY_RUN = Object.freeze([
    [4, 0], [6, 6.5], [10, 13], [8, 19.75], [5, 22.2], [14, 28.95],
  ]);

  function clamp(value, min, max) {
    return Math.min(max == null ? 1 : max, Math.max(min == null ? 0 : min, value));
  }

  function flashAlpha(value) {
    return Math.round(clamp(value) * 256) / 256;
  }

  function frameFromElapsed(elapsedMs) {
    return Math.min(
      MOVIE.frames,
      Math.max(1, Math.floor(Math.max(0, elapsedMs) / (1000 / MOVIE.fps)) + 1),
    );
  }

  function getFrameState(elapsedMs) {
    const frame = frameFromElapsed(elapsedMs);
    let pitcherOpacity = 1;
    if (frame <= 6) pitcherOpacity = flashAlpha((frame - 1) / 5);
    else if (frame >= 55 && frame <= 59) pitcherOpacity = flashAlpha((59 - frame) / 5);
    else if (frame > 59) pitcherOpacity = 0;

    let pourOpacity = 0;
    if (frame >= 5 && frame <= 39) pourOpacity = 1;
    else if (frame >= 40 && frame <= 42) pourOpacity = flashAlpha((42 - frame) / 3);

    const surfaceY = frame < 8
      ? 233.95
      : frame > 39
        ? 77.45
        : SURFACE_Y_TWIPS[frame - 8] / 20;

    return {
      frame,
      complete: frame >= MOVIE.frames,
      fillVisible: frame >= 8,
      surfaceY,
      pitcherOpacity,
      pourOpacity,
      formulaOpacity: frame < 43 ? 0 : flashAlpha((frame - 43) / 8),
      replayOpacity: frame < 59 ? 0 : flashAlpha((frame - 59) / 8),
    };
  }

  function createSvgElement(tag, attributes) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.keys(attributes || {}).forEach(function (key) {
      element.setAttribute(key, String(attributes[key]));
    });
    return element;
  }

  function appendGlyphRun(parent, run, x, y, scale) {
    run.forEach(function (entry) {
      const glyph = createSvgElement("path", {
        d: GLYPHS[entry[0]],
        fill: "#000000",
        "fill-rule": "evenodd",
        transform: "translate(" + (x + entry[1]) + " " + y + ") scale(" + scale + ")",
      });
      parent.appendChild(glyph);
    });
  }

  function addScaleMarks(parent) {
    MARKS.forEach(function (mark) {
      const line = createSvgElement("path", {
        d: "M 84.35 " + mark[2] + " C 91 " + (mark[2] + 3.2) + ", 116 " + (mark[2] + 3.2) + ", 128.15 " + mark[2],
        fill: "none",
        stroke: "#333333",
        "stroke-opacity": "0.58",
        "stroke-width": "0.55",
      });
      const label = createSvgElement("text", {
        x: "105.75",
        y: String(mark[1] + 8),
        fill: "#000000",
        "font-family": "Verdana, Arial, sans-serif",
        "font-size": "8",
      });
      label.textContent = mark[0];
      parent.appendChild(line);
      parent.appendChild(label);
    });
  }

  function startAnimation() {
    const host = document.getElementById("conversion-1-4-animation");
    if (!host) return;

    host.innerHTML = [
      '<svg class="conversion-stage" viewBox="0 0 780 379" role="img" aria-labelledby="conversion-title conversion-description">',
      '<title id="conversion-title">1 liter equals 1000 milliliters</title>',
      '<desc id="conversion-description">A pitcher fills a graduated cylinder to one liter, then the conversion formula and Replay button appear.</desc>',
      '<defs>',
      '<linearGradient id="replay-orange" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff9900"/><stop offset="0.66" stop-color="#ff6600"/><stop offset="1" stop-color="#ff9900"/></linearGradient>',
      '<linearGradient id="glass-shine" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.69" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.6"/></linearGradient>',
      '<clipPath id="cylinder-interior"><path d="M84.4 60.7 C88 64.6 96 66 106 66 C116 66 124.8 64 128.15 59.4 L128.15 245.1 L84.4 244.4 Z"/></clipPath>',
      '</defs>',
      '<rect width="780" height="379" fill="#e4e4e4"/>',
      '<g><rect x="15.15" y="290.85" width="365.7" height="52.8" fill="#9fd2df" stroke="#1e4e59" stroke-width="0.55"/><text x="29.15" y="320.85" fill="#000000" font-family="Verdana, Arial, sans-serif" font-size="16">1 liter = 1000 milliliters</text></g>',
      '<image id="pitcher-back" href="assets/pitcher-back.png" width="780" height="379" opacity="0"/>',
      '<image href="assets/cylinder-base.png" width="780" height="379"/>',
      '<g id="liquid" clip-path="url(#cylinder-interior)" visibility="hidden"><path id="liquid-fill" fill="#8fbfde"/><path id="liquid-surface" fill="none" stroke="#6faed3" stroke-width="0.65"/></g>',
      '<path id="pour" fill="none" stroke="#8fbfde" stroke-linecap="round" stroke-width="13.5" opacity="0"/>',
      '<path d="M84.4 60.7 L84.4 244.4 C84.45 246.7 90.75 248.25 99.8 248.25 L112 248.25 C121.6 248.25 128.1 246.4 128.15 244.1 L128.15 59.4 C124.8 63.6 116 65.6 106 65.6 C96 65.6 88 64.3 84.4 60.7 Z" fill="url(#glass-shine)"/>',
      '<g id="scale-marks"></g>',
      '<text x="99.75" y="75" fill="#000000" font-family="Verdana, Arial, sans-serif" font-size="8" font-weight="700">L</text>',
      '<image id="pitcher-front" href="assets/pitcher-front.png" width="780" height="379" opacity="0"/>',
      '<g id="formula" opacity="0" aria-label="1 liter = 1000 milliliters"></g>',
      '<g id="replay" class="replay" opacity="0" role="button" tabindex="-1" aria-label="Replay animation">',
      '<rect x="678.4" y="9.2" width="90.5" height="20.5" rx="10.25" fill="#ffffff" stroke="#999999" stroke-width="1.5"/>',
      '<rect x="731.3" y="9.2" width="37.6" height="20.5" rx="10.25" fill="url(#replay-orange)" stroke="#cd6701" stroke-width="1.5"/>',
      '<path d="M733 12.1 C741 9.4 758 9.6 766.2 12.2" fill="none" stroke="#ffffff" stroke-opacity="0.72" stroke-width="1.3"/>',
      '<g id="replay-text" transform="translate(782.95 24) scale(1.3)"></g>',
      '<circle cx="750.3" cy="19.4" r="7.1" fill="none" stroke="#ffffff" stroke-width="1.1"/>',
      '<path d="M747.1 15.4 A5.1 5.1 0 1 1 746.1 22.2 M746.1 22.2 L746.2 18.7 M746.1 22.2 L749.5 21.7" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.15"/>',
      '</g>',
      '</svg>',
    ].join("");

    addScaleMarks(document.getElementById("scale-marks"));
    appendGlyphRun(document.getElementById("formula"), FORMULA_RUN, 147.65, 161.55, 400 / 1024 / 20);
    appendGlyphRun(document.getElementById("replay-text"), REPLAY_RUN, -76.65, 0.25, 240 / 1024 / 20);

    const elements = {
      pitcherBack: document.getElementById("pitcher-back"),
      pitcherFront: document.getElementById("pitcher-front"),
      liquid: document.getElementById("liquid"),
      liquidFill: document.getElementById("liquid-fill"),
      liquidSurface: document.getElementById("liquid-surface"),
      pour: document.getElementById("pour"),
      formula: document.getElementById("formula"),
      replay: document.getElementById("replay"),
    };

    let animationFrame = 0;
    let startedAt = performance.now();

    function render(elapsedMs) {
      const state = getFrameState(elapsedMs);
      const y = state.surfaceY;
      const surfacePath = "M84.4 " + y + " C92 " + (y + 3.2) + ", 116 " + (y + 3.2) + ", 128.15 " + y;
      elements.pitcherBack.setAttribute("opacity", state.pitcherOpacity);
      elements.pitcherFront.setAttribute("opacity", state.pitcherOpacity);
      elements.liquid.setAttribute("visibility", state.fillVisible ? "visible" : "hidden");
      elements.liquidFill.setAttribute("d", surfacePath + " L128.15 245.1 L84.4 245.1 Z");
      elements.liquidSurface.setAttribute("d", surfacePath);
      elements.pour.setAttribute("d", "M66 18 C72 25, 73 39, 85 49 C98 60, 101 " + Math.max(64, y - 12) + ", 103 " + (y + 1));
      elements.pour.setAttribute("opacity", state.pourOpacity);
      elements.formula.setAttribute("opacity", state.formulaOpacity);
      elements.replay.setAttribute("opacity", state.replayOpacity);
      elements.replay.setAttribute("tabindex", state.replayOpacity > 0 ? "0" : "-1");
      return state.complete;
    }

    function tick(now) {
      if (!render(now - startedAt)) animationFrame = requestAnimationFrame(tick);
    }

    function replay() {
      cancelAnimationFrame(animationFrame);
      startedAt = performance.now();
      render(0);
      animationFrame = requestAnimationFrame(tick);
    }

    elements.replay.addEventListener("click", replay);
    elements.replay.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        replay();
      }
    });

    render(0);
    animationFrame = requestAnimationFrame(tick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAnimation);
  } else {
    startAnimation();
  }
})();
