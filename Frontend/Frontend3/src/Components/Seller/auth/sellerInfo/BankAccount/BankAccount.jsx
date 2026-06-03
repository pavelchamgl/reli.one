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
import { getAccountData } from "../../../../../api/seller/getOnboardingData"
import { normalizeCompanyAccountHolder } from "../../../../../code/seller/companyLegalForms"

const BankAccount = ({ formik, onClosePreview }) => {
    // const { selfData, companyData } = useSelector(state => state.selfEmploed)
    const { pathname } = useLocation()
    const { safeData } = useActionSafeEmploed()
    const bankRef = useRef(null)
    const { t } = useTranslation('onbording')

    const normalize = (val) => val?.toLowerCase()?.trim()

    const country_of_registration = normalize(formik.values.country_of_registration)
    const tax_country = normalize(formik.values.tax_country)
    const business_country = normalize(formik.values.country)
    const activeCountry = country_of_registration || tax_country || business_country
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
            return normalizeCompanyAccountHolder(formik.values.company_name, formik.values.legal_form);
            // return (formik.values.company_name || "").trim();
        } else {
            const first = cleanName(formik.values.first_name);
            const last = cleanName(formik.values.last_name);

            // const first = JSON.parse(localStorage.getItem('first_name') || '""');
            // const last = JSON.parse(localStorage.getItem('last_name') || '""');

            return `${first} ${last}`.trim();
        }

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
    useEffect(() => {
        if (!pathname.includes('company')) {
            getAccountData().then((res) => {
                // if (res.status === 200) {
                    // проверить нетворк на правильность статуса
                    formik.setFieldValue("first_name", res.first_name)
                    formik.setFieldValue("last_name", res.last_name)
                // }
            }).catch(err => {
                console.error("Ошибка при получении данных:", err);
            })
        }
    }, [pathname])

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
            const message = err?.message || t('onboard.common.error_save');
            formik.setFieldError('account_holder', message);
            ErrToast(message);
        }
    }

    useEffect(() => {
        if (!isCzSk) {
            formik.setFieldValue('bank_code', '', false)
            formik.setFieldValue('local_account_number', '', false)
        }
    }, [country_of_registration, tax_country, business_country])

    return (
        <section className={styles.main}
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
                    disabled={true}
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
        </section>
    )
}

export default BankAccount
