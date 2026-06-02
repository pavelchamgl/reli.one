
import { useRef, useState } from "react"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

import companyIc from "../../../../../assets/Seller/register/companyIcon.svg"

import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"
import { getAresCompanyByIco, putCompanyInfo, uploadSingleDocument } from "../../../../../api/seller/onboarding"
import { countriesArr, toISODate } from "../../../../../code/seller"
import { ErrToast } from "../../../../../ui/Toastify"

import styles from "./CompanyInfo.module.scss"

const CompanyInfo = ({ formik, onClosePreview }) => {

    const { companyData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()

    const [country, setCountry] = useState(companyData?.country_of_registration ?? null)

    const [uploadStatus, setUploadStatus] = useState("")
    const [aresLoading, setAresLoading] = useState(false)
    const [aresPreview, setAresPreview] = useState(null)
    const [aresErrorKey, setAresErrorKey] = useState("")

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
            const certificateIssueDate = toISODate(payload.certificate_issue_date)

            await putCompanyInfo({
                ...payload,
                ...(certificateIssueDate ? { certificate_issue_date: certificateIssueDate } : {})
            })

            onClosePreview?.();
        } catch (err) {
            ErrToast(err?.message || t('onboard.common.error_save'));
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

    const isCompatibleLegalForm = (value) => legalArr.some((item) => item.value === value)

    const formatAresAddress = (address) => {
        if (!address) return ""
        return [address.street, address.city, address.zip_code, address.country].filter(Boolean).join(", ")
    }

    const normalizeAresCountry = (value) => {
        if (!value) return ""
        const normalized = String(value).toLowerCase()
        return countriesArr.some((item) => item.value === normalized) ? normalized : ""
    }

    const handleAresLookup = async () => {
        setAresLoading(true)
        setAresPreview(null)
        setAresErrorKey("")

        try {
            const result = await getAresCompanyByIco(formik.values.business_id)
            if (!result?.found) {
                setAresErrorKey(result?.code === "ares_invalid_ico" ? "invalid" : "generic")
                return
            }
            setAresPreview(result)
        } catch (err) {
            if (err?.code === "ares_invalid_ico" || err?.status === 400) {
                setAresErrorKey("invalid")
            } else if (err?.code === "ares_not_found" || err?.status === 404) {
                setAresErrorKey("not_found")
            } else if (err?.code === "ares_unavailable" || err?.status === 503) {
                setAresErrorKey("unavailable")
            } else {
                setAresErrorKey("generic")
            }
        } finally {
            setAresLoading(false)
        }
    }

    const applyAresPreview = () => {
        if (!aresPreview) return

        if (aresPreview.company_name) {
            formik.setFieldValue("company_name", aresPreview.company_name)
        }
        if (aresPreview.business_id || aresPreview.ico) {
            formik.setFieldValue("business_id", aresPreview.business_id || aresPreview.ico)
        }
        if (aresPreview.legal_form && isCompatibleLegalForm(aresPreview.legal_form)) {
            formik.setFieldValue("legal_form", aresPreview.legal_form)
        }

        const address = aresPreview.registered_address
        if (address?.street) {
            formik.setFieldValue("street", address.street)
        }
        if (address?.city) {
            formik.setFieldValue("city", address.city)
        }
        if (address?.zip_code) {
            formik.setFieldValue("zip_code", address.zip_code)
        }

        const countryValue = normalizeAresCountry(address?.country)
        if (countryValue) {
            formik.setFieldValue("country", countryValue)
        }
    }

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
        <section className={styles.main}
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

                <div className={styles.aresLookupWrap}>
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

                    <button
                        type="button"
                        className={styles.aresLookupBtn}
                        onClick={handleAresLookup}
                        disabled={aresLoading}
                    >
                        {aresLoading ? t('onboard.company.ares.loading') : t('onboard.company.ares.load')}
                    </button>
                </div>

                {aresErrorKey &&
                    <p className={styles.aresError} role="alert">
                        {t(`onboard.company.ares.errors.${aresErrorKey}`)}
                    </p>}

                {aresPreview &&
                    <div className={styles.aresPreview} data-testid="ares-preview">
                        <div className={styles.aresPreviewHeader}>
                            <p>{t('onboard.company.ares.preview_title')}</p>
                            {!aresPreview.is_active &&
                                <span>{t('onboard.company.ares.inactive_warning')}</span>}
                        </div>

                        <dl>
                            {aresPreview.company_name &&
                                <>
                                    <dt>{t('onboard.company.name')}</dt>
                                    <dd>{aresPreview.company_name}</dd>
                                </>}
                            {aresPreview.legal_form &&
                                <>
                                    <dt>{t('onboard.company.legal_form')}</dt>
                                    <dd>{aresPreview.legal_form}</dd>
                                </>}
                            {formatAresAddress(aresPreview.registered_address) &&
                                <>
                                    <dt>{t('onboard.company.ares.registered_address')}</dt>
                                    <dd>{formatAresAddress(aresPreview.registered_address)}</dd>
                                </>}
                            {aresPreview.dic_hint &&
                                <>
                                    <dt>{t('onboard.company.ares.dic_hint')}</dt>
                                    <dd>{aresPreview.dic_hint}</dd>
                                </>}
                        </dl>

                        <button
                            type="button"
                            className={styles.aresApplyBtn}
                            onClick={applyAresPreview}
                        >
                            {t('onboard.company.ares.apply')}
                        </button>
                    </div>}



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
        </section>
    )
}

export default CompanyInfo
