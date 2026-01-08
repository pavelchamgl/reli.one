import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import translationEn from "./en/translations.json"
import translationCz from "./cz/translations.json"
import aboutEn from "./en/aboutEn.json"
import aboutCz from "./cz/aboutCz.json"
import pricingCz from "./cz/pricingCz.json"
import pricingEn from "./en/pricingEn.json"
import contactEn from "./en/contactEn.json"
import contactCz from "./cz/contactCz.json"




const resources = {
    en: {
        translation: translationEn,
        about: aboutEn,
        pricing: pricingEn
    },
    cz: {
        translation: translationCz,
        about: aboutCz,
        pricing: pricingCz
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