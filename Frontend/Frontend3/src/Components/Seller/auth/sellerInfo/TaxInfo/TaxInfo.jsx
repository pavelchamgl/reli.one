import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import InputSeller from '../../../../../ui/Seller/auth/inputSeller/InputSeller'
import SellerDateInp from '../dateInp/DateInp'
import SellerInfoSellect from '../sellerinfoSellect/SellerInfoSellect'

import taxInfo from "../../../../../assets/Seller/register/taxInfo.svg"
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed'

import styles from './TaxInfo.module.scss'
import { putSelfAddress, putTax } from '../../../../../api/seller/onboarding'
import { countriesArr } from '../../../../../code/seller'
import { ErrToast } from '../../../../../ui/Toastify'

const TaxInfo = ({ formik, onClosePreview }) => {

    const { selfData } = useSelector(state => state.selfEmploed)
    const { safeData } = useActionSafeEmploed()


    const [country, setCountry] = useState(selfData.tax_country)


    const taxDataRef = useRef(null)

    const isTaxDataFilled = (values) => {
        return Boolean(
            values.tax_country &&
            values.tin 
            // values.vat_id
        )
    }

    const onLeaveTaxBlock = async () => {

        const filled = isTaxDataFilled(formik.values)



        if (!filled) return

        const payload = {
            tax_country: country,
            tin: formik.values.tin,
            ico: formik.values.ico,
            vat_id: formik.values.vat_id
        }


        safeData(payload)




        try {
            await putTax({
                tax_country: country,
                tin: payload.tin,
                ico: (country === "cz" || country === "sk") ? "" : payload.ico,
                vat_id: payload.vat_id
            })

            onClosePreview?.();
        } catch (err) {
            ErrToast(err?.message || "Failed to save tax data");

        }

    }




    useEffect(() => {
        safeData({ tax_country: country })
        formik.setFieldValue("tax_country", country)

    }, [country])



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
                <h2>Tax Information</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <SellerInfoSellect arr={countriesArr} title={"Tax country"}
                    titleSellect={"Select country of tax residency"}
                    value={country} setValue={setCountry}
                    errText={"Tax country is required"}
                />

                <InputSeller title={"TIN (Tax Identification Number)"} type={"text"} circle={true} required={true} num={true}
                    placeholder={"123456789"}
                    name="tin" value={formik.values.tin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.tin}
                    touched={formik.touched.tin}

                />

                {
                    (country === "cz" || country === "sk") &&
                    <InputSeller title={"IČO"} type={"text"} circle={true} required={true} num={true}
                        placeholder={"123456789"}
                        name="ico"
                        value={formik.values.ico}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.ico}
                        touched={formik.touched.ico}

                    />
                }


                <InputSeller title={"VAT ID"} type={"text"} circle={true} num={true}
                    placeholder={"If registered"} name="vat_id"
                    value={formik.values.vat_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.vat_id}
                    touched={formik.touched.vat_id}

                />


            </div>


        </div>
    )
}

export default TaxInfo