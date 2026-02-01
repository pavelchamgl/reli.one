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
    const [regErr, setRegErr] = useState("");
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
                })
                .catch((err) => {
                    console.log(err);

                    if (err.response) {
                        if (err.response.status === 500) {
                            setRegErr(
                                "An error occurred on the server. Please try again later."
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
                                errorMessage.trim() || "OTP has expired or is invalid."
                            );
                        } else if (err.response.status === 404) {
                            setRegErr("User with this email does not exist.");
                        } else {
                            setRegErr("An unknown error occurred.");
                        }
                    } else {
                        // Обработка случаев, когда нет ответа (например, сетевые ошибки)
                        setRegErr(
                            "Failed to connect to the server. Check your internet connection."
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
            <TitleAndDesc title={"Create a new password"}
                desc={"Your new password must meet the requirements below"} />

            <form className={styles.form} onSubmit={(e) => {
                e.preventDefault()
                formik.handleSubmit()
            }}>
                <InputSeller
                    type={"password"} title={"New password"}
                    placeholder={"Your password"}
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.password}
                />
                <div className={styles.validationBlock}>
                    <p>Password requirements:</p>
                    <ul>
                        <li className={password.length > 8 ? styles.greenText : styles.greyList}>
                            <img src={password.length > 8 ? mark : xIc} alt="" />
                            At least 8 characters long
                        </li>
                        <li className={password.match(/[A-ZА-Я]/g)?.length > 0 ? styles.greenText : styles.greyList}>
                            <img src={password.match(/[A-ZА-Я]/g)?.length > 0 ? mark : xIc} alt="" />
                            Contains 1 uppercase letter
                        </li>
                        <li className={password.match(/\d/g)?.length > 0 ? styles.greenText : styles.greyList}>
                            <img src={password.match(/\d/g)?.length > 0 ? mark : xIc} alt="" />
                            Contains 1 digit
                        </li>
                        <li className={password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g)?.length > 0 ? styles.greenText : styles.greyList}>
                            <img src={password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g)?.length > 0 ? mark : xIc} alt="" />
                            Contains 1 special character (!@#$%^&*)
                        </li>
                    </ul>
                </div>
                <InputSeller
                    type={"password"} title={"Confirm password"}
                    placeholder={"Confirm password"}
                    name="confirm_password"
                    value={formik.values.confirm_password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.confirm_password}
                />
                {
                    regErr && <p className={styles.errorText}>{regErr}</p>
                }
                <AuthBtnSeller disabled={!formik.isValid || !formik.dirty} text={"Save new password"} />
            </form>

            <div className={styles.bottomLinkWrap}>
                <p>Make sure to save your new password in a secure location</p>
            </div>

        </div>
    )
}

export default CreatePassForm