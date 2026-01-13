
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import warehouseIc from "../../../../../assets/Seller/register/warehouseIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"

import styles from "./WareHouseAddress.module.scss"
import { useLocation } from "react-router-dom"

const WhareHouseAddress = ({ formik }) => {

    const { pathname } = useLocation()

    const companyPathname = '/seller/seller-company'

    const { selfData, companyData } = useSelector(state => state.selfEmploed)

    const [country, setCountry] = useState(selfData.wCountry || companyData.wCountry)

    const countryArr = [
        { text: "Czech Republic", value: "cz" },
        { text: "Germany", value: "de" },
        { text: "France", value: "fr" },
        { text: "Poland", value: "pl" },
        { text: "United Kingdom", value: "gb" }
    ];

    const { safeData, safeCompanyData } = useActionSafeEmploed()

    useEffect(() => {
        if (companyPathname === pathname) {
            safeCompanyData({ wCountry: country })
        } else {
            safeData({ wCountry: country })
        }
    }, [country])

    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={warehouseIc} alt="" />
                <h2>Warehouse Address</h2>
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

export default WhareHouseAddress