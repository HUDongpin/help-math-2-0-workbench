(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const MOVIE = Object.freeze({ fps: 12, frames: 109, durationMs: 9083 });
  const ASSET_ROOT = "assets";
  const DATA = window.CONVERSION_1_2_BAUHAUS;
  const FULL_SOURCE = [1, 0, 0, 1, 56.8, 144.65];
  const EMPTY_SOURCE = [-0.363312, 0.93045, -0.93045, -0.363312, 96.4, 203.6];
  const WINDOWS = [
    { move: [5, 9], pour: [10, 19], back: [20, 24] },
    { move: [19, 24], pour: [25, 35], back: [36, 40] },
    { move: [35, 40], pour: [41, 49], back: [50, 55] },
    { move: [49, 54], pour: [55, 68], back: [68, 75] },
  ];
  const MOVE = [
    [
      [0.863403, -0.499786, 0.499786, 0.863403, 147.1, 72.5],
      [0.496841, -0.865601, 0.865601, 0.496841, 237.55, 18.1],
      [0.23793, -0.968826, 0.968826, 0.23793, 342.8, 22.45],
      [-0.035141, -0.997955, 0.997955, -0.035141, 444.25, 30.15],
      [-0.309174, -0.949982, 0.949982, -0.309174, 541.15, 40.55],
    ],
    [
      [0.937759, -0.342346, 0.342346, 0.937759, 174.8, 97.55],
      [0.760056, -0.64534, 0.64534, 0.760056, 222.45, 58.55],
      [0.492828, -0.867859, 0.867859, 0.492828, 268.65, 27.45],
      [0.233231, -0.969955, 0.969955, 0.233231, 360.85, 30.45],
      [-0.04364, -0.997559, 0.997559, -0.04364, 449.35, 36.9],
      [-0.318253, -0.946915, 0.946915, -0.318253, 533.3, 46.05],
    ],
    [
      [0.908981, -0.411011, 0.411011, 0.908981, 262.6, 91.1],
      [0.655899, -0.751694, 0.751694, 0.655899, 325.95, 49.3],
      [0.433777, -0.897125, 0.897125, 0.433777, 384.6, 42.7],
      [0.182053, -0.980621, 0.980621, 0.182053, 440.6, 40.05],
      [-0.079361, -0.994705, 0.994705, -0.079361, 493.2, 40.2],
      [-0.341797, -0.937973, 0.937973, -0.341797, 541.7, 42.95],
    ],
    [
      [0.964661, -0.259125, 0.259125, 0.964661, 311.55, 113.85],
      [0.863449, -0.500351, 0.500351, 0.863449, 351.7, 87.35],
      [0.700958, -0.709549, 0.709549, 0.700958, 392.1, 65.55],
      [0.492325, -0.867294, 0.867294, 0.492325, 431.15, 48.25],
      [0.250198, -0.965683, 0.965683, 0.250198, 467.95, 34.9],
      [-0.009293, -0.998001, 0.998001, -0.009293, 501.55, 24.85],
    ],
  ];
  const RETURN = [
    [
      [-0.069611, 0.995499, -0.995499, -0.069611, 112.4, 163.6, 0],
      [-0.143585, 0.987335, -0.987335, -0.143585, 108.45, 173.55, 64],
      [-0.216797, 0.973862, -0.973862, -0.216797, 104.45, 183.6, 128],
      [-0.288849, 0.954987, -0.954987, -0.288849, 100.4, 193.65, 192],
      [-0.363312, 0.93045, -0.93045, -0.363312, 96.4, 203.6, 256],
    ],
    [
      [-0.230194, 0.971344, -0.971344, -0.230194, 179.6, 195.6, 0],
      [-0.26741, 0.961044, -0.961044, -0.26741, 177.6, 197.6, 64],
      [-0.305298, 0.949707, -0.949707, -0.305298, 175.7, 199.6, 128],
      [-0.345749, 0.93576, -0.93576, -0.345749, 173.55, 201.6, 192],
      [-0.383728, 0.922119, -0.922119, -0.383728, 171.6, 203.6, 256],
    ],
    [
      [-0.190887, 0.979706, -0.979706, -0.190887, 239.6, 187.6, 0],
      [-0.229202, 0.970856, -0.970856, -0.229202, 239.6, 190.75, 51],
      [-0.267471, 0.961029, -0.961029, -0.267471, 239.55, 193.95, 102],
      [-0.305328, 0.949692, -0.949692, -0.305328, 239.65, 197.2, 154],
      [-0.345779, 0.93573, -0.93573, -0.345779, 239.6, 200.4, 205],
      [-0.383728, 0.922119, -0.922119, -0.383728, 239.6, 203.6, 256],
    ],
    [
      [0.09935, 0.992264, -0.992264, 0.09935, 335.6, 131.6, 0],
      [0.026886, 0.996994, -0.996994, 0.026886, 332.2, 141.9, 37],
      [-0.039688, 0.996735, -0.996735, -0.039688, 328.7, 152.2, 73],
      [-0.109344, 0.991516, -0.991516, -0.109344, 325.3, 162.45, 110],
      [-0.178513, 0.98143, -0.98143, -0.178513, 321.9, 172.75, 146],
      [-0.249985, 0.965698, -0.965698, -0.249985, 318.4, 183.05, 183],
      [-0.317047, 0.945847, -0.945847, -0.317047, 315.05, 193.35, 219],
      [-0.383728, 0.922119, -0.922119, -0.383728, 311.6, 203.6, 256],
    ],
  ];
  const FLASH_FRAMES = new Set([17, 19, 21, 34, 36, 38, 51, 53, 55, 66, 68, 70]);

  function clamp(value) {
    return Math.min(1, Math.max(0, value));
  }

  function flashAlpha(value) {
    return Math.round(clamp(value) * 256) / 256;
  }

  function frameFromElapsed(elapsedMs) {
    return Math.min(109, Math.max(1, Math.floor(elapsedMs / (1000 / 12)) + 1));
  }

  function bottleState(frame, index) {
    const window = WINDOWS[index];
    if (frame < window.move[0]) return { phase: "full", index, opacity: 1 };
    if (frame <= window.move[1]) {
      return { phase: "moving", index, matrix: MOVE[index][frame - window.move[0]], opacity: 1 };
    }
    if (frame >= window.back[0] && frame <= window.back[1]) {
      const matrix = RETURN[index][frame - window.back[0]];
      return { phase: "returning", index, matrix, opacity: matrix[6] / 256 };
    }
    if (frame >= window.pour[0] && frame <= window.pour[1]) {
      return {
        phase: "pouring",
        index,
        opacity: index === 3 && frame >= 65 ? flashAlpha((68 - frame) / 3) : 1,
        pourProgress: clamp((frame - window.pour[0]) / (window.pour[1] - window.pour[0])),
      };
    }
    return { phase: "empty", index, opacity: 1 };
  }

  function gallonProgress(frame) {
    if (frame < 10) return 0;
    if (frame <= 17) return 0.25 * clamp((frame - 10) / 7);
    if (frame < 25) return 0.25;
    if (frame <= 33) return 0.25 + 0.25 * clamp((frame - 25) / 8);
    if (frame < 41) return 0.5;
    if (frame <= 49) return 0.5 + 0.25 * clamp((frame - 41) / 8);
    if (frame < 55) return 0.75;
    if (frame <= 65) return 0.75 + 0.25 * clamp((frame - 55) / 10);
    return 1;
  }

  function fluidOunces(frame) {
    if (frame < 17) return null;
    if (frame < 34) return 32;
    if (frame < 51) return 64;
    if (frame < 66) return 96;
    return 128;
  }

  function multiply(left, right) {
    const [a1, b1, c1, d1, e1, f1] = left;
    const [a2, b2, c2, d2, e2, f2] = right;
    return [
      a1 * a2 + c1 * b2,
      b1 * a2 + d1 * b2,
      a1 * c2 + c1 * d2,
      b1 * c2 + d1 * d2,
      a1 * e2 + c1 * f2 + e1,
      b1 * e2 + d1 * f2 + f1,
    ];
  }

  function invert(matrix) {
    const [a, b, c, d, e, f] = matrix;
    const determinant = a * d - b * c;
    return [d / determinant, -b / determinant, -c / determinant, a / determinant, (c * f - d * e) / determinant, (b * e - a * f) / determinant];
  }

  function stageTransform(target, source) {
    return "matrix(" + multiply(target.slice(0, 6), invert(source)).join(" ") + ")";
  }

  function svgElement(tag, attributes) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.keys(attributes || {}).forEach(function (key) {
      element.setAttribute(key, String(attributes[key]));
    });
    return element;
  }

  function renderGlyphRun(parent, textId, x, y) {
    parent.replaceChildren();
    const text = DATA.texts[textId];
    text.run.forEach(function (entry) {
      parent.appendChild(svgElement("path", {
        d: DATA.glyphs[entry.char],
        fill: "#000000",
        "fill-rule": "evenodd",
        transform: "translate(" + (x + entry.x) + " " + (y + text.baseline) + ") scale(" + text.scale + ")",
      }));
    });
  }

  function imageMarkup(href, transform, opacity) {
    return '<image href="' + href + '" width="780" height="379" transform="' + transform + '" opacity="' + opacity + '"/>';
  }

  function bottleMarkup(bottle) {
    if (bottle.phase === "full") {
      return '<ellipse cx="' + (103 + bottle.index * 72) + '" cy="253" rx="31" ry="8" fill="url(#quart-shadow)"/>'
        + imageMarkup(ASSET_ROOT + "/quart-full-stage.png", "translate(" + bottle.index * 72 + " 0)", 1);
    }
    if (bottle.phase === "moving") {
      return imageMarkup(ASSET_ROOT + "/quart-full-stage.png", stageTransform(bottle.matrix, FULL_SOURCE), 1);
    }
    if (bottle.phase === "pouring") {
      const streamOpacity = Math.sin(Math.PI * bottle.pourProgress) * bottle.opacity;
      return '<g opacity="' + bottle.opacity + '"><path d="M526 91 C530 94 532 101 537 108" fill="none" stroke="#c1dce9" stroke-linecap="round" stroke-width="4.2" opacity="' + streamOpacity + '"/>'
        + '<image href="' + ASSET_ROOT + '/quart-pouring-full.png" x="420" y="15" width="120" height="95" opacity="' + (1 - bottle.pourProgress) + '"/>'
        + '<image href="' + ASSET_ROOT + '/quart-pouring-empty.png" x="420" y="15" width="120" height="95" opacity="' + bottle.pourProgress + '"/></g>';
    }
    const transform = bottle.matrix ? stageTransform(bottle.matrix, EMPTY_SOURCE) : "translate(" + bottle.index * 72 + " 0)";
    return imageMarkup(ASSET_ROOT + "/quart-empty-stage.png", transform, bottle.opacity);
  }

  function start() {
    const host = document.getElementById("conversion-1-2-animation");
    if (!host || !DATA) return;
    host.innerHTML = [
      '<svg class="conversion-stage" viewBox="0 0 780 379" role="img" aria-labelledby="title description">',
      '<title id="title">1 gallon equals 128 fluid ounces</title>',
      '<desc id="description">Four quart bottles pour into a gallon jug as the total increases to 128 fluid ounces.</desc>',
      '<defs><radialGradient id="quart-shadow"><stop offset="0" stop-color="#8a8a8a" stop-opacity=".46"/><stop offset=".55" stop-color="#a8a8a8" stop-opacity=".22"/><stop offset="1" stop-color="#e4e4e4" stop-opacity="0"/></radialGradient><linearGradient id="replay-orange" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff9900"/><stop offset=".66" stop-color="#ff6600"/><stop offset="1" stop-color="#ff9900"/></linearGradient></defs>',
      '<rect width="780" height="379" fill="#e4e4e4"/>',
      '<g><rect x="15.15" y="322.85" width="365.7" height="52.8" fill="#9fd2df" stroke="#1e4e59" stroke-width=".55"/><text x="29.15" y="352.85" font-family="Verdana,Arial,sans-serif" font-size="16">1 gallon = 128 fluid ounces</text></g>',
      '<g id="gallon"><image id="gallon-lower" x="455" y="95" width="180" height="175"/><image id="gallon-upper" x="455" y="95" width="180" height="175"/></g>',
      '<g id="bottles"></g>',
      '<g id="counter"><rect id="counter-box" x="638.95" y="181" width="87" height="53" fill="#ffffcc"/><g id="counter-text"></g><g id="fluid-text"></g></g>',
      '<g id="final-formula"><rect x="425.2" y="278.2" width="225.4" height="26.4" rx="13.2" fill="#ffff99" stroke="#999966" stroke-width=".55"/><g id="final-formula-text"></g></g>',
      '<g id="replay" class="replay" role="button" tabindex="-1" aria-label="Replay animation"><rect x="678.4" y="9.2" width="90.5" height="20.5" rx="10.25" fill="#fff" stroke="#999" stroke-width="1.5"/><rect x="731.3" y="9.2" width="37.6" height="20.5" rx="10.25" fill="url(#replay-orange)" stroke="#cd6701" stroke-width="1.5"/><path d="M733 12.1 C741 9.4 758 9.6 766.2 12.2" fill="none" stroke="#fff" stroke-opacity=".72" stroke-width="1.3"/><g id="replay-text" transform="translate(782.95 24) scale(1.3)"></g><circle cx="750.3" cy="19.4" r="7.1" fill="none" stroke="#fff" stroke-width="1.1"/><path d="M747.1 15.4 A5.1 5.1 0 1 1 746.1 22.2 M746.1 22.2 L746.2 18.7 M746.1 22.2 L749.5 21.7" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.15"/></g>',
      '</svg>',
    ].join("");

    const elements = {
      gallonLower: document.getElementById("gallon-lower"),
      gallonUpper: document.getElementById("gallon-upper"),
      bottles: document.getElementById("bottles"),
      counter: document.getElementById("counter"),
      counterBox: document.getElementById("counter-box"),
      counterText: document.getElementById("counter-text"),
      fluidText: document.getElementById("fluid-text"),
      finalFormula: document.getElementById("final-formula"),
      finalFormulaText: document.getElementById("final-formula-text"),
      replay: document.getElementById("replay"),
      replayText: document.getElementById("replay-text"),
    };
    renderGlyphRun(elements.fluidText, "146", 647.95, 246.55);
    renderGlyphRun(elements.finalFormulaText, "174", 439.85, 279.9);
    renderGlyphRun(elements.replayText, "179", -76.65, -11.75);

    let lastCount = "";
    let animationFrame = 0;
    let startedAt = performance.now();

    function render(elapsedMs) {
      const frame = frameFromElapsed(elapsedMs);
      const progress = gallonProgress(frame);
      const scaled = Math.min(4, progress * 4);
      const lower = Math.floor(scaled);
      const upper = Math.min(4, lower + 1);
      const blend = scaled - lower;
      const assets = ["0", "32", "64", "96", "128"];
      elements.gallonLower.setAttribute("href", ASSET_ROOT + "/gallon-" + assets[lower] + ".png");
      elements.gallonLower.setAttribute("opacity", 1 - blend);
      elements.gallonUpper.setAttribute("href", ASSET_ROOT + "/gallon-" + assets[upper] + ".png");
      elements.gallonUpper.setAttribute("opacity", blend);
      elements.bottles.innerHTML = [0, 1, 2, 3].map(function (index) { return bottleMarkup(bottleState(frame, index)); }).join("");

      const count = fluidOunces(frame);
      const counterOpacity = frame < 7 ? 0 : frame >= 14 ? 1 : flashAlpha((frame - 7) / 7);
      elements.counter.setAttribute("opacity", counterOpacity);
      elements.counterBox.setAttribute("stroke", FLASH_FRAMES.has(frame) ? "#ff0000" : "#b8b8a5");
      elements.counterBox.setAttribute("stroke-width", FLASH_FRAMES.has(frame) ? "3" : ".8");
      if (String(count) !== lastCount) {
        elements.counterText.replaceChildren();
        if (count != null) {
          const textId = count === 32 ? "158" : count === 64 ? "165" : count === 96 ? "169" : "172";
          renderGlyphRun(elements.counterText, textId, count === 128 ? 663.95 : 669.9, 195.55);
        }
        lastCount = String(count);
      }

      const formulaOpacity = frame < 88 ? 0 : frame >= 100 ? 1 : flashAlpha((frame - 88) / 12);
      const replayOpacity = frame < 101 ? 0 : flashAlpha((frame - 101) / 8);
      elements.finalFormula.setAttribute("opacity", formulaOpacity);
      elements.replay.setAttribute("opacity", replayOpacity);
      elements.replay.setAttribute("tabindex", replayOpacity > 0 ? "0" : "-1");
      return frame >= MOVIE.frames;
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
