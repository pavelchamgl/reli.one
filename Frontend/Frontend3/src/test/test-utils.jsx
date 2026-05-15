import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../redux/index.js";

/**
 * Обёртка для RTL: Redux store + MemoryRouter (как в docs/frontend/testing-plan.md).
 *
 * По умолчанию создаёт свежий non-persisted store через setupStore() — каждый тест
 * получает изолированный инстанс без state bleeding (FE-P1-007).
 *
 * Для передачи кастомного store используй опцию storeInstance:
 *   renderWithProviders(<C />, { storeInstance: configureStore({ reducer: { auth: authReducer } }) })
 */
export function renderWithProviders(ui, options = {}) {
  const { route = "/", storeInstance = setupStore(), ...renderOptions } = options;

  function Wrapper({ children }) {
    return (
      <Provider store={storeInstance}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
