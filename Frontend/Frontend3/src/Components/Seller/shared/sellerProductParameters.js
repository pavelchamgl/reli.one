const DIMENSION_NAMES = new Set(["length", "width", "height", "weight"]);

const isBlank = (value) => String(value ?? "").trim() === "";

export const isDimensionParameterRow = (item) => (
    DIMENSION_NAMES.has(String(item?.name || "").trim().toLowerCase())
);

export const getVisibleProductParameters = (parameters = []) => (
    (Array.isArray(parameters) ? parameters : []).filter((item) => !isDimensionParameterRow(item))
);

/**
 * Полностью пустая строка характеристики (оба поля пустые/пробельные).
 * Такая строка эквивалентна «не заполнено» — это лишь UI-плейсхолдер,
 * остающийся после add/delete, и не должна делать блок обязательным.
 */
export const isEmptyParameterRow = (item) => (
    isBlank(item?.name) && isBlank(item?.value)
);

/**
 * Блок характеристик опционален: валиден, если среди видимых строк
 * (без габаритных Length/Width/Height/Weight) не осталось ни одной
 * частично заполненной. Полностью пустые строки игнорируются, частично
 * заполненные (только name или только value) считаются ошибкой.
 */
export const areProductParametersValid = (parameters = []) => (
    getVisibleProductParameters(parameters)
        .filter((item) => !isEmptyParameterRow(item))
        .every((item) => !isBlank(item?.name) && !isBlank(item?.value))
);
