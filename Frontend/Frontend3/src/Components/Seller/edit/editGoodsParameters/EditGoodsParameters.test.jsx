import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithProviders } from "../../../../test/test-utils.jsx";
import { setupStore } from "../../../../redux/index.js";
import { areProductParametersValid } from "../../shared/sellerProductParameters.js";
import EditGoodsParameters from "./EditGoodsParameters";

const noop = () => {};

const storeParameters = (store) => store.getState().edit_goods.parameters || [];

describe("EditGoodsParameters", () => {
  it("stays optional after deleting the only filled row (leftover empty row is valid)", () => {
    const store = setupStore();
    renderWithProviders(
      <EditGoodsParameters
        parameters={[{ id: 1, name: "Color", value: "Red", status: "local" }]}
        err={false}
        setErr={noop}
      />,
      { storeInstance: store }
    );

    fireEvent.click(screen.getByLabelText("goods.deleteCharacteristic"));

    expect(areProductParametersValid(storeParameters(store))).toBe(true);
  });

  it("becomes invalid when a row has only the name filled", () => {
    const store = setupStore();
    renderWithProviders(
      <EditGoodsParameters parameters={[]} err={false} setErr={noop} />,
      { storeInstance: store }
    );

    const nameInput = screen.getByPlaceholderText(
      "goods.placeholders.characteristicName"
    );
    fireEvent.change(nameInput, { target: { value: "Color" } });

    expect(areProductParametersValid(storeParameters(store))).toBe(false);
  });
});
