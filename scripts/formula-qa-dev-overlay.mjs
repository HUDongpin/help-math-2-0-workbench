import {createHash} from "node:crypto";

export const DEV_OVERLAY_CAPTURE_CSS = [
  "script[data-nextjs-dev-overlay]",
  "nextjs-portal",
].join(",") + "{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}";

export const DEV_OVERLAY_CONTROL_SELECTOR = [
  "button",
  "[role='button']",
  "[data-nextjs-dev-tools-button]",
  "#next-logo",
  "[data-next-badge-root]",
].join(",");

const SNAPSHOT_FIELDS = Object.freeze([
  "scriptOverlayCount",
  "hiddenScriptOverlayCount",
  "portalCount",
  "hiddenPortalCount",
  "shadowRootCount",
  "controlCount",
  "visibleControlCount",
]);

export function normalizeServerMode(value) {
  if (value !== "development" && value !== "production") {
    throw new Error(`--server-mode must be development or production, received ${JSON.stringify(value)}`);
  }
  return value;
}

export function overlaySnapshotShapeIsValid(snapshot) {
  return Boolean(snapshot)
    && SNAPSHOT_FIELDS.every((field) => Number.isInteger(snapshot[field]) && snapshot[field] >= 0);
}

export function overlaySnapshotIsSuppressed(snapshot) {
  return overlaySnapshotShapeIsValid(snapshot)
    && snapshot.visibleControlCount === 0
    && snapshot.hiddenScriptOverlayCount === snapshot.scriptOverlayCount
    && snapshot.hiddenPortalCount === snapshot.portalCount;
}

export function productionOverlayIsAbsent(snapshot) {
  return overlaySnapshotShapeIsValid(snapshot)
    && snapshot.scriptOverlayCount === 0
    && snapshot.portalCount === 0
    && snapshot.shadowRootCount === 0
    && snapshot.controlCount === 0
    && snapshot.visibleControlCount === 0;
}

export function devOverlaySuppressionPass(record) {
  if (!record
    || record.capturePageOnly !== true
    || record.styleInstalled !== true
    || !["development", "production"].includes(record.serverMode)
    || !overlaySnapshotShapeIsValid(record.beforeSuppression)
    || !overlaySnapshotIsSuppressed(record.afterSuppression)
    || !overlaySnapshotIsSuppressed(record.afterCapture)) return false;
  return record.serverMode !== "production" || productionOverlayIsAbsent(record.beforeSuppression);
}

export async function inspectDevOverlay(page) {
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
    const collectShadowRoots = (root, output) => {
      for (const element of root.querySelectorAll("*")) {
        if (!element.shadowRoot) continue;
        output.push(element.shadowRoot);
        collectShadowRoots(element.shadowRoot, output);
      }
    };
    const scripts = [...document.querySelectorAll("script[data-nextjs-dev-overlay]")];
    const portals = [...document.querySelectorAll("nextjs-portal")];
    const shadowRoots = [];
    for (const portal of portals) {
      if (!portal.shadowRoot) continue;
      shadowRoots.push(portal.shadowRoot);
      collectShadowRoots(portal.shadowRoot, shadowRoots);
    }
    const controls = shadowRoots.flatMap((root) => [...root.querySelectorAll(controlSelector)]);
    return {
      scriptOverlayCount: scripts.length,
      hiddenScriptOverlayCount: scripts.filter((script) => !visible(script)).length,
      portalCount: portals.length,
      hiddenPortalCount: portals.filter((portal) => !visible(portal)).length,
      shadowRootCount: shadowRoots.length,
      controlCount: controls.length,
      visibleControlCount: controls.filter(visible).length,
    };
  }, DEV_OVERLAY_CONTROL_SELECTOR);
}

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

export async function suppressDevOverlayForCapture(page, {serverMode, styleId, marker}) {
  const normalizedServerMode = normalizeServerMode(serverMode);
  const beforeSuppression = await inspectDevOverlay(page);
  if (normalizedServerMode === "production" && !productionOverlayIsAbsent(beforeSuppression)) {
    throw new Error(`Next.js development overlay exists in production QA mode: ${JSON.stringify(beforeSuppression)}`);
  }
  const styleInstalled = await page.evaluate(({styleId: id, css, controlSelector, marker: markerName}) => {
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      style.dataset.captureOnly = "true";
      document.head.appendChild(style);
    }
    style.textContent = css;
    const hide = (element) => {
      element.style.setProperty("display", "none", "important");
      element.style.setProperty("visibility", "hidden", "important");
      element.style.setProperty("opacity", "0", "important");
      element.style.setProperty("pointer-events", "none", "important");
      element.dataset[markerName] = "true";
    };
    for (const script of document.querySelectorAll("script[data-nextjs-dev-overlay]")) hide(script);
    for (const portal of document.querySelectorAll("nextjs-portal")) {
      hide(portal);
      const roots = portal.shadowRoot ? [portal.shadowRoot] : [];
      for (let index = 0; index < roots.length; index += 1) {
        const root = roots[index];
        for (const element of root.querySelectorAll("*")) {
          if (element.shadowRoot) roots.push(element.shadowRoot);
        }
        for (const control of root.querySelectorAll(controlSelector)) {
          hide(control);
          control.setAttribute("aria-hidden", "true");
        }
      }
    }
    return Boolean(style.isConnected && style.dataset.captureOnly === "true" && style.textContent === css);
  }, {
    styleId,
    css: DEV_OVERLAY_CAPTURE_CSS,
    controlSelector: DEV_OVERLAY_CONTROL_SELECTOR,
    marker,
  });
  await settle(page);
  const afterSuppression = await inspectDevOverlay(page);
  const record = {
    schemaVersion: 1,
    capturePageOnly: true,
    serverMode: normalizedServerMode,
    strategy: "Capture-page-only CSS plus inline important styles suppress Next.js overlay scripts, portal hosts, and recursively discovered shadow-root controls.",
    styleId,
    cssSha256: createHash("sha256").update(DEV_OVERLAY_CAPTURE_CSS).digest("hex"),
    styleInstalled,
    beforeSuppression,
    afterSuppression,
    afterCapture: null,
  };
  if (!devOverlaySuppressionPass({...record, afterCapture: afterSuppression})) {
    throw new Error(`Next.js development overlay remained visible before evidence capture: ${JSON.stringify(record)}`);
  }
  return record;
}

export async function finalizeDevOverlayCapture(page, record) {
  record.afterCapture = await inspectDevOverlay(page);
  if (!devOverlaySuppressionPass(record)) {
    throw new Error(`Next.js development overlay became visible during evidence capture: ${JSON.stringify(record)}`);
  }
  return record;
}
