import { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import InputSeller from '../../../../../ui/Seller/auth/inputSeller/InputSeller'
import SellerInfoSellect from '../sellerinfoSellect/SellerInfoSellect'
import { getAresCompanyByIco, putTax } from '../../../../../api/seller/onboarding'
import { countriesArr } from '../../../../../code/seller'

import taxInfo from "../../../../../assets/Seller/register/taxInfo.svg"
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed'
import {
    applyAresSelfEmployedPrefill,
    buildAresSelfEmployedPrefillPatch,
    formatAresAddress,
    getAresSelfEmployedRegistryName,
} from '../../../../../features/seller-onboarding/applyAresSelfEmployedPrefill'

import styles from './TaxInfo.module.scss'

const TaxInfo = ({ formik, onClosePreview }) => {

    const { selfData } = useSelector(state => state.selfEmploed)
    const { safeData } = useActionSafeEmploed()


    const [country, setCountry] = useState(selfData.tax_country)
    const [aresLoading, setAresLoading] = useState(false)
    const [aresPreview, setAresPreview] = useState(null)
    const [aresErrorKey, setAresErrorKey] = useState("")

    const taxDataRef = useRef(null)

    const { t } = useTranslation('onbording')

    const isTaxDataFilled = (values) => {
        return Boolean(
            values.tax_country &&
            values.tin
            // values.vat_id
        )
    }

    const { pathname } = useLocation()


    const onLeaveTaxBlock = async () => {

        const filled = isTaxDataFilled(formik.values)



        if (!filled) return

        const payload = {
            tax_country: formik.values.tax_country,
            tin: formik.values.tin,
            ico: formik.values.ico,
            vat_id: formik.values.vat_id
        }

        if (pathname === '/seller/seller-review') {
            safeData(payload)
        }

        try {
            await putTax({
                tax_country: country,
                tin: payload.tin,
                // business_id: (country === "cz" || country === "sk") ? payload.ico : "",
                business_id: payload.ico,
                vat_id: payload.vat_id
            })

            onClosePreview?.();
        } catch (err) {
            // ErrToast(err?.message || "Failed to save tax data");

        }

    }

    const getAresErrorKey = (err) => {
        if (err?.code === "ares_invalid_ico" || err?.status === 400) return "invalid"
        if (err?.code === "ares_not_found" || err?.status === 404) return "not_found"
        if (err?.code === "ares_unavailable" || err?.status === 503) return "unavailable"
        return "generic"
    }

    const handleAresLookup = async () => {
        setAresLoading(true)
        setAresPreview(null)
        setAresErrorKey("")

        try {
            const result = await getAresCompanyByIco(formik.values.ico)
            if (!result?.found) {
                setAresErrorKey(result?.code === "ares_invalid_ico" ? "invalid" : "not_found")
                return
            }
            setAresPreview(result)
        } catch (err) {
            setAresErrorKey(getAresErrorKey(err))
        } finally {
            setAresLoading(false)
        }
    }

    const applyAresPreview = () => {
        if (!aresPreview) return
        const appliedFields = applyAresSelfEmployedPrefill({ formik, aresPreview, setTaxCountry: setCountry })
        if (appliedFields.length > 0) {
            const patch = buildAresSelfEmployedPrefillPatch(aresPreview)
            const safePatch = appliedFields.reduce((acc, field) => {
                acc[field] = patch[field]
                return acc
            }, {})
            safeData({ ...formik.values, ...safePatch })
        }
    }

    const registryName = getAresSelfEmployedRegistryName(aresPreview)




    return (
        <div className={styles.main}
            ref={taxDataRef}
            tabIndex={-1}
            onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(onLeaveTaxBlock, 0);
                }
            }}
        >
            <div className={styles.titleWrap}>
                <img src={taxInfo} alt="" />
                <h2>{t('onboard.tax_address.tax_info')}</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <SellerInfoSellect
                    arr={countriesArr}
                    title={t('onboard.tax_address.tax_country')}
                    titleSellect={t('onboard.tax_address.select_tax_country')}
                    value={formik.values.tax_country}
                    setValue={(v) => {
                        formik.setFieldValue("tax_country", v)
                        setCountry(v)
                    }}
                    errText={t('onboard.tax_address.tax_country_required')}
                />

                <div className={styles.aresLookupWrap}>
                    <InputSeller
                        title={t('onboard.company.business_id')}
                        type={"text"} circle={true} required={true} num={true}
                        placeholder={"12345678"}
                        name="ico"
                        value={formik.values.ico}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.ico}
                        touched={formik.touched.ico}
                    />

                    <button
                        type="button"
                        className={styles.aresLookupBtn}
                        onClick={handleAresLookup}
                        disabled={aresLoading}
                    >
                        {aresLoading ? t('onboard.self_employed_ares.loading') : t('onboard.self_employed_ares.load')}
                    </button>
                </div>

                {aresErrorKey &&
                    <p className={styles.aresError} role="alert">
                        {t(`onboard.self_employed_ares.errors.${aresErrorKey}`)}
                    </p>}

                {aresPreview &&
                    <div className={styles.aresPreview} data-testid="self-employed-ares-preview">
                        <div className={styles.aresPreviewHeader}>
                            <p>{t('onboard.self_employed_ares.preview_title')}</p>
                            {!aresPreview.is_active &&
                                <span>{t('onboard.self_employed_ares.inactive_warning')}</span>}
                        </div>

                        <dl>
                            {registryName &&
                                <>
                                    <dt>{t('onboard.self_employed_ares.registry_name')}</dt>
                                    <dd>{registryName}</dd>
                                </>}
                            {(aresPreview.business_id || aresPreview.ico) &&
                                <>
                                    <dt>{t('onboard.company.business_id')}</dt>
                                    <dd>{aresPreview.business_id || aresPreview.ico}</dd>
                                </>}
                            {formatAresAddress(aresPreview.registered_address) &&
                                <>
                                    <dt>{t('onboard.company.ares.registered_address')}</dt>
                                    <dd>{formatAresAddress(aresPreview.registered_address)}</dd>
                                </>}
                            {aresPreview.dic_hint &&
                                <>
                                    <dt>
                                        {aresPreview.dic_hint_source === "derived"
                                            ? t('onboard.company.ares.dic_hint_derived')
                                            : t('onboard.company.ares.dic_hint')}
                                    </dt>
                                    <dd>
                                        {aresPreview.dic_hint}
                                        {aresPreview.dic_hint_source === "derived" &&
                                            <span className={styles.aresDerivedHint}>
                                                {t('onboard.company.ares.dic_hint_derived_warning')}
                                            </span>}
                                    </dd>
                                </>}
                        </dl>

                        <button
                            type="button"
                            className={styles.aresApplyBtn}
                            onClick={applyAresPreview}
                        >
                            {t('onboard.self_employed_ares.apply')}
                        </button>
                    </div>}

                <InputSeller
                    title={t('onboard.company.tin')}
                    type={"text"} circle={true} required={true} num={true}
                    placeholder={"123456789"}
                    name="tin" value={formik.values.tin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.tin}
                    touched={formik.touched.tin}
                />


            </div>
        </div>
    )
}

export default TaxInfo
