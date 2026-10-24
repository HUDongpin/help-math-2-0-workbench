let preparation: Promise<void> | null = null;
export function prepareP037Fonts(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  return preparation ??= (async () => {
    const faces = await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),
      document.fonts.load('500 24px "HELP Math Fredoka"')]);
    if (faces.some(group => group.length === 0)) throw Error('P037_FONT_UNAVAILABLE');
    await document.fonts.ready;
  })().catch(error => {preparation = null; throw error;});
}
