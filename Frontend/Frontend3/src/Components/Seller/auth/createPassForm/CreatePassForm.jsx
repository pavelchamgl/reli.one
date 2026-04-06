import { useFormik } from "formik"
import * as yup from "yup";
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import AuthBtnSeller from "../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import InputSeller from "../../../../ui/Seller/auth/inputSeller/InputSeller"
import TitleAndDesc from "../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import { createNewPassApi } from "../../../../api/auth";

import xIc from "../../../../assets/Seller/auth/xIc.svg"
import mark from "../../../../assets/Seller/auth/mark.svg"

import styles from "./CreatePassForm.module.scss"

const CreatePassForm = () => {
    const { t } = useTranslation();
    const { t: tOnb } = useTranslation('onbording');
    const [regErr, setRegErr] = useState("");
    const [isLoading, setIsLoading] = useState(false)


    const navigate = useNavigate()



    const validationPassword = yup.object().shape({
        password: yup
            .string()
            .test("password", t("validation.password.passwordCriteria"), (value) => {
                return (
                    /[a-z]/.test(value) && // содержит строчную букву
                    /[A-Z]/.test(value) && // содержит прописную букву
                    /\d/.test(value) && // содержит цифру
                    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value) // содержит специальный символ
                );
            })
            .min(8, t("validation.password.minLength")) // минимальная длина 6 символов
            .max(20, t("validation.password.maxLength")) // максимальная длина 15 символов
            .required(t("validation.password.required")), // обязательное поле
        confirm_password: yup
            .string()
            .oneOf([yup.ref("password"), null], t("validation.confirmPassword.oneOf")) // должен совпадать с полем "password"
            .required(t("validation.confirmPassword.required")), // обязательное поле
    });

    const email = localStorage.getItem("email")
        ? JSON.parse(localStorage.getItem("email"))
        : "";
    const otp = localStorage.getItem("otp")
        ? JSON.parse(localStorage.getItem("otp"))
        : "";

    const formik = useFormik({
        initialValues: {
            password: "",
            confirm_password: ""
        },
        validationSchema: validationPassword,
        onSubmit: (values) => {
            console.log(values);
            setIsLoading(true)
            createNewPassApi({
                password: values.password,
                confirm_password: values.confirm_password,
                email: email,
                otp: otp,
            })
                .then((res) => {
                    localStorage.removeItem("email");
                    localStorage.removeItem("otp");
                    navigate("/seller/successfully-reset");
                    setIsLoading(false)

                })
                .catch((err) => {
                    console.log(err);

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
                                errorMessage.trim() || tOnb('auth.otpExpiredOrInvalid')
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

    const { password, confirm_password } = formik.values


    // useEffect(() => {
    //     console.log(password.match(/[A-ZА-Я]/g))
    //     console.log(password.match(/\d/g))
    //     console.log(password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g));

    // }, [password])

    return (
        <div className={styles.main}>
            <TitleAndDesc title={tOnb('auth.title')}
                desc={tOnb('auth.description')} />

            <form className={styles.form} onSubmit={(e) => {
                e.preventDefault()
                formik.handleSubmit()
            }}>
                <InputSeller
                    type={"password"} title={tOnb('auth.label_password')}
                    placeholder={tOnb('auth.placeholder_password')}
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.password}
                />
                <div className={styles.validationBlock}>
                    <p>{tOnb('auth.requirements_title')}</p>
                    <ul>
                        <li className={password.length > 8 ? styles.greenText : styles.greyList}>
                            <img src={password.length > 8 ? mark : xIc} alt="" />
                            {tOnb('auth.req_length')}
                        </li>
                        <li className={password.match(/[A-ZА-Я]/g)?.length > 0 ? styles.greenText : styles.greyList}>
                            <img src={password.match(/[A-ZА-Я]/g)?.length > 0 ? mark : xIc} alt="" />
                            {tOnb('auth.req_uppercase')}
                        </li>
                        <li className={password.match(/\d/g)?.length > 0 ? styles.greenText : styles.greyList}>
                            <img src={password.match(/\d/g)?.length > 0 ? mark : xIc} alt="" />
                            {tOnb('auth.req_digit')}
                        </li>
                        <li className={password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g)?.length > 0 ? styles.greenText : styles.greyList}>
                            <img src={password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g)?.length > 0 ? mark : xIc} alt="" />
                            {tOnb('auth.req_special')}
                        </li>
                    </ul>
                </div>
                <InputSeller
                    type={"password"} title={tOnb('auth.label_confirm_password')}
                    placeholder={tOnb('auth.placeholder_confirm_password')}
                    name="confirm_password"
                    value={formik.values.confirm_password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.confirm_password}
                />
                {
                    regErr && <p className={styles.errorText}>{regErr}</p>
                }
                <AuthBtnSeller
                    loading={isLoading}
                    disabled={!formik.isValid || !formik.dirty} text={tOnb('auth.button_save')} />
            </form>

            <div className={styles.bottomLinkWrap}>
                <p>{tOnb('auth.footer_note')}</p>
            </div>

        </div>
    )
}

export default CreatePassForm