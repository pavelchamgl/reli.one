import { useState } from 'react'

import InputSeller from '../../../../../ui/Seller/auth/inputSeller/InputSeller'
import SellerDateInp from '../dateInp/DateInp'
import SellerInfoSellect from '../sellerinfoSellect/SellerInfoSellect'

import taxInfo from "../../../../../assets/Seller/register/taxInfo.svg"

import styles from './TaxInfo.module.scss'

const TaxInfo = ({ formik }) => {

    const [country, setCountry] = useState(null)

    const countryArr = [
        "Czech Republic",
        "Germany",
        "France",
        "Poland",
        "United Kingdom",
    ]

    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={taxInfo} alt="" />
                <h2>Tax Information</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <SellerInfoSellect arr={countryArr} title={"Tax country"} titleSellect={"Select country of tax residency"} value={country} setValue={setCountry} />
                <InputSeller title={"TIN (Tax Identification Number)"} type={"text"} circle={true} required={true} num={true} placeholder={"123456789"} name="tin" value={formik.values.tin} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                <InputSeller title={"IČO"} type={"text"} circle={true} required={true} num={true} placeholder={"123456789"} name="ico" value={formik.values.ico} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                <InputSeller title={"VAT ID"} type={"text"} circle={true} num={true} placeholder={"If registered"} name="vat_id" value={formik.values.vat_id} onChange={formik.handleChange} onBlur={formik.handleBlur} />


            </div>


        </div>
    )
}

export default TaxInfo