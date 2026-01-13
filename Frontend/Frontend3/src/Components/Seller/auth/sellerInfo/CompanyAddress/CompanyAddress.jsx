import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import companyAddressIc from "../../../../../assets/Seller/register/companyAddress.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"

import styles from "./CompanyAddress.module.scss"

const CompanyAddress = ({ formik }) => {

    const { companyData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()

    const [country, setCountry] = useState(companyData?.country ?? null)


    const countryArr = [
        { text: "Czech Republic", value: "cz" },
        { text: "Germany", value: "de" },
        { text: "France", value: "fr" },
        { text: "Poland", value: "pl" },
        { text: "United Kingdom", value: "gb" }
    ];

    useEffect(() => {
        if (country !== null) {
            safeCompanyData({ country: country })
        }
    }, [country])

    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={companyAddressIc} alt="" />
                <h2>Company Address</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Street"} type={"text"} circle={true} required={true} placeholder={"Industrial Street 456"}
                    name="street"
                    value={formik.values.street}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur} />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"City"} type={"text"} circle={true} required={true} placeholder={"Brno"}
                        name="city"
                        value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur} />

                    <InputSeller title={"ZIP"} type={"text"} circle={true} required={true} placeholder={"602 00"}
                        name="zip_code"
                        value={formik.values.zip_code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur} />
                    <SellerInfoSellect arr={countryArr} value={country} setValue={setCountry} title={"Country"} titleSellect={"Select"} />
                </div>
                <UploadInp />



            </div>


        </div>
    )
}

export default CompanyAddress