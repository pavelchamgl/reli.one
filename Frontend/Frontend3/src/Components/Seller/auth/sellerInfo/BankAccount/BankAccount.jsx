
import { useEffect, useRef } from "react"
import { putOnboardingBank } from "../../../../../api/seller/onboarding"
import bankAcc from "../../../../../assets/Seller/register/bankAcc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"

import styles from "./BankAccount.module.scss"
import { useLocation } from "react-router-dom"
import { ErrToast } from "../../../../../ui/Toastify"

const BankAccount = ({ formik, data, setData, errors, setErrors, onClosePreview }) => {


    const validate = () => {
        const newErrors = {}

        if (!data?.iban?.trim()) {
            newErrors.iban = "IBAN is required"
        }

        if (!data?.swift_bic?.trim()) {
            newErrors.swift_bic = "SWIFT/BIC is required"
        }

        if (!data?.account_holder?.trim()) {
            newErrors.account_holder = "Account holder is required"
        }

        if ((formik.values.country === "cz" || formik.values.country === "sk")) {

            if (!data?.bank_code?.trim()) {
                newErrors.bank_code = "Bank code is required"
            }

            if (!data?.local_account_number?.trim()) {
                newErrors.local_account_number = "Account number is required"
            }

        }

        setErrors(newErrors)

        return Object.keys(newErrors).length === 0
    }


    const bankRef = useRef(null)

    const onLeaveBankBlock = async () => {

        const isValid = validate()

        if (!isValid) return

        try {
            await putOnboardingBank(data)
            onClosePreview?.()
        } catch (err) {
            ErrToast(err?.message || "Failed to save bank data")
        }

    }

    useEffect(() => {
        console.log(errors);

    }, [errors])

    return (
        <div className={styles.main}
            ref={bankRef}
            tabIndex={-1}
            onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(onLeaveBankBlock, 0);
                }
            }}
        >

            <div className={styles.titleWrap}>
                <img src={bankAcc} alt="" />
                <h2>Bank Account</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"IBAN"} type={"text"}
                    circle={true} required={true}
                    afterText={"Up to 34 characters, letters and digits only"}
                    placeholder={"CZ65 0800 0000 1920 0014 5399"} num={true}
                    name="iban"
                    value={data?.iban}
                    onChange={(e) => {
                        const value = e.target.value

                        setData({ ...data, iban: value })



                        if (e.target.value?.length === 0) {
                            setErrors(prev => ({
                                ...prev,
                                iban: "IBAN is required"
                            }))
                        } else {
                            setErrors(prev => ({
                                ...prev,
                                iban: ""
                            }))
                        }
                    }}
                    error={errors?.iban}
                />

                <InputSeller
                    title={"SWIFT/BIC"}
                    type={"text"} circle={true}
                    required={true} afterText={"8–11 characters"}
                    placeholder={"GIBACZPX"} name="swift_bic"
                    value={data?.swift_bic}
                    onChange={(e) => {
                        const value = e.target.value

                        setData({ ...data, swift_bic: value })

                        if (e.target.value?.length === 0) {
                            setErrors(prev => ({
                                ...prev,
                                swift_bic: "SWIFT/BIC is required"
                            }))
                        } else {
                            setErrors(prev => ({
                                ...prev,
                                swift_bic: ""
                            }))
                        }
                    }}
                    error={errors.swift_bic}
                />

                <InputSeller title={"Account holder"} type={"text"} circle={true} required={true}
                    placeholder={"Must match seller's full name"}
                    name="account_holder"
                    value={data?.account_holder}
                    onChange={(e) => {
                        const value = e.target.value

                        setData({ ...data, account_holder: value })


                        if (e.target.value?.length === 0) {
                            setErrors(prev => ({
                                ...prev,
                                account_holder: "Account holder is required"
                            }))
                        } else {
                            setErrors(prev => ({
                                ...prev,
                                account_holder: ""
                            }))
                        }
                    }}
                    error={errors?.account_holder}
                />


                {
                    formik.values.country ?
                        (formik.values.country === "cz" || formik.values.country === "sk") ?
                            <div className={styles.twoInpWrap}>
                                <InputSeller title={"Bank code"} type={"text"} circle={true} required={true}
                                    placeholder={"080"} num={true}
                                    name="bank_code"
                                    value={data?.bank_code}
                                    onChange={(e) => {
                                        const value = e.target.value

                                        setData({ ...data, bank_code: value })

                                        if (e.target.value?.length === 0) {
                                            setErrors(prev => ({
                                                ...prev,
                                                bank_code: "Bank code is required"
                                            }))
                                        } else {
                                            setErrors(prev => ({
                                                ...prev,
                                                bank_code: ""
                                            }))
                                        }
                                    }}
                                    error={errors?.bank_code}
                                />

                                <InputSeller title={"Local account number"} type={"text"} circle={true} required={true}
                                    placeholder={"192001489"} num={true}
                                    name="local_account_number"
                                    value={data?.local_account_number}
                                    onChange={(e) => {
                                        const value = e.target.value

                                        setData({ ...data, local_account_number: value })

                                        if (e.target.value?.length === 0) {
                                            setErrors(prev => ({
                                                ...prev,
                                                local_account_number: "Account number is required"
                                            }))
                                        } else {
                                            setErrors(prev => ({
                                                ...prev,
                                                local_account_number: ""
                                            }))
                                        }
                                    }}
                                    error={errors.local_account_number}
                                />
                            </div>
                            : null
                        : null
                }




            </div>


        </div>
    )
}

export default BankAccount