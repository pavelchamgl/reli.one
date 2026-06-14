import { formatApiErrorMessage } from "../../../utils/sellerProductWizard";

const fieldWrapStyle = {
    display: "grid",
    gap: "10px",
    marginTop: "18px",
};

const fieldStyle = {
    display: "grid",
    gap: "6px",
};

const labelStyle = {
    fontSize: "14px",
    fontWeight: 500,
    color: "#1f2933",
};

const inputStyle = {
    width: "100%",
    minHeight: "44px",
    border: "1px solid #ced4d7",
    borderRadius: "4px",
    padding: "0 12px",
    fontSize: "14px",
};

const errorStyle = {
    margin: 0,
    fontSize: "12px",
    color: "#dc2626",
};

const hintStyle = {
    margin: 0,
    fontSize: "12px",
    color: "#6b7280",
};

const SellerCategoryAttributesFields = ({
    schema = [],
    values = {},
    errors = {},
    loading = false,
    disabled = false,
    onChange,
}) => {
    const normalizedErrors = errors || {};
    const schemaError = formatApiErrorMessage(normalizedErrors.schema, "");

    if (loading) {
        return (
            <section style={fieldWrapStyle}>
                <h4>Category attributes</h4>
                <p style={hintStyle}>Loading category schema...</p>
            </section>
        );
    }

    if (!schema.length) {
        return (
            <section style={fieldWrapStyle}>
                <h4>Category attributes</h4>
                {schemaError ? <p style={errorStyle}>{schemaError}</p> : null}
                <p style={hintStyle}>No typed attributes are required for this category.</p>
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
                    style={inputStyle}
                    value={value}
                    disabled={disabled}
                    onChange={(event) => onChange(attribute.id, event.target.value)}
                >
                    <option value="">Select value</option>
                    {(attribute.options || []).map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        }

        return (
            <input
                style={inputStyle}
                type={attribute.data_type === "number" ? "number" : "text"}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(attribute.id, event.target.value)}
            />
        );
    };

    return (
        <section style={fieldWrapStyle}>
            <h4>Category attributes</h4>
            {schemaError ? <p style={errorStyle}>{schemaError}</p> : null}
            {disabled ? <p style={hintStyle}>Typed attributes are shown for compatibility. Full edit save is a follow-up.</p> : null}
            {schema.map((attribute) => (
                <label key={attribute.id} style={fieldStyle}>
                    <span style={labelStyle}>
                        {attribute.name}
                        {attribute.is_required ? " *" : ""}
                        {attribute.unit ? `, ${attribute.unit}` : ""}
                    </span>
                    {renderControl(attribute)}
                    {attribute.is_inherited ? (
                        <p style={hintStyle}>Inherited from parent category</p>
                    ) : null}
                    {formatApiErrorMessage(normalizedErrors[attribute.id], "") ? (
                        <p style={errorStyle}>{formatApiErrorMessage(normalizedErrors[attribute.id], "")}</p>
                    ) : null}
                </label>
            ))}
        </section>
    );
};

export default SellerCategoryAttributesFields;
