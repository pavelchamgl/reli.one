import { countriesArr } from "../../code/seller";
import { resolveAresLegalForm } from "../../code/seller/companyLegalForms";

export const formatAresAddress = (address) => {
  if (!address) return "";
  return [address.street, address.city, address.zip_code, address.country].filter(Boolean).join(", ");
};

export const normalizeAresCountry = (value) => {
  if (!value) return "";
  const normalized = String(value).toLowerCase();
  return countriesArr.some((item) => item.value === normalized) ? normalized : "";
};

export const applyAresCompanyPrefill = ({ formik, aresPreview, setCountry }) => {
  if (!formik || !aresPreview) return;

  if (aresPreview.company_name) {
    formik.setFieldValue("company_name", aresPreview.company_name);
  }
  if (aresPreview.business_id || aresPreview.ico) {
    formik.setFieldValue("business_id", aresPreview.business_id || aresPreview.ico);
  }

  const address = aresPreview.registered_address;
  if (address?.street) {
    formik.setFieldValue("street", address.street);
  }
  if (address?.city) {
    formik.setFieldValue("city", address.city);
  }
  if (address?.zip_code) {
    formik.setFieldValue("zip_code", address.zip_code);
  }

  const countryValue = normalizeAresCountry(address?.country) || "cz";
  formik.setFieldValue("country_of_registration", countryValue);
  setCountry?.(countryValue);

  const addressCountry = normalizeAresCountry(address?.country);
  if (addressCountry) {
    formik.setFieldValue("country", addressCountry);
  }

  const legalForm = resolveAresLegalForm({
    country: countryValue,
    legal_form_code: aresPreview.legal_form_code,
    legal_form: aresPreview.legal_form,
  });
  if (legalForm) {
    formik.setFieldValue("legal_form", legalForm);
  }

  if (aresPreview.dic_hint && !formik.values.tin) {
    formik.setFieldValue("tin", aresPreview.dic_hint, true);
    formik.setFieldTouched("tin", false, false);
    formik.setFieldError("tin", undefined);
  }
};
