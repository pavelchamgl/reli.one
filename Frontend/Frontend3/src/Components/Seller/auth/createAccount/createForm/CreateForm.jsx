import { useFormik } from "formik"
import * as yup from "yup";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import AuthBtnSeller from "../../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import TitleAndDesc from "../../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from '../../../../../ui/Seller/register/stepWrap/StepWrap'
import Checkbox from "../../../../../ui/Seller/newOrder/checkbox/Checkbox"
import { register } from "../../../../../api/auth"
import { registerSeller } from "../../../../../api/seller/auth";

import userIc from "../../../../../assets/Seller/register/userIc.svg"
import phoneIc from "../../../../../assets/Seller/register/phoneIc.svg"

import styles from "./CreateForm.module.scss"
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed";


const CreateForm = () => {

    const { t, i18n } = useTranslation();

    const [isAgree, setIsAgree] = useState(false)

    const [regErr, setRegErr] = useState("");

    const navigate = useNavigate()

    const { setRegisterData } = useActionSafeEmploed()

    const validationSchema = yup.object().shape({
        first_name: yup.string().required(t("validation.name.required")),
        last_name: yup.string().required(t("validation.name.required")),
        email: yup
            .string()
            .typeError(t("validation.email.typeError"))
            .email(t("validation.email.email"))
            .required(t("validation.email.required")),
        phone: yup.string().required(t("validation.phone.required")),
        password: yup
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
        confirm_password: yup
            .string()
            .oneOf([yup.ref("password"), null], t("validation.confirmPassword.oneOf"))
            .required(t("validation.confirmPassword.required")),
    });

    const formik = useFormik({
        initialValues: {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            password: "",
            confirm_password: "",
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            console.log(values);

            registerSeller(values)
                .then((res) => {
                    setRegErr("");
                    localStorage.setItem("email", JSON.stringify(values.email));
                    setRegisterData({ ...values })
                    navigate("/seller/create-verify");
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
                                errorMessage.trim() ||
                                "An account with these details has already been registered."
                            );
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
        },
    });

    return (
        <div className={styles.main}>
            <TitleAndDesc title={"Create Your Seller Account"}
                desc={"Enter your details to get started"} />

            <StepWrap step={1} />


            <form className={styles.form} a
                onSubmit={(e) => {
                    e.preventDefault()
                    formik.handleSubmit()
                }}
            >
                <div className={styles.nameInpWrap}>
                    <InputSeller
                        required={true} circle={true}
                        type={"text"} title={"First Name"}
                        img={userIc}
                        name="first_name"
                        placeholder={"Your first name"}
                        value={formik.values.first_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.first_name}
                    />
                    <InputSeller
                        required={true}
                        circle={true}
                        type={"text"} title={"Last Name"}
                        img={userIc}
                        placeholder={"Your last name"}
                        name="last_name"
                        value={formik.values.last_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.last_name}

                    />
                </div>
                <InputSeller
                    required={true}
                    circle={true}
                    type={"email"} title={"Email"}
                    placeholder={"Your Email"}
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.email}
                />

                <InputSeller
                    required={true}
                    circle={true}
                    type={"tel"} title={"Phone Number"}
                    img={phoneIc}
                    placeholder={"Your phone"}
                    num={true}
                    name="phone"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.phone}
                />
                <InputSeller
                    required={true}
                    circle={true}
                    type={"password"} title={"Password"}
                    placeholder={"Your password"}
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.password}
                />
                <InputSeller
                    required={true}
                    circle={true}
                    type={"password"} title={"Confirm Password"}
                    placeholder={"Confirm password"}
                    name="confirm_password"
                    value={formik.values.confirm_password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.confirm_password}
                />

                {regErr && <p className={styles.errText}>{regErr}</p>}

                <div className={styles.checkWrap}>
                    <Checkbox checked={isAgree} onChange={(e) => {
                        setIsAgree(e.target.checked)
                    }} />
                    <p>
                        I agree with the
                        <a target="_blank" href={i18n.language === "en" ? "../../../../../../public/TermsEN.pdf" : "../../../../../../public/TermsCZ.pdf"}> terms & conditions </a>
                        and
                        <Link to={"/privacy-policy"}> privacy policy</Link>
                    </p>
                </div>

                <AuthBtnSeller
                    disabled={
                        !formik.isValid ||
                        !formik.dirty ||
                        !isAgree

                    } style={{ borderRadius: "16px" }} text={"Sign Up"} />
            </form>



        </div>
    )
}

export default CreateForm