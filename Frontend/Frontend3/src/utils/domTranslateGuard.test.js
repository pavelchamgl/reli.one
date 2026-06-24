import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import * as Sentry from "@sentry/react";

import {
  installDomTranslateGuard,
  isDomTranslateGuardInstalled,
  resetDomTranslateGuardTelemetryForTests,
} from "./domTranslateGuard";

vi.mock("@sentry/react", () => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
}));

describe("domTranslateGuard", () => {
  beforeAll(() => {
    installDomTranslateGuard();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resetDomTranslateGuardTelemetryForTests();
  });

  it("installs once and is idempotent", () => {
    expect(isDomTranslateGuardInstalled()).toBe(true);
    expect(() => installDomTranslateGuard()).not.toThrow();
    expect(isDomTranslateGuardInstalled()).toBe(true);
  });

  it("removeChild does not throw when the child belongs to another parent", () => {
    const parent = document.createElement("div");
    const otherParent = document.createElement("div");
    const child = document.createElement("span");
    otherParent.appendChild(child);

    expect(() => parent.removeChild(child)).not.toThrow();
    expect(otherParent.contains(child)).toBe(true);

    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "dom.translate_guard",
        message: "Cross-parent removeChild suppressed",
      })
    );
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "DOM translate guard: cross-parent mutation suppressed",
      expect.objectContaining({
        level: "info",
        tags: { area: "dom_translate_guard", method: "removeChild" },
      })
    );
  });

  it("removeChild removes the child when the parent matches", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);

    parent.removeChild(child);

    expect(parent.contains(child)).toBe(false);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("insertBefore does not throw when the reference node belongs to another parent", () => {
    const parent = document.createElement("div");
    const otherParent = document.createElement("div");
    const referenceNode = document.createElement("span");
    const newNode = document.createElement("b");
    otherParent.appendChild(referenceNode);

    expect(() => parent.insertBefore(newNode, referenceNode)).not.toThrow();
    expect(parent.contains(newNode)).toBe(false);

    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "dom.translate_guard",
        message: "Cross-parent insertBefore suppressed",
      })
    );
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "DOM translate guard: cross-parent mutation suppressed",
      expect.objectContaining({
        level: "info",
        tags: { area: "dom_translate_guard", method: "insertBefore" },
      })
    );
  });

  it("insertBefore inserts when the reference node belongs to the same parent", () => {
    const parent = document.createElement("div");
    const referenceNode = document.createElement("span");
    const newNode = document.createElement("b");
    parent.appendChild(referenceNode);

    parent.insertBefore(newNode, referenceNode);

    expect(parent.firstChild).toBe(newNode);
    expect(parent.lastChild).toBe(referenceNode);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("reports cross-parent telemetry only once per session (rate-limit)", () => {
    const parent = document.createElement("div");
    const otherParent = document.createElement("div");
    const child = document.createElement("span");
    const referenceNode = document.createElement("span");
    const newNode = document.createElement("b");
    otherParent.appendChild(child);
    otherParent.appendChild(referenceNode);

    parent.removeChild(child);
    parent.insertBefore(newNode, referenceNode);

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
  });
});
