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

export const formatApiErrorMessage = (error, fallback = "Unknown error") => {
    if (error === undefined || error === null || error === "") return fallback;
    if (typeof error === "string") return error;
    if (Array.isArray(error)) {
        const messages = error
            .map((item) => formatApiErrorMessage(item, ""))
            .filter(Boolean);
        return messages.length ? messages.join(", ") : fallback;
    }
    if (typeof error === "object") {
        if (typeof error.detail === "string") return error.detail;
        if (typeof error.message === "string") return error.message;

        const fieldMessages = Object.entries(error)
            .map(([field, value]) => {
                const message = formatApiErrorMessage(value, "");
                return message ? `${field}: ${message}` : "";
            })
            .filter(Boolean);

        return fieldMessages.length ? fieldMessages.join("; ") : fallback;
    }
    return fallback;
};

export const formatStepError = (error) => {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;
    if (error.response?.data) return formatApiErrorMessage(error.response.data);
    if (error.message) return error.message;
    return formatApiErrorMessage(error);
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

const firstPresent = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const imageSource = (item) => item?.image_url || item?.image || item?.base64 || item?.file_url || "";

export const REVIEW_STOCK_NOT_LOADED = "Stock not loaded";
export const PREVIEW_DELIVERY_TEXT = "Delivery options are shown as preview only";

export const unwrapProductPreviewResponse = (response) => {
    if (!response) return null;
    return (response.data !== undefined && response.data !== null) ? response.data : response;
};

const licenseRows = (licenseFile) => {
    if (!licenseFile) return [];
    if (typeof licenseFile === "string") {
        return [{
            id: licenseFile,
            name: "License / Certificate",
            status: "ready",
            url: licenseFile,
        }];
    }
    const rows = Array.isArray(licenseFile) ? licenseFile : [licenseFile];
    return rows
        .filter(Boolean)
        .map((item) => ({
            id: item.id || item.name || item.file_url,
            name: item.name || item.file?.name || "License / Certificate",
            status: item.status || "ready",
            url: item.file_url || item.url || item.file,
        }));
};

const packageDimensionsForReview = (variant = {}) => ({
    length: firstPresent(
        variant.package_length_cm,
        variant.length,
        variant.length_mm ? mmToCm(variant.length_mm) : ""
    ),
    width: firstPresent(
        variant.package_width_cm,
        variant.width,
        variant.width_mm ? mmToCm(variant.width_mm) : ""
    ),
    height: firstPresent(
        variant.package_height_cm,
        variant.height,
        variant.height_mm ? mmToCm(variant.height_mm) : ""
    ),
    weight: firstPresent(
        variant.package_weight_kg,
        variant.weight,
        variant.weight_grams ? gramsToKg(variant.weight_grams) : ""
    ),
});

const attributeDisplayValue = (attribute, value) => {
    const isEmpty = value === undefined || value === null || value === "";
    if (isEmpty) return "";
    if (attribute.data_type === "boolean") return value ? "Yes" : "No";
    if (attribute.data_type === "enum") {
        const option = (attribute.options || []).find((item) => Number(item.id) === Number(value));
        return option?.label || option?.value || String(value);
    }
    if (attribute.data_type === "number") {
        return `${value}${attribute.unit ? ` ${attribute.unit}` : ""}`;
    }
    return String(value);
};

export const buildSellerReviewData = (product = {}) => {
    const source = product || {};
    const variants = source.variantsServ || source.variantsMain || source.variants || [];
    const images = (source.images || [])
        .map((item, index) => ({
            id: item?.id || index,
            src: imageSource(item),
        }))
        .filter((item) => item.src);
    const schema = normalizeAttributeSchema(source.attributeSchema);
    const attributeValues = source.attributeValues || {};
    const categoryAttributes = schema
        .map((attribute) => {
            const value = attributeValues[attribute.id];
            const display = attributeDisplayValue(attribute, value);
            const missingRequired = attribute.is_required && !display;
            if (!display && !missingRequired) return null;
            return {
                id: attribute.id,
                name: attribute.name,
                code: attribute.code,
                display,
                isRequired: Boolean(attribute.is_required),
                missingRequired,
            };
        })
        .filter(Boolean);

    const reviewVariants = variants.map((variant, index) => ({
        id: variant.id || index,
        axis: source.variantsName || variant.name || "Variant",
        value: variant.text || (variant.image ? "Image variant" : "Default"),
        price: variant.price,
        priceWithoutVat: firstPresent(variant.price_without_vat, ""),
        stock: firstPresent(variant.quantity_in_stock, variant.stock_quantity, variant.stock) ?? REVIEW_STOCK_NOT_LOADED,
        sku: variant.sku,
        image: imageSource(variant),
        packageDimensions: packageDimensionsForReview(variant),
    }));

    return {
        productName: source.name || "",
        categoryName: source.category?.name || source.category_name || "",
        rating: Number(source.rating) || 0,
        totalReviews: Number(source.total_reviews) || 0,
        description: source.product_description || "",
        price: firstPresent(source.price, reviewVariants[0]?.price, ""),
        priceWithoutVat: firstPresent(source.price_without_vat, reviewVariants[0]?.priceWithoutVat, ""),
        vatRate: formatVatRateForInput(normalizeVatRate(source.vat_rate)),
        images,
        categoryAttributes,
        productParameters: source.parameters || source.product_parameters || [],
        variants: reviewVariants,
        variantAxisName: source.variantsName || reviewVariants[0]?.axis || "Variant",
        documents: licenseRows(source.license_file),
        moderation: {
            status: source.status || source.moderation_status || "",
            statusLabel: source.status_label || source.moderation_status_label || "",
        },
        deliveryText: PREVIEW_DELIVERY_TEXT,
        additionalDetails: {
            additional_details: source.additional_details || "",
            country_of_origin: source.country_of_origin || "",
            warranty_months: source.warranty_months ?? "",
            barcode: source.barcode || "",
            article: source.item || source.article || "",
            is_age_restricted: Boolean(source.is_age ?? source.is_age_restricted),
        },
        hasMissingRequiredAttributes: categoryAttributes.some((item) => item.missingRequired),
    };
};
