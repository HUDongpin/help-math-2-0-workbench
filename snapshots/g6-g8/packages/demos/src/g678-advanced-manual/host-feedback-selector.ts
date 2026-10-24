export type HostFeedbackKind = "right" | "wrong";

export interface HostFeedbackSelection {
  readonly kind: HostFeedbackKind;
  readonly branchIndex: number;
  readonly cardinality: 3 | 4;
  readonly instanceName:
    | `Mc_Wrong_Feed${number}`
    | `Mc_Right_Feed${number}`;
  readonly authoritativeAdobeRandomStateAccepted: false;
}

/**
 * Three independent HELP Math lesson-host evidence chains expose the same
 * shell-owned selector cardinalities. The G4 product bridge already uses the
 * unsigned page seed modulo the exact cardinality so branch capture is stable
 * and exhaustible. That maintained mapping preserves the source-reachable
 * branch set; it deliberately does not claim equality with Adobe's random
 * generator state.
 */
export const HELP_MATH_HOST_FEEDBACK_SELECTOR_V1 = Object.freeze({
  schemaVersion: 1,
  contractId: "help-math-host-feedback-selector-v1",
  sourceCalls: Object.freeze({
    wrong: "showWrongFeed -> random(3) + 1",
    right: "showRightFeed -> random(4) + 1",
  }),
  evidence: Object.freeze([
    Object.freeze({
      path: "migrations/course-g03-l01-ts-008/audit/host-function-binding.json",
      bytes: 17761,
      sha256: "444b49203626ed196a59f77f9164158e47a450bb448d1f24bb40b7d3f13a068e",
      scope: "same-lesson G3 child-to-host static binding",
    }),
    Object.freeze({
      path: "catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v31.json",
      bytes: 23020,
      sha256: "7729ca9cc648c98148d29f1f19adf0ad46a5ce4cec622b6213348dc359cabbd2",
      scope: "G4 product bridge random-branch gate",
    }),
    Object.freeze({
      path: "migrations/course-g05-l13-rw-002/audit/original-host-entry/ffdec-scripts/frame_35/DoAction.as",
      bytes: 122477,
      sha256: "19a500653e0e71cb8c936373a709f13f6377e74f2d74c57e179a68710a8da08f",
      scope: "unmodified G5 host ActionScript export",
    }),
    Object.freeze({
      path: "migrations/course-g05-l13-rw-002/audit/original-host-entry-contract.json",
      bytes: 35618,
      sha256: "433b34758c1e707da2bd5a10438ea1a35675e1a159d3d73bdc98440875ccbdbf",
      scope: "G5 original-host source contract",
    }),
  ]),
  selectionRule:
    "unsigned page seed modulo exact source cardinality, then add one",
  wrongCardinality: 3,
  rightCardinality: 4,
  authoritativeAdobeRandomStateAccepted: false,
  audioAccepted: false,
  strictAcceptanceEffect: "none",
} as const);

export function selectHostFeedback(
  kind: HostFeedbackKind,
  seed: number,
): HostFeedbackSelection {
  const cardinality = kind === "wrong" ? 3 : 4;
  const unsignedSeed = Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 0;
  const branchIndex = (unsignedSeed % cardinality) + 1;
  const prefix = kind === "wrong" ? "Mc_Wrong_Feed" : "Mc_Right_Feed";
  return Object.freeze({
    kind,
    branchIndex,
    cardinality,
    instanceName: `${prefix}${branchIndex}` as HostFeedbackSelection["instanceName"],
    authoritativeAdobeRandomStateAccepted: false,
  });
}
