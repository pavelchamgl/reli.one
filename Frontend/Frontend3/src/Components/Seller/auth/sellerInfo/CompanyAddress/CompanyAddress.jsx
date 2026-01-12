import { useState } from "react"

import companyAddressIc from "../../../../../assets/Seller/register/companyAddress.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"

import styles from "./CompanyAddress.module.scss"

const CompanyAddress = ({ formik }) => {

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
                <img src={companyAddressIc} alt="" />
                <h2>Company Address</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Street"} type={"text"} circle={true} required={true} placeholder={"Industrial Street 456"} name="wStreet" value={formik.values.wStreet} onChange={formik.handleChange} onBlur={formik.handleBlur} />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"City"} type={"text"} circle={true} required={true} placeholder={"Brno"} name="wCity" value={formik.values.wCity} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                    <InputSeller title={"ZIP"} type={"text"} circle={true} required={true} placeholder={"602 00"} name="wZip_code" value={formik.values.wZip_code} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                    <SellerInfoSellect arr={countryArr} value={country} setValue={setCountry} title={"Country"} titleSellect={"Select"} />
                </div>
                <InputSeller title={"Contact phone"} type={"tel"} circle={true} required={true} placeholder={"+420 987 654 321"} name="contact_phone" value={formik.values.contact_phone} onChange={formik.handleChange} onBlur={formik.handleBlur} />



            </div>


        </div>
    )
}

export default CompanyAddress