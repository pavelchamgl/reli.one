import { useFormik } from "formik"
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import AuthBtnSeller from "../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import BackBtn from "../../../../ui/Seller/auth/backBtn/BackBtn"
import FormLink from "../../../../ui/Seller/auth/formLink/FormLink"
import InputSeller from "../../../../ui/Seller/auth/inputSeller/InputSeller"
import TitleAndDesc from "../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"

import styles from "./ResetForm.module.scss"
import { passSendOtp, sendOtp } from "../../../../api/auth";

const ResetForm = () => {

    const { t } = useTranslation()
    const { t: tOnb } = useTranslation('onbording')
    const [regErr, setRegErr] = useState("");
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()



    const validationReset = Yup.object().shape({
        email: Yup
            .string()
            .email(t("validation.email.email"))
            .required(t("validation.email.required"))
    })

    const formik = useFormik({
        initialValues: {
            email: ""
        },
        validationSchema: validationReset,
        onSubmit: (values) => {
            setIsLoading(true)
            passSendOtp(values)
                .then((res) => {
                    localStorage.setItem("email", JSON.stringify(values.email));
                    navigate("/seller/verify-email");
                    setIsLoading(false)
                })
                .catch((err) => {
                    if (err.response) {
                        setIsLoading(false)
                        if (err.response.status === 500) {
                            setRegErr(
                                tOnb('auth.errorOccurredOnServer')
                            );
                        } else if (err.response.status === 400) {
                            const errorData = err.response.data;
                            let errorMessage = "";

                            for (const key in errorData) {
                                if (errorData[key] && Array.isArray(errorData[key])) {
                                    // Добавляем имя поля к сообщению об ошибке
                                    errorMessage += `${key}: ${errorData[key].join(", ")} `;
                                }
                            }

                            setRegErr(
                                errorMessage.trim() ||
                                tOnb('auth.noActiveAccountFound')
                            );
                        } else if (err.response.status === 404) {
                            setRegErr(tOnb('auth.userWithEmailNotFound'));
                        } else {
                            setRegErr(tOnb('auth.unknownErrorOccurred'));
                        }
                    } else {
                        // Обработка случаев, когда нет ответа (например, сетевые ошибки)
                        setRegErr(
                            tOnb('auth.failedToConnectToServer')
                        );
                    }
                });
        }
    })

    return (
        <div className={styles.main}>
            <BackBtn text={tOnb('auth.backToLogin')} />
            <TitleAndDesc title={tOnb('auth.resetYourPassword')}
                desc={tOnb('auth.enterTheEmailAddress')} />

            <form className={styles.form}
                onSubmit={(e) => {
                    e.preventDefault()
                    formik.handleSubmit()
                }}
            >
                <InputSeller
                    type={"email"} title={t("email")}
                    placeholder={"your.email@reli.one"}
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.email}
                />
                {regErr && <p className={styles.errText}>{regErr}</p>}
                <AuthBtnSeller
                    loading={isLoading}
                    disabled={!formik.isValid || !formik.dirty}
                    text={tOnb('auth.sendCode')} />
            </form>

            <div className={styles.bottomLinkWrap}>
                <p>{tOnb('auth.rememberYourPassword')}</p>
                <FormLink url={"/seller/login"} text={tOnb('auth.logInInstead')} />
            </div>

        </div>
    )
}

export default ResetForm