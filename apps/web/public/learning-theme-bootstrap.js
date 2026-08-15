(() => {
  let theme = 'light';
  try {
    const saved = localStorage.getItem('helpmath:learning-workspace-theme:v1');
    if (saved === 'light' || saved === 'dark') theme = saved;
    else if (matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  } catch {}
  document.documentElement.dataset.learningPlatformTheme = theme;
})();
