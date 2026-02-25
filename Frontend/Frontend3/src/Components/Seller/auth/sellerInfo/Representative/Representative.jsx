
import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"

import representativeIc from "../../../../../assets/Seller/register/representativeIc.svg"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"

import styles from "./Representative.module.scss"
import SellerDateInp from "../dateInp/DateInp"
import { putRepresentative, uploadSingleDocument } from "../../../../../api/seller/onboarding"
import { countriesArr } from "../../../../../code/seller"
import { ErrToast } from "../../../../../ui/Toastify"

const Representative = ({ formik, onClosePreview }) => {

    const { companyData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData, setRegisterData } = useActionSafeEmploed()

    const [role, setRole] = useState(companyData?.role ?? null)
    const [nationality, setNationality] = useState(companyData?.nationality ?? null)

    const isRepresentativeFilled = (values) => {
        return Boolean(
            values.first_name &&
            values.last_name &&
            values.date_of_birth
        )
    }

    const representativeRef = useRef(null)

    const onLeavePersonalBlock = async () => {

        const filled = isRepresentativeFilled(formik.values)



        if (!filled) return

        const payload = {
            first_name: formik.values.first_name,
            last_name: formik.values.last_name,
            role: role,
            date_of_birth: formik.values.date_of_birth,
            nationality: nationality
        }


        safeCompanyData(payload)

        setRegisterData({
            first_name: payload.first_name,
            last_name: payload.last_name,
        })




        try {
            await putRepresentative({
                ...payload,
                date_of_birth: payload.date_of_birth?.split(".")?.reverse()?.join("-")
            })

            onClosePreview?.();
        } catch (err) {
            ErrToast(err?.message || "Failed to save personal data");
        }

    }



    const roleArr = [
        { text: "Owner", value: "Owner" },
        { text: "Director", value: "Director" },
        { text: "Managing Director", value: "Managing Director" },
        { text: "CEO", value: "CEO" },
        { text: "Authorized Signatory", value: "Authorized Signatory" },
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

                if (side === "front") {
                    formik.setFieldValue("uploadFront", res.uploaded_at)
                    safeCompanyData({ uploadFront: res.uploaded_at })
                }
                if (side === "back") {
                    formik.setFieldValue("uploadBack", res.uploaded_at)
                    safeCompanyData({ uploadBack: res.uploaded_at })
                }
            })
            .catch(err => {
                ErrToast(err.message)
                console.log("Ошибка загрузки", err);
            });
    };

    const ignoreBlurRef = useRef(false);


    return (
        <div className={styles.main}
            ref={representativeRef}
            tabIndex={-1}
            onBlurCapture={(e) => {

                if (ignoreBlurRef.current) {
                    ignoreBlurRef.current = false;
                    return;
                }

                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(onLeavePersonalBlock, 0);
                }
            }}
        >

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
                        touched={formik.touched.first_name}

                    />
                    <InputSeller title={"Last name"} type={"text"} circle={true} required={true} placeholder={"Smith"}
                        name="last_name"
                        value={formik.values.last_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.last_name}
                        touched={formik.touched.last_name}

                    />
                </div>

                <SellerInfoSellect arr={roleArr} title={"Role"}
                    titleSellect={"Select role"}
                    value={role} setValue={setRole}
                    errText={"Role is required"}
                />

                <div className={styles.twoInpWrap}>
                    <SellerDateInp formik={formik} />
                    <SellerInfoSellect arr={countriesArr} title={"Nationality"}
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
                        stateName={companyData?.front}
                        nameTitle={"front"}
                        onMouseDown={() => (ignoreBlurRef.current = true)}

                    />
                    <UploadInp
                        scope={"company_representative"}
                        docType={"identity_document"}
                        side={"back"}
                        onChange={handleSingleFrontUpload}
                        inpText={"Upload back side"}
                        stateName={companyData?.back}
                        nameTitle={"back"}
                        onMouseDown={() => (ignoreBlurRef.current = true)}

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