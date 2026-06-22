import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import CreateFormInp from "./CreateFormInp";

const baseProps = {
  text: "Name",
  name: "name",
  value: "",
  handleChange: () => {},
};

describe("CreateFormInp", () => {
  it("shows the error text and protects it from translation", () => {
    render(<CreateFormInp {...baseProps} error="Required field" />);

    const errNode = screen.getByText("Required field");
    expect(errNode).toBeVisible();
    expect(errNode).toHaveAttribute("translate", "no");
  });

  it("keeps a stable, hidden error node when there is no error", () => {
    const { container } = render(<CreateFormInp {...baseProps} />);

    const errNode = container.querySelector("p[translate='no']");
    expect(errNode).toBeInTheDocument();
    expect(errNode).not.toBeVisible();
  });

  it("survives external DOM mutation (translator reparents node) on re-render", () => {
    const { container, rerender } = render(
      <CreateFormInp {...baseProps} error="Required field" />
    );

    const errNode = container.querySelector("p[translate='no']");
    // Эмулируем автопереводчик: переносим управляемый React узел под чужой <font>.
    const font = document.createElement("font");
    errNode.parentNode.insertBefore(font, errNode);
    font.appendChild(errNode);

    // Старый паттерн `error ? <p/> : <></>` тут падал бы NotFoundError на removeChild.
    expect(() =>
      rerender(<CreateFormInp {...baseProps} error={undefined} />)
    ).not.toThrow();
    expect(errNode.hidden).toBe(true);
  });
});
