export const DEV_OVERLAY_CAPTURE_STYLE_ID = "help-math-candidate-qa-hide-next-dev-overlay";
export const DEV_OVERLAY_CONTROL_SELECTOR = [
  "button",
  "[role='button']",
  "[data-nextjs-dev-tools-button]",
  "#next-logo",
  "[data-next-badge-root]",
].join(",");
export const DEV_OVERLAY_CAPTURE_CSS = [
  "script[data-nextjs-dev-overlay]",
  "nextjs-portal",
].join(",") + "{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}";

const SNAPSHOT_KEYS = Object.freeze([
  "scriptOverlayCount",
  "hiddenScriptOverlayCount",
  "portalCount",
  "hiddenPortalCount",
  "shadowRootCount",
  "controlCount",
  "visibleControlCount",
]);

function snapshotShapeIsValid(state) {
  return Boolean(state) && SNAPSHOT_KEYS.every((key) => Number.isInteger(state[key]) && state[key] >= 0);
}

function snapshotIsClean(state) {
  return snapshotShapeIsValid(state)
    && state.visibleControlCount === 0
    && state.hiddenScriptOverlayCount === state.scriptOverlayCount
    && state.hiddenPortalCount === state.portalCount;
}

export function devOverlaySuppressionPass(record) {
  return Boolean(
    record?.capturePageOnly === true
      && record?.styleInstalled === true
      && snapshotShapeIsValid(record?.beforeSuppression)
      && snapshotIsClean(record?.afterSuppression)
      && snapshotIsClean(record?.afterCapture),
  );
}

export async function inspectNextDevOverlay(page) {
  return page.evaluate((controlSelector) => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || "1") !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const scripts = [...document.querySelectorAll("script[data-nextjs-dev-overlay]")];
    const portals = [...document.querySelectorAll("nextjs-portal")];
    const controls = portals.flatMap((portal) => (
      portal.shadowRoot ? [...portal.shadowRoot.querySelectorAll(controlSelector)] : []
    ));
    return {
      scriptOverlayCount: scripts.length,
      hiddenScriptOverlayCount: scripts.filter((script) => !visible(script)).length,
      portalCount: portals.length,
      hiddenPortalCount: portals.filter((portal) => !visible(portal)).length,
      shadowRootCount: portals.filter((portal) => portal.shadowRoot).length,
      controlCount: controls.length,
      visibleControlCount: controls.filter(visible).length,
    };
  }, DEV_OVERLAY_CONTROL_SELECTOR);
}

async function settlePage(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

export async function suppressNextDevOverlayForCapture(page, sha256) {
  const beforeSuppression = await inspectNextDevOverlay(page);
  const styleInstalled = await page.evaluate(({ styleId, css, controlSelector }) => {
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.dataset.captureOnly = "true";
      document.head.appendChild(style);
    }
    style.textContent = css;
    for (const script of document.querySelectorAll("script[data-nextjs-dev-overlay]")) {
      script.style.setProperty("display", "none", "important");
      script.style.setProperty("visibility", "hidden", "important");
      script.style.setProperty("opacity", "0", "important");
      script.dataset.helpMathCandidateQaCaptureHidden = "true";
    }
    for (const portal of document.querySelectorAll("nextjs-portal")) {
      portal.style.setProperty("display", "none", "important");
      portal.style.setProperty("visibility", "hidden", "important");
      portal.style.setProperty("opacity", "0", "important");
      portal.style.setProperty("pointer-events", "none", "important");
      portal.dataset.helpMathCandidateQaCaptureHidden = "true";
      for (const control of portal.shadowRoot?.querySelectorAll(controlSelector) || []) {
        control.style.setProperty("display", "none", "important");
        control.style.setProperty("visibility", "hidden", "important");
        control.style.setProperty("opacity", "0", "important");
        control.setAttribute("aria-hidden", "true");
      }
    }
    return Boolean(style.isConnected && style.dataset.captureOnly === "true" && style.textContent === css);
  }, {
    styleId: DEV_OVERLAY_CAPTURE_STYLE_ID,
    css: DEV_OVERLAY_CAPTURE_CSS,
    controlSelector: DEV_OVERLAY_CONTROL_SELECTOR,
  });
  await settlePage(page);
  const afterSuppression = await inspectNextDevOverlay(page);
  const record = {
    capturePageOnly: true,
    strategy: "Capture-page-only CSS plus inline important styles suppress Next.js overlay scripts, portal hosts, and shadow-root controls.",
    styleId: DEV_OVERLAY_CAPTURE_STYLE_ID,
    cssSha256: sha256(DEV_OVERLAY_CAPTURE_CSS),
    styleInstalled,
    beforeSuppression,
    afterSuppression,
    afterCapture: null,
  };
  if (!devOverlaySuppressionPass({ ...record, afterCapture: afterSuppression })) {
    throw new Error(`Next.js development overlay remained visible before capture: ${JSON.stringify(record)}`);
  }
  return record;
}

export async function finalizeNextDevOverlayCapture(page, record) {
  record.afterCapture = await inspectNextDevOverlay(page);
  if (!devOverlaySuppressionPass(record)) {
    throw new Error(`Next.js development overlay became visible during capture: ${JSON.stringify(record)}`);
  }
  return record;
}
