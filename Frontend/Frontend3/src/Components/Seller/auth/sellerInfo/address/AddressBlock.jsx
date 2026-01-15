
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import addressIc from "../../../../../assets/Seller/register/addressIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"

import styles from "./Address.module.scss"
import { uploadSingleDocument } from "../../../../../api/seller/onboarding"

const AddressBlock = ({ formik }) => {

    const { selfData } = useSelector(state => state.selfEmploed)


    const [country, setCountry] = useState(formik.values.address_country ?? null)

    const countryArr = [
        { text: "Czech Republic", value: "cz" },
        { text: "Germany", value: "de" },
        { text: "France", value: "fr" },
        { text: "Poland", value: "pl" },
        { text: "United Kingdom", value: "gb" }
    ]

    const { safeData } = useActionSafeEmploed()

    useEffect(() => {
        safeData({ address_country: country })
        formik.setFieldValue("address_country", country)
    }, [country])

    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
        uploadSingleDocument({ file, doc_type, scope, side })
            .then(res => {
                console.log("Документ загружен", res);

                formik.setFieldValue("proof_document_issue_date", res.uploaded_at)

            })
            .catch(err => {
                ErrToast(err.message)
                console.log("Ошибка загрузки", err);
            });
    };


    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={addressIc} alt="" />
                <h2>Address</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Street"} type={"text"} circle={true} required={true}
                    placeholder={"Main street 123"}
                    name="street" value={formik.values.street}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.street}
                />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"City"} type={"text"} circle={true} required={true}
                        placeholder={"Prague"}
                        name="city" value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.city}
                    />

                    <InputSeller title={"ZIP"} type={"text"} circle={true} required={true}
                        placeholder={"11000"} num={true}
                        name="zip_code" value={formik.values.zip_code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.zip_code}
                    />

                    <SellerInfoSellect arr={countryArr} value={country}
                        setValue={setCountry} title={"Country"}
                        titleSellect={"Select"}
                        errText={"Country is required"}
                    />
                </div>

                <div>
                    <UploadInp
                        title={"Proof of address"}
                        description={"Not older than 3 months (utility bill, bank statement, etc.)"}
                        side={null}
                        docType={"proof_of_address"}
                        inpText={"Upload document"}
                        scope={"self_employed_address"}
                        onChange={handleSingleFrontUpload}
                    />
                    {formik.errors.proof_document_issue_date && <p className={styles.errorText}>Upload document is required</p>}
                </div>





            </div>


        </div>
    )
}

export default AddressBlock