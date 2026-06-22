import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import SellerReviewProductInfo from "./SellerReviewProductInfo";

vi.mock("@mui/material", () => ({
  Rating: () => <div data-testid="rating" />,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock("../../../../utils/sellerCatalogI18n", () => ({
  translateCategoryName: (_id, name) => name,
}));

const baseReview = {
  rating: 4,
  totalReviews: 12,
  productName: "Test door",
  categoryId: 1,
  categoryName: "Doors",
  price: "100",
  priceWithoutVat: "82.64",
  vatRate: "21",
  variantAxisName: "Color",
  variants: [
    {
      id: 1,
      value: "White",
      price: "100",
      stockStatus: "in_stock",
      sku: "SKU-001",
    },
  ],
  deliveryText: "Delivery info",
};

describe("SellerReviewProductInfo", () => {
  it("protects technical price and SKU values from browser translation", () => {
    render(
      <SellerReviewProductInfo
        review={baseReview}
        activeVariantId={1}
        onActiveVariantChange={vi.fn()}
      />
    );

    const priceNodes = screen.getAllByText("100 €");
    expect(priceNodes.length).toBeGreaterThan(0);
    priceNodes.forEach((node) => expect(node).toHaveAttribute("translate", "no"));
    expect(screen.getByText("SKU-001")).toHaveAttribute("translate", "no");
    expect(screen.getByText("12")).toHaveAttribute("translate", "no");
    expect(screen.getByText("21")).toHaveAttribute("translate", "no");
  });
});
