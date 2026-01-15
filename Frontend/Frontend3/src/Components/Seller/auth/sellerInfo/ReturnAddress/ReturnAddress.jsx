
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"

import returnAddress from "../../../../../assets/Seller/register/returnAddress.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import Checkbox from "../../../../../ui/Seller/newOrder/checkbox/Checkbox"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"

import styles from "./ReturnAddress.module.scss"

const ReturnAddress = ({ formik }) => {

    const { pathname } = useLocation()

    const companyPathname = '/seller/seller-company'

    const { selfData, companyData } = useSelector(state => state.selfEmploed)

    const [isCheked, setIsChecked] = useState(
        !!(selfData?.same_as_warehouse ?? companyData?.same_as_warehouse)
    )

    const sourceData = pathname === companyPathname ? companyData : selfData

    const [country, setCountry] = useState(
        isCheked
            ? sourceData?.wCountry ?? null
            : sourceData?.rCountry ?? null
    )

    const countryArr = [
        { text: "Czech Republic", value: "cz" },
        { text: "Germany", value: "de" },
        { text: "France", value: "fr" },
        { text: "Poland", value: "pl" },
        { text: "United Kingdom", value: "gb" }
    ];

    const { safeData, safeCompanyData } = useActionSafeEmploed()

    useEffect(() => {
        if (pathname === companyPathname) {
            safeCompanyData({ rCountry: country })
            formik.setFieldValue("rCountry", country)


        } else {
            safeData({ rCountry: country })
            formik.setFieldValue("rCountry", country)

        }
    }, [country])

    useEffect(() => {
        if (isCheked) {
            setCountry(selfData.wCountry)
        } else {
            setCountry(selfData.rCountry)
        }

        if (pathname === companyPathname) {
            safeCompanyData({ same_as_warehouse: isCheked })
        } else {
            safeData({ same_as_warehouse: isCheked })
        }

    }, [isCheked])

    const handleSameAsWarehouse = (checked) => {
        setIsChecked(checked)

        if (!checked) {
            formik.setFieldValue("rStreet", "")
            formik.setFieldValue("rCity", "")
            formik.setFieldValue("rZip_code", "")
            formik.setFieldValue("rCountry", null)
            formik.setFieldValue("rContact_phone", "")
        } else {
            formik.setFieldValue("rStreet", formik.values.wStreet)
            formik.setFieldValue("rCity", formik.values.wCity)
            formik.setFieldValue("rZip_code", formik.values.wZip_code)
            formik.setFieldValue("rCountry", selfData.wCountry)
            formik.setFieldValue("rContact_phone", formik.values.contact_phone)
        }

    }

    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={returnAddress} alt="" />
                <h2>Return Address</h2>
            </div>

            <label className={styles.checkWrap}>
                <Checkbox checked={isCheked} onChange={(e) => handleSameAsWarehouse(e.target.checked)} />
                <p>Same as warehouse address</p>
            </label>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Street"} type={"text"} circle={true} required={true}
                    placeholder={"Industrial Street 456"}
                    name="rStreet" value={formik.values.rStreet}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.rStreet}
                />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"City"} type={"text"} circle={true} required={true}
                        placeholder={"Brno"}
                        name="rCity" value={formik.values.rCity}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.rCity}
                    />
                    <InputSeller title={"ZIP"} type={"text"} circle={true} required={true}
                        placeholder={"602 00"}
                        name="rZip_code" value={formik.values.rZip_code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.rZip_code}
                    />
                    <SellerInfoSellect arr={countryArr} value={country} setValue={setCountry}
                        title={"Country"} titleSellect={"Select"}
                        errText={"Country is required"}
                    />
                </div>
                <InputSeller title={"Contact phone"} type={"tel"} circle={true} required={true}
                    placeholder={"+420 987 654 321"}
                    name="rContact_phone" value={formik.values.rContact_phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.rContact_phone}
                />



            </div>


        </div>
    )
}

export default ReturnAddress