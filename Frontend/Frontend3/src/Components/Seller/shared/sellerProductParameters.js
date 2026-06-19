const DIMENSION_NAMES = new Set(["length", "width", "height", "weight"]);

export const isDimensionParameterRow = (item) => (
    DIMENSION_NAMES.has(String(item?.name || "").trim().toLowerCase())
);

export const getVisibleProductParameters = (parameters = []) => (
    (Array.isArray(parameters) ? parameters : []).filter((item) => !isDimensionParameterRow(item))
);
