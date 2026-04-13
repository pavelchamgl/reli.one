
import { useRef, useState } from "react"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

import companyIc from "../../../../../assets/Seller/register/companyIcon.svg"

import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"
import { putCompanyInfo, uploadSingleDocument } from "../../../../../api/seller/onboarding"
import { countriesArr, toISODate } from "../../../../../code/seller"

import styles from "./CompanyInfo.module.scss"

const CompanyInfo = ({ formik, onClosePreview }) => {

    const { companyData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()

    const [country, setCountry] = useState(companyData?.country_of_registration ?? null)

    const [uploadStatus, setUploadStatus] = useState("")

    const isCompanyFilled = (values) => {
        return Boolean(
            values.company_name &&
            values.business_id &&
            values.tin &&
            values.company_phone &&
            values.certificate_issue_date
        )
    }

    const companyRef = useRef(null)


    const { pathname } = useLocation()

    const { t } = useTranslation('onbording')

    const onLeaveCompanyBlock = async () => {

        const filled = isCompanyFilled(formik.values)
        if (!filled) return

        const payload = {
            company_name: formik.values.company_name,
            legal_form: formik.values.legal_form,
            country_of_registration: formik.values.country_of_registration,
            business_id: formik.values.business_id,
            tin: formik.values?.tin,
            eori_number: formik.values?.eori_number,
            imports_to_eu: Boolean(formik.values?.eori_number),
            company_phone: formik.values?.company_phone,
            certificate_issue_date: formik.values.certificate_issue_date,
        }

        if (pathname === '/seller/seller-review-company') {
            safeCompanyData(payload)
        }


        try {
            await putCompanyInfo({
                ...payload,
                certificate_issue_date: toISODate(payload.certificate_issue_date)
            })

            onClosePreview?.();
        } catch (err) {
            // ErrToast(err?.message || "Failed to save personal data");
        }
    }




    const legalArr = [
        {
            value: "GmbH (Germany)",
            text: t('onboard.legal_forms.gmbh')
        },
        {
            value: "Ltd (United Kingdom)",
            text: t('onboard.legal_forms.ltd')
        },
        {
            value: "S.A.R.L. (France)",
            text: t('onboard.legal_forms.sarl')
        },
        {
            value: "s.r.o. (Czech Republic / Slovakia)",
            text: t('onboard.legal_forms.sro')
        },
    ];

    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
        uploadSingleDocument({ file, doc_type, scope, side })
            .then(res => {
                formik.setFieldValue("certificate_issue_date", res.uploaded_at)
                setUploadStatus('full')
            })
            .catch(err => {
                setUploadStatus('rej')
                ErrToast(err.message)
                console.log("Ошибка загрузки", err);
            });
    };

    const ignoreBlurRef = useRef(false);


    return (
        <div className={styles.main}
            tabIndex={-1}
            ref={companyRef}
            onBlurCapture={(e) => {
                if (ignoreBlurRef.current) {
                    ignoreBlurRef.current = false;
                    return;
                }
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(onLeaveCompanyBlock, 0);
                }
            }}
        >
            <div className={styles.titleWrap}>
                <img src={companyIc} alt="" />
                <h2>{t('onboard.company.title')}</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller
                    title={t('onboard.company.name')}
                    type={"text"} circle={true} required={true}
                    placeholder={"Official registered company name"}
                    name="company_name"
                    value={formik.values.company_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.company_name}
                    touched={formik.touched.company_name}
                />

                <div className={styles.twoInpWrap}>
                    <SellerInfoSellect
                        arr={legalArr}
                        title={t('onboard.company.legal_form')}
                        titleSellect={t('onboard.company.select_legal')}
                        value={formik.values.legal_form}
                        setValue={(v) => formik.setFieldValue('legal_form', v)}
                        errText={t('onboard.company.legal_required')}
                        style={{ height: '150px' }}
                    />

                    <SellerInfoSellect
                        arr={countriesArr}
                        title={t('onboard.company.country_reg')}
                        titleSellect={t('onboard.common.select')}
                        value={formik.values.country_of_registration}
                        setValue={(v) => {
                            setCountry(v)
                            formik.setFieldValue('country_of_registration', v)
                        }}
                        errText={t('onboard.company.country_required')}
                    />
                </div>

                <InputSeller
                    title={t('onboard.company.business_id')}
                    type={"text"} circle={true} required={true}
                    placeholder={"Trade register number"}
                    name="business_id"
                    value={formik.values.business_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.business_id}
                    touched={formik.touched.business_id}
                    num={true}
                />



                <InputSeller
                    title={t('onboard.tax_address.tin_full')}
                    type={"text"} circle={true} required={true} placeholder={"987654321"}
                    name="tin"
                    value={formik.values.tin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.tin}
                    touched={formik.touched.tin}
                    num={true}
                />

                <InputSeller
                    title={"EORI"}
                    type={"text"} circle={true}
                    placeholder={t('onboard.company.eori_placeholder')}
                    name="eori_number"
                    value={formik.values.eori_number}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.eori_number}
                    touched={formik.touched.eori_number}
                />


                <div>
                    <UploadInp
                        title={t('onboard.company.cert_title')}
                        description={t('onboard.company.cert_desc')}
                        scope={"company_info"}
                        docType={"registration_certificate"}
                        side={null}
                        onChange={handleSingleFrontUpload}
                        inpText={t('onboard.common.upload')}
                        stateName={companyData?.company_file_date}
                        nameTitle={"company_file_date"}
                        onMouseDown={() => (ignoreBlurRef.current = true)}
                        uploadStatus={uploadStatus}
                    />
                </div>

                <InputSeller
                    title={t('onboard.company.phone')}
                    type={"tel"} circle={true} required={true} num={true}
                    placeholder={"+420 ..."}
                    name="company_phone"
                    value={formik.values.company_phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.company_phone}
                    touched={formik.touched.company_phone}
                />
            </div>
        </div>
    )
}

export default CompanyInfo