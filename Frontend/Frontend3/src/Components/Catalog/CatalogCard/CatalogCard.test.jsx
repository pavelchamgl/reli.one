import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { renderWithProviders } from "../../../test/test-utils.jsx";

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (_key, opts) => opts?.defaultValue ?? _key,
      i18n: { changeLanguage: vi.fn() },
    }),
  };
});

// Minimal stub for the redux slice used by CatalogCard (setPodCategory)
vi.mock("../../../redux/categorySlice.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    setPodCategory: vi.fn((payload) => ({ type: "category/setPodCategory", payload })),
  };
});

import CatalogCard from "./CatalogCard.jsx";

// Minimal store — CatalogCard dispatches setPodCategory but doesn't read state
const makeStore = () =>
  configureStore({
    reducer: {
      category: (state = {}, action) => state,
    },
  });

describe("CatalogCard", () => {
  const item = { id: 3, name: "Electronics", image_url: "https://example.com/img.jpg" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders category name", () => {
    renderWithProviders(<CatalogCard item={item} />, {
      storeInstance: makeStore(),
    });

    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("applies background image from item.image_url", () => {
    renderWithProviders(<CatalogCard item={item} />, {
      storeInstance: makeStore(),
    });

    const card = screen.getByText("Electronics").closest("[style]");
    expect(card?.style.backgroundImage).toContain("example.com/img.jpg");
  });

  it("dispatches setPodCategory when card is clicked", async () => {
    const store = makeStore();
    const dispatch = vi.spyOn(store, "dispatch");
    const user = userEvent.setup();

    renderWithProviders(<CatalogCard item={item} />, { storeInstance: store });

    await user.click(screen.getByText("Electronics").closest("div[class]"));

    expect(dispatch).toHaveBeenCalled();
  });
});
