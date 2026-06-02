import { useFormik } from 'formik'
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
import { companyValidationSchema } from '../../code/seller/validation';
import { ErrToast } from '../../ui/Toastify';
import { buildCompanySubmitRequests } from '../../features/seller-onboarding/buildCompanySubmitRequests';

import styles from "./SellerCompanyInfo.module.scss"

const SellerCompanyInfo = () => {

    const firstName = JSON.parse(localStorage.getItem('first_name')) || ""
    const lastName = JSON.parse(localStorage.getItem('last_name')) || ""


    const { companyData, registerData, companyDataLoading } = useSelector(state => state.selfEmploed)

    const { safeCompanyData, getAllCompanyDataBD } = useActionSafeEmploed()

    const navigate = useNavigate()

    const { t } = useTranslation('onbording')

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
            // uploadFront: companyData?.uploadFront ?? "",
            // uploadBack: companyData?.uploadBack ?? "",


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
            // same_as_warehouse: companyData?.same_as_warehouse ?? false,
            same_as_warehouse:false,
            rStreet: companyData?.rStreet ?? "",
            rCity: companyData?.rCity ?? "",
            rZip_code: companyData?.rZip_code ?? "",

            rCountry: companyData?.rCountry ?? "",
            rContact_phone: companyData?.rContact_phone ?? "",
            rProof_document_issue_date: companyData?.rProof_document_issue_date ?? ""

        },
        validationSchema: companyValidationSchema,
        enableReinitialize: true,
        // validateOnMount: false,
        validateOnChange: true,
        // validateOnBlur: true,
        onSubmit: async (values) => {
            safeCompanyData({
                ...values
            });

            localStorage.setItem('first_name', JSON.stringify(values.first_name))
            localStorage.setItem('last_name', JSON.stringify(values.last_name))


            try {
                const requests = buildCompanySubmitRequests(values);

                // Отправляем все запросы параллельно
                const results = await Promise.allSettled(
                    requests.map((request) => request.promise)
                );

                // Обработка ошибок
                const errors = results
                    .map((result, index) => {
                        if (result.status === "rejected") {
                            return `${requests[index].name}: ${result.reason?.message || "Unknown error"}`;
                        }
                        return null;
                    })
                    .filter(Boolean);

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
        getAllCompanyDataBD()
    }, [])

    if (!companyDataLoading) {
        return (
            <FormWrap style={{ height: "100%" }}>
                <div className={styles.main}>
                    <div className={styles.titleWrap}>
                        <TitleAndDesc
                            title={t('onboard.seller_info.title')}
                            desc={t('onboard.seller_info.provide_info_desc')}
                        />

                        <StepWrap step={4} />

                    </div>

                    <CompanyInfo formik={formik} />

                    <Representative formik={formik} />

                    <CompanyAddress formik={formik} />

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

export default SellerCompanyInfo
