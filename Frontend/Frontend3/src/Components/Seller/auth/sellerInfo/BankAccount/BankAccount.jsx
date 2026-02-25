
import { useRef } from "react"
import { putOnboardingBank } from "../../../../../api/seller/onboarding"
import bankAcc from "../../../../../assets/Seller/register/bankAcc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"

import styles from "./BankAccount.module.scss"
import { useLocation } from "react-router-dom"
import { ErrToast } from "../../../../../ui/Toastify"

const BankAccount = ({ formik, onClosePreview }) => {

    const isBankFilled = (values) => {
        return Boolean(
            values.iban &&
            values.swift_bic &&
            values.account_holder
        )
    }

    const { safeData, safeCompanyData } = useActionSafeEmploed()

    const { pathname } = useLocation()

    const companyPathname = ['/seller/seller-company', "/seller/seller-review-company"]


    const bankRef = useRef(null)

    const onLeaveBankBlock = async () => {

        const filled = isBankFilled(formik.values)



        if (!filled) return

        const payload = {
            iban: formik.values.iban,
            swift_bic: formik.values.swift_bic,
            account_holder: formik.values.account_holder,
            bank_code: formik.values.bank_code,
            local_account_number: formik.values.local_account_number
        }



        if (companyPathname.includes(pathname)) {
            safeCompanyData(payload)
        } else {
            safeData(payload)
        }







        try {
            await putOnboardingBank(payload)
            onClosePreview?.();
        } catch (err) {
            ErrToast(err?.message || "Failed to save personal data");
        }


    }

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
                <InputSeller title={"IBAN"} type={"text"} circle={true} required={true} afterText={"Up to 34 characters, letters and digits only"}
                    placeholder={"CZ65 0800 0000 1920 0014 5399"} num={true}
                    name="iban" value={formik.values.iban}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.iban}
                    touched={formik.touched.iban}

                />

                <InputSeller title={"SWIFT/BIC"} type={"text"} circle={true} required={true} afterText={"8–11 characters"}
                    placeholder={"GIBACZPX"} name="swift_bic"
                    value={formik.values.swift_bic}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.swift_bic}
                    touched={formik.touched.swift_bic}

                />

                <InputSeller title={"Account holder"} type={"text"} circle={true} required={true}
                    placeholder={"Must match seller's full name"}
                    name="account_holder" value={formik.values.account_holder}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.account_holder}
                    touched={formik.touched.account_holder}

                />


                {
                    formik.values.country ?
                        (formik.values.country === "cz" || formik.values.country === "sk") ?
                            <div className={styles.twoInpWrap}>
                                <InputSeller title={"Bank code"} type={"text"} circle={true} required={true}
                                    placeholder={"080"} num={true}
                                    name="bank_code" value={formik.values.bank_code}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.errors.bank_code}
                                    touched={formik.touched.bank_code}

                                />

                                <InputSeller title={"Local account number"} type={"text"} circle={true} required={true}
                                    placeholder={"192001489"} num={true}
                                    name="local_account_number" value={formik.values.local_account_number}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.errors.local_account_number}
                                    touched={formik.touched.local_account_number}

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