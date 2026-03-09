
import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"

import returnAddress from "../../../../../assets/Seller/register/returnAddress.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import Checkbox from "../../../../../ui/Seller/newOrder/checkbox/Checkbox"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"

import styles from "./ReturnAddress.module.scss"
import { putReturnAddress } from "../../../../../api/seller/onboarding"
import { countriesArr, toISODate } from "../../../../../code/seller"

const ReturnAddress = ({ formik }) => {

    const { pathname } = useLocation()

    const companyPathname = '/seller/seller-company'

    const { selfData, companyData } = useSelector(state => state.selfEmploed)

    const sourceData = pathname === companyPathname ? companyData : selfData

    const [isCheked, setIsChecked] = useState(
        Boolean(sourceData?.same_as_warehouse)
    );



    const [country, setCountry] = useState(
        isCheked
            ? sourceData?.wCountry ?? null
            : sourceData?.rCountry ?? null
    )


    const { safeData, safeCompanyData } = useActionSafeEmploed()

    useEffect(() => {
        setIsChecked(Boolean(sourceData?.same_as_warehouse));
    }, [sourceData?.same_as_warehouse, pathname]);

    // useEffect(() => {
    //     if (pathname === companyPathname) {
    //         safeCompanyData({ rCountry: country })
    //         formik.setFieldValue("rCountry", country)


    //     } else {
    //         safeData({ rCountry: country })
    //         formik.setFieldValue("rCountry", country)

    //     }
    // }, [country])

    useEffect(() => {
        // if (isCheked) {
        //     setCountry(selfData.wCountry)
        // } else {
        //     setCountry(selfData.rCountry)
        // }

        if (pathname === companyPathname) {
            safeCompanyData({ same_as_warehouse: isCheked })
        } else {
            safeData({ same_as_warehouse: isCheked })
        }

    }, [isCheked])

    // const handleSameAsWarehouse = async (checked) => {
    //     setIsChecked(checked)





    //     if (!checked) {
    //         formik.setFieldValue("rStreet", "", true)
    //         formik.setFieldValue("rCity", "", true)
    //         formik.setFieldValue("rZip_code", "", true)
    //         formik.setFieldValue("rCountry", null, true)
    //         formik.setFieldValue("rContact_phone", "", true)
    //     } else {
    //         formik.setFieldValue("rStreet", sourceData.wStreet, true)
    //         formik.setFieldValue("rCity", sourceData.wCity, true)
    //         formik.setFieldValue("rZip_code", sourceData.wZip_code, true)
    //         formik.setFieldValue("rCountry", sourceData.wCountry, true)
    //         formik.setFieldValue("rContact_phone", sourceData.contact_phone, true)
    //     }

    //     await formik.validateForm()

    // }

    useEffect(() => {
        console.log(formik.values);

    }, [formik.values])

    const handleSameAsWarehouse = (checked) => {
        setIsChecked(checked)

        if (!checked) {

            formik.setFieldValue("rStreet", "")
            formik.setFieldValue("rCity", "")
            formik.setFieldValue("rZip_code", "")
            formik.setFieldValue("rCountry", null)
            formik.setFieldValue("rContact_phone", "")


            if (pathname === companyPathname) {
                safeCompanyData({
                    rStreet: '',
                    rCity: '',
                    rZip_code: '',
                    rCountry: '',
                    rContact_phone: ''
                })
            } else {
                safeData({
                    rStreet: '',
                    rCity: '',
                    rZip_code: '',
                    rCountry: '',
                    rContact_phone: ''
                })
            }
        } else {

            formik.setFieldValue("rStreet", sourceData?.wStreet ?? "")
            formik.setFieldValue("rCity", sourceData?.wCity ?? "")
            formik.setFieldValue("rZip_code", sourceData?.wZip_code ?? "")
            formik.setFieldValue("rCountry", sourceData?.wCountry ?? null)
            formik.setFieldValue("rContact_phone", sourceData?.contact_phone ?? "")

            if (pathname === companyPathname) {
                safeCompanyData({
                    rStreet: sourceData?.wStreet ?? '',
                    rCity: sourceData?.wCity ?? '',
                    rZip_code: sourceData?.wZip_code ?? '',
                    rCountry: sourceData?.wCountry ?? '',
                    rContact_phone: sourceData.contact_phone ?? ''
                })
            } else {
                safeData({
                    rStreet: sourceData?.wStreet ?? '',
                    rCity: sourceData?.wCity ?? '',
                    rZip_code: sourceData?.wZip_code ?? '',
                    rCountry: sourceData?.wCountry ?? '',
                    rContact_phone: sourceData.contact_phone ?? ''
                })
            }
        }
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

    const rAddressRef = useRef(null)

    const onLeaveReturnBlock = () => {

        const filled = isReturnFilled(formik.values)



        if (!filled) return

        const payload = {
            same_as_warehouse: isCheked,
            street: formik.values.rStreet,
            city: formik.values.rCity,
            zip_code: formik.values.rZip_code,
            country: formik.values.rCountry,
            contact_phone: formik.values.rContact_phone,
            proof_document_issue_date: toISODate(formik.values.wProof_document_issue_date)
        }



        if (pathname === companyPathname) {
            safeCompanyData(payload)
        } else {
            safeData(payload)
        }



        putReturnAddress(payload)


    }


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
                <h2>Return Address</h2>
            </div>

            <label className={styles.checkWrap}>
                <Checkbox checked={isCheked} onChange={(e) => handleSameAsWarehouse(e.target.checked)} />
                <p>Same as warehouse address</p>
            </label>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Street"} type={"text"} circle={true} required={true}
                    placeholder={"Industrial Street 456"}
                    name="rStreet" value={formik.values.rStreet}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.rStreet}
                    touched={formik.touched.rStreet}

                />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"City"} type={"text"} circle={true} required={true}
                        placeholder={"Brno"}
                        name="rCity" value={formik.values.rCity}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.rCity}
                        touched={formik.touched.rCity}
                    />
                    <InputSeller title={"ZIP"} type={"text"} circle={true} required={true}
                        placeholder={"602 00"}
                        name="rZip_code" value={formik.values.rZip_code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.rZip_code}
                        num={true}
                        touched={formik.touched.rZip_code}

                    />
                    <SellerInfoSellect arr={countriesArr}
                        value={formik.values?.rCountry}
                        setValue={(t) => formik.setFieldValue("rCountry", t)}
                        title={"Country"} titleSellect={"Select"}
                        errText={"Country is required"}
                    />
                </div>
                <InputSeller title={"Contact phone"} type={"tel"} circle={true} required={true}
                    placeholder={"+420 987 654 321"}
                    name="rContact_phone" value={formik.values.rContact_phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.rContact_phone}
                    num={true}
                    touched={formik.touched.rContact_phone}

                />



            </div>


        </div>
    )
}

export default ReturnAddress