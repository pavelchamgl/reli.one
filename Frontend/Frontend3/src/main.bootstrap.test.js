import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const mainSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "main.jsx"),
  "utf8"
);

describe("main.jsx bootstrap wiring", () => {
  it("installs dom translate guard before the first render", () => {
    expect(mainSource).toContain("installDomTranslateGuard()");
    expect(mainSource.indexOf("installDomTranslateGuard")).toBeLessThan(
      mainSource.indexOf("ReactDOM.createRoot")
    );
  });

  it("wraps RouterProvider with ErrorBoundary area=app", () => {
    expect(mainSource).toMatch(/<ErrorBoundary area="app">/);
    expect(mainSource).toContain("<RouterProvider router={router}>");

    const boundaryIndex = mainSource.indexOf("<ErrorBoundary area=\"app\">");
    const routerIndex = mainSource.indexOf("<RouterProvider router={router}>");

    expect(boundaryIndex).toBeGreaterThan(-1);
    expect(routerIndex).toBeGreaterThan(boundaryIndex);
  });
});
