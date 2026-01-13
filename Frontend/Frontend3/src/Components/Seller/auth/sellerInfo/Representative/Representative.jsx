
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"

import representativeIc from "../../../../../assets/Seller/register/representativeIc.svg"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"

import styles from "./Representative.module.scss"
import SellerDateInp from "../dateInp/DateInp"

const Representative = ({ formik }) => {

    const { companyData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()

    const [role, setRole] = useState(companyData?.role ?? null)
    const [nationality, setNationality] = useState(companyData?.nationality ?? null)





    const roleArr = [
        { text: "Owner", value: "Owner" },
        { text: "Director", value: "Director" },
        { text: "Managing Director", value: "Managing Director" },
        { text: "CEO", value: "CEO" },
        { text: "Authorized Signatory", value: "Authorized Signatory" },
    ];

    const nationalArr = [
        { text: "Czech Republic", value: "cz" },
        { text: "Germany", value: "de" },
        { text: "France", value: "fr" },
        { text: "Poland", value: "pl" },
        { text: "United Kingdom", value: "gb" }
    ];

    useEffect(() => {
        if (role !== null) {
            safeCompanyData({ role: role })
        }
    }, [role])

    useEffect(() => {
        if (nationality !== null) {
            safeCompanyData({ nationality: nationality })
        }
    }, [nationality])

    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={representativeIc} alt="" />
                <h2>Representative (Authorized Person)</h2>
            </div>

            <div className={styles.inpWrapMain}>



                <div className={styles.twoInpWrap}>
                    <InputSeller title={"First name"} type={"text"} circle={true} required={true} placeholder={"Jane"}
                        name="first_name"
                        value={formik.values.first_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                    <InputSeller title={"Last name"} type={"text"} circle={true} required={true} placeholder={"Smith"}
                        name="last_name"
                        value={formik.values.last_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                </div>

                <SellerInfoSellect arr={roleArr} title={"Role"} titleSellect={"Select role"} value={role} setValue={setRole} />

                <div className={styles.twoInpWrap}>
                    <SellerDateInp formik={formik} />
                    <SellerInfoSellect arr={nationalArr} title={"Nationality"} titleSellect={"Select nationality"} value={nationality} setValue={setNationality} />
                </div>



                <UploadInp second={true} />



            </div>


        </div>
    )
}

export default Representative