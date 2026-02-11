import { useFormik } from "formik"
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import TitleAndDesc from '../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc'
import InputSeller from '../../../../ui/Seller/auth/inputSeller/InputSeller'
import AuthBtnSeller from '../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller'
import FormLink from '../../../../ui/Seller/auth/formLink/FormLink'
import { login } from "../../../../api/auth";

import styles from "./LoginForm.module.scss"
import { syncBasket } from "../../../../redux/basketSlice";

const LoginForm = () => {

    const [regErr, setRegErr] = useState("");


    const { t } = useTranslation()
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const validationLogin = Yup.object().shape({
        email: Yup
            .string()
            .email(t("validation.email.email"))
            .required(t("validation.email.required")),
        password: Yup
            .string()
            .test("password", t("validation.password.passwordCriteria"), (value) => {
                return (
                    /[a-z]/.test(value) &&
                    /[A-Z]/.test(value) &&
                    /\d/.test(value) &&
                    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
                );
            })
            .min(8, t("validation.password.minLength"))
            .max(20, t("validation.password.maxLength"))
            .required(t("validation.password.required")),
    });

    const formik = useFormik({
        initialValues: {
            email: "",
            password: ""
        },
        validationSchema: validationLogin,
        onSubmit: async (values) => {

            try {
                const res = await login(values)
                localStorage.setItem("token", JSON.stringify(res.data));
                localStorage.setItem("email", JSON.stringify(values.email));
                dispatch(syncBasket())

                // setRegErr("");
                // handleClose();
                // setIsBuy(false)
                navigate("/seller/goods-choice"); // Обновление страницы

            } catch (err) {
                if (err.response) {
                    if (err.response.status === 500) {
                        setRegErr("An error occurred on the server. Please try again later.");
                    } else if (err.response.status === 401) {
                        const errorData = err.response.data;
                        let errorMessage = "";

                        for (const key in errorData) {
                            if (Array.isArray(errorData[key])) {
                                errorMessage += `${key}: ${errorData[key].join(", ")} `;
                            }
                        }

                        setRegErr(
                            errorMessage.trim() ||
                            "No active account found with the given credentials."
                        );
                    } else {
                        setRegErr("An unknown error occurred.");
                    }
                } else {
                    setRegErr("Failed to connect to the server. Check your internet connection.");
                }
            }
        }
    })


    return (
        <div className={styles.main}>
            <TitleAndDesc title={"Log in to Seller Panel"} desc={"Enter your credentials to access your dashboard"} />

            <form className={styles.form} onSubmit={(e) => {
                e.preventDefault()
                formik.handleSubmit()
            }}>
                <InputSeller
                    type={"email"} title={"Email"}
                    placeholder={"your.email@reli.one"}
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.email}
                />
                <InputSeller type={"password"} title={"Password"}
                    placeholder={"Your password"}
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.password}
                />
                {
                    regErr && regErr.length > 0 &&
                    <p className={styles.errText}>{regErr}</p>
                }

                <AuthBtnSeller
                    disabled={!formik.isValid || !formik.dirty}
                    text={"Log in"} />
                <FormLink
                    url={"/seller/reset"}
                    text={"Forgot your password?"} />
            </form>

            <div className={styles.bottomLinkWrap}>
                <p>Don't have an account?</p>
                <FormLink url={"/seller/create-account"} text={"Sign up here"} />
            </div>

        </div>
    )
}

export default LoginForm