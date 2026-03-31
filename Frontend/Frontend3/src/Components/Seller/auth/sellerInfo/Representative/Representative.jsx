
import { useRef } from "react"
import { useSelector } from "react-redux"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

import representativeIc from "../../../../../assets/Seller/register/representativeIc.svg"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerDateInp from "../dateInp/DateInp"
import { putRepresentative, uploadSingleDocument } from "../../../../../api/seller/onboarding"
import { countriesArr } from "../../../../../code/seller"
import { ErrToast } from "../../../../../ui/Toastify"

import styles from "./Representative.module.scss"

const Representative = ({ formik, onClosePreview }) => {

    const { companyData } = useSelector(state => state.selfEmploed)

    const { safeCompanyData } = useActionSafeEmploed()

    const isRepresentativeFilled = (values) => {
        return Boolean(
            values.first_name &&
            values.last_name &&
            values.date_of_birth
        )
    }

    const representativeRef = useRef(null)

    const { t } = useTranslation('onbording')

    const { pathname } = useLocation()

    const onLeavePersonalBlock = async () => {

        const filled = isRepresentativeFilled(formik.values)
        if (!filled) return

        const payload = {
            first_name: formik.values.first_name,
            last_name: formik.values.last_name,
            role: formik.values.role,
            date_of_birth: formik.values.date_of_birth,
            nationality: formik.values.nationality
        }

        if (pathname === '/seller/seller-review-company') {
            safeCompanyData(payload)
        }

        localStorage.setItem('first_name', JSON.stringify(payload.first_name))
        localStorage.setItem('last_name', JSON.stringify(payload.last_name))

        try {
            await putRepresentative({
                ...payload,
                date_of_birth: payload.date_of_birth?.split(".")?.reverse()?.join("-")
            })

            onClosePreview?.();
        } catch (err) {
            // ErrToast(err?.message || "Failed to save personal data");
        }

    }



    const roleArr = [
        { text: t('onboard.representative.role_owner'), value: "Owner" },
        { text: t('onboard.representative.role_director'), value: "Director" },
        { text: t('onboard.representative.role_managing'), value: "Managing Director" },
        { text: t('onboard.representative.role_ceo'), value: "CEO" },
        { text: t('onboard.representative.role_signatory'), value: "Authorized Signatory" },
    ];


    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
        uploadSingleDocument({ file, doc_type, scope, side })
            .then(res => {

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
                <h2>{t('onboard.representative.title')}</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <div className={styles.twoInpWrap}>
                    <InputSeller
                        title={t('onboard.reg.first_name')}
                        type={"text"} circle={true} required={true} placeholder={"Jane"}
                        name="first_name"
                        value={formik.values.first_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.first_name}
                        touched={formik.touched.first_name}
                    />
                    <InputSeller
                        title={t('onboard.reg.last_name')}
                        type={"text"} circle={true} required={true} placeholder={"Smith"}
                        name="last_name"
                        value={formik.values.last_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.last_name}
                        touched={formik.touched.last_name}
                    />
                </div>

                <SellerInfoSellect
                    arr={roleArr}
                    title={t('onboard.review.role')}
                    titleSellect={t('onboard.representative.select_role')}
                    value={formik.values.role}
                    setValue={(v) => formik.setFieldValue('role', v)}
                    errText={t('onboard.representative.role_required')}
                />

                <div className={styles.twoInpWrap}>
                    <SellerDateInp formik={formik} />
                    <SellerInfoSellect
                        arr={countriesArr}
                        title={t('onboard.seller_info.nationality')}
                        titleSellect={t('onboard.representative.select_nat')}
                        value={formik.values.nationality}
                        setValue={(v) => formik.setFieldValue('nationality', v)}
                        errText={t('onboard.representative.nat_required')}
                    />
                </div>

                <div>
                    <UploadInp
                        title={t('onboard.review.identity_doc')}
                        description={t('onboard.representative.doc_desc')}
                        scope={"company_representative"}
                        docType={"identity_document"}
                        side={"front"}
                        onChange={handleSingleFrontUpload}
                        inpText={t('onboard.representative.upload_front')}
                        stateName={companyData?.front}
                        nameTitle={"front"}
                        onMouseDown={() => (ignoreBlurRef.current = true)}
                    />
                    <UploadInp
                        scope={"company_representative"}
                        docType={"identity_document"}
                        side={"back"}
                        onChange={handleSingleFrontUpload}
                        inpText={t('onboard.representative.upload_back')}
                        stateName={companyData?.back}
                        nameTitle={"back"}
                        onMouseDown={() => (ignoreBlurRef.current = true)}
                    />
                    {(formik.errors.uploadFront || formik.errors.uploadBack) && (
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