import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithProviders } from "../../../../test/test-utils.jsx";
import CreateCharacInp from "./CreateCharacInp";

const noop = () => {};

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

  it("toggles the translation-protected required error without unmounting it", () => {
    const { container, rerender } = renderWithProviders(
      <CreateCharacInp setParameters={noop} setErr={noop} err={false} />
    );

    let errNode = container.querySelector("p[translate='no']");
    expect(errNode).toBeInTheDocument();
    expect(errNode).not.toBeVisible();

    rerender(<CreateCharacInp setParameters={noop} setErr={noop} err={true} />);

    errNode = container.querySelector("p[translate='no']");
    expect(errNode).toBeVisible();
    expect(errNode).toHaveTextContent("allParametersAreRequired");
  });
});
