const TRUE_VALUES = new Set(["true", "1", "yes", "y"]);
const FALSE_VALUES = new Set(["false", "0", "no", "n"]);

export const SELLER_WIZARD_MESSAGE_KEYS = {
    categorySchemaNotReady: "goods.errors.categorySchemaNotReady",
    unableToLoadCategorySchema: "goods.errors.unableToLoadCategorySchema",
    fillRequiredCategoryAttributes: "goods.errors.fillRequiredCategoryAttributes",
    errorCreatingProduct: "goods.errors.errorCreatingProduct",
    attributeRequired: "goods.errors.attributeRequired",
    attributeValidNumber: "goods.errors.attributeValidNumber",
    attributeBoolean: "goods.errors.attributeBoolean",
    attributeEnum: "goods.errors.attributeEnum",
    licenseFileFormat: "goods.errors.licenseFileFormat",
    licenseFileSize: "goods.errors.licenseFileSize",
    licenseFileEmpty: "goods.errors.licenseFileEmpty",
    licenseFileReadError: "goods.errors.licenseFileReadError",
    licenseAlreadyExists: "goods.errors.licenseAlreadyExists",
    licenseUploadFailed: "goods.errors.licenseUploadFailed",
    productImageFormat: "goods.errors.productImageFormat",
    brandMinLength: "goods.validation.brandMinLength",
    brandMaxLength: "goods.validation.brandMaxLength",
};

export const SELLER_WIZARD_MESSAGE_FALLBACKS = {
    [SELLER_WIZARD_MESSAGE_KEYS.categorySchemaNotReady]:
        "Category attributes schema is not loaded. Please reload category and try again.",
    [SELLER_WIZARD_MESSAGE_KEYS.unableToLoadCategorySchema]: "Unable to load category schema",
    [SELLER_WIZARD_MESSAGE_KEYS.fillRequiredCategoryAttributes]: "Please fill required category attributes.",
    [SELLER_WIZARD_MESSAGE_KEYS.errorCreatingProduct]: "Error while creating the product",
    [SELLER_WIZARD_MESSAGE_KEYS.attributeRequired]: "This attribute is required.",
    [SELLER_WIZARD_MESSAGE_KEYS.attributeValidNumber]: "Enter a valid number.",
    [SELLER_WIZARD_MESSAGE_KEYS.attributeBoolean]: "Choose true or false.",
    [SELLER_WIZARD_MESSAGE_KEYS.attributeEnum]: "Choose one of the available options.",
    [SELLER_WIZARD_MESSAGE_KEYS.licenseFileFormat]: "License file must be JPG, JPEG, PNG, WebP, or PDF.",
    [SELLER_WIZARD_MESSAGE_KEYS.licenseFileSize]: "License file must be smaller than 13 MB.",
    [SELLER_WIZARD_MESSAGE_KEYS.licenseFileEmpty]: "The selected file is empty.",
    [SELLER_WIZARD_MESSAGE_KEYS.licenseFileReadError]: "Could not read the selected file. Please try again.",
    [SELLER_WIZARD_MESSAGE_KEYS.licenseAlreadyExists]: "A license file already exists. Delete it before uploading a new one.",
    [SELLER_WIZARD_MESSAGE_KEYS.licenseUploadFailed]: "Could not upload the license file. Check the format and size, then try again.",
    [SELLER_WIZARD_MESSAGE_KEYS.productImageFormat]: "Product images must be JPG, PNG, or WEBP.",
    [SELLER_WIZARD_MESSAGE_KEYS.brandMinLength]: "Brand must be at least 2 characters",
    [SELLER_WIZARD_MESSAGE_KEYS.brandMaxLength]: "Brand must be at most 150 characters",
};

export const BRAND_NAME_API_ERROR_CODES = {
    brand_min_length: SELLER_WIZARD_MESSAGE_KEYS.brandMinLength,
    brand_max_length: SELLER_WIZARD_MESSAGE_KEYS.brandMaxLength,
};

const resolveWizardMessage = (messageKey, t) => (
    t ? t(messageKey) : SELLER_WIZARD_MESSAGE_FALLBACKS[messageKey]
);

export const translateSellerWizardError = (message, t) => {
    if (!message || !t) return message || "";
    const mappedBrand = mapBrandNameApiError(message, t);
    if (mappedBrand !== message) return mappedBrand;
    const mapped = mapLicenseApiError(message, t);
    if (mapped !== message) return mapped;
    const entry = Object.entries(SELLER_WIZARD_MESSAGE_FALLBACKS).find(([, text]) => text === message);
    return entry ? t(entry[0]) : message;
};

export const resolveWizardApiErrorMessage = (error, t, fallback = "Unknown error") => {
    if (error === undefined || error === null || error === "") {
        return fallback;
    }
    if (typeof error === "string") {
        return translateSellerWizardError(error, t) || fallback;
    }
    if (typeof error === "object" && !Array.isArray(error)) {
        const brandError = getBrandNameFieldError(error, t);
        if (brandError) return brandError;

        for (const [field, value] of Object.entries(error)) {
            if (field === "message" || field === "attributeErrors") continue;
            const raw = Array.isArray(value) ? value[0] : value;
            if (raw === undefined || raw === null || raw === "") continue;
            const mapped = field === "brand_name"
                ? mapBrandNameApiError(raw, t)
                : translateSellerWizardError(String(raw), t);
            if (mapped) return mapped;
        }

        if (typeof error.message === "string") {
            return translateSellerWizardError(error.message, t) || fallback;
        }
    }

    const message = formatApiErrorMessage(error, fallback);
    return translateSellerWizardError(message, t) || fallback;
};

export const formatSellerWizardApiError = (error, t, fallback = "Unknown error") => (
    resolveWizardApiErrorMessage(error, t, fallback)
);

const LICENSE_API_ERROR_PATTERNS = [
    { includes: "Unsupported file type", key: SELLER_WIZARD_MESSAGE_KEYS.licenseFileFormat },
    { includes: "File size exceeds", key: SELLER_WIZARD_MESSAGE_KEYS.licenseFileSize },
    { includes: "uploaded file is empty", key: SELLER_WIZARD_MESSAGE_KEYS.licenseFileEmpty },
    { includes: "already exists", key: SELLER_WIZARD_MESSAGE_KEYS.licenseAlreadyExists },
    { includes: "Base64 decode error", key: SELLER_WIZARD_MESSAGE_KEYS.licenseUploadFailed },
    { includes: "Not a valid data URI scheme", key: SELLER_WIZARD_MESSAGE_KEYS.licenseUploadFailed },
];

export const mapLicenseApiError = (message, t) => {
    if (!message) {
        return resolveWizardMessage(SELLER_WIZARD_MESSAGE_KEYS.licenseUploadFailed, t);
    }
    const normalized = String(message);
    const matchedPattern = LICENSE_API_ERROR_PATTERNS.find(({ includes }) => (
        normalized.toLowerCase().includes(includes.toLowerCase())
    ));
    if (matchedPattern) {
        return resolveWizardMessage(matchedPattern.key, t);
    }
    return normalized;
};

export const mapBrandNameApiError = (codeOrMessage, t) => {
    if (codeOrMessage === undefined || codeOrMessage === null || codeOrMessage === "") {
        return "";
    }
    const code = String(codeOrMessage).trim();
    const messageKey = BRAND_NAME_API_ERROR_CODES[code];
    if (messageKey) {
        return resolveWizardMessage(messageKey, t);
    }
    return code;
};

export const getBrandNameFieldError = (apiError, t) => {
    if (!apiError || typeof apiError !== "object") return null;
    const brandError = apiError.brand_name;
    if (brandError === undefined || brandError === null) return null;
    const raw = Array.isArray(brandError) ? brandError[0] : brandError;
    return mapBrandNameApiError(raw, t) || null;
};

export const getCategorySchemaNotReadyMessage = (t) => (
    resolveWizardMessage(SELLER_WIZARD_MESSAGE_KEYS.categorySchemaNotReady, t)
);

export const getUnableToLoadCategorySchemaMessage = (t) => (
    resolveWizardMessage(SELLER_WIZARD_MESSAGE_KEYS.unableToLoadCategorySchema, t)
);

export const normalizeAttributeSchema = (schemaResponse) => {
    return schemaResponse?.attributes || [];
};

export const CATEGORY_SCHEMA_NOT_READY_MESSAGE = SELLER_WIZARD_MESSAGE_FALLBACKS[
    SELLER_WIZARD_MESSAGE_KEYS.categorySchemaNotReady
];

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

export const isMmStoredNumberAttribute = (attribute) => (
    attribute?.data_type === "number" && attribute?.unit === "mm"
);

export const attributeInputUnit = (attribute) => {
    if (isMmStoredNumberAttribute(attribute)) return "mm";
    return attribute?.unit || "";
};

const attributeValueNumberForApi = (attribute, value) => {
    if (isMmStoredNumberAttribute(attribute)) {
        return String(value);
    }
    return String(value);
};

const attributeValueNumberForForm = (attribute, valueNumber) => (
    formatNumberInputValue(valueNumber)
);

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

const formatNumberInputValue = (value) => {
    if (value === undefined || value === null || value === "") return "";
    const stringValue = String(value).trim().replace(",", ".");
    const numberValue = Number(stringValue);
    if (!Number.isFinite(numberValue)) return String(value);
    return String(numberValue);
};

export const normalizeWarrantyMonths = (value) => {
    if (value === undefined || value === null || value === "") return null;
    return Number(value);
};

export const normalizeSellerArticle = (value) => {
    const trimmed = String(value ?? "").trim();
    if (/^\d{10}$/.test(trimmed)) return trimmed;
    return String(Date.now()).slice(-10);
};

export const normalizeBrandName = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

export const buildSellerProductCreatePayload = ({
    name,
    brand_name,
    product_description,
    barcode,
    item,
    additional_details,
    country_of_origin,
    warranty_months,
    vat_rate,
    is_age,
    category,
}) => {
    const payload = {
        name,
        product_description,
        barcode,
        article: normalizeSellerArticle(item),
        additional_details,
        country_of_origin,
        warranty_months: normalizeWarrantyMonths(warranty_months),
        vat_rate: normalizeVatRate(vat_rate),
        is_age_restricted: Boolean(is_age),
        category: category?.id || null,
    };
    const normalizedBrandName = normalizeBrandName(brand_name);
    if (normalizedBrandName) {
        payload.brand_name = normalizedBrandName;
    }
    return payload;
};

export const buildSellerProductPatchPayload = ({
    name,
    brand_name,
    originalBrandName,
    product_description,
    categoryId,
    item,
    barcode,
    additional_details,
    country_of_origin,
    warranty_months,
    vat_rate,
    is_age,
}) => {
    const payload = {
        name,
        product_description,
        category: categoryId,
        article: item || String(Date.now()),
        barcode,
        additional_details,
        country_of_origin,
        warranty_months: normalizeWarrantyMonths(warranty_months),
        vat_rate: normalizeVatRate(vat_rate),
        is_age_restricted: Boolean(is_age),
    };

    const normalizedBrandName = normalizeBrandName(brand_name);
    const normalizedOriginalBrandName = normalizeBrandName(originalBrandName);

    if (normalizedBrandName === normalizedOriginalBrandName) {
        return payload;
    }
    if (!normalizedBrandName && normalizedOriginalBrandName) {
        payload.brand_name = "";
        return payload;
    }
    if (normalizedBrandName) {
        payload.brand_name = normalizedBrandName;
    }
    return payload;
};

export const openSellerDocumentUrl = (url) => {
    if (!url) return;

    let openUrl = url;
    let shouldRevoke = false;

    if (typeof url === "string" && url.startsWith("data:")) {
        try {
            const [header, base64Data] = url.split(",");
            const mimeMatch = header.match(/data:([^;]+)/);
            const mimeType = mimeMatch?.[1] || "application/octet-stream";
            const binary = atob(base64Data);
            const bytes = new Uint8Array(binary.length);
            for (let index = 0; index < binary.length; index += 1) {
                bytes[index] = binary.charCodeAt(index);
            }
            openUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
            shouldRevoke = true;
        } catch {
            openUrl = url;
        }
    }

    const anchor = document.createElement("a");
    anchor.href = openUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    if (shouldRevoke) {
        window.setTimeout(() => URL.revokeObjectURL(openUrl), 60_000);
    }
};

export const gramsToKg = (value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 0) return "";
    return String(Number((numberValue / 1000).toFixed(3)));
};

const rejectNegativeNumericInput = (value) => value.includes("-");

const hasDecimalSeparator = (value) => /[.,]/.test(value);

export const sanitizeIntegerNumericInput = (value) => {
    if (rejectNegativeNumericInput(value)) return null;
    if (hasDecimalSeparator(value)) return null;
    return value.replace(/[^0-9]/g, "");
};

const dimensionValue = (variant, packageField, legacyField) => (
    variant?.[packageField] !== undefined && variant?.[packageField] !== ""
        ? variant[packageField]
        : variant?.[legacyField]
);

const parseMmValue = (value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || !Number.isInteger(numberValue) || numberValue <= 0) {
        return null;
    }
    return numberValue;
};

export const mapVariantDraftToPayload = (variant, fallbackName) => {
    const payload = {
        price: variant.price,
        name: variant.name || fallbackName,
        text: variant.text ?? "",
        weight_grams: kgToGrams(dimensionValue(variant, "package_weight_kg", "weight")),
        width_mm: parseMmValue(dimensionValue(variant, "package_width_mm", "width")),
        length_mm: parseMmValue(dimensionValue(variant, "package_length_mm", "length")),
        height_mm: parseMmValue(dimensionValue(variant, "package_height_mm", "height")),
    };

    if (hasVariantImageValue(variant.image)) {
        payload.image = variant.image;
    }

    return payload;
};

export const mapVariantApiToEditDraft = (variant) => ({
    ...variant,
    price: variant?.price !== undefined && variant?.price !== null ? String(variant.price) : "",
    text: variant?.text ?? "",
    quantity_in_stock: variant?.quantity_in_stock ?? "",
    package_weight_kg: gramsToKg(variant?.weight_grams),
    package_width_mm: variant?.width_mm != null && variant?.width_mm !== "" ? String(variant.width_mm) : "",
    package_length_mm: variant?.length_mm != null && variant?.length_mm !== "" ? String(variant.length_mm) : "",
    package_height_mm: variant?.height_mm != null && variant?.height_mm !== "" ? String(variant.height_mm) : "",
});

export const mapSellerProductVariantsForEdit = (variants = []) => (
    variants.map((variant) => ({
        ...mapVariantApiToEditDraft(variant),
        status: variant.status || "server",
    }))
);

export const addPackageDimensionsToPayload = (payload, variant) => {
    const weight = kgToGrams(dimensionValue(variant, "package_weight_kg", "weight"));
    const width = parseMmValue(dimensionValue(variant, "package_width_mm", "width"));
    const length = parseMmValue(dimensionValue(variant, "package_length_mm", "length"));
    const height = parseMmValue(dimensionValue(variant, "package_height_mm", "height"));

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
        text: variant.text,
    };

    if (hasVariantImageValue(variant.image)) {
        const image = typeof variant.image === "string" ? variant.image : "";
        if (image && !/^https?:\/\//i.test(image)) {
            payload.image = image;
        }
    }

    return addPackageDimensionsToPayload(payload, variant);
};

export const areOptionalPackageDimensionsValid = (variant) => (
    areRequiredPackageDimensionsValid(variant)
);

const VARIANT_DIMENSION_FIELDS = [
    { packageField: "package_weight_kg", legacyField: "weight", isMm: false },
    { packageField: "package_width_mm", legacyField: "width", isMm: true },
    { packageField: "package_height_mm", legacyField: "height", isMm: true },
    { packageField: "package_length_mm", legacyField: "length", isMm: true },
];

const resolveVariantMessage = (messageKey, t) => (
    t ? t(`item.${messageKey}`) : messageKey
);

const isPositiveNumericValue = (value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0;
};

const isPositiveIntegerValue = (value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && Number.isInteger(numberValue) && numberValue > 0;
};

export const areRequiredPackageDimensionsValid = (variant) => (
    VARIANT_DIMENSION_FIELDS.every(({ packageField, legacyField, isMm }) => {
        const value = dimensionValue(variant, packageField, legacyField);
        if (value === undefined || value === null || value === "") {
            return false;
        }
        return isMm ? isPositiveIntegerValue(value) : isPositiveNumericValue(value);
    })
);

export const validateVariantDraft = (variant, t) => {
    const errors = {};

    if (!variant?.text?.trim()) {
        errors.text = resolveVariantMessage("variantTextRequired", t);
    }

    const priceValue = variant?.price;
    if (priceValue === undefined || priceValue === null || String(priceValue).trim() === "") {
        errors.price = resolveVariantMessage("variantPriceRequired", t);
    } else if (!isPositiveNumericValue(priceValue)) {
        errors.price = resolveVariantMessage("variantPriceInvalid", t);
    }

    const stockValue = variant?.quantity_in_stock;
    if (stockValue === undefined || stockValue === null || stockValue === "") {
        errors.quantity_in_stock = resolveVariantMessage("variantStockRequired", t);
    } else {
        const stockNumber = Number(stockValue);
        if (!Number.isInteger(stockNumber) || stockNumber < 0) {
            errors.quantity_in_stock = resolveVariantMessage("variantStockInvalid", t);
        }
    }

    VARIANT_DIMENSION_FIELDS.forEach(({ packageField, legacyField, isMm }) => {
        const value = dimensionValue(variant, packageField, legacyField);
        const fieldKey = variant && Object.prototype.hasOwnProperty.call(variant, packageField)
            ? packageField
            : legacyField;
        const errorKey = {
            package_weight_kg: "variantPackageWeightRequired",
            package_width_mm: "variantPackageWidthRequired",
            package_height_mm: "variantPackageHeightRequired",
            package_length_mm: "variantPackageLengthRequired",
            weight: "variantPackageWeightRequired",
            width: "variantPackageWidthRequired",
            height: "variantPackageHeightRequired",
            length: "variantPackageLengthRequired",
        }[fieldKey];

        if (value === undefined || value === null || value === "") {
            errors[fieldKey] = resolveVariantMessage(errorKey, t);
            return;
        }
        const isValid = isMm ? isPositiveIntegerValue(value) : isPositiveNumericValue(value);
        if (!isValid) {
            errors[fieldKey] = resolveVariantMessage("variantPackageDimensionInvalid", t);
        }
    });

    return errors;
};

export const validateProductVariants = ({ variantsName, variants = [] }, t) => {
    const result = {
        name: null,
        section: null,
        variants: {},
    };

    if (!variantsName?.trim()) {
        result.name = resolveVariantMessage("variantNameIsRequired", t);
    }

    if (!variants.length) {
        result.section = resolveVariantMessage("variantsSectionError", t);
        return result;
    }

    variants.forEach((variant) => {
        const fieldErrors = validateVariantDraft(variant, t);
        if (Object.keys(fieldErrors).length > 0) {
            result.variants[variant.id] = fieldErrors;
        }
    });

    if (Object.keys(result.variants).length > 0 && !result.section) {
        result.section = resolveVariantMessage("variantsSectionError", t);
    }

    return result;
};

export const isProductVariantsValid = (validation) => (
    !validation?.name
    && !validation?.section
    && Object.keys(validation?.variants || {}).length === 0
);

export const hasVariantImageValue = (image) => {
    if (typeof image === "string") {
        return Boolean(image.trim());
    }
    return image instanceof Blob;
};

export const isVariantValuePresent = (variant) => Boolean(variant?.text?.trim());

export const isVariantStockInputValid = (variant) => {
    if (variant?.quantity_in_stock === undefined || variant?.quantity_in_stock === "") {
        return false;
    }
    const value = Number(variant.quantity_in_stock);
    return Number.isInteger(value) && value >= 0;
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
                return value !== undefined && value !== ""
                    ? { ...base, value_number: attributeValueNumberForApi(attribute, value) }
                    : null;
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

export const valuesFromAttributeRows = (rows = [], schemaAttributes = []) => {
    return rows.reduce((acc, row) => {
        if (row.data_type === "text") {
            acc[row.attribute_definition] = row.value_text || "";
        } else if (row.data_type === "number") {
            acc[row.attribute_definition] = attributeValueNumberForForm(row, row.value_number, schemaAttributes);
        } else if (row.data_type === "boolean") {
            acc[row.attribute_definition] = row.value_boolean;
        } else if (row.data_type === "enum") {
            acc[row.attribute_definition] = row.value_option?.id || "";
        }
        return acc;
    }, {});
};

export const validateAttributeDraft = (schema, values, t) => {
    const errors = {};

    normalizeAttributeSchema({ attributes: schema }).forEach((attribute) => {
        const value = values?.[attribute.id];
        const isEmpty = value === undefined || value === null || value === "";

        if (attribute.is_required && isEmpty) {
            errors[attribute.id] = resolveWizardMessage(SELLER_WIZARD_MESSAGE_KEYS.attributeRequired, t);
            return;
        }

        if (isEmpty) return;

        if (attribute.data_type === "number" && !Number.isFinite(Number(value))) {
            errors[attribute.id] = resolveWizardMessage(SELLER_WIZARD_MESSAGE_KEYS.attributeValidNumber, t);
        }
        if (attribute.data_type === "boolean" && typeof value !== "boolean") {
            const normalized = String(value).toLowerCase();
            if (!TRUE_VALUES.has(normalized) && !FALSE_VALUES.has(normalized)) {
                errors[attribute.id] = resolveWizardMessage(SELLER_WIZARD_MESSAGE_KEYS.attributeBoolean, t);
            }
        }
        if (attribute.data_type === "enum") {
            const allowedIds = new Set((attribute.options || []).map((option) => Number(option.id)));
            if (!allowedIds.has(Number(value))) {
                errors[attribute.id] = resolveWizardMessage(SELLER_WIZARD_MESSAGE_KEYS.attributeEnum, t);
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

export const LICENSE_FILE_ERROR_MESSAGE = SELLER_WIZARD_MESSAGE_FALLBACKS[
    SELLER_WIZARD_MESSAGE_KEYS.licenseFileFormat
];

const LICENSE_MIME_TYPES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const LICENSE_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

const LICENSE_EXTENSION_MIME_TYPES = {
    pdf: new Set(["application/pdf"]),
    jpg: new Set(["image/jpeg"]),
    jpeg: new Set(["image/jpeg"]),
    png: new Set(["image/png"]),
    webp: new Set(["image/webp"]),
};

export const LICENSE_MAX_BYTES = 13 * 1024 * 1024;

export const validateLicenseFile = (file, t) => {
    if (!file) return null;

    if (!file.size) {
        return resolveWizardMessage(SELLER_WIZARD_MESSAGE_KEYS.licenseFileEmpty, t);
    }

    const errorMessage = resolveWizardMessage(SELLER_WIZARD_MESSAGE_KEYS.licenseFileFormat, t);
    const extension = file.name?.split(".").pop()?.toLowerCase();
    const hasAllowedExtension = LICENSE_EXTENSIONS.has(extension);
    const hasMime = Boolean(file.type);
    const hasAllowedMime = LICENSE_MIME_TYPES.has(file.type);
    const extensionMimeTypes = LICENSE_EXTENSION_MIME_TYPES[extension];
    const hasMatchingMime = !hasMime || (hasAllowedMime && extensionMimeTypes?.has(file.type));

    if (!hasAllowedExtension) return errorMessage;
    if (!hasMatchingMime) return errorMessage;

    if (file.size > LICENSE_MAX_BYTES) {
        return resolveWizardMessage(SELLER_WIZARD_MESSAGE_KEYS.licenseFileSize, t);
    }

    return null;
};

export const validateLicenseFiles = (files = [], t) => {
    const fileList = Array.from(files);
    for (const file of fileList) {
        const error = validateLicenseFile(file, t);
        if (error) return error;
    }
    return null;
};

export const PRODUCT_IMAGE_FILE_ERROR_MESSAGE = SELLER_WIZARD_MESSAGE_FALLBACKS[
    SELLER_WIZARD_MESSAGE_KEYS.productImageFormat
];

const PRODUCT_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const PRODUCT_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export const validateProductImageFile = (file, t) => {
    if (!file) return null;

    const errorMessage = resolveWizardMessage(SELLER_WIZARD_MESSAGE_KEYS.productImageFormat, t);
    const extension = file.name?.split(".").pop()?.toLowerCase();
    const hasAllowedExtension = PRODUCT_IMAGE_EXTENSIONS.has(extension);
    const hasMime = Boolean(file.type);
    const hasAllowedMime = PRODUCT_IMAGE_MIME_TYPES.has(file.type);

    if (!hasAllowedExtension) return errorMessage;
    if (hasMime && !hasAllowedMime) return errorMessage;

    return null;
};

export const validateProductImageFiles = (files = [], t) => {
    const fileList = Array.from(files);
    for (const file of fileList) {
        const error = validateProductImageFile(file, t);
        if (error) return error;
    }
    return null;
};

const firstPresent = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const imageSource = (item) => {
    if (!item) return "";

    const stringCandidates = [item.image_url, item.image, item.base64, item.file_url, item.url];
    for (const candidate of stringCandidates) {
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate;
        }
    }

    const blobCandidate = [item.image, item.file].find((value) => value instanceof Blob);
    if (blobCandidate) {
        return URL.createObjectURL(blobCandidate);
    }

    return "";
};

export const resolveVariantImagePreview = (image) => imageSource({ image });

export const REVIEW_STOCK_NOT_LOADED = "Stock not loaded";
export const isVariantStockLoaded = (stock) => (
    stock !== undefined && stock !== null && stock !== REVIEW_STOCK_NOT_LOADED
);
export const PREVIEW_DELIVERY_TEXT = "Delivery options are shown as preview only";
const IN_STOCK_STATUS = "in_stock";
const FEW_LEFT_STATUS = "few_left";
const OUT_OF_STOCK_STATUS = "out_of_stock";
const STOCK_FEW_LEFT_THRESHOLD = 5;

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
            url: item.file_url || item.url || item.base64 || item.file,
        }));
};

const packageDimensionsForReview = (variant = {}) => ({
    height: firstPresent(
        variant.package_height_mm,
        variant.height,
        variant.height_mm !== undefined && variant.height_mm !== null ? String(variant.height_mm) : ""
    ),
    width: firstPresent(
        variant.package_width_mm,
        variant.width,
        variant.width_mm !== undefined && variant.width_mm !== null ? String(variant.width_mm) : ""
    ),
    length: firstPresent(
        variant.package_length_mm,
        variant.length,
        variant.length_mm !== undefined && variant.length_mm !== null ? String(variant.length_mm) : ""
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
        if (isMmStoredNumberAttribute(attribute)) {
            const normalized = formatNumberInputValue(value);
            return normalized ? `${normalized} mm` : "";
        }
        return `${value}${attribute.unit ? ` ${attribute.unit}` : ""}`;
    }
    return String(value);
};

const attributeRowDisplayValue = (row) => {
    if (row.value_text !== undefined && row.value_text !== null && row.value_text !== "") return row.value_text;
    if (row.value_number !== undefined && row.value_number !== null && row.value_number !== "") {
        const normalized = formatNumberInputValue(row.value_number);
        return `${normalized}${row.unit ? ` ${row.unit}` : ""}`;
    }
    if (row.value_boolean !== undefined && row.value_boolean !== null && row.value_boolean !== "") {
        return row.value_boolean ? "Yes" : "No";
    }
    if (row.value_option) {
        return row.value_option.label || row.value_option.value || row.value_option.name || String(row.value_option.id || row.value_option);
    }
    return "";
};

const attributesFromRows = (rows = []) => rows
    .map((row, index) => {
        const display = attributeRowDisplayValue(row);
        const name = row.name || row.attribute_name || row.attribute_definition_name || row.code || `Attribute ${index + 1}`;
        if (!display && !row.is_required) return null;
        return {
            id: row.id || row.attribute_definition || row.code || index,
            name,
            code: row.code,
            display,
            isRequired: Boolean(row.is_required),
            missingRequired: Boolean(row.is_required && !display),
        };
    })
    .filter(Boolean);

const mergeCategoryAttributes = (schemaAttributes = [], rowAttributes = []) => {
    const seen = new Set();
    const merged = [];

    [...schemaAttributes, ...rowAttributes].forEach((attribute) => {
        const key = attribute.code || attribute.id;
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(attribute);
    });

    return merged;
};

const PHYSICAL_PARAMETER_NAMES = new Set([
    "length",
    "width",
    "height",
    "weight",
    "Length",
    "Width",
    "Height",
    "Weight",
]);

export const mapProductParametersForReview = (parameters = []) => parameters
    .filter((parameter) => {
        const name = parameter?.name || "";
        return name && !PHYSICAL_PARAMETER_NAMES.has(name);
    })
    .map((parameter, index) => ({
        id: parameter.id || parameter.name || index,
        name: parameter.name,
        value: parameter.value ?? parameter.text ?? "",
    }))
    .filter((parameter) => parameter.name && parameter.value !== undefined && parameter.value !== null && parameter.value !== "");

const calculatePriceWithoutVat = (price, vatRate) => {
    const priceNumber = Number(price);
    const vatNumber = Number(normalizeVatRate(vatRate));
    if (!Number.isFinite(priceNumber) || !Number.isFinite(vatNumber) || vatNumber < 0) return "";
    if (vatNumber === 0) return String(Number(priceNumber.toFixed(2)));
    return (priceNumber / (1 + vatNumber / 100)).toFixed(2);
};

const stockStatusForReview = (variant = {}) => {
    if (variant.stock_status) return variant.stock_status;
    const stock = firstPresent(variant.quantity_in_stock, variant.stock_quantity, variant.stock, variant.available_quantity);
    if (stock === REVIEW_STOCK_NOT_LOADED || stock === undefined) return "";
    const stockNumber = Number(stock);
    if (!Number.isFinite(stockNumber)) return "";
    if (stockNumber <= 0) return OUT_OF_STOCK_STATUS;
    if (stockNumber <= STOCK_FEW_LEFT_THRESHOLD) return FEW_LEFT_STATUS;
    return IN_STOCK_STATUS;
};

export const buildSellerReviewData = (product = {}) => {
    const source = product || {};
    const variants = source.variantsServ || source.variantsMain || source.variants || [];
    const images = (source.images || [])
        .map((item, index) => ({
            id: item?.id || index,
            src: imageSource(item),
            alt: item?.alt || source.name || `Product image ${index + 1}`,
        }))
        .filter((item) => item.src);
    const schema = normalizeAttributeSchema(source.attributeSchema);
    const attributeValues = source.attributeValues || {};
    const schemaAttributes = schema
        .map((attribute) => {
            const value = attributeValues[attribute.id];
            const display = attributeDisplayValue(attribute, value);
            const missingRequired = attribute.is_required && !display;
            if (!display && !missingRequired) return null;

            let optionValue = null;
            if (attribute.data_type === "enum" && value !== undefined && value !== null && value !== "") {
                const option = (attribute.options || []).find((item) => Number(item.id) === Number(value));
                optionValue = option?.value || null;
            }

            return {
                id: attribute.id,
                name: attribute.name,
                code: attribute.code,
                dataType: attribute.data_type,
                optionValue,
                display,
                isRequired: Boolean(attribute.is_required),
                missingRequired,
            };
        })
        .filter(Boolean);
    const rowAttributes = attributesFromRows(source.product_attributes || source.attributes || []);
    const categoryAttributes = mergeCategoryAttributes(schemaAttributes, rowAttributes);

    const reviewVariants = variants.map((variant, index) => ({
        id: variant.id || index,
        axis: source.variantsName || variant.name || "Variant",
        name: variant.name || source.variantsName || "Variant",
        value: variant.text || (variant.image ? "Image variant" : "Default"),
        price: variant.price,
        priceWithoutVat: firstPresent(
            variant.price_without_vat,
            calculatePriceWithoutVat(variant.price, source.vat_rate),
            ""
        ),
        stock: firstPresent(variant.quantity_in_stock, variant.stock_quantity, variant.stock, variant.available_quantity) ?? REVIEW_STOCK_NOT_LOADED,
        stockStatus: stockStatusForReview(variant),
        sku: variant.sku,
        image: imageSource(variant),
        packageDimensions: packageDimensionsForReview(variant),
    }));

    return {
        productName: source.name || "",
        categoryId: source.category?.id || source.category || null,
        categoryName: source.category?.name || source.category_name || "",
        rating: Number(source.rating) || 0,
        totalReviews: Number(source.total_reviews) || 0,
        description: source.product_description || "",
        price: firstPresent(source.price, reviewVariants[0]?.price, ""),
        priceWithoutVat: firstPresent(source.price_without_vat, reviewVariants[0]?.priceWithoutVat, ""),
        vatRate: formatVatRateForInput(normalizeVatRate(source.vat_rate)),
        images,
        categoryAttributes,
        productParameters: mapProductParametersForReview(source.parameters || source.product_parameters || []),
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
            brand_name: source.brand_name || "",
            country_of_origin: source.country_of_origin || "",
            warranty_months: source.warranty_months ?? "",
            barcode: source.barcode || "",
            article: source.item || source.article || "",
            is_age_restricted: Boolean(source.is_age ?? source.is_age_restricted),
        },
        hasMissingRequiredAttributes: categoryAttributes.some((item) => item.missingRequired),
    };
};
