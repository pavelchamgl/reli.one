import { useFormik } from "formik"

import AddressBlock from "../../Components/Seller/auth/sellerInfo/address/AddressBlock"
import BankAccount from "../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount"
import PersonalDetails from "../../Components/Seller/auth/sellerInfo/PersonalDetails/PersonalDetails"
import ReturnAddress from "../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress"
import TaxInfo from "../../Components/Seller/auth/sellerInfo/TaxInfo/TaxInfo"
import WhareHouseAddress from "../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress"
import AuthBtnSeller from "../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import FormWrap from "../../ui/Seller/auth/formWrap/FormWrap"
import TitleAndDesc from "../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from "../../ui/Seller/register/stepWrap/StepWrap"
import { useActionSafeEmploed } from "../../hook/useActionSafeEmploed"

import styles from "./SellerInformation.module.scss"
import { putOnboardingData, putPersonalData } from "../../api/seller/onboarding"

const SellerInformation = () => {

    const { safeData } = useActionSafeEmploed()

    const formik = useFormik({
        initialValues: {
            // personal
            first_name: "",
            last_name: "",
            date_of_birth: "",
            nationality: "",
            personal_phone: "",
            // tax
            tax_country: "",
            tin: "",
            ico: "",
            vat_id: "",
            // address
            street: "",
            city: "",
            zip_code: "",
            country: "",
            proof_document_issue_date: "",

            // bank
            iban: "",
            swift_bic: "",
            account_holder: "",
            bank_code: "",
            local_account_number: "",

            // warehouse
            wStreet: "",
            wCity: "",
            wZip_code: "",
            wCountry: "",
            contact_phone: "",
            proof_document_issue_date: "",

            // return
            rStreet: "",
            rCity: "",
            rZip_code: "",
            rCountry: "",
            rContact_phone: "",
            rProof_document_issue_date: ""
        },
        onSubmit: (values) => {
            console.log(values);
            safeData(values)

            putPersonalData({
                date_of_birth: values.date_of_birth.replace(/\./g, "-"),
                nationality: "cz",
                personal_phone: values.personal_phone
            })

            putOnboardingData({
                iban: values.iban,
                swift_bic: values.swift_bic,
                account_holder: values.account_holder,
                bank_code: values.bank_code,
                local_account_number: values.local_account_number
            })
        }
    })

    return (
        <FormWrap style={{ height: "100%" }}>
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <TitleAndDesc title={"Seller Information"}
                        desc={"Please provide all required information for verification"} />

                    <StepWrap step={4} />

                </div>

                <PersonalDetails formik={formik} />

                <TaxInfo formik={formik} />

                <AddressBlock formik={formik} />

                <BankAccount formik={formik} />

                <WhareHouseAddress formik={formik} />

                <ReturnAddress formik={formik} />

                <AuthBtnSeller text={"Continue to Review"} style={{ borderRadius: "16px", width: "222px" }} handleClick={formik.handleSubmit} />

            </div>

        </FormWrap>
    )
}

export default SellerInformation