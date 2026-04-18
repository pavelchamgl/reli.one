
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"

import { putOnboardingBank } from "../../../../../api/seller/onboarding"
import bankAcc from "../../../../../assets/Seller/register/bankAcc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import { ErrToast } from "../../../../../ui/Toastify"

import styles from "./BankAccount.module.scss"

const BankAccount = ({ formik, onClosePreview }) => {

    const { pathname } = useLocation()

    const { safeData, safeCompanyData } = useActionSafeEmploed()

    const bankRef = useRef(null)

    const { t } = useTranslation('onbording')

    const isBankDataFilled = (values) => {
        return Boolean(
            values.iban &&
            values.swift_bic &&
            values.account_holder
        )
    }

    const onLeaveBankBlock = async () => {

        const payload = {
            iban: formik.values.iban,
            swift_bic: formik.values.swift_bic,
            account_holder: formik.values.account_holder,
            bank_code: formik.values.bank_code,
            local_account_number: formik.values.local_account_number
        }

        const isValid = isBankDataFilled(payload)

        if (!isValid) return


        if (pathname === '/seller/seller-review') {
            safeData(payload)
        }
        if (pathname === '/seller/seller-review-company') {
            safeCompanyData(payload)
        }

        try {
            await putOnboardingBank(payload)
            onClosePreview?.()
        } catch (err) {
            ErrToast(err?.message || t('onboard.common.error_save'))
        }

    }

    useEffect(() => {
        const cleanName = (str) =>
            str
                ?.replace(/[^\p{L}\s-]/gu, "") // только буквы, пробелы, дефис
                .replace(/\s+/g, " ")          // убрать двойные пробелы
                .trim()
        if (pathname === '/seller/seller-company'
            // || pathname === '/seller/seller-review-company'
        ) {
            const cleanLegalForm = formik.values.legal_form?.replace(/\s*\(.*?\)/, "")
            // const cleanCompany = cleanName(formik.values.company_name)
            formik.setFieldValue('account_holder', `${formik.values.company_name + " "}${cleanLegalForm}`)
        } else if (pathname === '/seller/seller-info') {
            const first = cleanName(formik.values.first_name)
            const last = cleanName(formik.values.last_name)

            formik.setFieldValue('account_holder', `${first + " "}${last}`)
        }

    }, [
        formik.values.company_name,
        formik.values.first_name,
        formik.values.legal_form,
        formik.values.last_name
    ])

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
                <h2>{t('onboard.bank.title')}</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller
                    title={t('onboard.bank.iban')}
                    type={"text"}
                    circle={true}
                    required={true}
                    afterText={t('onboard.bank.iban_hint')}
                    placeholder={"CZ65 0800 0000 1920 0014 5399"}
                    num={true}
                    name="iban"
                    value={formik.values.iban}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.iban}
                    touched={formik.touched.iban}
                />

                <InputSeller
                    title={t('onboard.bank.swift')}
                    type={"text"}
                    circle={true}
                    required={true}
                    afterText={t('onboard.bank.swift_hint')}
                    placeholder={"GIBACZPX"}
                    name="swift_bic"
                    value={formik.values.swift_bic}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.swift_bic}
                    touched={formik.touched.swift_bic}
                />

                <InputSeller
                    title={t('onboard.bank.holder')}
                    type={"text"}
                    circle={true}
                    required={true}
                    placeholder={t('onboard.bank.holder_placeholder')}
                    name="account_holder"
                    value={formik.values.account_holder}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.account_holder}
                    touched={formik.touched.account_holder}
                    readOnly
                />

                {
                    formik.values.country ?
                        (formik.values.country === "cz" || formik.values.country === "sk") ?
                            <div className={styles.twoInpWrap}>
                                <InputSeller
                                    title={t('onboard.bank.bank_code')}
                                    type={"text"}
                                    circle={true}
                                    required={true}
                                    placeholder={"080"}
                                    num={true}
                                    name="bank_code"
                                    value={formik.values.bank_code}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.errors.bank_code}
                                    touched={formik.touched.bank_code}
                                />

                                <InputSeller
                                    title={t('onboard.bank.local_acc')}
                                    type={"text"}
                                    circle={true}
                                    required={true}
                                    placeholder={"192001489"}
                                    num={true}
                                    name="local_account_number"
                                    value={formik.values.local_account_number}
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