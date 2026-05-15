import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { renderWithProviders } from "./test-utils.jsx";

describe("renderWithProviders", () => {
  it("renders children with Redux and router context", () => {
    renderWithProviders(<div data-testid="smoke">ok</div>);
    expect(screen.getByTestId("smoke")).toHaveTextContent("ok");
  });

  it("provides i18n context — useTranslation does not throw", () => {
    function I18nSmoke() {
      const { t } = useTranslation();
      return <div data-testid="i18n-smoke">{t("test.key")}</div>;
    }

    renderWithProviders(<I18nSmoke />);
    expect(screen.getByTestId("i18n-smoke")).toBeInTheDocument();
    // empty test resources → key returned as-is
    expect(screen.getByTestId("i18n-smoke")).toHaveTextContent("test.key");
  });
});
