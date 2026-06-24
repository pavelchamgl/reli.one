import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    attributeInputUnit,
    formatApiErrorMessage,
    isMmStoredNumberAttribute,
    translateSellerWizardError,
} from "../../../utils/sellerProductWizard";
import {
    translateCategoryAttributeName,
    translateCategoryAttributeOption,
} from "../../../utils/sellerCatalogI18n";

import styles from "./SellerCategoryAttributesFields.module.scss";

const SellerCategoryAttributesFields = ({
    schema = [],
    values = {},
    errors = {},
    loading = false,
    disabled = false,
    onChange,
}) => {
    const { t } = useTranslation("sellerHome");
    const normalizedErrors = errors || {};
    const schemaError = translateSellerWizardError(
        formatApiErrorMessage(normalizedErrors.schema, ""),
        t
    );

    const fieldError = (attributeId) => translateSellerWizardError(
        formatApiErrorMessage(normalizedErrors[attributeId], ""),
        t
    );

    const requiredAttributes = useMemo(
        () => schema.filter((attribute) => attribute.is_required),
        [schema]
    );
    const optionalAttributes = useMemo(
        () => schema.filter((attribute) => !attribute.is_required),
        [schema]
    );

    const hasOptionalValues = useMemo(
        () => optionalAttributes.some((attribute) => {
            const value = values[attribute.id];
            return value !== "" && value !== null && value !== undefined && value !== false;
        }),
        [optionalAttributes, values]
    );

    const hasOptionalErrors = useMemo(
        () => optionalAttributes.some((attribute) => Boolean(fieldError(attribute.id))),
        [optionalAttributes, normalizedErrors, t]
    );

    const [showOptional, setShowOptional] = useState(
        () => hasOptionalValues || hasOptionalErrors
    );

    useEffect(() => {
        if (hasOptionalErrors) {
            setShowOptional(true);
        }
    }, [hasOptionalErrors]);

    const placeholderForAttribute = (attribute) => {
        if (attribute.data_type === "number") {
            return isMmStoredNumberAttribute(attribute)
                ? t("goods.placeholders.attributeNumberMm")
                : t("goods.placeholders.attributeNumber");
        }
        if (attribute.data_type === "enum") {
            return t("goods.placeholders.attributeSelect");
        }
        return t("goods.placeholders.attributeText");
    };

    const attributeLabel = (attribute) => translateCategoryAttributeName(attribute?.code, attribute?.name, t);

    if (loading) {
        return (
            <section className={styles.fieldWrap}>
                <p className={styles.hint}>{t("goods.loadingCategorySchema")}</p>
            </section>
        );
    }

    if (!schema.length) {
        return (
            <section className={styles.fieldWrap}>
                {schemaError ? <p className={styles.error}>{schemaError}</p> : null}
                <p className={styles.hint}>{t("goods.noTypedAttributes")}</p>
            </section>
        );
    }

    const renderControl = (attribute) => {
        const value = values[attribute.id] ?? "";

        if (attribute.data_type === "boolean") {
            return (
                <input
                    type="checkbox"
                    checked={Boolean(value)}
                    disabled={disabled}
                    onChange={(event) => onChange(attribute.id, event.target.checked)}
                />
            );
        }

        if (attribute.data_type === "enum") {
            return (
                <select
                    className={styles.input}
                    value={value}
                    disabled={disabled}
                    onChange={(event) => onChange(attribute.id, event.target.value)}
                >
                    <option value="">{t("goods.placeholders.attributeSelect")}</option>
                    {(attribute.options || []).map((option) => (
                        <option key={option.id} value={option.id}>
                            {translateCategoryAttributeOption(attribute.code, option, t)}
                        </option>
                    ))}
                </select>
            );
        }

        return (
            <input
                className={styles.input}
                type={attribute.data_type === "number" ? "number" : "text"}
                min={attribute.data_type === "number" ? "0" : undefined}
                value={value}
                disabled={disabled}
                placeholder={placeholderForAttribute(attribute)}
                onChange={(event) => {
                    const nextValue = event.target.value;
                    if (attribute.data_type === "number" && nextValue.startsWith("-")) return;
                    onChange(attribute.id, nextValue);
                }}
            />
        );
    };

    const renderField = (attribute) => (
        <label key={attribute.id} className={styles.field}>
            <span className={styles.label}>
                <span className={attribute.is_required ? styles.labelTextRequired : undefined}>
                    {attributeLabel(attribute)}
                </span>
                {attributeInputUnit(attribute) ? `, ${attributeInputUnit(attribute)}` : ""}
            </span>
            {renderControl(attribute)}
            {fieldError(attribute.id) ? (
                <p className={styles.error}>{fieldError(attribute.id)}</p>
            ) : null}
        </label>
    );

    return (
        <section className={styles.fieldWrap}>
            {schemaError ? <p className={styles.error}>{schemaError}</p> : null}
            {disabled ? <p className={styles.hint}>{t("goods.typedAttributesCompatibility")}</p> : null}
            {requiredAttributes.map(renderField)}
            {optionalAttributes.length > 0 ? (
                <>
                    <button
                        type="button"
                        className={`${styles.toggleOptional} ${showOptional ? styles.toggleOptionalExpanded : ""}`}
                        onClick={() => setShowOptional((prev) => !prev)}
                    >
                        {showOptional
                            ? t("goods.hideOptionalAttributes")
                            : t("goods.showAllAttributes", { count: optionalAttributes.length })}
                    </button>
                    {showOptional ? optionalAttributes.map(renderField) : null}
                </>
            ) : null}
        </section>
    );
};

export default SellerCategoryAttributesFields;
