import en from './en.json';
import es from './es.json';
import cs from './cs.json';
import de from './de.json';

export const translations = {
  en,
  es,
  cs,
  de,
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations['en'];

export function getBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const lang = navigator.language.split('-')[0];
  return (lang in translations) ? (lang as Language) : 'en';
}
