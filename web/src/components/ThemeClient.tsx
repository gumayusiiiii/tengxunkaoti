'use client';

import { useEffect } from 'react';

export type ThemeMode = 'day' | 'night';

export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const cls = document.body.classList;
  // day = warm beige, night = warm dark
  cls.remove('theme-night');
  cls.add('theme-warm');
  if (mode === 'night') cls.add('theme-night');
}

export default function ThemeClient() {
  useEffect(() => {
    const stored = (localStorage.getItem('theme_mode') as ThemeMode | null) ?? 'day';
    applyTheme(stored === 'night' ? 'night' : 'day');
  }, []);

  return null;
}

