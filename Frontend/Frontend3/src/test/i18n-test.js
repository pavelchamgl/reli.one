/**
 * Лёгкий i18n instance для RTL-тестов.
 *
 * Создаётся через createInstance() — не загрязняет production singleton.
 * Пустые ресурсы: t("some.key") возвращает "some.key" — предсказуемо в тестах.
 * Не читает localStorage (initImmediate: false + lng: "en" хардкодом).
 *
 * @see docs/frontend/frontend3-audit.md FE-P1-004
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const i18nTest = i18n.createInstance();

i18nTest.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
  initImmediate: false,
});

export default i18nTest;
