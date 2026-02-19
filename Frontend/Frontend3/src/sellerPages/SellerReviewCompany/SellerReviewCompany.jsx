import { useSelector } from "react-redux"

import WarehouseAndReturn from "../../Components/Seller/auth/review/WarehouseAndReturn/WarehouseAndReturn"
import FormWrap from "../../ui/Seller/auth/formWrap/FormWrap"
import TitleAndDesc from "../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from "../../ui/Seller/register/stepWrap/StepWrap"
import SubBtn from "../../ui/Seller/review/subBtn/SubBtn"

import styles from "./SellerReviewCompany.module.scss"
import BankAccount from "../../Components/Seller/auth/review/bankAccount/BankAccount"
import AccountInfo from "../../Components/Seller/auth/review/accountInfo/AccountInfo"
import BusinessAddress from "../../Components/Seller/auth/review/businessAddress/BusinessAddress"
import CompanyInfo from "../../Components/Seller/auth/review/companyInfo/CompanyInfo"
import { getReviewOnboarding, postSubmitOnboarding } from "../../api/seller/onboarding"
import { useEffect, useState } from "react"
import { ErrToast } from "../../ui/Toastify"
import { useNavigate } from "react-router-dom"
import { useActionSafeEmploed } from "../../hook/useActionSafeEmploed"
import { useFormik } from "formik"
import { companyValidationSchema } from "../../code/seller/validation"
import Representative from "../../Components/Seller/auth/sellerInfo/Representative/Representative"
import CompanyInfoEdit from '../../Components/Seller/auth/sellerInfo/CompanyInfo/CompanyInfo';
import BankAccountEdit from "../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount"
import CompanyAddress from "../../Components/Seller/auth/sellerInfo/CompanyAddress/CompanyAddress"
import WhareHouseAddress from "../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress"
import ReturnAddress from "../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress"

const SellerReviewCompany = () => {

    const { companyData, registerData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()

    console.log(companyData);



    const complitnessArr = {
        documents_complete: "Documents"
    }

    const formik = useFormik({
        initialValues: {
            // company info
            company_name: companyData?.company_name ?? "",
            legal_form: companyData?.legal_form ?? "",
            country_of_registration: companyData?.country_of_registration ?? "",          // Чехия (Czech Republic)
            business_id: companyData?.business_id ?? "",     // IČO (8-значный номер компании)
            ico: companyData?.ico ?? "",             // То же самое, что и business_id (IČO)
            tin: companyData?.tin ?? "",             // Daňové identifikační číslo (DIČ) без префикса
            vat_id: companyData?.vat_id ?? "",          // DIČ с префиксом → CZ + 8-10 цифр
            eori_number: companyData?.eori_number ?? "",     // Только если реально есть (CZ + IČО обычно)
            company_phone: companyData?.company_phone ?? "",
            imports_to_eu: true,
            certificate_issue_date: companyData?.certificate_issue_date ?? "",   // ← выглядит нормально, если это дата выдачи сертификата

            // representative
            first_name: registerData?.first_name ?? "",
            last_name: registerData?.last_name ?? "",
            role: companyData?.role ?? "",
            date_of_birth: companyData?.date_of_birth ?? "",
            nationality: companyData?.nationality ?? "",
            uploadFront: companyData?.uploadFront ?? "",
            uploadBack: companyData?.uploadBack ?? "",


            // company address
            street: companyData?.street ?? "",
            city: companyData?.city ?? "",
            zip_code: companyData?.zip_code ?? "",
            country: companyData?.country ?? "",
            proof_document_issue_date: companyData?.proof_document_issue_date ?? "",


            // bank
            iban: companyData?.iban ?? "",
            swift_bic: companyData?.swift_bic ?? "",
            account_holder: companyData?.account_holder ?? "",
            bank_code: companyData?.bank_code ?? "",
            local_account_number: companyData?.local_account_number ?? "",

            // warehouse
            wStreet: companyData?.wStreet ?? "",
            wCity: companyData?.wCity ?? "",
            wZip_code: companyData?.wZip_code ?? "",
            wCountry: companyData?.wCountry ?? "",
            contact_phone: companyData?.contact_phone ?? "",
            wProof_document_issue_date: companyData?.wProof_document_issue_date ?? "",

            // return
            rStreet: companyData?.rStreet ?? "",
            rCity: companyData?.rCity ?? "",
            rZip_code: companyData?.rZip_code ?? "",
            rCountry: companyData?.rCountry ?? "",
            rContact_phone: companyData?.rContact_phone ?? "",
            rProof_document_issue_date: companyData?.rProof_document_issue_date ?? ""

        },
        validationSchema: companyValidationSchema,
        // validateOnMount: false,
        validateOnChange: true,
        // validateOnBlur: true,
        onSubmit: async (values) => {
            safeCompanyData({
                ...values
            });


        }

    })

    const [openCompanyInfo, setOpenCompanyInfo] = useState(false)
    const [openRepresen, setOpenRepresen] = useState(false)
    const [openAddress, setOpenAddress] = useState(false)
    const [openBank, setOpenBank] = useState(false)
    const [openWarehouse, setOpenWarehouse] = useState(false)


    useEffect(() => {
        getReviewOnboarding()
    }, [])

    const navigate = useNavigate()

    const parseApiErrors = (data) => {
        if (!data) return ["Unknown error"];

        if (data.completeness) {
            const incomplete = Object.entries(data.completeness)
                .filter(([_, v]) => v !== "True")
                .map(([k]) => complitnessArr[k] ?? k);

            if (incomplete.length) {
                return [`Please complete: ${incomplete.join(", ")}`];
            }
        }

        if (typeof data === "string") return [data];
        if (data.detail) return [data.detail];
        if (data.message) return [data.message];

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
            const res = await postSubmitOnboarding()
            console.log(res);

            navigate("/seller/application-sub")

        } catch (error) {
            console.log(error);

            const responseData = error?.response?.data;

            const messages = parseApiErrors(responseData);

            console.log(messages);


            messages.forEach((msg) => ErrToast(msg));
            navigate("/seller/seller-company")

        }
    }

    return (
        <FormWrap style={{ height: "100%" }}>
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <TitleAndDesc title={"Review Your Information"}
                        desc={"Please review all information before submitting your application"} />

                    <StepWrap step={5} />

                </div>

                {
                    openRepresen ?
                        <Representative onClosePreview={() => setOpenRepresen(false)} formik={formik} />
                        :
                        <AccountInfo setOpen={setOpenRepresen} isCompany={true} data={companyData} type={"company"} />
                }

                {
                    openCompanyInfo ?
                        <CompanyInfoEdit onClosePreview={() => setOpenCompanyInfo(false)} formik={formik} />
                        :
                        <CompanyInfo setOpen={setOpenCompanyInfo} data={companyData} />
                }

                {
                    openAddress ?
                        <CompanyAddress onClosePreview={() => setOpenAddress(false)} formik={formik} />
                        :
                        <BusinessAddress setOpen={setOpenAddress} data={companyData} />
                }


                {
                    openBank ?
                        <BankAccountEdit onClosePreview={() => setOpenBank(false)} formik={formik} />
                        :

                        <BankAccount setOpen={setOpenBank} data={companyData} />
                }

                {
                    openWarehouse ?
                        <>
                            <WhareHouseAddress formik={formik} />
                            <ReturnAddress formik={formik} />
                        </>
                        :
                        <WarehouseAndReturn setOpen={setOpenWarehouse} data={companyData} />
                }

                <SubBtn onClick={handleSubmit} />

            </div>

        </FormWrap>
    )
}

export default SellerReviewCompany