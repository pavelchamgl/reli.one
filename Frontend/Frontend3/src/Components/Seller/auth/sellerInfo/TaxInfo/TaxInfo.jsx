import { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import InputSeller from '../../../../../ui/Seller/auth/inputSeller/InputSeller'
import SellerDateInp from '../dateInp/DateInp'
import SellerInfoSellect from '../sellerinfoSellect/SellerInfoSellect'
import { putSelfAddress, putTax } from '../../../../../api/seller/onboarding'
import { countriesArr } from '../../../../../code/seller'
import { ErrToast } from '../../../../../ui/Toastify'

import taxInfo from "../../../../../assets/Seller/register/taxInfo.svg"
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed'

import styles from './TaxInfo.module.scss'

const TaxInfo = ({ formik, onClosePreview }) => {

    const { selfData } = useSelector(state => state.selfEmploed)
    const { safeData } = useActionSafeEmploed()


    const [country, setCountry] = useState(selfData.tax_country)

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
                business_id: (country === "cz" || country === "sk") ? payload.ico : "",
                vat_id: payload.vat_id
            })

            onClosePreview?.();
        } catch (err) {
            // ErrToast(err?.message || "Failed to save tax data");

        }

    }




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

                {
                    (country === "cz" || country === "sk") &&
                    <InputSeller
                        title={t('onboard.company.business_id')}
                        type={"text"} circle={true} required={true} num={true}
                        placeholder={"123456789"}
                        name="ico"
                        value={formik.values.ico}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.ico}
                        touched={formik.touched.ico}
                    />
                }
                
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