import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "../redux/index.js";

/**
 * Обёртка для RTL: Redux store + MemoryRouter (как в docs/frontend/testing-plan.md).
 */
export function renderWithProviders(ui, options = {}) {
  const { route = "/", storeInstance = store, ...renderOptions } = options;

  function Wrapper({ children }) {
    return (
      <Provider store={storeInstance}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
