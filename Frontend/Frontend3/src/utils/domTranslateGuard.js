import * as Sentry from "@sentry/react";

let installed = false;
let crossParentReported = false;

/**
 * Защита React от падений при автопереводе страницы браузером.
 *
 * Переводчик оборачивает текст-узлы в <font> и перемещает их. React при
 * reconciliation вызывает removeChild/insertBefore на узлах, которые уже не
 * являются прямыми потомками ожидаемого родителя → NotFoundError.
 *
 * Патч «глотает» только cross-parent операции; нормальный путь не меняется.
 * Идемпотентен — повторный вызов безопасен (StrictMode, HMR).
 */
export function installDomTranslateGuard() {
  if (installed || typeof Node === "undefined" || !Node.prototype) {
    return;
  }

  installed = true;

  const reportCrossParentOperation = (method) => {
    if (crossParentReported) {
      return;
    }
    crossParentReported = true;

    try {
      Sentry.addBreadcrumb({
        category: "dom.translate_guard",
        message: `Cross-parent ${method} suppressed`,
        level: "info",
      });
      Sentry.captureMessage("DOM translate guard: cross-parent mutation suppressed", {
        level: "info",
        tags: { area: "dom_translate_guard", method },
      });
    } catch {
      // Sentry may be unavailable in tests or before init.
    }
  };

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function removeChildPatched(child) {
    if (child.parentNode !== this) {
      reportCrossParentOperation("removeChild");
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function insertBeforePatched(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      reportCrossParentOperation("insertBefore");
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}

export function isDomTranslateGuardInstalled() {
  return installed;
}

/** @internal Сброс rate-limit телеметрии — только для изоляции unit-тестов. */
export function resetDomTranslateGuardTelemetryForTests() {
  crossParentReported = false;
}
