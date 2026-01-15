import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import InputSeller from '../../../../../ui/Seller/auth/inputSeller/InputSeller'
import SellerDateInp from '../dateInp/DateInp'
import SellerInfoSellect from '../sellerinfoSellect/SellerInfoSellect'

import taxInfo from "../../../../../assets/Seller/register/taxInfo.svg"
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed'

import styles from './TaxInfo.module.scss'

const TaxInfo = ({ formik }) => {

    const { selfData } = useSelector(state => state.selfEmploed)

    const [country, setCountry] = useState(selfData.tax_country)


    const countryArr = [
        { text: "Czech Republic", value: "cz" },
        { text: "Germany", value: "de" },
        { text: "France", value: "fr" },
        { text: "Poland", value: "pl" },
        { text: "United Kingdom", value: "gb" },  // или "uk"
    ];

    const { safeData } = useActionSafeEmploed()

    useEffect(() => {
        safeData({ tax_country: country })
        formik.setFieldValue("tax_country", country)

    }, [country])

    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={taxInfo} alt="" />
                <h2>Tax Information</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <SellerInfoSellect arr={countryArr} title={"Tax country"}
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
                />

                <InputSeller title={"IČO"} type={"text"} circle={true} required={true} num={true}
                    placeholder={"123456789"}
                    name="ico"
                    value={formik.values.ico}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.ico}
                />

                <InputSeller title={"VAT ID"} type={"text"} circle={true} num={true}
                    placeholder={"If registered"} name="vat_id"
                    value={formik.values.vat_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.vat_id}
                />


            </div>


        </div>
    )
}

export default TaxInfo