
import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"

import warehouseIc from "../../../../../assets/Seller/register/warehouseIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"

import styles from "./WareHouseAddress.module.scss"
import { useLocation } from "react-router-dom"
import UploadInp from "../uploadInp/UploadInp"
import { putWarehouse, uploadSingleDocument } from "../../../../../api/seller/onboarding"
import { toISODate } from "../../../../../code/seller"

const WhareHouseAddress = ({ formik }) => {



    const isWarehouseFilled = (values) => {
        return Boolean(
            values.wStreet &&
            values.wCity &&
            values.wZip_code &&
            values.contact_phone
        )
    }

    const [date, setDate] = useState("")

    const warehouseRef = useRef(null)

    const { pathname } = useLocation()

    const companyPathname = '/seller/seller-company'

    const { selfData, companyData } = useSelector(state => state.selfEmploed)

    const [country, setCountry] = useState(selfData.wCountry || companyData.wCountry)

    const countryArr = [
        { text: "Czech Republic", value: "cz" },
        { text: "Germany", value: "de" },
        { text: "France", value: "fr" },
        { text: "Poland", value: "pl" },
        { text: "United Kingdom", value: "gb" }
    ];

    const { safeData, safeCompanyData } = useActionSafeEmploed()

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

        if (pathname === companyPathname) {
            safeCompanyData(payload)
        } else {
            safeData(payload)
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


    useEffect(() => {
        if (companyPathname === pathname) {
            safeCompanyData({ wCountry: country })
            formik.setFieldValue("wCountry", country)
        } else {
            safeData({ wCountry: country })
            formik.setFieldValue("wCountry", country)
        }
    }, [country])

    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
        uploadSingleDocument({ file, doc_type, scope, side })
            .then(res => {
                formik.setFieldValue("wProof_document_issue_date", res.uploaded_at)
                setDate(res?.uploaded_at)
                if (pathname === companyPathname) {
                    safeCompanyData({ wProof_document_issue_date: res?.uploaded_at })
                } else {
                    safeData({ wProof_document_issue_date: res?.uploaded_at })
                }
            })
            .catch(err => {
                ErrToast(err.message)
                console.log("Ошибка загрузки", err);
            });
    };



    return (
        <div className={styles.main}
            ref={warehouseRef}
            onBlurCapture={(e) => {
                // если фокус ушёл вне блока
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(onLeaveWarehouseBlock, 0);
                }
            }}
            tabIndex={-1}>

            <div className={styles.titleWrap}>
                <img src={warehouseIc} alt="" />
                <h2>Warehouse Address</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Street"} type={"text"} circle={true} required={true}
                    placeholder={"Industrial Street 456"}
                    name="wStreet" value={formik.values.wStreet}
                    onChange={
                        (e) => {
                            formik.handleChange(e)
                            setWStreet(e.target.value)
                        }
                    }
                    onBlur={formik.handleBlur}
                    error={formik.errors.wStreet}

                />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"City"} type={"text"} circle={true} required={true}
                        placeholder={"Brno"}
                        name="wCity" value={formik.values.wCity}
                        onChange={
                            (e) => {
                                formik.handleChange(e)
                                setWCity(e.target.value)
                            }
                        }
                        onBlur={formik.handleBlur}
                        error={formik.errors.wCity}
                    />

                    <InputSeller title={"ZIP"} type={"text"} circle={true} required={true}
                        placeholder={"602 00"}
                        name="wZip_code" value={formik.values.wZip_code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.wZip_code}
                    />

                    <SellerInfoSellect arr={countryArr} value={country}
                        setValue={setCountry} title={"Country"}
                        titleSellect={"Select"}
                        errText={"Country is required"}
                    />
                </div>
                <InputSeller title={"Contact phone"} type={"tel"} circle={true} required={true}
                    placeholder={"+420 987 654 321"}
                    name="contact_phone" value={formik.values.contact_phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.contact_phone}
                    num={true}
                />

                <div>
                    <UploadInp
                        title={"Proof of address"}
                        description={"Not older than 3 months (utility bill, bank statement, etc.)"}
                        side={null}
                        docType={"proof_of_address"}
                        inpText={"Upload document"}
                        scope={"warehouse_address"}
                        onChange={handleSingleFrontUpload}
                        stateName={selfData?.warehouse_name}
                        nameTitle={"warehouse_name"}
                    />
                    {formik.errors.wProof_document_issue_date && <p className={styles.errorText}>Upload document is required</p>}
                </div>




            </div>


        </div>
    )
}

export default WhareHouseAddress