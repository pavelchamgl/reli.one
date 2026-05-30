import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }) => children,
}));

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: class AdapterDayjs {},
}));

vi.mock("@mui/x-date-pickers/DateCalendar", () => ({
  DateCalendar: () => null,
}));

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
