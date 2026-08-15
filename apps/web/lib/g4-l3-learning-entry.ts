export function resolveG4L3LearningEntryAvailability({
  descriptorBound,
  developmentAudit,
  showcaseEnabled,
}: Readonly<{
  descriptorBound: boolean;
  developmentAudit: boolean;
  showcaseEnabled: boolean;
}>) {
  return descriptorBound
    && (developmentAudit || showcaseEnabled);
}
