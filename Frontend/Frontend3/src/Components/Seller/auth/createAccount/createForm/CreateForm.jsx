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
        const { t: tOnb } = useTranslation('onbording');

        const [isAgree, setIsAgree] = useState(false)
        const [regErr, setRegErr] = useState("");
        const [isLoading, setIsLoading] = useState(false)

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
                setIsLoading(true)


                registerSeller(values)
                    .then((res) => {
                        setRegErr("");
                        localStorage.setItem("email", JSON.stringify(values.email));
                        localStorage.setItem('first_name', JSON.stringify(values.first_name))
                        localStorage.setItem('last_name', JSON.stringify(values.last_name))
                        localStorage.setItem('phone', JSON.stringify(values.phone))
                        setRegisterData({ ...values })
                        setIsLoading(false)
                        navigate("/seller/create-verify");
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
                                    errorMessage.trim() ||
                                    tOnb('reg.error_conflict')
                                );
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
            },
        });

        return (
            <div className={styles.main}>
                <TitleAndDesc
                    title={tOnb('reg.title')}
                    desc={tOnb('reg.description')}
                />

                <StepWrap step={1} />

                <form className={styles.form}
                    onSubmit={(e) => {
                        e.preventDefault()
                        formik.handleSubmit()
                    }}
                >
                    <div className={styles.nameInpWrap}>
                        <InputSeller
                            required={true} circle={true}
                            type={"text"} title={tOnb('reg.label_first_name')}
                            img={userIc}
                            name="first_name"
                            placeholder={tOnb('reg.placeholder_first_name')}
                            value={formik.values.first_name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.errors.first_name}
                        />
                        <InputSeller
                            required={true}
                            circle={true}
                            type={"text"} title={tOnb('reg.label_last_name')}
                            img={userIc}
                            placeholder={tOnb('reg.placeholder_last_name')}
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
                        type={"email"} title={tOnb('reg.label_email')}
                        placeholder={tOnb('reg.placeholder_email')}
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.email}
                    />

                    <InputSeller
                        required={true}
                        circle={true}
                        type={"tel"} title={tOnb('reg.label_phone')}
                        img={phoneIc}
                        placeholder={tOnb('reg.placeholder_phone')}
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
                        type={"password"} title={tOnb('reg.label_password')}
                        placeholder={tOnb('reg.placeholder_password')}
                        name="password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.password}
                    />
                    <InputSeller
                        required={true}
                        circle={true}
                        type={"password"} title={tOnb('reg.label_confirm_password')}
                        placeholder={tOnb('reg.placeholder_confirm_password')}
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
                            {tOnb('reg.agree_text')}
                            <Link to={'https://info.reli.one/terms'}> {tOnb('reg.terms_link')} </Link>
                            {tOnb('reg.and')}
                            <Link to={"/privacy-policy"}> {tOnb('reg.privacy_link')}</Link>
                        </p>
                    </div>

                    <AuthBtnSeller
                        loading={isLoading}
                        disabled={
                            !formik.isValid ||
                            !formik.dirty ||
                            !isAgree
                        }
                        style={{ borderRadius: "16px" }}
                        text={tOnb('reg.button_signup')}
                    />
                </form>
            </div>
        )
    }

    export default CreateForm