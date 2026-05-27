import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { setupStore } from "../redux/index.js";
import i18nTest from "./i18n-test.js";

/**
 * Обёртка для RTL: Redux store + MemoryRouter + I18nextProvider.
 *
 * - Redux: создаёт свежий non-persisted store через setupStore() — без state bleeding (FE-P1-007).
 * - i18n: изолированный тестовый instance (FE-P1-004); t("key") → "key".
 *
 * Опции:
 *   route         — начальный URL для MemoryRouter (default: "/")
 *   storeInstance — кастомный store (если нужна кастомная схема редьюсеров):
 *     renderWithProviders(<C />, { storeInstance: configureStore({ reducer: { auth: authReducer } }) })
 *
 * Тесты, которым важно конкретное значение t(), должны мокать react-i18next напрямую:
 *   vi.mock("react-i18next", async (i) => ({ ...(await i()), useTranslation: () => ({ t: k => k }) }))
 */
export function renderWithProviders(ui, options = {}) {
  const { route = "/", storeInstance = setupStore(), ...renderOptions } = options;

  function Wrapper({ children }) {
    return (
      <Provider store={storeInstance}>
        <I18nextProvider i18n={i18nTest}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </I18nextProvider>
      </Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
