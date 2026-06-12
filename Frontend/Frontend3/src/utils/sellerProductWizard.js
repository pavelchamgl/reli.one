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

export const mmToCm = (value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 0) return "";
    return String(Number((numberValue / 10).toFixed(2)));
};

export const kgToGrams = (value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 0) return null;
    return Math.round(numberValue * 1000);
};

export const normalizeVatRate = (value) => {
    if (value === undefined || value === null || value === "") return "0";
    return value;
};

export const formatVatRateForInput = (value) => {
    if (value === undefined || value === null || value === "") return "";
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return String(value);
    return String(numberValue);
};

export const normalizeWarrantyMonths = (value) => {
    if (value === undefined || value === null || value === "") return null;
    return Number(value);
};

export const gramsToKg = (value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 0) return "";
    return String(Number((numberValue / 1000).toFixed(3)));
};

const dimensionValue = (variant, packageField, legacyField) => (
    variant?.[packageField] !== undefined && variant?.[packageField] !== ""
        ? variant[packageField]
        : variant?.[legacyField]
);

export const mapVariantDraftToPayload = (variant, fallbackName) => {
    const payload = {
        price: variant.price,
        name: variant.name || fallbackName,
        weight_grams: kgToGrams(dimensionValue(variant, "package_weight_kg", "weight")),
        width_mm: cmToMm(dimensionValue(variant, "package_width_cm", "width")),
        length_mm: cmToMm(dimensionValue(variant, "package_length_cm", "length")),
        height_mm: cmToMm(dimensionValue(variant, "package_height_cm", "height")),
    };

    if (variant.image) {
        payload.image = variant.image;
    } else {
        payload.text = variant.text;
    }

    return payload;
};

export const mapVariantApiToEditDraft = (variant) => ({
    ...variant,
    package_weight_kg: gramsToKg(variant?.weight_grams),
    package_width_cm: mmToCm(variant?.width_mm),
    package_length_cm: mmToCm(variant?.length_mm),
    package_height_cm: mmToCm(variant?.height_mm),
});

export const addPackageDimensionsToPayload = (payload, variant) => {
    const weight = kgToGrams(dimensionValue(variant, "package_weight_kg", "weight"));
    const width = cmToMm(dimensionValue(variant, "package_width_cm", "width"));
    const length = cmToMm(dimensionValue(variant, "package_length_cm", "length"));
    const height = cmToMm(dimensionValue(variant, "package_height_cm", "height"));

    if (weight !== null) payload.weight_grams = weight;
    if (width !== null) payload.width_mm = width;
    if (length !== null) payload.length_mm = length;
    if (height !== null) payload.height_mm = height;

    return payload;
};

export const mapEditVariantDraftToPatchPayload = (variant, fallbackName) => {
    const payload = {
        price: variant.price,
        name: variant.name || fallbackName,
        image: variant.image,
        text: variant.text,
    };

    return addPackageDimensionsToPayload(payload, variant);
};

export const areOptionalPackageDimensionsValid = (variant) => {
    return ["package_weight_kg", "package_width_cm", "package_height_cm", "package_length_cm"].every((field) => {
        const value = variant?.[field];
        if (value === undefined || value === null || value === "") {
            return true;
        }
        const numberValue = Number(value);
        return Number.isFinite(numberValue) && numberValue > 0;
    });
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

export const LICENSE_FILE_ERROR_MESSAGE = "License file must be PDF or DOCX.";

const LICENSE_MIME_TYPES = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const validateLicenseFile = (file) => {
    if (!file) return null;

    const extension = file.name?.split(".").pop()?.toLowerCase();
    const hasAllowedExtension = extension === "pdf" || extension === "docx";
    const hasMime = Boolean(file.type);
    const hasAllowedMime = LICENSE_MIME_TYPES.has(file.type);

    if (!hasAllowedExtension) return LICENSE_FILE_ERROR_MESSAGE;
    if (hasMime && !hasAllowedMime) return LICENSE_FILE_ERROR_MESSAGE;

    return null;
};

export const validateLicenseFiles = (files = []) => {
    const fileList = Array.from(files);
    for (const file of fileList) {
        const error = validateLicenseFile(file);
        if (error) return error;
    }
    return null;
};

export const PRODUCT_IMAGE_FILE_ERROR_MESSAGE = "Product images must be JPG, PNG, or WEBP.";

const PRODUCT_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const PRODUCT_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export const validateProductImageFile = (file) => {
    if (!file) return null;

    const extension = file.name?.split(".").pop()?.toLowerCase();
    const hasAllowedExtension = PRODUCT_IMAGE_EXTENSIONS.has(extension);
    const hasMime = Boolean(file.type);
    const hasAllowedMime = PRODUCT_IMAGE_MIME_TYPES.has(file.type);

    if (!hasAllowedExtension) return PRODUCT_IMAGE_FILE_ERROR_MESSAGE;
    if (hasMime && !hasAllowedMime) return PRODUCT_IMAGE_FILE_ERROR_MESSAGE;

    return null;
};

export const validateProductImageFiles = (files = []) => {
    const fileList = Array.from(files);
    for (const file of fileList) {
        const error = validateProductImageFile(file);
        if (error) return error;
    }
    return null;
};
