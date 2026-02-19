import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import AccountInfo from "../../Components/Seller/auth/review/accountInfo/AccountInfo"
import FormWrap from "../../ui/Seller/auth/formWrap/FormWrap"
import TitleAndDesc from "../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from "../../ui/Seller/register/stepWrap/StepWrap"
import PersonalDetails from "../../Components/Seller/auth/review/personalDetails/PersonalDetails"
import BusinessAddress from "../../Components/Seller/auth/review/businessAddress/BusinessAddress"
import BankAccount from "../../Components/Seller/auth/review/bankAccount/BankAccount"
import WarehouseAndReturn from "../../Components/Seller/auth/review/WarehouseAndReturn/WarehouseAndReturn"
import SubBtn from "../../ui/Seller/review/subBtn/SubBtn"
import { getReviewOnboarding, postSubmitOnboarding } from "../../api/seller/onboarding"
import { ErrToast } from "../../ui/Toastify"

import PersonalEdit from "../../Components/Seller/auth/sellerInfo/PersonalDetails/PersonalDetails"


import styles from "./ReviewInfoPage.module.scss"
import { useFormik } from "formik"
import { validationSchemaSelf } from "../../code/seller/validation"
import TaxInfo from "../../Components/Seller/auth/sellerInfo/TaxInfo/TaxInfo"
import AddressBlock from "../../Components/Seller/auth/sellerInfo/address/AddressBlock"
import BankAccountEdit from "../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount"
import WhareHouseAddress from "../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress"
import ReturnAddress from "../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress"

const ReviewInfoPage = () => {

    const { selfData, registerData } = useSelector(state => state.selfEmploed)

    console.log(selfData);

    const formik = useFormik({
        initialValues: {

            // personal
            first_name: registerData?.first_name ?? "",
            last_name: registerData?.last_name ?? "",
            date_of_birth: selfData?.date_of_birth ?? "",
            nationality: selfData?.nationality ?? "",
            personal_phone: registerData?.phone ?? "",
            uploadFront: selfData?.uploadFront ?? "",
            uploadBack: selfData?.uploadBack ?? "",

            // tax
            tax_country: selfData?.tax_country ?? "",
            tin: selfData?.tin ?? "",
            ico: selfData?.ico ?? "",
            vat_id: selfData?.vat_id ?? "",

            // address
            street: selfData?.street ?? "",
            city: selfData?.city ?? "",
            zip_code: selfData?.zip_code ?? "",
            country: selfData?.country ?? "",
            proof_document_issue_date: selfData.proof_document_issue_date ?? "",

            // bank
            iban: selfData?.iban ?? "",
            swift_bic: selfData?.swift_bic ?? "",
            account_holder: selfData?.account_holder ?? "",
            bank_code: selfData?.bank_code ?? "",
            local_account_number: selfData?.local_account_number ?? "",

            // warehouse
            wStreet: selfData?.wStreet ?? "",
            wCity: selfData?.wCity ?? "",
            wZip_code: selfData?.wZip_code ?? "",
            wCountry: selfData?.wCountry ?? "",
            contact_phone: selfData?.contact_phone ?? "",
            wProof_document_issue_date: selfData?.wProof_document_issue_date ?? "",

            // return
            rStreet: selfData?.rStreet ?? "",
            rCity: selfData?.rCity ?? "",
            rZip_code: selfData?.rZip_code ?? "",
            rCountry: selfData?.rCountry ?? "",
            rContact_phone: selfData?.rContact_phone ?? "",
            rProof_document_issue_date: selfData?.rProof_document_issue_date ?? ""
        },
        validationSchema: validationSchemaSelf,
        // enableReinitialize: true,
        validateOnChange: true,
        // validateOnMount: false,
        // validateOnChange: false,
        // validateOnBlur: true,
        onSubmit: async (values) => {
            safeData(values);

            // массив промисов с описанием

        }
    })

    const [openAccount, setOpenAccount] = useState(false)
    const [openTax, setOpenTax] = useState(false)
    const [openAddress, setOpenAddress] = useState(false)
    const [openBank, setOpenBank] = useState(false)
    const [openWarehouse, setOpenWarehouse] = useState(false)


    const navigate = useNavigate()

    useEffect(() => {
        getReviewOnboarding()
    }, [])

    const parseApiErrors = (data) => {
        if (!data) return ["Unknown error"];

        // detail / message
        if (typeof data === "string") return [data];
        if (data.detail) return [data.detail];
        if (data.message) return [data.message];

        // field errors
        if (typeof data === "object") {
            return Object.values(data).flatMap((value) => {
                if (Array.isArray(value)) return value;
                if (typeof value === "string") return [value];
                return [];
            });
        }

        return ["Unexpected error"];
    };


    const handleSubmit = async () => {
        try {
            const res = await postSubmitOnboarding();
            console.log(res);

            navigate("/seller/application-sub")

        } catch (error) {
            const responseData = error?.response?.data;

            const messages = parseApiErrors(responseData);

            messages.forEach((msg) => ErrToast(msg));
            navigate("/seller/seller-info")
        }
    };



    return (
        <FormWrap style={{ height: "100%" }}>
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <TitleAndDesc title={"Review Your Information"}
                        desc={"Please review all information before submitting your application"} />

                    <StepWrap step={5} />

                </div>

                {
                    openAccount ?
                        <PersonalEdit onClosePreview={() => setOpenAccount(false)} formik={formik} />
                        :
                        <AccountInfo setOpen={setOpenAccount} data={selfData} />
                }

                {
                    openTax ?
                        <TaxInfo formik={formik} onClosePreview={() => setOpenTax(false)} />
                        :
                        <PersonalDetails setOpen={setOpenTax} data={selfData} />
                }

                {
                    openAddress ?
                        <AddressBlock onClosePreview={() => setOpenAddress(false)} formik={formik} />
                        :
                        <BusinessAddress setOpen={setOpenAddress} data={selfData} />

                }

                {
                    openBank ?
                        <BankAccountEdit onClosePreview={() => setOpenBank(false)} formik={formik} />
                        :
                        <BankAccount setOpen={setOpenBank} data={selfData} />
                }

                {
                    openWarehouse ?
                        <>
                            <WhareHouseAddress formik={formik} />
                            <ReturnAddress formik={formik} />
                        </>
                        :
                        <WarehouseAndReturn setOpen={setOpenWarehouse} data={selfData} />

                }








                <SubBtn onClick={handleSubmit} />

            </div>

        </FormWrap>
    )
}

export default ReviewInfoPage