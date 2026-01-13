

import { useEffect, useState } from "react"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import { useSelector } from "react-redux"

import companyIc from "../../../../../assets/Seller/register/companyIcon.svg"

import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"

import styles from "./CompanyInfo.module.scss"

const CompanyInfo = ({ formik }) => {

    const { companyData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()


    const [country, setCountry] = useState(companyData?.country_of_registration ?? null)
    const [legal, setLegal] = useState(companyData?.legal_form ?? null)


    const countryArr = [
        { text: "Czech Republic", value: "cz" },
        { text: "Germany", value: "de" },
        { text: "France", value: "fr" },
        { text: "Poland", value: "pl" },
        { text: "United Kingdom", value: "gb" }
    ];

    const legalArr = [
        { value: "GmbH (Germany)", text: "GmbH (Germany)" },
        { value: "Ltd (United Kingdom)", text: "Ltd (United Kingdom)" },
        { value: "S.A.R.L. (France)", text: "S.A.R.L. (France)" },
        { value: "s.r.o. (Czech Republic / Slovakia)", text: "s.r.o. (Czech Republic / Slovakia)" },
    ];

    useEffect(() => {
        if (legal !== null) {
            safeCompanyData({ legal_form: legal })
        }
    }, [legal])

    useEffect(() => {
        if (country !== null) {
            safeCompanyData({ country_of_registration: country })
        }
    }, [country])



    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={companyIc} alt="" />
                <h2>Company Information</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Company name"} type={"text"} circle={true} required={true} placeholder={"Official registered company name"}
                    name="company_name"
                    value={formik.values.company_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                />


                <div className={styles.twoInpWrap}>
                    <SellerInfoSellect arr={legalArr} title={"Legal form"} titleSellect={"Select legal form"} value={legal} setValue={setLegal} />
                    <SellerInfoSellect arr={countryArr} title={"Country of registration"} titleSellect={"Select country"} value={country} setValue={setCountry} />
                </div>

                <InputSeller title={"Business ID"} type={"text"} circle={true} required={true} placeholder={"Trade register number"}
                    name="business_id"
                    value={formik.values.business_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                />

                <InputSeller title={"TIN (Tax Identification Number)"} type={"text"} circle={true} required={true} placeholder={"987654321"}
                    name="tin"
                    value={formik.values.tin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                />

                <InputSeller title={"EORI"} type={"text"} circle={true} placeholder={"If importing into EU"}
                    name="eori_number"
                    value={formik.values.eori_number}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                />

                <InputSeller title={"VAT ID"} type={"text"} circle={true} placeholder={"If registered"}
                    name="vat_id"
                    value={formik.values.vat_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                />

                <UploadInp />

                <InputSeller title={"Company phone"} type={"tel"} circle={true} required={true} num={true} placeholder={"Personal phone"}
                    name="company_phone"
                    value={formik.values.company_phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur} />


            </div>


        </div>
    )
}

export default CompanyInfo