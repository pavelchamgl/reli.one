
import { useState } from "react"

import representativeIc from "../../../../../assets/Seller/register/representativeIc.svg"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"

import styles from "./Representative.module.scss"
import SellerDateInp from "../dateInp/DateInp"

const Representative = ({ formik }) => {

    const [role, setRole] = useState(null)
    const [nationality, setNationality] = useState(null)





    const roleArr = [
        "Owner",
        "Director",
        "Managing Director",
        "CEO",
        "Authorized Signatory",
    ]

    const nationalArr = [
        "Czech Republic",
        "Germany",
        "France",
        "Poland",
        "United Kingdom",
    ]

    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={representativeIc} alt="" />
                <h2>Representative (Authorized Person)</h2>
            </div>

            <div className={styles.inpWrapMain}>



                <div className={styles.twoInpWrap}>
                    <InputSeller title={"First name"} type={"text"} circle={true} required={true} placeholder={"Jane"}
                    // name="first_name"
                    // value={formik.values.first_name}
                    // onChange={formik.handleChange}
                    // onBlur={formik.handleBlur}
                    />
                    <InputSeller title={"Last name"} type={"text"} circle={true} required={true} placeholder={"Smith"}
                    // name="first_name"
                    // value={formik.values.first_name}
                    // onChange={formik.handleChange}
                    // onBlur={formik.handleBlur}
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