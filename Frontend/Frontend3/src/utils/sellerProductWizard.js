const TRUE_VALUES = new Set(["true", "1", "yes", "y"]);
const FALSE_VALUES = new Set(["false", "0", "no", "n"]);

export const normalizeAttributeSchema = (schemaResponse) => {
    return schemaResponse?.attributes || [];
};

export const CATEGORY_SCHEMA_NOT_READY_MESSAGE =
    "Category attributes schema is not loaded. Please reload category and try again.";

export const isCategoryAttributeSchemaReady = (category, schema, status) => {
    if (!category?.id) return false;
    return status === "fulfilled" && Array.isArray(schema?.attributes);
};

export const cmToMm = (value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 0) return null;
    return Math.round(numberValue * 10);
};

export const kgToGrams = (value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 0) return null;
    return Math.round(numberValue * 1000);
};

export const mapVariantDraftToPayload = (variant, fallbackName) => {
    const payload = {
        price: variant.price,
        name: variant.name || fallbackName,
        weight_grams: kgToGrams(variant.weight),
        width_mm: cmToMm(variant.width),
        length_mm: cmToMm(variant.length),
        height_mm: cmToMm(variant.height),
    };

    if (variant.image) {
        payload.image = variant.image;
    } else {
        payload.text = variant.text;
    }

    return payload;
};

export const buildAttributePayload = (schema, values) => {
    return normalizeAttributeSchema({ attributes: schema })
        .map((attribute) => {
            const value = values?.[attribute.id];
            const base = { attribute_definition: attribute.id };

            if (attribute.data_type === "text") {
                return value ? { ...base, value_text: value } : null;
            }
            if (attribute.data_type === "number") {
                return value !== undefined && value !== "" ? { ...base, value_number: String(value) } : null;
            }
            if (attribute.data_type === "boolean") {
                return value !== undefined && value !== "" ? { ...base, value_boolean: Boolean(value) } : null;
            }
            if (attribute.data_type === "enum") {
                return value ? { ...base, value_option: Number(value) } : null;
            }
            return null;
        })
        .filter(Boolean);
};

export const valuesFromAttributeRows = (rows = []) => {
    return rows.reduce((acc, row) => {
        if (row.data_type === "text") {
            acc[row.attribute_definition] = row.value_text || "";
        } else if (row.data_type === "number") {
            acc[row.attribute_definition] = row.value_number || "";
        } else if (row.data_type === "boolean") {
            acc[row.attribute_definition] = row.value_boolean;
        } else if (row.data_type === "enum") {
            acc[row.attribute_definition] = row.value_option?.id || "";
        }
        return acc;
    }, {});
};

export const validateAttributeDraft = (schema, values) => {
    const errors = {};

    normalizeAttributeSchema({ attributes: schema }).forEach((attribute) => {
        const value = values?.[attribute.id];
        const isEmpty = value === undefined || value === null || value === "";

        if (attribute.is_required && isEmpty) {
            errors[attribute.id] = "This attribute is required.";
            return;
        }

        if (isEmpty) return;

        if (attribute.data_type === "number" && !Number.isFinite(Number(value))) {
            errors[attribute.id] = "Enter a valid number.";
        }
        if (attribute.data_type === "boolean" && typeof value !== "boolean") {
            const normalized = String(value).toLowerCase();
            if (!TRUE_VALUES.has(normalized) && !FALSE_VALUES.has(normalized)) {
                errors[attribute.id] = "Choose true or false.";
            }
        }
        if (attribute.data_type === "enum") {
            const allowedIds = new Set((attribute.options || []).map((option) => Number(option.id)));
            if (!allowedIds.has(Number(value))) {
                errors[attribute.id] = "Choose one of the available options.";
            }
        }
    });

    return errors;
};

export const stepSucceeded = (results = [], step) => {
    return results.some((item) => item.step === step && item.status === "fulfilled");
};

export const makeStepResult = (step, status, payload) => ({
    step,
    status,
    payload: status === "fulfilled" ? payload : undefined,
    error: status === "rejected" ? formatStepError(payload) : undefined,
});

export const formatStepError = (error) => {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;
    if (error.response?.data) return JSON.stringify(error.response.data);
    if (error.message) return error.message;
    return JSON.stringify(error);
};
