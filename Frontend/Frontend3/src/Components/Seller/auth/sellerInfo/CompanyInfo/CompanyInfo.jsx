

import { useState } from "react"

import companyIc from "../../../../../assets/Seller/register/companyIcon.svg"

import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"

import styles from "./CompanyInfo.module.scss"

const CompanyInfo = ({ formik }) => {

    const [country, setCountry] = useState(null)
    const [legal, setLegal] = useState(null)


    const countryArr = [
        "Czech Republic",
        "Germany",
        "France",
        "Poland",
        "United Kingdom",
    ]

    const legalArr = [
        "GmbH (Germany)",
        "Ltd (United Kingdom)",
        "S.A.R.L. (France)",
        "s.r.o. (Czech Republic/Slovakia)"
    ]


    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={companyIc} alt="" />
                <h2>Company Information</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Company name"} type={"text"} circle={true} required={true} placeholder={"Official registered company name"}
                // name="first_name"
                // value={formik.values.first_name}
                // onChange={formik.handleChange}
                // onBlur={formik.handleBlur}
                />


                <div className={styles.twoInpWrap}>
                    <SellerInfoSellect arr={legalArr} title={"Legal form"} titleSellect={"Select legal form"} value={legal} setValue={setLegal} />
                    <SellerInfoSellect arr={countryArr} title={"Country of registration"} titleSellect={"Select country"} value={country} setValue={setCountry} />
                </div>

                <InputSeller title={"Business ID"} type={"text"} circle={true} required={true} placeholder={"Trade register number"}
                // name="first_name"
                // value={formik.values.first_name}
                // onChange={formik.handleChange}
                // onBlur={formik.handleBlur}
                />

                <InputSeller title={"TIN (Tax Identification Number)"} type={"text"} circle={true} required={true} placeholder={"987654321"}
                // name="first_name"
                // value={formik.values.first_name}
                // onChange={formik.handleChange}
                // onBlur={formik.handleBlur}
                />

                <InputSeller title={"EORI"} type={"text"} circle={true}  placeholder={"If importing into EU"}
                // name="first_name"
                // value={formik.values.first_name}
                // onChange={formik.handleChange}
                // onBlur={formik.handleBlur}
                />

                 <InputSeller title={"VAT ID"} type={"text"} circle={true}  placeholder={"If registered"}
                // name="first_name"
                // value={formik.values.first_name}
                // onChange={formik.handleChange}
                // onBlur={formik.handleBlur}
                />

                <UploadInp  />

                    <InputSeller title={"Company phone"} type={"tel"} circle={true} required={true} num={true} placeholder={"Personal phone"} name="personal_phone" value={formik.values.personal_phone} onChange={formik.handleChange} onBlur={formik.handleBlur} />


            </div>


        </div>
    )
}

export default CompanyInfo