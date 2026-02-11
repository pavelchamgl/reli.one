import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import translationEn from "../src/locales/en/translation.json";
import translationCz from "../src/locales/cz/translation.json";
import contactEn from "../src/locales/en/contactEn.json";
import contactCz from "../src/locales/cz/contactCz.json";
import aboutCz from "../src/locales/cz/aboutCz.json";
import aboutEn from "../src/locales/en/aboutEn.json";

const resources = {
  en: {
    translation: translationEn,
    contact: contactEn,
    about: aboutEn
  },
  cz: {
    translation: translationCz,
    contact: contactCz,
    about: aboutCz
  },
};

// Достаём язык из localStorage или ставим "en"
const savedLanguage = localStorage.getItem("i18nextLng") || "en";

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage, // ← подставляем сохранённый язык
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// слушаем смену языка и сохраняем
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("i18nextLng", lng);
});

export default i18n;
