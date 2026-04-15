import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import translationEn from "../src/locales/en/translation.json";
import translationCz from "../src/locales/cz/translation.json";
import contactEn from "../src/locales/en/contactEn.json";
import contactCz from "../src/locales/cz/contactCz.json";
import newSellerEn from "../src/locales/en/newSellerPageEn.json";
import newSellerCz from "../src/locales/cz/newSellerPageCz.json";
import privacyPolicyEn from "../src/locales/en/privacyPolicyEn.json";
import privacyPolicyCz from "../src/locales/cz/privacyPolicyCz.json";
import generalTermsEn from "../src/locales/en/generalTermsEn.json";
import generalTermsCz from "../src/locales/cz/generalTermsCz.json";
import claimEn from "../src/locales/en/claimEn.json";
import claimCz from "../src/locales/cz/claimCz.json";
import termsEn from "../src/locales/en/terms.json";
import termsCz from "../src/locales/cz/terms.json";
import sellerOrderEn from "../src/locales/en/sellerOrderEn.json";
import sellerOrderCz from "../src/locales/cz/sellerOrderCz.json";
import sellerHomeEn from "../src/locales/en/sellerHomeEn.json";
import sellerHomeCz from "../src/locales/cz/sellerHomeCz.json";
import onbordingEn from "../src/locales/en/onbordingEn.json";
import onbordingCz from "../src/locales/cz/onbordingCz.json";
import onbordStatusEn from "../src/locales/en/onbordingStatusEn.json";
import onbordStatusCz from "../src/locales/cz/onbordingStatusCz.json";


const resources = {
  en: {
    translation: translationEn,
    contact: contactEn,
    newSeller: newSellerEn,
    policy: privacyPolicyEn,
    terms: generalTermsEn,
    claim: claimEn,
    newTerm: termsEn,
    sellerOrder: sellerOrderEn,
    sellerHome: sellerHomeEn,
    onbording: onbordingEn,
    onbordStatus: onbordStatusEn
  },
  cz: {
    translation: translationCz,
    contact: contactCz,
    newSeller: newSellerCz,
    policy: privacyPolicyCz,
    terms: generalTermsCz,
    claim: claimCz,
    newTerm: termsCz,
    sellerOrder: sellerOrderCz,
    sellerHome: sellerHomeCz,
    onbording: onbordingCz,
    onbordStatus:onbordStatusCz
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
