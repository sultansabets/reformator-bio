import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ru from "./locales/ru.json";
import kz from "./locales/kz.json";
import en from "./locales/en.json";
import slang from "./locales/slang.json";

const STORAGE_KEY = "reformator_lang";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      kz: { translation: kz },
      en: { translation: en },
      slang: { translation: slang },
    },
    fallbackLng: "ru",
    lng: (() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && ["ru", "kz", "en", "slang"].includes(saved)) return saved;
      } catch {
        // ignore
      }
      return undefined;
    })(),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

export const LANGUAGES = [
  { code: "ru" as const, label: "Русский" },
  { code: "kz" as const, label: "Қазақша" },
  { code: "en" as const, label: "English" },
  { code: "slang" as const, label: "Пацанский" },
] as const;

export function persistLanguage(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

export default i18n;
