"use client";

import * as React from 'react';
import { translations, getBrowserLanguage, Language } from './index';

type ContextValue = {
  language: Language;
  setLanguage: (l: Language) => void;
};

const TranslationContext = React.createContext<ContextValue | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with a deterministic language on both server and client
  // to avoid hydration mismatches. Detect the browser/URL language
  // on the client only and update state afterwards.
  const [language, setLanguage] = React.useState<Language>('en');

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('lang');
      if (q && (q in translations)) {
        setLanguage(q as Language);
        return;
      }
    } catch {}

    // Fallback to browser language when no explicit param is present
    setLanguage(getBrowserLanguage());
  }, []);

  // keep URL in sync when language changes
  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', language);
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [language]);

  const value = React.useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export function useTranslationContext() {
  const ctx = React.useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslationContext must be used within a TranslationProvider');
  return ctx;
}
