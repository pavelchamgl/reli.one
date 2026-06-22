import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithProviders } from "../../../../test/test-utils.jsx";
import { areProductParametersValid } from "../../../../Components/Seller/shared/sellerProductParameters.js";
import CreateCharacInp from "./CreateCharacInp";

const noop = () => {};

const lastParameters = (setParameters) => {
  const calls = setParameters.mock.calls;
  return calls.length ? calls[calls.length - 1][0] : [];
};

describe("CreateCharacInp", () => {
  it("renders one empty row by default and adds rows", () => {
    renderWithProviders(
      <CreateCharacInp setParameters={noop} setErr={noop} err={false} />
    );

    expect(
      screen.getAllByPlaceholderText("goods.placeholders.characteristicName")
    ).toHaveLength(1);

    fireEvent.click(screen.getByText("item.add"));

    expect(
      screen.getAllByPlaceholderText("goods.placeholders.characteristicName")
    ).toHaveLength(2);
  });

  it("removes a row when delete is clicked", () => {
    renderWithProviders(
      <CreateCharacInp setParameters={noop} setErr={noop} err={false} />
    );

    fireEvent.click(screen.getByText("item.add"));
    expect(
      screen.getAllByPlaceholderText("goods.placeholders.characteristicName")
    ).toHaveLength(2);

    fireEvent.click(screen.getAllByLabelText("goods.deleteCharacteristic")[0]);
    expect(
      screen.getAllByPlaceholderText("goods.placeholders.characteristicName")
    ).toHaveLength(1);
  });

  it("toggles the required error without unmounting the node", () => {
    const { container, rerender } = renderWithProviders(
      <CreateCharacInp setParameters={noop} setErr={noop} err={false} />
    );

    const errNode = container.querySelector('[class*="errText"]');
    expect(errNode).toBeInTheDocument();
    expect(errNode).not.toBeVisible();
    expect(errNode).not.toHaveAttribute("translate", "no");

    rerender(<CreateCharacInp setParameters={noop} setErr={noop} err={true} />);

    expect(errNode).toBeVisible();
    expect(errNode).toHaveTextContent("allParametersAreRequired");
  });

  it("stays optional after add -> type -> delete (leftover empty row is valid)", () => {
    const setParameters = vi.fn();
    renderWithProviders(
      <CreateCharacInp setParameters={setParameters} setErr={noop} err={false} />
    );

    fireEvent.click(screen.getByText("item.add"));

    const nameInputs = screen.getAllByPlaceholderText(
      "goods.placeholders.characteristicName"
    );
    fireEvent.change(nameInputs[1], { target: { value: "Color" } });

    fireEvent.click(screen.getAllByLabelText("goods.deleteCharacteristic")[1]);

    expect(areProductParametersValid(lastParameters(setParameters))).toBe(true);
  });

  it("becomes invalid when a row has only the name filled", () => {
    const setParameters = vi.fn();
    renderWithProviders(
      <CreateCharacInp setParameters={setParameters} setErr={noop} err={false} />
    );

    const nameInputs = screen.getAllByPlaceholderText(
      "goods.placeholders.characteristicName"
    );
    fireEvent.change(nameInputs[0], { target: { value: "Color" } });

    expect(areProductParametersValid(lastParameters(setParameters))).toBe(false);
  });
});
