"use client";

import { useMemo } from 'react';
import { translations } from './index';
import { useTranslationContext } from './TranslationProvider';

export function useTranslation() {
  const { language, setLanguage } = useTranslationContext();

  const t = useMemo(() => translations[language], [language]);

  const languages = Object.keys(translations) as Array<keyof typeof translations>;

  return { t, language, setLanguage, languages };
}
