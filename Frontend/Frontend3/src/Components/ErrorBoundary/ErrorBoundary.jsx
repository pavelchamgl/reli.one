import { Component } from "react";
import * as Sentry from "@sentry/react";

import i18n from "../../../language/i18next";

/**
 * Глобальный ErrorBoundary.
 *
 * Зачем: при включённом автопереводе страницы браузер оборачивает текст-узлы
 * в <font> и перемещает их, из-за чего React при reconciliation падает с
 * `NotFoundError: Failed to execute 'removeChild' on 'Node'`. Без boundary
 * срабатывает дефолтный экран React Router («Unexpected Application Error!»).
 *
 * Что делает:
 * - показывает управляемый фолбэк с кнопками «Назад» / «Перезагрузить»;
 * - логирует ошибку в Sentry с тегом area и флагом возможного автоперевода
 *   (наличие <font>-узлов в #root), без PII.
 */
const hasTranslatorFontNodes = () => {
  try {
    const root = document.getElementById("root");
    return Boolean(root && root.querySelector("font"));
  } catch {
    return false;
  }
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleReload = this.handleReload.bind(this);
    this.handleBack = this.handleBack.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    const translationLikelyActive = hasTranslatorFontNodes();

    Sentry.withScope((scope) => {
      scope.setTag("area", this.props.area || "app");
      scope.setTag("translation_likely_active", String(translationLikelyActive));
      scope.setContext("react", {
        componentStack: info?.componentStack,
      });
      Sentry.captureException(error);
    });
  }

  handleReload() {
    window.location.reload();
  }

  handleBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.assign("/");
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const t = (key, defaultValue) =>
      i18n.t(key, { defaultValue, ns: "translation" });

    return (
      <div
        translate="no"
        role="alert"
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          fontFamily: "var(--ft, sans-serif)",
        }}
      >
        <h1 style={{ fontSize: "22px", margin: 0 }}>
          {t("errorBoundary.title", "Something went wrong")}
        </h1>
        <p style={{ maxWidth: "520px", margin: 0, color: "#4b5563", lineHeight: 1.5 }}>
          {t(
            "errorBoundary.description",
            "The page could not be displayed correctly. Please reload the page or go back."
          )}
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#111827",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {t("errorBoundary.reload", "Reload page")}
          </button>
          <button
            type="button"
            onClick={this.handleBack}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#111827",
              cursor: "pointer",
            }}
          >
            {t("errorBoundary.back", "Go back")}
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
