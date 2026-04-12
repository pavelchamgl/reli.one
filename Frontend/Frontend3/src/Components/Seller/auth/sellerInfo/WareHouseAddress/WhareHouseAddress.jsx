
import { useRef } from "react"
import { useState } from "react"
import { useSelector } from "react-redux"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"

import warehouseIc from "../../../../../assets/Seller/register/warehouseIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import UploadInp from "../uploadInp/UploadInp"
import { putWarehouse, uploadSingleDocument } from "../../../../../api/seller/onboarding"
import { countriesArr, toISODate } from "../../../../../code/seller"

import styles from "./WareHouseAddress.module.scss"
import { ErrToast } from "../../../../../ui/Toastify"

const WhareHouseAddress = ({ formik }) => {

    const isWarehouseFilled = (values) => {
        return Boolean(
            values.wStreet &&
            values.wCity &&
            values.wZip_code &&
            values.contact_phone
        )
    }

    const [uploadStatus, setUploadStatus] = useState("")


    const warehouseRef = useRef(null)

    const { pathname } = useLocation()

    const companyPathname = '/seller/seller-company'

    const { selfData, companyData } = useSelector(state => state.selfEmploed)

    const resultData = companyPathname === pathname ? companyData : selfData



    const onLeaveWarehouseBlock = () => {

        const filled = isWarehouseFilled(formik.values)

        if (!filled) return

        const payload = {
            wStreet: formik.values.wStreet,
            wCity: formik.values.wCity,
            wZip_code: formik.values.wZip_code,
            wCountry: formik.values.wCountry,
            contact_phone: formik.values.contact_phone,
            wProof_document_issue_date: formik.values.wProof_document_issue_date
        }

        putWarehouse({
            street: payload.wStreet,
            city: payload.wCity,
            zip_code: payload.wZip_code,
            country: payload.wCountry,
            contact_phone: payload.contact_phone,
            proof_document_issue_date: toISODate(payload.wProof_document_issue_date)
        })


    }


    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
        uploadSingleDocument({ file, doc_type, scope, side })
            .then(res => {
                formik.setFieldValue("wProof_document_issue_date", res.uploaded_at)
                setUploadStatus('full')
            })
            .catch(err => {
                setUploadStatus('rej')
                ErrToast(err.message)
                console.log("Ошибка загрузки", err);
            });
    };

    const ignoreBlurRef = useRef(false);

    const { t } = useTranslation('onbording')

    return (
        <div className={styles.main}
            ref={warehouseRef}
            onBlurCapture={(e) => {
                if (ignoreBlurRef.current) {
                    ignoreBlurRef.current = false;
                    return;
                }
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(onLeaveWarehouseBlock, 0);
                }
            }}
            tabIndex={-1}>

            <div className={styles.titleWrap}>
                <img src={warehouseIc} alt="" />
                <h2>{t('onboard.warehouse.title')}</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller
                    title={t('onboard.tax_address.street')}
                    type={"text"} circle={true} required={true}
                    placeholder={"Industrial Street 456"}
                    name="wStreet" value={formik.values.wStreet}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.wStreet}
                    touched={formik.touched.wStreet}
                />

                <div className={styles.twoInpWrap}>
                    <InputSeller
                        title={t('onboard.tax_address.city')}
                        type={"text"} circle={true} required={true}
                        placeholder={"Brno"}
                        name="wCity" value={formik.values.wCity}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.wCity}
                        touched={formik.touched.wCity}
                    />

                    <InputSeller
                        title={t('onboard.tax_address.zip')}
                        type={"text"} circle={true} required={true}
                        placeholder={"602 00"}
                        name="wZip_code"
                        num={true}
                        value={formik.values.wZip_code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.wZip_code}
                        touched={formik.touched.wZip_code}
                    />

                    <SellerInfoSellect
                        arr={countriesArr}
                        value={formik.values.wCountry}
                        setValue={(t_val) => {
                            formik.setFieldValue("wCountry", t_val)
                        }}
                        title={t('onboard.tax_address.country')}
                        titleSellect={t('onboard.common.select')}
                        errText={t('onboard.tax_address.country_required')}
                    />
                </div>

                <InputSeller
                    title={t('onboard.warehouse.contact_phone')}
                    type={"tel"} circle={true} required={true}
                    placeholder={"+420 987 654 321"}
                    name="contact_phone" value={formik.values.contact_phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.contact_phone}
                    num={true}
                    touched={formik.touched.contact_phone}
                />

                <div>
                    <UploadInp
                    
                        title={t('onboard.tax_address.proof_address')}
                        description={t('onboard.tax_address.proof_desc')}
                        side={null}
                        docType={"proof_of_address"}
                        inpText={t('onboard.tax_address.upload_doc')}
                        scope={"warehouse_address"}
                        onChange={handleSingleFrontUpload}
                        stateName={resultData?.warehouse_name}
                        nameTitle={"warehouse_name"}
                        onMouseDown={() => (ignoreBlurRef.current = true)}
                        uploadStatus={uploadStatus}
                        
                    />
                </div>
            </div>
        </div>
    )
}

export default WhareHouseAddress