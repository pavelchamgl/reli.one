
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"

import representativeIc from "../../../../../assets/Seller/register/representativeIc.svg"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"

import styles from "./Representative.module.scss"
import SellerDateInp from "../dateInp/DateInp"
import { uploadSingleDocument } from "../../../../../api/seller/onboarding"

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
            formik.setFieldValue("role", role)
        }
    }, [role])

    useEffect(() => {
        if (nationality !== null) {
            safeCompanyData({ nationality: nationality })
            formik.setFieldValue("nationality", nationality)
        }
    }, [nationality])


    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
        uploadSingleDocument({ file, doc_type, scope, side })
            .then(res => {
                console.log("Документ загружен", res);

                if (side === "front") {
                    formik.setFieldValue("uploadFront", res.uploaded_at)

                }
                if (side === "back") {
                    formik.setFieldValue("uploadBack", res.uploaded_at)

                }
            })
            .catch(err => {
                ErrToast(err.message)
                console.log("Ошибка загрузки", err);
            });
    };

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
                        error={formik.errors.first_name}
                    />
                    <InputSeller title={"Last name"} type={"text"} circle={true} required={true} placeholder={"Smith"}
                        name="last_name"
                        value={formik.values.last_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.last_name}
                    />
                </div>

                <SellerInfoSellect arr={roleArr} title={"Role"}
                    titleSellect={"Select role"}
                    value={role} setValue={setRole}
                    errText={"Role is required"}
                />

                <div className={styles.twoInpWrap}>
                    <SellerDateInp formik={formik} />
                    <SellerInfoSellect arr={nationalArr} title={"Nationality"}
                        titleSellect={"Select nationality"}
                        value={nationality} setValue={setNationality}
                        errText={"Nationality is required"}
                    />
                </div>


                <div>
                    <UploadInp
                        title={"Identity document"}
                        description={"Passport or National ID"}
                        scope={"company_representative"}
                        docType={"identity_document"}
                        side={"front"}
                        onChange={handleSingleFrontUpload}
                        inpText={"Upload front side"}
                    />
                    <UploadInp
                        scope={"company_representative"}
                        docType={"identity_document"}
                        side={"back"}
                        onChange={handleSingleFrontUpload}
                        inpText={"Upload back side"}
                    />
                    {
                        (formik.errors.uploadFront || formik.errors.uploadBack) && (
                            <p className={styles.errorText}>
                                {formik.errors.uploadFront || formik.errors.uploadBack}
                            </p>
                        )}

                </div>




            </div>


        </div>
    )
}

export default Representative