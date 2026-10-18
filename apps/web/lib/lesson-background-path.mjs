/**
 * Content-hashed, immutable public path for a source-bound lesson background.
 * Shared by the build step that emits the file and the shell that renders it.
 */
export function hashedLessonBackgroundPath(assetPath, sha256) {
  if (!/^[a-f0-9]{64}$/u.test(sha256)) throw new Error(`Invalid lesson background digest for ${assetPath}`);
  const name = assetPath.split('/').at(-1);
  const dot = name.lastIndexOf('.');
  return `/lesson-backgrounds/${name.slice(0, dot)}.${sha256.slice(0, 16)}${name.slice(dot)}`;
}
