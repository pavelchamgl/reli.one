import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import translationEn from "../src/locales/en/translation.json"
import translationDe from "../src/locales/de/translation.json"
import translationCs from "../src/locales/cs/translation.json"

const resources = {
    en: {
        translation: translationEn
    },
    de: {
        translation: translationDe
    },
    cs: {
        translation: translationCs
    }
};

i18n
    .use(initReactI18next) // передаем i18n в react-i18next
    .init({
        resources,
        lng: 'en', // язык по умолчанию
        fallbackLng: 'en', // язык, если перевод не найден
        interpolation: {
            escapeValue: false // для React не нужно экранирование
        }
    });

export default i18n;  