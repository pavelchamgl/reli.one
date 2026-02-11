import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"

import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import companyAddressIc from "../../../../../assets/Seller/register/companyAddress.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"

import styles from "./CompanyAddress.module.scss"
import { putCompanyAddress, uploadSingleDocument } from "../../../../../api/seller/onboarding"
import { toISODate } from "../../../../../code/seller"

const CompanyAddress = ({ formik }) => {

    const { companyData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()

    const [country, setCountry] = useState(companyData?.country ?? null)

    const isCompanyAddressFilled = (values) => {
        return Boolean(
            values.street,
            values.city,
            values.zip_code,
            country,
            values.proof_document_issue_date
        )
    }

    const companyAddressRef = useRef(null)

    const onLeaveCompanyAddressBlock = () => {

        const filled = isCompanyAddressFilled(formik.values)



        if (!filled) return

        const payload = {
            street: formik.values.street,
            city: formik.values.city,
            zip_code: formik.values.zip_code,
            country: country,
            proof_document_issue_date: formik.values.proof_document_issue_date
        }


        safeCompanyData(payload)



        putCompanyAddress({
            ...payload,
            proof_document_issue_date: toISODate(payload.proof_document_issue_date)
        })


    }

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
            formik.setFieldValue("country", country)
        }
    }, [country])

    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
        uploadSingleDocument({ file, doc_type, scope, side })
            .then(res => {

                formik.setFieldValue("proof_document_issue_date", res.uploaded_at)

                safeCompanyData({ proof_document_issue_date: res.uploaded_at })

            })
            .catch(err => {
                ErrToast(err.message)
                console.log("Ошибка загрузки", err);
            });
    };

    return (
        <div className={styles.main}
            ref={companyAddressRef}
            tabIndex={-1}
            onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {

                    setTimeout(onLeaveCompanyAddressBlock, 0);
                }

            }}
        >

            <div className={styles.titleWrap}>
                <img src={companyAddressIc} alt="" />
                <h2>Company Address</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Street"} type={"text"} circle={true} required={true} placeholder={"Industrial Street 456"}
                    name="street"
                    value={formik.values.street}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.street}
                />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"City"} type={"text"} circle={true} required={true} placeholder={"Brno"}
                        name="city"
                        value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.city}
                    />


                    <InputSeller title={"ZIP"} type={"text"} circle={true} required={true} placeholder={"602 00"}
                        name="zip_code"
                        value={formik.values.zip_code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.zip_code}
                    />
                    <SellerInfoSellect arr={countryArr}
                        value={country} setValue={setCountry}
                        title={"Country"} titleSellect={"Select"}
                        errText={"Country is required"}
                    />
                </div>
                <div>
                    <UploadInp
                        title={"Proof of address"}
                        description={"Not older than 3 months"}
                        scope={"company_address"}
                        docType={"proof_of_address"}
                        side={null}
                        onChange={handleSingleFrontUpload}
                        inpText={"Upload document"}
                        stateName={companyData?.company_address_name}
                        nameTitle={"company_address_name"}
                    />
                    {formik.errors.proof_document_issue_date &&
                        <p className={styles.errorText}>{formik.errors.proof_document_issue_date}</p>}
                </div>
            </div>
        </div>
    )
}

export default CompanyAddress