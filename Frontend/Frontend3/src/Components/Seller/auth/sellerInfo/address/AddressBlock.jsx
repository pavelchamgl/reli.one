
import { useState } from "react"

import addressIc from "../../../../../assets/Seller/register/addressIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"

import styles from "./Address.module.scss"

const AddressBlock = ({ formik }) => {

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
                <img src={addressIc} alt="" />
                <h2>Address</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Street"} type={"text"} circle={true} required={true} placeholder={"Main street 123"} name="street" value={formik.values.street} onChange={formik.handleChange} onBlur={formik.handleBlur} />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"City"} type={"text"} circle={true} required={true} placeholder={"Prague"} name="city" value={formik.values.city} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                    <InputSeller title={"ZIP"} type={"text"} circle={true} required={true} placeholder={"11000"} num={true} name="zip_code" value={formik.values.zip_code} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                    <SellerInfoSellect arr={countryArr} value={country} setValue={setCountry} title={"Country"} titleSellect={"Select"} />
                </div>

                <UploadInp />



            </div>


        </div>
    )
}

export default AddressBlock