import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithProviders } from "../../../../test/test-utils.jsx";
import SellerCreateImage from "./SellerCreateImage";

vi.mock("swiper/react", () => ({
  Swiper: ({ children }) => <div data-testid="swiper">{children}</div>,
  SwiperSlide: ({ children }) => <div>{children}</div>,
}));

vi.mock("swiper/modules", () => ({ Navigation: {} }));

vi.mock("react-responsive", () => ({
  useMediaQuery: () => false,
}));

const noop = () => {};

describe("SellerCreateImage", () => {
  it("shows a file validation error for unsupported files", () => {
    renderWithProviders(<SellerCreateImage err={false} setErr={noop} />);

    const fileInput = document.querySelector('input[type="file"]');
    const badFile = new File(["x"], "doc.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    const errNode = screen.getByText("goods.errors.productImageFormat");
    expect(errNode).toBeVisible();
    expect(errNode).not.toHaveAttribute("translate", "no");
  });

  it("shows the image-required error only when err is true and keeps it mounted otherwise", () => {
    const { container, rerender } = renderWithProviders(
      <SellerCreateImage err={false} setErr={noop} />
    );

    const errNodes = container.querySelectorAll('[class*="errText"]');
    expect(errNodes.length).toBe(2);
    errNodes.forEach((node) => expect(node).not.toBeVisible());

    rerender(<SellerCreateImage err={true} setErr={noop} />);

    const requiredNode = screen.getByText("goods.errors.imageRequired");
    expect(requiredNode).toBeVisible();
    expect(requiredNode).not.toHaveAttribute("translate", "no");
  });
});
