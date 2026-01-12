
import { useState } from "react"
import returnAddress from "../../../../../assets/Seller/register/returnAddress.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import Checkbox from "../../../../../ui/Seller/newOrder/checkbox/Checkbox"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"

import styles from "./ReturnAddress.module.scss"

const ReturnAddress = ({ formik }) => {

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
                <img src={returnAddress} alt="" />
                <h2>Return Address</h2>
            </div>

            <label className={styles.checkWrap}>
                <Checkbox />
                <p>Same as warehouse address</p>
            </label>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Street"} type={"text"} circle={true} required={true} placeholder={"Industrial Street 456"} name="rStreet" value={formik.values.rStreet} onChange={formik.handleChange} onBlur={formik.handleBlur} />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"City"} type={"text"} circle={true} required={true} placeholder={"Brno"} name="rCity" value={formik.values.rCity} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                    <InputSeller title={"ZIP"} type={"text"} circle={true} required={true} placeholder={"602 00"} name="rZip_code" value={formik.values.rZip_code} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                    <SellerInfoSellect arr={countryArr} value={country} setValue={setCountry} title={"Country"} titleSellect={"Select"} />
                </div>
                <InputSeller title={"Contact phone"} type={"tel"} circle={true} required={true} placeholder={"+420 987 654 321"} name="rContact_phone" value={formik.values.rContact_phone} onChange={formik.handleChange} onBlur={formik.handleBlur} />



            </div>


        </div>
    )
}

export default ReturnAddress