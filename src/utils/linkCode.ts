export const normalizeLinkCode = (value: string): string | null => {
  const input = value.trim();
  if (!input) return null;

  if (/^https?:\/\//i.test(input) || input.startsWith('/link/')) {
    try {
      const url = new URL(input, 'https://tarefas-diarias.invalid');
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length !== 2 || segments[0] !== 'link') return null;

      const code = decodeURIComponent(segments[1]);
      return code && !/[\\/]/.test(code) ? code : null;
    } catch {
      return null;
    }
  }

  return /[/\\?#]/.test(input) ? null : input;
};
