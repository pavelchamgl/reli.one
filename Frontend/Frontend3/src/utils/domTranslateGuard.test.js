import { describe, it, expect, beforeAll } from "vitest";

import { installDomTranslateGuard, isDomTranslateGuardInstalled } from "./domTranslateGuard";

describe("domTranslateGuard", () => {
  beforeAll(() => {
    installDomTranslateGuard();
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
  });

  it("removeChild removes the child when the parent matches", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);

    parent.removeChild(child);

    expect(parent.contains(child)).toBe(false);
  });

  it("insertBefore does not throw when the reference node belongs to another parent", () => {
    const parent = document.createElement("div");
    const otherParent = document.createElement("div");
    const referenceNode = document.createElement("span");
    const newNode = document.createElement("b");
    otherParent.appendChild(referenceNode);

    expect(() => parent.insertBefore(newNode, referenceNode)).not.toThrow();
    expect(parent.contains(newNode)).toBe(false);
  });

  it("insertBefore inserts when the reference node belongs to the same parent", () => {
    const parent = document.createElement("div");
    const referenceNode = document.createElement("span");
    const newNode = document.createElement("b");
    parent.appendChild(referenceNode);

    parent.insertBefore(newNode, referenceNode);

    expect(parent.firstChild).toBe(newNode);
    expect(parent.lastChild).toBe(referenceNode);
  });
});
