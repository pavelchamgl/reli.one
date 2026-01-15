import { useFormik } from 'formik'
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import TitleAndDesc from '../../ui/Seller/auth/titleAndDesc/TitleAndDesc';
import StepWrap from '../../ui/Seller/register/stepWrap/StepWrap';
import WhareHouseAddress from '../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress';
import ReturnAddress from '../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress';
import AuthBtnSeller from '../../ui/Seller/auth/authBtnSeller/AuthBtnSeller';
import FormWrap from '../../ui/Seller/auth/formWrap/FormWrap';
import BankAccount from '../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount';
import CompanyAddress from '../../Components/Seller/auth/sellerInfo/CompanyAddress/CompanyAddress';
import CompanyInfo from '../../Components/Seller/auth/sellerInfo/CompanyInfo/CompanyInfo';
import Representative from '../../Components/Seller/auth/sellerInfo/Representative/Representative';
import { useActionSafeEmploed } from '../../hook/useActionSafeEmploed';
import { putCompanyAddress, putCompanyInfo, putOnboardingBank, putRepresentative, putReturnAddress, putWarehouse } from '../../api/seller/onboarding';
import { companyValidationSchema } from '../../code/seller/validation';
import { ErrToast } from '../../ui/Toastify';
import { toISODate } from '../../code/seller';

import styles from "./SellerCompanyInfo.module.scss"

const SellerCompanyInfo = () => {

    const { companyData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()

    const navigate = useNavigate()



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
            first_name: companyData?.first_name ?? "",
            last_name: companyData?.last_name ?? "",
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
        enableReinitialize: true,
        onSubmit: async (values) => {
            console.log(values);
            safeCompanyData({
                ...values
            });

            try {
                // Создаем массив промисов для всех запросов
                const requests = [
                    putCompanyInfo({
                        company_name: values.company_name,
                        legal_form: companyData?.legal_form,
                        country_of_registration: companyData?.country_of_registration,
                        business_id: values?.business_id,
                        ico: "string",
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
                const results = await Promise.allSettled(requests);

                // Обработка ошибок
                const errors = results
                    .filter((r) => r.status === "rejected")
                    .map((r) => r.reason?.message || "Unknown error");

                if (errors.length > 0) {
                    // Можно показать тоаст или alert
                    console.error("Some requests failed:", errors);
                    ErrToast("Some requests failed:\n" + errors.join("\n"));
                    return; // прерываем навигацию
                }

                // Если все прошло успешно
                navigate("/seller/seller-review-company");
            } catch (err) {
                console.error("Unexpected error:", err);
                ErrToast("Unexpected error occurred. Please try again.");
            }
        }

    })


    useEffect(() => {
        console.log(formik.errors);
        console.log(formik.values);

    }, [formik.errors, formik.values])

    return (
        <FormWrap style={{ height: "100%" }}>
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <TitleAndDesc title={"Seller Information"}
                        desc={"Please provide all required information for verification"} />

                    <StepWrap step={4} />

                </div>

                <CompanyInfo formik={formik} />
                <Representative formik={formik} />


                <CompanyAddress formik={formik} />

                <BankAccount formik={formik} />

                <WhareHouseAddress formik={formik} />

                <ReturnAddress formik={formik} />

                <AuthBtnSeller
                    text={"Continue to Review"}
                    style={{ borderRadius: "16px", width: "222px" }}
                    handleClick={formik.handleSubmit}
                    disabled={!formik.isValid}
                />

            </div>

        </FormWrap>
    )
}

export default SellerCompanyInfo