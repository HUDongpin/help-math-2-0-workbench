/* Generated from the frozen compact IR. Do not edit. */
(() => {
  'use strict';
  const animationId = "course-g04-l09-in-010";
  const colors = ['#e7f8ff', '#dff6ed', '#fff3cf'];
  const asset = Object.freeze({
    ready: () => Promise.resolve(),
    render(canvas, request) {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('2D Canvas is required');
      const frame = Math.max(1, Math.min(271, Number(request.frame) || 1));
      const seed = Number.isSafeInteger(request.seed) ? request.seed : 0;
      context.clearRect(0, 0, 800, 600);
      context.fillStyle = colors[Math.abs(seed + 23) % colors.length];
      context.fillRect(0, 0, 800, 600);
      context.strokeStyle = '#174f78';
      context.lineWidth = 8;
      context.beginPath();
      context.moveTo(100, 390);
      context.lineTo(700, 390);
      context.stroke();
      for (let index = 0; index < 5; index += 1) {
        const height = 55 + ((seed + index * 29 + 23) % 120);
        context.fillStyle = index % 2 ? '#f59e0b' : '#0b7fab';
        context.fillRect(150 + index * 105, 390 - height, 68, height);
      }
      context.fillStyle = '#17324d';
      context.font = '700 28px system-ui, sans-serif';
      context.fillText("IN · Solving Equations Using a Balance Scale Practice", 52, 66);
      context.font = '600 18px system-ui, sans-serif';
      context.fillText('Source-bound Current-JS engineering candidate', 52, 102);
      context.fillText('Frame ' + frame + ' / 271', 52, 540);
      canvas.dataset.flashFrame = String(frame);
      canvas.dataset.flashFrameDomain = "sprite-156";
      canvas.dataset.networkCalls = '0';
      canvas.dataset.originalRuntimeValidated = 'false';
      return Object.freeze({animationId, frame, networkCalls: 0});
    },
  });
  window.HELP_MATH_CANVAS_ASSETS = window.HELP_MATH_CANVAS_ASSETS || {};
  window.HELP_MATH_CANVAS_ASSETS[animationId] = asset;
})();
