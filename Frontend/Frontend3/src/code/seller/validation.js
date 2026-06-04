import * as Yup from "yup";
import { isLegalFormAllowed, normalizeCompanyAccountHolder } from "./companyLegalForms";

const phoneRegex = /^\+?[0-9]{7,15}$/;
const zipRegex = /^[A-Za-z0-9\- ]{3,10}$/;
const ibanRegex = /^[A-Z]{2}[0-9A-Z]{13,32}$/;
const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const isCzSkBankCountry = (...countries) => countries
    .map((country) => String(country || "").trim().toLowerCase())
    .some((country) => country === "cz" || country === "sk");

export const validationSchemaSelf = Yup.object({

    // ================= PERSONAL =================
    first_name: Yup.string()
        .min(2, "Minimum 2 characters")
        .required("First name is required"),

    last_name: Yup.string()
        .min(2, "Minimum 2 characters")
        .required("Last name is required"),

    date_of_birth: Yup.date()
        .transform((value, originalValue) => {
            if (typeof originalValue === "string") {
                const [day, month, year] = originalValue.split(".");
                return new Date(`${year}-${month}-${day}`);
            }
            return value;
        })
        .typeError("Invalid date format")
        .required("Date of birth is required"),

    nationality: Yup.string()
        .required("Nationality is required"),

    personal_phone: Yup.string()
        .matches(phoneRegex, "Invalid phone number")
        .required("Phone number is required"),

    uploadPassport: Yup.string().test(
        "identity-document-uploaded",
        "Identity document upload is required",
        function () {
            const {
                uploadPassport,
                uploadDrivFront,
                uploadDrivBack,
                uploadIdFront,
                uploadIdBack,
                uploadFront,
                uploadBack,
            } = this.parent;

            return Boolean(
                uploadPassport ||
                (uploadDrivFront && uploadDrivBack) ||
                (uploadIdFront && uploadIdBack) ||
                (uploadFront && uploadBack)
            );
        },
    ),

    // ================= TAX =================
    tax_country: Yup.string()
        .required("Tax country is required"),

    tin: Yup.string()
        .min(5, "TIN is too short")
        .required("TIN is required"),

    ico: Yup.string().when("tax_country", {
        is: (val) => val === "cz" || val === "sk", // условие
        then: (schema) => schema.required("IČO is required"), // обязательно
        otherwise: (schema) => schema.notRequired(),          // иначе необязательно
    }),

    // ico: Yup.string()
    //     .required("ico is required"),


    // ================= ADDRESS =================
    street: Yup.string()
        .required("Street is required"),

    city: Yup.string()
        .required("City is required"),

    zip_code: Yup.string()
        .matches(zipRegex, "Invalid ZIP code")
        .required("ZIP code is required"),

    country: Yup.string()
        .required("Country is required"),

    proof_document_issue_date: Yup.string()
        .required("Address proof of address upload is required"),

    // ================= BANK =================
    iban: Yup.string()
        .matches(ibanRegex, "Invalid IBAN")
        .required("IBAN is required"),

    swift_bic: Yup.string().min(8, "SWIFT / BIC must contain at least 8 characters").max(11, "SWIFT / BIC must contain a maximum of 11 characters")
        .required("SWIFT/BIC is required"),

    account_holder: Yup.string()
        .required("Account holder is required")
        .test(
            "matches-company-name",
            "Account holder must match company name and legal form",
            function (value) {
                const { company_name, legal_form } = this.parent;
                const expected = normalizeCompanyAccountHolder(company_name, legal_form);
                if (!expected || !value) return true;
                return String(value).trim() === expected;
            },
        ),

    bank_code: Yup.string().when(["country_of_registration", "tax_country", "country"], {
        is: isCzSkBankCountry,
        then: (schema) => schema.required("Bank code is required"),
        otherwise: (schema) => schema.notRequired(),
    }),

    local_account_number: Yup.string().when(["country_of_registration", "tax_country", "country"], {
        is: isCzSkBankCountry,
        then: (schema) => schema.required("Local account number is required"),
        otherwise: (schema) => schema.notRequired(),
    }),

    // local_account_number: Yup.string()
    //     .required("Local account number is required"),

    // ================= WAREHOUSE =================
    wStreet: Yup.string()
        .required("Warehouse street is required"),

    wCity: Yup.string()
        .required("Warehouse city is required"),

    wZip_code: Yup.string()
        .matches(zipRegex, "Invalid ZIP code")
        .required("Warehouse ZIP code is required"),

    wCountry: Yup.string()
        .required("Warehouse country is required"),

    contact_phone: Yup.string()
        .matches(phoneRegex, "Invalid phone number")
        .required("Contact phone is required"),

    wProof_document_issue_date: Yup.string().when('same_as_the_primary_address', {
        is: true,
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.required("Warehouse proof of address upload is required"),
    }),

    // ================= RETURN ADDRESS =================
    rStreet: Yup.string()
        .required("Return street is required"),

    rCity: Yup.string()
        .required("Return city is required"),

    rZip_code: Yup.string()
        .matches(zipRegex, "Invalid ZIP code")
        .required("Return ZIP code is required"),

    rCountry: Yup.string()
        .required("Return country is required"),

    rContact_phone: Yup.string()
        .matches(phoneRegex, "Invalid phone number")
        .required("Return contact phone is required"),

    rProof_document_issue_date: Yup.string().when('same_as_warehouse', {
        is: true,
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.required("Return address proof of address upload is required"),
    }),
});


/* ================= REGEX ================= */
const icoRegex = /^[0-9]{8}$/;                          // IČO – 8 цифр
const dicRegex = /^[0-9A-Za-z]{8,10}$/;                      // DIČ без префикса
// EU VAT (общая форма)
const euVatRegex = /^[A-Z]{2}[A-Z0-9]{8,12}$/;

// EU EORI (общая форма)
const euEoriRegex = /^[A-Z]{2}[A-Z0-9]{8,15}$/;

/* ================= SCHEMA ================= */
export const companyValidationSchema = Yup.object({

    /* ========= COMPANY INFO ========= */
    company_name: Yup.string()
        .min(2, "Company name is too short")
        .required("Company name is required"),

    legal_form: Yup.string()
        .required("Legal form is required")
        .test(
            "legal-form-country",
            "Legal form is not allowed for country of registration",
            function (value) {
                return isLegalFormAllowed(this.parent.country_of_registration, value)
            },
        ),

    country_of_registration: Yup.string()
        .required("Country of registration is required"),

    business_id: Yup.string()
        .required("Business ID (IČO) is required"),


    tin: Yup.string()
        .min(5, "TIN is too short")
        .required("TIN is required"),

    eori_number: Yup.string()
        .nullable()
        .optional()
        .test(
            'eori-format',
            "Invalid EORI number format. It must start with a country code followed by numbers or letters.",
            (value) => !value || euEoriRegex.test(value),
        ),


    company_phone: Yup.string()
        .matches(phoneRegex, "Invalid phone number")
        .required("Company phone is required"),

    // imports_to_eu: Yup.boolean(),

    // Set by the upload response (res.uploaded_at); non-empty means doc was uploaded.
    certificate_issue_date: Yup.string()
        .required("Registration certificate upload is required"),

    /* ========= REPRESENTATIVE ========= */
    first_name: Yup.string()
        .min(2, "Minimum 2 characters")
        .required("First name is required"),

    last_name: Yup.string()
        .min(2, "Minimum 2 characters")
        .required("Last name is required"),

    role: Yup.string()
        .required("Role is required"),

    date_of_birth: Yup.date()
        .transform((value, originalValue) => {
            if (typeof originalValue === "string") {
                const [day, month, year] = originalValue.split(".");
                return new Date(`${year}-${month}-${day}`);
            }
            return value;
        })
        .typeError("Invalid date format")
        .required("Date of birth is required"),

    nationality: Yup.string()
        .required("Nationality is required"),

    // uploadFront: Yup.string()
    //     .required("Front side upload is required"),

    // uploadBack: Yup.string()
    //     .required("Back side upload is required"),

    /* ========= COMPANY ADDRESS ========= */
    street: Yup.string()
        .required("Street is required"),

    city: Yup.string()
        .required("City is required"),

    zip_code: Yup.string()
        .matches(zipRegex, "Invalid ZIP code format")
        .required("ZIP code is required"),

    country: Yup.string()
        .required("Country is required"),

    // Set by the upload response; non-empty means doc was uploaded.
    proof_document_issue_date: Yup.string()
        .required("Business address proof of address upload is required"),

    /* ========= BANK ========= */
    iban: Yup.string()
        .matches(ibanRegex, "Invalid IBAN format")
        .required("IBAN is required"),

    swift_bic: Yup.string()
        .matches(swiftRegex, "Invalid SWIFT/BIC format")
        .required("SWIFT/BIC is required"),

    account_holder: Yup.string()
        .required("Account holder is required")
        .test(
            "matches-company-name",
            "Account holder must match company name and legal form",
            function (value) {
                const { company_name, legal_form } = this.parent;
                const expected = normalizeCompanyAccountHolder(company_name, legal_form);
                if (!expected || !value) return true;
                return String(value).trim() === expected;
            },
        ),

    bank_code: Yup.string().when(["country_of_registration", "tax_country", "country"], {
        is: isCzSkBankCountry,
        then: (schema) => schema.required("Bank code is required"),
        otherwise: (schema) => schema.notRequired(),
    }),

    local_account_number: Yup.string().when(["country_of_registration", "tax_country", "country"], {
        is: isCzSkBankCountry,
        then: (schema) => schema.required("Local account number is required"),
        otherwise: (schema) => schema.notRequired(),
    }),

    /* ========= WAREHOUSE ========= */
    wStreet: Yup.string()
        .required("Warehouse street is required"),

    wCity: Yup.string()
        .required("Warehouse city is required"),

    wZip_code: Yup.string()
        .matches(zipRegex, "Invalid ZIP code format")
        .required("Warehouse ZIP code is required"),

    wCountry: Yup.string()
        .required("Warehouse country is required"),

    contact_phone: Yup.string()
        .matches(phoneRegex, "Invalid phone number")
        .required("Contact phone is required"),

    // Required when warehouse address is not linked to the primary/company address.
    wProof_document_issue_date: Yup.string().when('same_as_the_primary_address', {
        is: true,
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.required("Warehouse proof of address upload is required"),
    }),

    /* ========= RETURN ADDRESS ========= */
    rStreet: Yup.string()
        .required("Return street is required"),

    rCity: Yup.string()
        .required("Return city is required"),

    rZip_code: Yup.string()
        .matches(zipRegex, "Invalid ZIP code format")
        .required("Return ZIP code is required"),

    rCountry: Yup.string()
        .required("Return country is required"),

    rContact_phone: Yup.string()
        .matches(phoneRegex, "Invalid phone number")
        .required("Return contact phone is required"),

    // Required when same_as_warehouse is false (upload hidden when linked).
    rProof_document_issue_date: Yup.string().when('same_as_warehouse', {
        is: false,
        then: (schema) => schema.required("Return address proof of address upload is required"),
        otherwise: (schema) => schema.optional(),
    }),
});
