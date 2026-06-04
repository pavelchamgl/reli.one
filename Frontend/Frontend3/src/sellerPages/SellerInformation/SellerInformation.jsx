import { useFormik } from "formik"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useEffect, useRef, useState } from "react"

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
import { validationSchemaSelf } from "../../code/seller/validation"
import { ErrToast } from "../../ui/Toastify"
import { toISODate } from "../../code/seller"
import SelfEmployedAresEntryAssistModal from "./SelfEmployedAresEntryAssistModal"

import styles from "./SellerInformation.module.scss"

export const SELF_EMPLOYED_ARES_ENTRY_ASSIST_STORAGE_KEY = "seller_self_employed_ares_entry_assist_dismissed_v1"

const SellerInformation = () => {

    // const firstName = JSON.parse(localStorage.getItem('first_name')) || ""
    // const lastName = JSON.parse(localStorage.getItem('last_name')) || ""
    const phone = JSON.parse(localStorage.getItem('phone')) || ""

    const { safeData, getAllDataFromBD } = useActionSafeEmploed()

    const navigate = useNavigate()

    const { selfData, selfDataLoading } = useSelector(state => state.selfEmploed)
    const [showAresEntryAssist, setShowAresEntryAssist] = useState(false)
    const showAresEntryAssistRef = useRef(false)

    const formik = useFormik({
        initialValues: {

            // personal
            first_name: selfData?.first_name ?? "",
            last_name: selfData?.last_name ?? "",
            date_of_birth: selfData?.date_of_birth ?? "",
            nationality: selfData?.nationality ?? "",
            personal_phone: selfData?.personal_phone ?? phone,
            uploadFront: selfData?.uploadFront ?? "",
            uploadBack: selfData?.uploadBack ?? "",

            // tax
            tax_country: selfData?.tax_country ?? "",
            tin: selfData?.tin ?? "",
            ico: selfData?.ico ?? "",

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
            same_as_the_primary_address: selfData?.same_as_the_primary_address ?? false,
            wStreet: selfData?.wStreet ?? "",
            wCity: selfData?.wCity ?? "",
            wZip_code: selfData?.wZip_code ?? "",
            wCountry: selfData?.wCountry ?? "",
            contact_phone: selfData?.contact_phone ?? "",
            wProof_document_issue_date: selfData?.wProof_document_issue_date ?? "",

            // return
            same_as_warehouse: selfData?.same_as_warehouse ?? false,
            rStreet: selfData?.rStreet ?? "",
            rCity: selfData?.rCity ?? "",
            rZip_code: selfData?.rZip_code ?? "",
            rCountry: selfData?.rCountry ?? "",
            rContact_phone: selfData?.rContact_phone ?? "",
            rProof_document_issue_date: selfData?.rProof_document_issue_date ?? ""
        },
        validationSchema: validationSchemaSelf,
        enableReinitialize: true,
        validateOnChange: true,
        // validateOnMount: false,
        // validateOnBlur: true,
        onSubmit: async (values) => {
            safeData(values);
            // localStorage.setItem('first_name', JSON.stringify(values.first_name))
            // localStorage.setItem('last_name', JSON.stringify(values.last_name))
            localStorage.setItem('phone', JSON.stringify(values.personal_phone))

            const selfAddressProofDate = toISODate(values.proof_document_issue_date)
            const warehouseProofDate = toISODate(values.wProof_document_issue_date)
            const returnProofDate = toISODate(values.rProof_document_issue_date)

            // массив промисов с описанием
            const requests = [
                {
                    name: "Personal Data",
                    promise: putPersonalData({
                        date_of_birth: values.date_of_birth
                            ?.split(".")
                            .reverse()
                            .join("-"),
                        nationality: values.nationality,
                        personal_phone: values.personal_phone
                    })
                },
                {
                    name: "Tax Info",
                    promise: putTax({
                        tax_country: values.tax_country,
                        tin: values.tin,
                        business_id: values.ico,
                        // business_id: (selfData.tax_country === "cz" || selfData.tax_country === "sk") ? "" : values.ico,
                    })
                },
                {
                    name: "Self Address",
                    promise: putSelfAddress({
                        street: values.street,
                        city: values.city,
                        zip_code: values.zip_code,
                        country: values.country,
                        ...(selfAddressProofDate ? { proof_document_issue_date: selfAddressProofDate } : {})
                    })
                },
                {
                    name: "Bank Account",
                    promise: putOnboardingBank({
                        iban: values?.iban,
                        swift_bic: values?.swift_bic,
                        account_holder: values?.account_holder,
                        bank_code: values?.bank_code,
                        local_account_number: values?.local_account_number
                    })
                },
                {
                    name: "Warehouse",
                    promise: putWarehouse({
                        same_as_the_primary_address: values.same_as_the_primary_address,
                        street: values.wStreet,
                        city: values.wCity,
                        zip_code: values.wZip_code,
                        country: values.wCountry,
                        contact_phone: values.contact_phone,
                        ...(warehouseProofDate ? { proof_document_issue_date: warehouseProofDate } : {})
                    })
                },
                {
                    name: "Return Address",
                    promise: putReturnAddress({
                        same_as_warehouse: values.same_as_warehouse,
                        street: values.rStreet,
                        city: values.rCity,
                        zip_code: values.rZip_code,
                        country: values.rCountry,
                        contact_phone: values.rContact_phone,
                        ...(returnProofDate ? { proof_document_issue_date: returnProofDate } : {})
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

    useEffect(() => {
        getAllDataFromBD()
    }, [])

    const { t } = useTranslation('onbording')

    const hasSelfEmployedLegalTaxData = (values) => Boolean(
        values.tax_country ||
        values.tin ||
        values.ico ||
        values.street ||
        values.city ||
        values.zip_code ||
        values.country
    )

    useEffect(() => {
        if (selfDataLoading) return
        const dismissed = localStorage.getItem(SELF_EMPLOYED_ARES_ENTRY_ASSIST_STORAGE_KEY)
        const shouldShow = !dismissed && !hasSelfEmployedLegalTaxData(formik.values)
        if (showAresEntryAssistRef.current !== shouldShow) {
            showAresEntryAssistRef.current = shouldShow
            setShowAresEntryAssist(shouldShow)
        }
    }, [selfDataLoading, formik.values])

    const dismissAresEntryAssist = (mode) => {
        localStorage.setItem(SELF_EMPLOYED_ARES_ENTRY_ASSIST_STORAGE_KEY, mode)
        showAresEntryAssistRef.current = false
        setShowAresEntryAssist(false)
    }


    if (!selfDataLoading) {
        return (
            <FormWrap style={{ height: "100%" }}>
                {showAresEntryAssist &&
                    <SelfEmployedAresEntryAssistModal
                        formik={formik}
                        onDismiss={dismissAresEntryAssist}
                    />}
                <div className={styles.main}>
                    <div className={styles.titleWrap}>
                        <TitleAndDesc title={t('onboard.seller_info.title')}
                            desc={t('onboard.seller_info.provide_info_desc')} />
                        <StepWrap step={4} />

                    </div>

                    <PersonalDetails formik={formik} />

                    <TaxInfo formik={formik} />

                    <AddressBlock formik={formik} />

                    <BankAccount formik={formik} />

                    <WhareHouseAddress formik={formik} />

                    <ReturnAddress formik={formik} />

                    <AuthBtnSeller
                        disabled={!formik.isValid}
                        text={t('onboard.common.continue_review')}
                        style={{ borderRadius: "16px", width: "222px" }}
                        handleClick={formik.handleSubmit}
                    />
                </div>

            </FormWrap>
        )
    }

}

export default SellerInformation
