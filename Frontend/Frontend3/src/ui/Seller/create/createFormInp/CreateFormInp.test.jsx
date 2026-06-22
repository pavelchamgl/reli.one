import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";

import { installDomTranslateGuard } from "../../../../utils/domTranslateGuard.js";
import CreateFormInp from "./CreateFormInp";

const baseProps = {
  text: "Name",
  name: "name",
  value: "",
  handleChange: () => {},
};

describe("CreateFormInp", () => {
  beforeAll(() => {
    installDomTranslateGuard();
  });

  it("shows validation error text without blocking browser translation", () => {
    render(<CreateFormInp {...baseProps} error="Required field" />);

    const errNode = screen.getByText("Required field");
    expect(errNode).toBeVisible();
    expect(errNode).not.toHaveAttribute("translate", "no");
  });

  it("protects technical numeric inputs from translation", () => {
    const { container } = render(
      <CreateFormInp {...baseProps} name="vat_rate" digitsOnly value="21" />
    );

    expect(container.querySelector("input[translate='no']")).toBeInTheDocument();
  });

  it("keeps a stable, hidden error node when there is no error", () => {
    const { container } = render(<CreateFormInp {...baseProps} />);

    const errNode = container.querySelector("p.errText, .errText");
    const errByClass = container.querySelector('[class*="errText"]');
    expect(errByClass).toBeInTheDocument();
    expect(errByClass).not.toBeVisible();
    expect(errNode ?? errByClass).not.toBeVisible();
  });

  it("survives external DOM mutation (translator reparents node) on re-render", () => {
    const { container, rerender } = render(
      <CreateFormInp {...baseProps} error="Required field" />
    );

    const errNode = container.querySelector('[class*="errText"]');
    const font = document.createElement("font");
    errNode.parentNode.insertBefore(font, errNode);
    font.appendChild(errNode);

    expect(() =>
      rerender(<CreateFormInp {...baseProps} error={undefined} />)
    ).not.toThrow();
    expect(errNode.hidden).toBe(true);
  });
});
