import { useRef } from "react"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import companyAddressIc from "../../../../../assets/Seller/register/companyAddress.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"
import { putCompanyAddress, uploadSingleDocument } from "../../../../../api/seller/onboarding"
import { countriesArr, toISODate } from "../../../../../code/seller"
import { ErrToast } from "../../../../../ui/Toastify"

import styles from "./CompanyAddress.module.scss"

const CompanyAddress = ({ formik, onClosePreview }) => {

    const { companyData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()


    const isCompanyAddressFilled = (values) => {
        return Boolean(
            values.street,
            values.city,
            values.zip_code,
            values.country,
            values.proof_document_issue_date
        )
    }

    const companyAddressRef = useRef(null)
    const { pathname } = useLocation()



    const onLeaveCompanyAddressBlock = async () => {

        const filled = isCompanyAddressFilled(formik.values)
        if (!filled) return

        const payload = {
            street: formik.values.street,
            city: formik.values.city,
            zip_code: formik.values.zip_code,
            country: formik.values.country,
            proof_document_issue_date: formik.values.proof_document_issue_date
        }

        if (pathname === '/seller/seller-review-company') {
            safeCompanyData(payload)
        }

        try {
            await putCompanyAddress({
                ...payload,
                proof_document_issue_date: toISODate(payload.proof_document_issue_date)
            })

            onClosePreview?.();
        } catch (err) {
            // ErrToast(err?.message || "Failed to save personal data");
        }
    }


    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
        uploadSingleDocument({ file, doc_type, scope, side })
            .then(res => {
                formik.setFieldValue("proof_document_issue_date", res.uploaded_at)
            })
            .catch(err => {
                ErrToast(err.message)
                console.log("Ошибка загрузки", err);
            });
    };

    const ignoreBlurRef = useRef(false);

    const { t } = useTranslation('onbording')


    return (
        <div className={styles.main}
            ref={companyAddressRef}
            tabIndex={-1}
            onBlurCapture={(e) => {
                if (ignoreBlurRef.current) {
                    ignoreBlurRef.current = false;
                    return;
                }
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(onLeaveCompanyAddressBlock, 0);
                }
            }}
        >
            <div className={styles.titleWrap}>
                <img src={companyAddressIc} alt="" />
                <h2>{t('onboard.tax_address.title_business')}</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller
                    title={t('onboard.tax_address.street')}
                    type={"text"} circle={true} required={true}
                    placeholder={"Industrial Street 456"}
                    name="street"
                    value={formik.values.street}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.street}
                    touched={formik.touched.street}
                />

                <div className={styles.twoInpWrap}>
                    <InputSeller
                        title={t('onboard.tax_address.city')}
                        type={"text"} circle={true} required={true}
                        placeholder={"Brno"}
                        name="city"
                        value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.city}
                        touched={formik.touched.city}
                    />

                    <InputSeller
                        title={t('onboard.tax_address.zip')}
                        type={"text"} circle={true} required={true}
                        placeholder={"602 00"}
                        name="zip_code"
                        value={formik.values.zip_code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.zip_code}
                        touched={formik.touched.zip_code}
                    />

                    <SellerInfoSellect
                        arr={countriesArr}
                        value={formik.values.country}
                        setValue={(v) => formik.setFieldValue('country', v)}
                        title={t('onboard.tax_address.country')}
                        titleSellect={t('onboard.common.select')}
                        errText={t('onboard.tax_address.country_required')}
                    />
                </div>
                <div>
                    <UploadInp
                        title={t('onboard.tax_address.proof_address')}
                        description={t('onboard.company.cert_desc')} // Переиспользуем "не старше 3 месяцев"
                        scope={"company_address"}
                        docType={"proof_of_address"}
                        side={null}
                        onChange={handleSingleFrontUpload}
                        inpText={t('onboard.common.upload')}
                        stateName={companyData?.company_address_name}
                        nameTitle={"company_address_name"}
                        onMouseDown={() => (ignoreBlurRef.current = true)}
                    />
                    {formik.errors.proof_document_issue_date &&
                        <p className={styles.errorText}>{formik.errors.proof_document_issue_date}</p>}
                </div>
            </div>
        </div>
    )
}

export default CompanyAddress