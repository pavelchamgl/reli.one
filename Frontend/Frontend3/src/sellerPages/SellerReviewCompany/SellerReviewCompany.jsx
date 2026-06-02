import { useSelector } from "react-redux"
import { useEffect, useState } from "react"
import { useFormik } from "formik"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import WarehouseAndReturn from "../../Components/Seller/auth/review/WarehouseAndReturn/WarehouseAndReturn"
import FormWrap from "../../ui/Seller/auth/formWrap/FormWrap"
import TitleAndDesc from "../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from "../../ui/Seller/register/stepWrap/StepWrap"
import SubBtn from "../../ui/Seller/review/subBtn/SubBtn"
import BankAccount from "../../Components/Seller/auth/review/bankAccount/BankAccount"

import AccountInfo from "../../Components/Seller/auth/review/accountInfo/AccountInfo"
import BusinessAddress from "../../Components/Seller/auth/review/businessAddress/BusinessAddress"
import CompanyInfo from "../../Components/Seller/auth/review/companyInfo/CompanyInfo"
import { getOnboardingStatus, getReviewOnboarding, postSubmitOnboarding } from "../../api/seller/onboarding"
import { ErrToast } from "../../ui/Toastify"
import { useActionSafeEmploed } from "../../hook/useActionSafeEmploed"
import { companyValidationSchema } from "../../code/seller/validation"
import Representative from "../../Components/Seller/auth/sellerInfo/Representative/Representative"
import CompanyInfoEdit from '../../Components/Seller/auth/sellerInfo/CompanyInfo/CompanyInfo';
import BankAccountEdit from "../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount"
import CompanyAddress from "../../Components/Seller/auth/sellerInfo/CompanyAddress/CompanyAddress"
import WhareHouseAddress from "../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress"
import ReturnAddress from "../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress"
import { buildCompanySubmitRequests } from "../../features/seller-onboarding/buildCompanySubmitRequests"

import styles from "./SellerReviewCompany.module.scss"

const SellerReviewCompany = () => {

    const { companyData, registerData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData, getAllCompanyDataBD } = useActionSafeEmploed()

    const firstName = JSON.parse(localStorage.getItem('first_name')) || ""
    const lastName = JSON.parse(localStorage.getItem('last_name')) || ""

    const formik = useFormik({
        initialValues: {
            // company info
            company_name: companyData?.company_name ?? "",
            legal_form: companyData?.legal_form ?? "",
            country_of_registration: companyData?.country_of_registration ?? "",          // Чехия (Czech Republic)
            business_id: companyData?.business_id ?? "",     // IČO (8-значный номер компании)
            tin: companyData?.tin ?? "",             // Daňové identifikační číslo (DIČ) без префикса
            eori_number: companyData?.eori_number ?? "",     // Только если реально есть (CZ + IČО обычно)
            company_phone: companyData?.company_phone ?? "",
            imports_to_eu: true,
            certificate_issue_date: companyData?.certificate_issue_date ?? "",   // ← выглядит нормально, если это дата выдачи сертификата

            // representative
            first_name: firstName,
            last_name: lastName,
            role: companyData?.role ?? "",
            date_of_birth: companyData?.date_of_birth ?? "",
            nationality: companyData?.nationality ?? "",
            uploadFront: companyData?.uploadFront ?? "",
            uploadBack: companyData?.uploadBack ?? "",


            // company address
            street: companyData?.street ?? "",
            city: companyData?.city ?? "",
            zip_code: companyData?.zip_code ?? "",
            country: companyData?.country ?? "",
            proof_document_issue_date: companyData?.proof_document_issue_date ?? "",


            // bank
            iban: companyData?.iban ?? "",
            swift_bic: companyData?.swift_bic ?? "",
            account_holder: companyData?.account_holder ?? "",
            bank_code: companyData?.bank_code ?? "",
            local_account_number: companyData?.local_account_number ?? "",

            // warehouse
            same_as_the_primary_address: companyData?.same_as_the_primary_address ?? companyData?.same_as_primary_address ?? false,
            wStreet: companyData?.wStreet ?? "",
            wCity: companyData?.wCity ?? "",
            wZip_code: companyData?.wZip_code ?? "",
            wCountry: companyData?.wCountry ?? "",
            contact_phone: companyData?.contact_phone ?? "",
            wProof_document_issue_date: companyData?.wProof_document_issue_date ?? "",

            // return
            same_as_warehouse: companyData?.same_as_warehouse ?? false,
            rStreet: companyData?.rStreet ?? "",
            rCity: companyData?.rCity ?? "",
            rZip_code: companyData?.rZip_code ?? "",
            rCountry: companyData?.rCountry ?? "",
            rContact_phone: companyData?.rContact_phone ?? "",
            rProof_document_issue_date: companyData?.rProof_document_issue_date ?? ""

        },
        validationSchema: companyValidationSchema,
        enableReinitialize: true,
        validateOnChange: true,
        // validateOnMount: false,
        // validateOnBlur: true,
        onSubmit: async (values) => {
            safeCompanyData({
                ...values
            });


        }

    })

    const [openCompanyInfo, setOpenCompanyInfo] = useState(false)
    const [openRepresen, setOpenRepresen] = useState(false)
    const [openAddress, setOpenAddress] = useState(false)
    const [openBank, setOpenBank] = useState(false)
    const [openWarehouse, setOpenWarehouse] = useState(false)
    const [submitError, setSubmitError] = useState("")

    const { t } = useTranslation('onbording')


    useEffect(() => {
        getReviewOnboarding()
        getAllCompanyDataBD()

    }, [])

    const navigate = useNavigate()

    const parseApiErrors = (data) => {
        if (!data) return ["Unknown error"];

        // 🔹 Если строка
        if (typeof data === "string") return [data];

        // 🔹 Стандартные backend поля
        if (data.detail) return [String(data.detail)];
        if (data.message) return [String(data.message)];

        // 🔹 Человекочитаемые названия для completeness
        const labels = {
            seller_type_selected: "Seller type",
            personal_complete: "Personal details",
            tax_complete: "Tax info",
            address_complete: "Address",
            bank_complete: "Bank account",
            warehouse_complete: "Warehouse",
            return_complete: "Return address",
            documents_complete: "Documents",
        };

        // 🔹 Обработка completeness
        const completeness = data.completeness ?? data;

        if (completeness && typeof completeness === "object") {
            const failed = Object.entries(completeness)
                .filter(
                    ([_, value]) =>
                        typeof value === "string" &&
                        value.toLowerCase() === "false"
                )
                .map(([key]) => labels[key] ?? key);

            if (failed.length) {
                return ["Please complete: " + failed.join(", ")];
            }
        }

        // 🔹 Универсальный проход по вложенным объектам
        const messages = [];

        const walk = (obj) => {
            if (!obj) return;

            if (typeof obj === "string") {
                messages.push(obj);
            } else if (Array.isArray(obj)) {
                obj.forEach(walk);
            } else if (typeof obj === "object") {
                Object.values(obj).forEach(walk);
            }
        };

        walk(data);

        return messages.length ? messages : ["Unexpected error"];
    };

    const handleSubmit = async () => {

        const values = formik.values
        setSubmitError("")

        try {
            const validationErrors = await formik.validateForm()

            if (Object.keys(validationErrors).length > 0) {
                const message = t('onboard.errors.complete_fields')
                setSubmitError(message)
                ErrToast(message)
                return
            }

            safeCompanyData({ ...values })
            localStorage.setItem('first_name', JSON.stringify(values.first_name))
            localStorage.setItem('last_name', JSON.stringify(values.last_name))

            const requests = buildCompanySubmitRequests(values);

            // Отправляем все запросы параллельно
            const results = await Promise.allSettled(
                requests.map((r) => r.promise)
            );

            const errors = results
                .map((result, index) => {
                    if (result.status === "rejected") {
                        const data = result.reason?.response?.data;
                        const messages = parseApiErrors(data);
                        return `${requests[index].name}: ${messages.join(", ")}`;
                    }
                    return null;
                })
                .filter(Boolean);

            if (errors.length) {
                ErrToast(errors.join("\n"));
                return;
            }

            const statusOnboard = await getOnboardingStatus()

            if (statusOnboard && statusOnboard?.can_submit === true) {
                const submitRes = await postSubmitOnboarding();

                if (submitRes.status === "pending_verification") {
                    navigate("/seller/application-sub");
                } else {
                    const message = t('onboard.errors.submit_failed')
                    setSubmitError(message)
                    ErrToast(message);
                }
            } else {

                const next = statusOnboard?.next_step

                const message = next
                    ? `${t('onboard.errors.complete_fields')}: ${next}`
                    : t('onboard.errors.complete_fields')
                setSubmitError(message)
                ErrToast(message);
            }


        } catch (error) {
            const responseData = error?.response?.data;

            const messages = parseApiErrors(responseData);

            setSubmitError(messages.join("\n"))
            messages.forEach((msg) => ErrToast(msg));
            // navigate("/seller/seller-company")

        }
    }

    return (
        <FormWrap style={{ height: "100%" }}>
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <TitleAndDesc
                        title={t('onboard.review.title')}
                        desc={t('onboard.review.desc')}
                    />

                    <StepWrap step={5} />

                </div>

                {
                    openRepresen ?
                        <Representative onClosePreview={() => setOpenRepresen(false)} formik={formik} />
                        :
                        <AccountInfo setOpen={setOpenRepresen} isCompany={true} data={companyData} type={"company"} />
                }

                {
                    openCompanyInfo ?
                        <CompanyInfoEdit onClosePreview={() => setOpenCompanyInfo(false)} formik={formik} />
                        :
                        <CompanyInfo setOpen={setOpenCompanyInfo} data={companyData} />
                }

                {
                    openAddress ?
                        <CompanyAddress onClosePreview={() => setOpenAddress(false)} formik={formik} />
                        :
                        <BusinessAddress setOpen={setOpenAddress} data={companyData} isCompany={true} />
                }


                {
                    openBank ?
                        <BankAccountEdit
                            onClosePreview={() => setOpenBank(false)}
                            formik={formik}
                        />
                        :
                        <BankAccount setOpen={setOpenBank} data={companyData} />
                }

                {
                    openWarehouse ?
                        <>
                            <WhareHouseAddress formik={formik} />
                            <ReturnAddress formik={formik} />
                        </>
                        :
                        <WarehouseAndReturn setOpen={setOpenWarehouse} data={companyData} isCompany={true} />
                }

                {submitError && <p role="alert">{submitError}</p>}

                <SubBtn onClick={handleSubmit} />

            </div>

        </FormWrap>
    )
}

export default SellerReviewCompany
