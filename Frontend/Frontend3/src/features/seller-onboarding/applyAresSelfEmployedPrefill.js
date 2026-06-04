import { formatAresAddress, normalizeAresCountry } from "./applyAresCompanyPrefill";

export { formatAresAddress };

const hasValue = (value) => String(value ?? "").trim().length > 0;

const setIfEmpty = ({ formik, field, value, validate = true }) => {
  if (!hasValue(value) || hasValue(formik.values?.[field])) return false;

  formik.setFieldValue(field, value, validate);
  formik.setFieldTouched?.(field, false, false);
  formik.setFieldError?.(field, undefined);
  return true;
};

export const getAresSelfEmployedRegistryName = (aresPreview) => (
  aresPreview?.registry_name || aresPreview?.company_name || ""
);

export const buildAresSelfEmployedPrefillPatch = (aresPreview) => {
  const address = aresPreview?.registered_address;
  const businessId = aresPreview?.business_id || aresPreview?.ico;
  const addressCountry = normalizeAresCountry(address?.country) || "cz";

  return {
    ico: businessId,
    tax_country: "cz",
    tin: aresPreview?.dic_hint,
    street: address?.street,
    city: address?.city,
    zip_code: address?.zip_code,
    country: addressCountry,
  };
};

export const applyAresSelfEmployedPrefill = ({ formik, aresPreview, setTaxCountry }) => {
  if (!formik || !aresPreview) return [];

  const appliedFields = [];
  const patch = buildAresSelfEmployedPrefillPatch(aresPreview);

  for (const [field, value] of Object.entries(patch)) {
    if (setIfEmpty({ formik, field, value })) {
      if (field === "tax_country") {
        setTaxCountry?.("cz");
      }
      appliedFields.push(field);
    }
  }

  return appliedFields;
};
