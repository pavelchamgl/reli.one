/**
 * Vitest + redux-persist: часть слайсов читает localStorage на верхнем уровне модуля.
 * Полифилл без import, чтобы выполнился до остальных setup и трансформаций.
 */
const memory = new Map();

globalThis.localStorage = {
  getItem(key) {
    return memory.has(key) ? memory.get(key) : null;
  },
  setItem(key, value) {
    memory.set(key, String(value));
  },
  removeItem(key) {
    memory.delete(key);
  },
  clear() {
    memory.clear();
  },
  key(i) {
    return [...memory.keys()][i] ?? null;
  },
  get length() {
    return memory.size;
  },
};
