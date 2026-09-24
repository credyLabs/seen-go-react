import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

// English
import enCommon from "./locales/en/common.json"

// Tamil
import taCommon from "./locales/ta/common.json"

// Arabic
import arCommon from "./locales/ar/common.json"

const resources = {
  en: {
    common: enCommon,
  },
  ta: {
    common: taCommon,
  },
  ar: {
    common: arCommon,
  },
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,

    // Default language
    fallbackLng: "en",

    // Supported languages
    supportedLngs: ["en", "ta", "ar"],

    // Default namespace
    defaultNS: "common",

    // Available namespaces
    ns: ["common"],

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  })

export default i18n
