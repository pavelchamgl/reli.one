
import {  useRef } from "react"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

import addressIc from "../../../../../assets/Seller/register/addressIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import { putSelfAddress, uploadSingleDocument } from "../../../../../api/seller/onboarding"
import { countriesArr, toISODate } from "../../../../../code/seller"

import styles from "./Address.module.scss"

const AddressBlock = ({ formik, onClosePreview }) => {

    const { selfData } = useSelector(state => state.selfEmploed)

    const { safeData } = useActionSafeEmploed()


    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
        uploadSingleDocument({ file, doc_type, scope, side })
            .then(res => {
                formik.setFieldValue("proof_document_issue_date", res.uploaded_at)
                // safeData({ proof_document_issue_date: res.uploaded_at })
            })
            .catch(err => {
                ErrToast(err.message)
                console.log("Ошибка загрузки", err);
            });
    };

    const isAddressFilled = (values) => {
        return Boolean(
            values.street,
            values.city,
            values.zip_code,
            values.country
        )
    }

    const addressRef = useRef(null)

    const { pathname } = useLocation()


    const onLeaveAddressBlock = async () => {

        const filled = isAddressFilled(formik.values)

        if (!filled) return

        const payload = {
            street: formik.values.street,
            city: formik.values.city,
            zip_code: formik.values.zip_code,
            country: formik.values.country,
            proof_document_issue_date: toISODate(formik.values.proof_document_issue_date)
        }

        if (pathname === '/seller/seller-review') {
            safeData(payload)
        }


        try {
            await putSelfAddress(payload)

            onClosePreview?.();
        } catch (err) {
            // ErrToast(err?.message || "Failed to save personal data");
        }
    }

    const ignoreBlurRef = useRef(false);

    const { t } = useTranslation('onbording')

    return (
        <div className={styles.main}
            ref={addressRef}
            tabIndex={-1}
            onBlurCapture={(e) => {
                if (ignoreBlurRef.current) {
                    ignoreBlurRef.current = false;
                    return;
                }
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(onLeaveAddressBlock, 0);
                }
            }}
        >
            <div className={styles.titleWrap}>
                <img src={addressIc} alt="" />
                <h2>{t('onboard.tax_address.address')}</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller
                    title={t('onboard.tax_address.street')}
                    type={"text"} circle={true} required={true}
                    placeholder={"Main street 123"}
                    name="street" value={formik.values.street}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.street}
                    touched={formik.touched.street}
                />

                <div className={styles.twoInpWrap}>
                    <InputSeller
                        title={t('onboard.tax_address.city')}
                        type={"text"} circle={true} required={true}
                        placeholder={"Prague"}
                        name="city" value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.city}
                        touched={formik.touched.city}
                    />

                    <InputSeller
                        title={t('onboard.tax_address.zip')}
                        type={"text"} circle={true} required={true}
                        placeholder={"11000"} num={true}
                        name="zip_code" value={formik.values.zip_code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.zip_code}
                        touched={formik.touched.zip_code}
                    />

                    <SellerInfoSellect
                        arr={countriesArr}
                        value={formik.values.country}
                        setValue={(v) => formik.setFieldValue('country', v)}
                        title={t('onboard.tax_address.country')}
                        titleSellect={t('onboard.common.select')}
                        errText={t('onboard.tax_address.country_required')}
                    />
                </div>

                <div>
                    <UploadInp
                        title={t('onboard.tax_address.proof_address')}
                        description={t('onboard.tax_address.proof_desc')}
                        side={null}
                        docType={"proof_of_address"}
                        inpText={t('onboard.tax_address.upload_doc')}
                        scope={"self_employed_address"}
                        onChange={handleSingleFrontUpload}
                        stateName={selfData?.self_address_name}
                        nameTitle={"self_address_name"}
                        onMouseDown={() => (ignoreBlurRef.current = true)}
                    />
                    {formik.errors.proof_document_issue_date &&
                        <p className={styles.errorText}>{t('onboard.tax_address.upload_required')}</p>
                    }
                </div>
            </div>
        </div>
    )
}

export default AddressBlock