
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import returnAddress from "../../../../../assets/Seller/register/returnAddress.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import Checkbox from "../../../../../ui/Seller/newOrder/checkbox/Checkbox"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import { putReturnAddress, uploadSingleDocument } from "../../../../../api/seller/onboarding"
import { countriesArr, toISODate } from "../../../../../code/seller"

import styles from "./ReturnAddress.module.scss"
import UploadInp from "../uploadInp/UploadInp"

const ReturnAddress = ({ formik }) => {

    const isLinked = formik.values.same_as_warehouse
    const handleSameAsWarehouse = (checked) => {
        formik.setFieldValue('same_as_warehouse', checked)

        if (!checked) {
            formik.setFieldValue("rStreet", "")
            formik.setFieldValue("rCity", "")
            formik.setFieldValue("rZip_code", "")
            formik.setFieldValue("rCountry", null)
            formik.setFieldValue("rContact_phone", "")
            formik.setFieldValue("rProof_document_issue_date", "")
        } else {
            formik.setFieldValue("rStreet", formik.values?.wStreet ?? "")
            formik.setFieldValue("rCity", formik.values?.wCity ?? "")
            formik.setFieldValue("rZip_code", formik.values?.wZip_code ?? "")
            formik.setFieldValue("rCountry", formik.values?.wCountry ?? null)
            formik.setFieldValue("rContact_phone", formik.values?.contact_phone ?? "")

        }
        setTimeout(() => {
            formik.validateForm()
        }, 0)
    }

    const isReturnFilled = (values) => {
        return Boolean(
            values.rStreet &&
            values.rCity &&
            values.rZip_code &&
            values.rCountry &&
            values.rContact_phone
        )
    }
    const [uploadStatus, setUploadStatus] = useState("")


    const rAddressRef = useRef(null)

    const { t } = useTranslation('onbording')


    const onLeaveReturnBlock = () => {

        const filled = isReturnFilled(formik.values)

        if (!filled) return

        const payload = {
            same_as_warehouse: formik.values.same_as_warehouse,
            street: formik.values.rStreet,
            city: formik.values.rCity,
            zip_code: formik.values.rZip_code,
            country: formik.values.rCountry,
            contact_phone: formik.values.rContact_phone,
            proof_document_issue_date: toISODate(formik.values.rProof_document_issue_date)
            
        }
        console.log(formik.values.rProof_document_issue_date)

        putReturnAddress(payload)
    }
    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
                console.log("UPLOAD SCOPE:", scope)   // 👈 ВОТ ЭТО

        uploadSingleDocument({ file, doc_type, scope, side })   
            .then(res => {
                formik.setFieldValue("rProof_document_issue_date", res.uploaded_at)
                setUploadStatus('full')
            })
            .catch(err => {
                setUploadStatus('rej')
                ErrToast(err.message)
                console.log("Ошибка загрузки", err);
            });
    };


    return (
        <div className={styles.main}
            tabIndex={-1}
            ref={rAddressRef}
            onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(onLeaveReturnBlock, 0);
                }
            }}
        >
            <div className={styles.titleWrap}>
                <img src={returnAddress} alt="" />
                <h2>{t('onboard.return.title')}</h2>
            </div>

            <label className={styles.checkWrap}>
                <Checkbox
                    checked={formik.values.same_as_warehouse}
                    onChange={(e) => handleSameAsWarehouse(e.target.checked)}
                />
                <p>{t('onboard.return.same_as_warehouse')}</p>
            </label>

            <div className={styles.inpWrapMain}>
                <InputSeller
                    title={t('onboard.tax_address.street')}
                    type={"text"} circle={true} required={true}
                    placeholder={"Industrial Street 456"}
                    name="rStreet" value={formik.values.rStreet}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.rStreet}
                    touched={formik.touched.rStreet}
                />

                <div className={styles.twoInpWrap}>
                    <InputSeller
                        title={t('onboard.tax_address.city')}
                        type={"text"} circle={true} required={true}
                        placeholder={"Brno"}
                        name="rCity" value={formik.values.rCity}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.rCity}
                        touched={formik.touched.rCity}
                    />
                    <InputSeller
                        title={t('onboard.tax_address.zip')}
                        type={"text"} circle={true} required={true}
                        placeholder={"602 00"}
                        name="rZip_code" value={formik.values.rZip_code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.rZip_code}
                        num={true}
                        touched={formik.touched.rZip_code}
                    />
                    <SellerInfoSellect
                        arr={countriesArr}
                        value={formik.values?.rCountry}
                        setValue={(v) => formik.setFieldValue("rCountry", v)}
                        title={t('onboard.tax_address.country')}
                        titleSellect={t('onboard.common.select')}
                        errText={t('onboard.tax_address.country_required')}
                    />
                </div>

                <InputSeller
                    title={t('onboard.warehouse.contact_phone')}
                    type={"tel"} circle={true} required={true}
                    placeholder={"+420 987 654 321"}
                    name="rContact_phone" value={formik.values.rContact_phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.rContact_phone}
                    num={true}
                    touched={formik.touched.rContact_phone}
                />
                {!isLinked && (
                    <UploadInp
                        title={t('onboard.tax_address.proof_address')}
                        description={t('onboard.tax_address.proof_desc')}
                        side={null}
                        docType={"proof_of_address"}
                        scope={"return_address"}
                        onChange={handleSingleFrontUpload}
                        inpText={t('onboard.tax_address.upload_doc')}
                        stateName={formik.values.rProof_document_name}
                        nameTitle={"return_address"}
                        // onMouseDown={() => (ignoreBlurRef.current = true)}
                        uploadStatus={uploadStatus}
                    />
                )}
            </div>
        </div>
    )
}

export default ReturnAddress