import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import { putOnboardingBank } from "../../../../../api/seller/onboarding"
import bankAcc from "../../../../../assets/Seller/register/bankAcc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed"
import { ErrToast } from "../../../../../ui/Toastify"
// import { useSelector } from "react-redux";
import styles from "./BankAccount.module.scss"

const BankAccount = ({ formik, onClosePreview }) => {
    // const { selfData, companyData } = useSelector(state => state.selfEmploed)
    const { pathname } = useLocation()
    const { safeData, safeCompanyData } = useActionSafeEmploed()
    const bankRef = useRef(null)
    const { t } = useTranslation('onbording')

    const normalize = (val) => val?.toLowerCase()?.trim()

    const tax_country = normalize(formik.values.tax_country)
    const business_country = normalize(formik.values.country)
    const activeCountry = tax_country || business_country
    const isCzSk = ["cz", "sk"].includes(activeCountry)

    const cleanName = (str) =>
        str
            ?.replace(/[^\p{L}\s-]/gu, "")
            .replace(/\s+/g, " ")
            .trim() || "";
    const cleanLegalFormOnly = (str) =>
        str
            ?.toString()
            .replace(/\s*\(.*?\)/g, "") // Удаляет " (любой текст)"
            .trim() || "";

    // 1. Функция получения "правильного" имени на основе данных из других блоков
    const getExpectedHolderName = () => {
        if (pathname.includes('company')) {
            const cleanLegalForm = formik.values.legal_form?.replace(/\s*\(.*?\)/, "") || "";
            const companyName = formik.values.company_name || "";
            return `${companyName} ${cleanLegalForm}`.trim();
            // return (formik.values.company_name || "").trim();
        }
        const first = cleanName(formik.values.first_name);
        const last = cleanName(formik.values.last_name);
        console.log(first, last, "что приходит с фио");

        // const first = JSON.parse(localStorage.getItem('first_name') || '""');
        // const last = JSON.parse(localStorage.getItem('last_name') || '""');

        return `${first} ${last}`.trim();
    };

    // 2. Эффект для автоматической подстановки значения (Company Info -> Bank Account)
    useEffect(() => {
        const expected = getExpectedHolderName();
        if (expected) {
            formik.setFieldValue('account_holder', expected);
        }
    }, [
        formik.values.company_name,
        formik.values.legal_form,
        formik.values.first_name,
        formik.values.last_name,
        pathname
    ]);


    const isBankDataFilled = (values) => {
        return Boolean(values.iban && values.swift_bic && values.account_holder);
    }

    // 3. Валидация при сохранении (onBlur или Submit)
    const onLeaveBankBlock = async () => {
        const payload = {
            iban: formik.values.iban,
            swift_bic: formik.values.swift_bic,
            account_holder: formik.values.account_holder,
            ...(isCzSk && {
                bank_code: formik.values.bank_code,
                local_account_number: formik.values.local_account_number
            })
        }
        if (!isBankDataFilled(payload)) return;
        // --- ПРОВЕРКА НА СХОЖЕСТЬ ---
        const expectedName = getExpectedHolderName();
        if (payload.account_holder.trim() !== expectedName) {
            formik.setFieldError('account_holder', t('onboard.bank.holder_error_mismatch'));
            ErrToast(t('onboard.bank.holder_error_mismatch'));
            return; // Блокируем отправку
        }
        if (pathname === '/seller/seller-review') safeData(payload);
        // if (pathname === '/seller/seller-review-company') safeCompanyData(payload);
        try {
            await putOnboardingBank(payload);
            onClosePreview?.();
        } catch (err) {
            ErrToast(err?.message || t('onboard.common.error_save'));
        }
    }

    useEffect(() => {
        if (!isCzSk) {
            formik.setFieldValue('bank_code', '', false)
            formik.setFieldValue('local_account_number', '', false)
        }
    }, [tax_country, business_country])

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
                    name="iban"
                    value={formik.values.iban}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.iban}
                    touched={formik.touched.iban}
                    required
                />

                <InputSeller
                    title={t('onboard.bank.swift')}
                    name="swift_bic"
                    value={formik.values.swift_bic}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.swift_bic}
                    touched={formik.touched.swift_bic}
                    required
                />

                <InputSeller
                    title={t('onboard.bank.holder')}
                    name="account_holder"
                    value={formik.values.account_holder}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    // Ошибка из setFieldError отобразится здесь автоматически
                    error={formik.errors.account_holder}
                    touched={formik.touched.account_holder}
                    required
                />

                {isCzSk && (
                    <div className={styles.twoInpWrap}>
                        <InputSeller
                            title={t('onboard.bank.bank_code')}
                            name="bank_code"
                            value={formik.values.bank_code}
                            onChange={formik.handleChange}
                            error={formik.errors.bank_code}
                            required={isCzSk ? true : false}
                        />

                        <InputSeller
                            title={t('onboard.bank.local_acc')}
                            name="local_account_number"
                            value={formik.values.local_account_number}
                            onChange={formik.handleChange}
                            error={formik.errors.local_account_number}
                            required={isCzSk ? true : false}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export default BankAccount