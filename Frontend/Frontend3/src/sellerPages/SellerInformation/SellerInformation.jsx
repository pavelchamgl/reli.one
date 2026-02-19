import { useFormik } from "formik"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import AddressBlock from "../../Components/Seller/auth/sellerInfo/address/AddressBlock"
import BankAccount from "../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount"
import PersonalDetails from "../../Components/Seller/auth/sellerInfo/PersonalDetails/PersonalDetails"
import ReturnAddress from "../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress"
import TaxInfo from "../../Components/Seller/auth/sellerInfo/TaxInfo/TaxInfo"
import WhareHouseAddress from "../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress"
import AuthBtnSeller from "../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import FormWrap from "../../ui/Seller/auth/formWrap/FormWrap"
import TitleAndDesc from "../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from "../../ui/Seller/register/stepWrap/StepWrap"
import { useActionSafeEmploed } from "../../hook/useActionSafeEmploed"
import { putOnboardingBank, putPersonalData, putReturnAddress, putSelfAddress, putTax, putWarehouse } from "../../api/seller/onboarding"

import styles from "./SellerInformation.module.scss"
import { validationSchemaSelf } from "../../code/seller/validation"
import { useEffect } from "react"
import { ErrToast } from "../../ui/Toastify"
import { toISODate } from "../../code/seller"

const SellerInformation = () => {

    const { safeData } = useActionSafeEmploed()

    const navigate = useNavigate()

    const { selfData, registerData } = useSelector(state => state.selfEmploed)



    const formik = useFormik({
        initialValues: {

            // personal
            first_name: registerData?.first_name ?? "",
            last_name: registerData?.last_name ?? "",
            date_of_birth: selfData?.date_of_birth ?? "",
            nationality: selfData?.nationality ?? "",
            personal_phone: registerData?.phone ?? "",
            uploadFront: selfData?.uploadFront ?? "",
            uploadBack: selfData?.uploadBack ?? "",

            // tax
            tax_country: selfData?.tax_country ?? "",
            tin: selfData?.tin ?? "",
            ico: selfData?.ico ?? "",
            vat_id: selfData?.vat_id ?? "",

            // address
            street: selfData?.street ?? "",
            city: selfData?.city ?? "",
            zip_code: selfData?.zip_code ?? "",
            country: selfData?.country ?? "",
            proof_document_issue_date: selfData.proof_document_issue_date ?? "",

            // bank
            iban: selfData?.iban ?? "",
            swift_bic: selfData?.swift_bic ?? "",
            account_holder: selfData?.account_holder ?? "",
            bank_code: selfData?.bank_code ?? "",
            local_account_number: selfData?.local_account_number ?? "",

            // warehouse
            wStreet: selfData?.wStreet ?? "",
            wCity: selfData?.wCity ?? "",
            wZip_code: selfData?.wZip_code ?? "",
            wCountry: selfData?.wCountry ?? "",
            contact_phone: selfData?.contact_phone ?? "",
            wProof_document_issue_date: selfData?.wProof_document_issue_date ?? "",

            // return
            rStreet: selfData?.rStreet ?? "",
            rCity: selfData?.rCity ?? "",
            rZip_code: selfData?.rZip_code ?? "",
            rCountry: selfData?.rCountry ?? "",
            rContact_phone: selfData?.rContact_phone ?? "",
            rProof_document_issue_date: selfData?.rProof_document_issue_date ?? ""
        },
        validationSchema: validationSchemaSelf,
        // enableReinitialize: true,
        validateOnChange: true,
        // validateOnMount: false,
        // validateOnChange: false,
        // validateOnBlur: true,
        onSubmit: async (values) => {
            safeData(values);

            // массив промисов с описанием
            const requests = [
                {
                    name: "Personal Data",
                    promise: putPersonalData({
                        date_of_birth: values.date_of_birth
                            ?.split(".")
                            .reverse()
                            .join("-"),
                        nationality: selfData.nationality,
                        personal_phone: values.personal_phone
                    })
                },
                {
                    name: "Tax Info",
                    promise: putTax({
                        tax_country: selfData.tax_country,
                        tin: values.tin,
                        ico: (selfData.tax_country === "cz" || selfData.tax_country === "sk") ? "" : values.ico,
                        vat_id: values.vat_id
                    })
                },
                {
                    name: "Self Address",
                    promise: putSelfAddress({
                        street: values.street,
                        city: values.city,
                        zip_code: values.zip_code,
                        country: selfData.country,
                        proof_document_issue_date: toISODate(values.proof_document_issue_date)
                    })
                },
                {
                    name: "Bank Account",
                    promise: putOnboardingBank({
                        iban: values.iban,
                        swift_bic: values.swift_bic,
                        account_holder: values.account_holder,
                        bank_code: values.bank_code,
                        local_account_number: values.local_account_number
                    })
                },
                {
                    name: "Warehouse",
                    promise: putWarehouse({
                        street: values.wStreet,
                        city: values.wCity,
                        zip_code: values.wZip_code,
                        country: selfData.wCountry,
                        contact_phone: values.contact_phone,
                        proof_document_issue_date: toISODate(values.wProof_document_issue_date)
                    })
                },
                {
                    name: "Return Address",
                    promise: putReturnAddress({
                        same_as_warehouse: selfData.same_as_warehouse,
                        street: values.rStreet,
                        city: values.rCity,
                        zip_code: values.rZip_code,
                        country: selfData.rCountry,
                        contact_phone: values.rContact_phone,
                        proof_document_issue_date: "2026-01-13"
                    })
                }
            ];

            try {
                // выполняем все промисы параллельно
                const results = await Promise.allSettled(requests.map(r => r.promise));

                // проверяем результаты
                const errors = results
                    .map((res, index) => {
                        if (res.status === "rejected") {
                            return `${requests[index].name} failed: ${res.reason?.message || res.reason}`;
                        }
                        return null;
                    })
                    .filter(Boolean);



                if (errors.length > 0) {
                    console.log("Ошибки при отправке данных:", errors);
                    // здесь можно вызвать toast или alert
                    ErrToast("Some requests failed:\n" + errors.join("\n"));
                    return; // останавливаем навигацию
                }

                // если все прошло успешно
                console.log("Все запросы успешно выполнены");
                navigate("/seller/seller-review");

            } catch (err) {
                console.log("Неожиданная ошибка:", err);
                ErrToast("Unexpected error: " + err.message || err);
            }
        }



    })

    // useEffect(() => {
    //     console.log(formik.errors);
    // }, [formik.errors, selfData])

    return (
        <FormWrap style={{ height: "100%" }}>
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <TitleAndDesc title={"Seller Information"}
                        desc={"Please provide all required information for verification"} />
                    <StepWrap step={4} />

                </div>

                <PersonalDetails formik={formik} />

                <TaxInfo formik={formik} />

                <AddressBlock formik={formik} />

                <BankAccount formik={formik} />

                <WhareHouseAddress formik={formik} />

                <ReturnAddress formik={formik} />

                <AuthBtnSeller
                    // disabled={!formik.isValid}
                    text={"Continue to Review"}
                    style={{ borderRadius: "16px", width: "222px" }}
                    handleClick={formik.handleSubmit}
                />
            </div>

        </FormWrap>
    )
}

export default SellerInformation