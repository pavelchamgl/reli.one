import { useSelector } from "react-redux"

import WarehouseAndReturn from "../../Components/Seller/auth/review/WarehouseAndReturn/WarehouseAndReturn"
import FormWrap from "../../ui/Seller/auth/formWrap/FormWrap"
import TitleAndDesc from "../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from "../../ui/Seller/register/stepWrap/StepWrap"
import SubBtn from "../../ui/Seller/review/subBtn/SubBtn"

import styles from "./SellerReviewCompany.module.scss"
import BankAccount from "../../Components/Seller/auth/review/bankAccount/BankAccount"
import AccountInfo from "../../Components/Seller/auth/review/accountInfo/AccountInfo"
import BusinessAddress from "../../Components/Seller/auth/review/businessAddress/BusinessAddress"
import CompanyInfo from "../../Components/Seller/auth/review/companyInfo/CompanyInfo"
import { getReviewOnboarding, postSubmitOnboarding, putCompanyAddress, putCompanyInfo, putOnboardingBank, putRepresentative, putReturnAddress, putWarehouse } from "../../api/seller/onboarding"
import { useEffect, useState } from "react"
import { ErrToast } from "../../ui/Toastify"
import { useNavigate } from "react-router-dom"
import { useActionSafeEmploed } from "../../hook/useActionSafeEmploed"
import { useFormik } from "formik"
import { companyValidationSchema } from "../../code/seller/validation"
import Representative from "../../Components/Seller/auth/sellerInfo/Representative/Representative"
import CompanyInfoEdit from '../../Components/Seller/auth/sellerInfo/CompanyInfo/CompanyInfo';
import BankAccountEdit from "../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount"
import CompanyAddress from "../../Components/Seller/auth/sellerInfo/CompanyAddress/CompanyAddress"
import WhareHouseAddress from "../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress"
import ReturnAddress from "../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress"
import { toISODate } from "../../code/seller"

const SellerReviewCompany = () => {

    const { companyData, registerData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()

    console.log(companyData);



    const complitnessArr = {
        documents_complete: "Documents"
    }

    const formik = useFormik({
        initialValues: {
            // company info
            company_name: companyData?.company_name ?? "",
            legal_form: companyData?.legal_form ?? "",
            country_of_registration: companyData?.country_of_registration ?? "",          // Чехия (Czech Republic)
            business_id: companyData?.business_id ?? "",     // IČO (8-значный номер компании)
            ico: companyData?.ico ?? "",             // То же самое, что и business_id (IČO)
            tin: companyData?.tin ?? "",             // Daňové identifikační číslo (DIČ) без префикса
            vat_id: companyData?.vat_id ?? "",          // DIČ с префиксом → CZ + 8-10 цифр
            eori_number: companyData?.eori_number ?? "",     // Только если реально есть (CZ + IČО обычно)
            company_phone: companyData?.company_phone ?? "",
            imports_to_eu: true,
            certificate_issue_date: companyData?.certificate_issue_date ?? "",   // ← выглядит нормально, если это дата выдачи сертификата

            // representative
            first_name: registerData?.first_name ?? "",
            last_name: registerData?.last_name ?? "",
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
            wStreet: companyData?.wStreet ?? "",
            wCity: companyData?.wCity ?? "",
            wZip_code: companyData?.wZip_code ?? "",
            wCountry: companyData?.wCountry ?? "",
            contact_phone: companyData?.contact_phone ?? "",
            wProof_document_issue_date: companyData?.wProof_document_issue_date ?? "",

            // return
            rStreet: companyData?.rStreet ?? "",
            rCity: companyData?.rCity ?? "",
            rZip_code: companyData?.rZip_code ?? "",
            rCountry: companyData?.rCountry ?? "",
            rContact_phone: companyData?.rContact_phone ?? "",
            rProof_document_issue_date: companyData?.rProof_document_issue_date ?? ""

        },
        validationSchema: companyValidationSchema,
        // validateOnMount: false,
        validateOnChange: true,
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


    useEffect(() => {
        getReviewOnboarding()
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

        try {

            const requests = [
                putCompanyInfo({
                    company_name: values.company_name,
                    legal_form: companyData?.legal_form,
                    country_of_registration: companyData?.country_of_registration,
                    business_id: values?.business_id,
                    ico: values?.ico,
                    tin: values?.tin,
                    vat_id: values?.vat_id,
                    imports_to_eu: true,
                    eori_number: values?.eori_number,
                    company_phone: values?.company_phone,
                    certificate_issue_date: toISODate(values.certificate_issue_date),
                }),
                putRepresentative({
                    first_name: values?.first_name,
                    last_name: values?.last_name,
                    role: companyData?.role,
                    date_of_birth: values?.date_of_birth?.split(".")?.reverse()?.join("-"),
                    nationality: companyData?.nationality,
                }),
                putCompanyAddress({
                    street: values.street,
                    city: values.city,
                    zip_code: values.zip_code,
                    country: companyData?.country,
                    proof_document_issue_date: toISODate(values.proof_document_issue_date),
                }),
                putOnboardingBank({
                    iban: values.iban,
                    swift_bic: values.swift_bic,
                    account_holder: values.account_holder,
                    bank_code: values.bank_code,
                    local_account_number: values.local_account_number,
                }),
                putWarehouse({
                    street: values.wStreet,
                    city: values.wCity,
                    zip_code: values.wZip_code,
                    country: companyData.wCountry,
                    contact_phone: values.contact_phone,
                    proof_document_issue_date: toISODate(values.wProof_document_issue_date),
                }),
                putReturnAddress({
                    same_as_warehouse: companyData.same_as_warehouse,
                    street: values.rStreet,
                    city: values.rCity,
                    zip_code: values.rZip_code,
                    country: companyData.rCountry,
                    contact_phone: values.rContact_phone,
                    proof_document_issue_date: "2026-01-13",
                }),
            ];

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

            const submitRes = await postSubmitOnboarding();

            if (submitRes.status >= 200 && submitRes.status < 300) {
                navigate("/seller/application-sub");
            } else {
                ErrToast("Failed to submit onboarding");
            }


        } catch (error) {
            console.log(error);

            const responseData = error?.response?.data;

            const messages = parseApiErrors(responseData);

            console.log(messages);


            messages.forEach((msg) => ErrToast(msg));
            navigate("/seller/seller-company")

        }
    }

    return (
        <FormWrap style={{ height: "100%" }}>
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <TitleAndDesc title={"Review Your Information"}
                        desc={"Please review all information before submitting your application"} />

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
                        <BankAccountEdit onClosePreview={() => setOpenBank(false)} formik={formik} />
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
                        <WarehouseAndReturn setOpen={setOpenWarehouse} data={companyData} />
                }

                <SubBtn onClick={handleSubmit} />

            </div>

        </FormWrap>
    )
}

export default SellerReviewCompany