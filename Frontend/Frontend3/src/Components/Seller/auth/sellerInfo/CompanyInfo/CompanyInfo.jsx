

import { useEffect, useRef, useState } from "react"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import { useSelector } from "react-redux"

import companyIc from "../../../../../assets/Seller/register/companyIcon.svg"

import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"

import styles from "./CompanyInfo.module.scss"
import { putCompanyInfo, uploadSingleDocument } from "../../../../../api/seller/onboarding"
import { countriesArr, toISODate } from "../../../../../code/seller"

const CompanyInfo = ({ formik, onClosePreview }) => {



    const { companyData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()



    const [country, setCountry] = useState(companyData?.country_of_registration ?? null)
    const [legal, setLegal] = useState(companyData?.legal_form ?? null)

    const isCompanyFilled = (values) => {
        return Boolean(
            values.company_name &&
            values.business_id &&
            values.tin &&
            values.company_phone &&
            values.certificate_issue_date
        )
    }

    const companyRef = useRef(null)

    const onLeaveCompanyBlock = async () => {

        const filled = isCompanyFilled(formik.values)

        if (!filled) return

        const payload = {
            company_name: formik.values.company_name,
            legal_form: legal,
            country_of_registration: country,
            business_id: formik.values.business_id,
            ico: formik.values.ico,
            tin: formik.values?.tin,
            vat_id: formik.values?.vat_id,
            eori_number: formik.values?.eori_number,
            imports_to_eu: Boolean(formik.values?.eori_number),
            company_phone: formik.values?.company_phone,
            certificate_issue_date: formik.values.certificate_issue_date,
        }

        safeCompanyData(payload)



        try {
            await putCompanyInfo({
                ...payload,
                certificate_issue_date: toISODate(payload.certificate_issue_date)
            })

            onClosePreview?.();
        } catch (err) {
            ErrToast(err?.message || "Failed to save personal data");
        }


    }




    const legalArr = [
        { value: "GmbH (Germany)", text: "GmbH (Germany)" },
        { value: "Ltd (United Kingdom)", text: "Ltd (United Kingdom)" },
        { value: "S.A.R.L. (France)", text: "S.A.R.L. (France)" },
        { value: "s.r.o. (Czech Republic / Slovakia)", text: "s.r.o. (Czech Republic / Slovakia)" },
    ];



    useEffect(() => {
        if (legal !== null) {
            safeCompanyData({ legal_form: legal })
            formik.setFieldValue("legal_form", legal)
        }
    }, [legal])

    useEffect(() => {
        if (country !== null) {
            safeCompanyData({ country_of_registration: country })
            formik.setFieldValue("country_of_registration", country)
        }
    }, [country])


    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
        uploadSingleDocument({ file, doc_type, scope, side })
            .then(res => {
                formik.setFieldValue("certificate_issue_date", res.uploaded_at)
                safeCompanyData({ certificate_issue_date: res.uploaded_at })
            })
            .catch(err => {
                ErrToast(err.message)
                console.log("Ошибка загрузки", err);
            });
    };



    return (
        <div className={styles.main}
            tabIndex={-1}
            ref={companyRef}
            onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(onLeaveCompanyBlock, 0);
                }
            }}
        >

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
                    error={formik.errors.company_name}
                    touched={formik.touched.company_name}
                />


                <div className={styles.twoInpWrap}>
                    <SellerInfoSellect arr={legalArr} title={"Legal form"}
                        titleSellect={"Select legal form"}
                        value={legal} setValue={setLegal}
                        errText={"Legal form is required"}
                        style={{
                            height: "auto"
                        }}
                    />

                    <SellerInfoSellect arr={countriesArr} title={"Country of registration"}
                        titleSellect={"Select country"}
                        value={country} setValue={setCountry}
                        errText={"Country of registration is required"}
                    />
                </div>

                <InputSeller title={"Business ID"} type={"text"} circle={true} required={true} placeholder={"Trade register number"}
                    name="business_id"
                    value={formik.values.business_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.business_id}
                    touched={formik.touched.business_id}

                />

                {(country === "cz" || country === "sk") &&
                    <InputSeller title={"IČO"} type={"text"} circle={true} required={true} num={true}
                        placeholder={"123456789"}
                        name="ico"
                        value={formik.values.ico}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.ico}
                        touched={formik.touched.ico}

                    />
                }

                <InputSeller title={"TIN (Tax Identification Number)"} type={"text"} circle={true} required={true} placeholder={"987654321"}
                    name="tin"
                    value={formik.values.tin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.tin}
                    touched={formik.touched.tin}

                />

                <InputSeller title={"EORI"} type={"text"} circle={true} placeholder={"If importing into EU"}
                    name="eori_number"
                    value={formik.values.eori_number}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.eori_number}
                    touched={formik.touched.eori_number}

                />

                <InputSeller title={"VAT ID"} type={"text"} circle={true} placeholder={"If registered"}
                    name="vat_id"
                    value={formik.values.vat_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.vat_id}
                    touched={formik.touched.vat_id}

                />

                <div>
                    <UploadInp
                        title={"Registration certificate document"}
                        description={"Extract from trade register, not older than 3 months"}
                        scope={"company_info"}
                        docType={"registration_certificate"}
                        side={null}
                        onChange={handleSingleFrontUpload}
                        inpText={"Upload document"}
                        stateName={companyData?.company_file_date}
                        nameTitle={"company_file_date"}
                    />
                </div>

                <InputSeller title={"Company phone"} type={"tel"} circle={true} required={true} num={true} placeholder={"Personal phone"}
                    name="company_phone"
                    value={formik.values.company_phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.company_phone}
                    touched={formik.touched.company_phone}

                />


            </div>


        </div>
    )
}

export default CompanyInfo