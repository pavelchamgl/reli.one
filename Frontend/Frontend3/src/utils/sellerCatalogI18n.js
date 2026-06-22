export const translateCategoryName = (categoryId, fallbackName, t) => {
    if (categoryId === undefined || categoryId === null || categoryId === "") {
        return fallbackName || "";
    }

    return t(`categories.${categoryId}`, {
        ns: "translation",
        defaultValue: fallbackName || "",
    });
};

export const translateCategoryAttributeName = (attributeCode, fallbackName, t) => {
    if (!attributeCode) {
        return fallbackName || "";
    }

    return t(`goods.categoryAttributes.${attributeCode}`, {
        ns: "sellerHome",
        defaultValue: fallbackName || "",
    });
};

export const translateCategoryAttributeOption = (attributeCode, option, t) => {
    if (!option) return "";

    const fallback = option.label || option.value || "";
    if (!attributeCode || !option.value) {
        return fallback;
    }

    return t(`goods.categoryAttributeOptions.${attributeCode}.${option.value}`, {
        ns: "sellerHome",
        defaultValue: fallback,
    });
};

export const resolveCategoryAttributeDisplayValue = (attribute, value, t) => {
    const isEmpty = value === undefined || value === null || value === "";
    if (isEmpty) return { display: "", optionValue: null };

    if (attribute.data_type === "boolean") {
        return { display: value ? "Yes" : "No", optionValue: null };
    }

    if (attribute.data_type === "enum") {
        const option = (attribute.options || []).find((item) => Number(item.id) === Number(value));
        if (!option) {
            return { display: String(value), optionValue: null };
        }

        return {
            display: translateCategoryAttributeOption(attribute.code, option, t),
            optionValue: option.value,
        };
    }

    if (attribute.data_type === "number") {
        return {
            display: `${value}${attribute.unit ? ` ${attribute.unit}` : ""}`,
            optionValue: null,
        };
    }

    return { display: String(value), optionValue: null };
};
