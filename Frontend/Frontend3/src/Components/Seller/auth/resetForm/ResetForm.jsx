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
    const [regErr, setRegErr] = useState("");
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
            console.log(values);
            passSendOtp(values)
                .then((res) => {
                    localStorage.setItem("email", JSON.stringify(values.email));
                    navigate("/seller/verify-email");
                })
                .catch((err) => {
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
                                errorMessage.trim() ||
                                "No active account found with the given credentials."
                            );
                        } else if (err.response.status === 404) {
                            setRegErr("User with the specified email address not found.");
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

    return (
        <div className={styles.main}>
            <BackBtn text={"Back to login"} />
            <TitleAndDesc title={"Reset your password"} desc={"Enter the email address you used during registration."} />

            <form className={styles.form}
                onSubmit={(e) => {
                    e.preventDefault()
                    formik.handleSubmit()
                }}
            >
                <InputSeller
                    type={"email"} title={"Email"}
                    placeholder={"your.email@reli.one"}
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.email}
                />
                {regErr && <p className={styles.errText}>{regErr}</p>}
                <AuthBtnSeller
                    disabled={!formik.isValid || !formik.dirty}
                    text={"Send code"} />
            </form>

            <div className={styles.bottomLinkWrap}>
                <p>Remember your password?</p>
                <FormLink url={"/seller/login"} text={"Log in instead"} />
            </div>

        </div>
    )
}

export default ResetForm