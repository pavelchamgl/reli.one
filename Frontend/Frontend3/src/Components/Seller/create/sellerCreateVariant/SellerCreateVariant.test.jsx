import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

import SellerCreateVariant from "./SellerCreateVariant";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const baseVariant = {
  id: 1,
  text: "White",
  price: "99.90",
  image: null,
  weight: "12.5",
  width: "800",
  length: "40",
  height: "2060",
  quantity_in_stock: "5",
};

describe("SellerCreateVariant", () => {
  it("protects numeric variant fields from browser translation", () => {
    const { container } = render(
      <SellerCreateVariant
        err={false}
        setErr={vi.fn()}
        variant={baseVariant}
        handleEditVariant={vi.fn()}
        handleDeleteVariant={vi.fn()}
      />
    );

    const protectedInputs = container.querySelectorAll("input[translate='no']");
    expect(protectedInputs.length).toBe(6);
    expect(container.querySelector('input[name], input[placeholder]')).toBeTruthy();
  });
});
