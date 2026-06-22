let installed = false;

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

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function removeChildPatched(child) {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function insertBeforePatched(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}

export function isDomTranslateGuardInstalled() {
  return installed;
}
