/** Native P060 quiz content uses document flow, as the maintained DOM lessons do.
 * Keep the opt-in on this versioned renderer; source-coordinate pages retain
 * their existing host layout when the quiz unmounts. */
const P060_COURSE_SCOPE = '[data-lesson-player][data-current-animation-id="shared-alg001-l06-p060"]:has([data-p060-native-flow="v1"])';

export const P060_COURSE_LAYOUT_CSS = `
${P060_COURSE_SCOPE} .lesson-shell2[data-host-presentation="modern-wide"] .lesson-shell2__legacy-stage {
  aspect-ratio: auto;
  height: auto;
  max-height: none;
  overflow: visible;
}
${P060_COURSE_SCOPE} .lesson-shell2__legacy-stage > .lesson-shell2__stage {
  aspect-ratio: auto;
  height: auto;
  inset: auto;
  max-height: none;
  overflow: visible;
  position: relative;
}
${P060_COURSE_SCOPE} .lesson-shell2__legacy-stage :is(.runtime-shell, .runtime-stage, .runtime-stage > div) {
  height: auto;
  max-height: none;
  min-height: 0;
}
${P060_COURSE_SCOPE} .p060-source-language-note {
  color: #142d44;
  font: 400 1rem/1.5 system-ui, sans-serif;
  margin: 0;
  padding: .5rem .75rem;
}
`;
