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
import { getOnboardingStatus } from "../../../../api/seller/onboarding";

const LoginForm = () => {

    const [regErr, setRegErr] = useState("");
    const [isLoading, setIsLoading] = useState(false)


    const { t } = useTranslation()
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { t: tOnb } = useTranslation('onbording')


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

            setIsLoading(true)

            try {
                const res = await login(values)
                localStorage.setItem("token", JSON.stringify(res.data));
                localStorage.setItem("email", JSON.stringify(values.email));


                dispatch(syncBasket())
                setIsLoading(false)

                const res2 = await getOnboardingStatus()
                console.log(res2);

                if (res2 && res2?.requires_onboarding === false) {
                    navigate("/seller/goods-choice"); // Обновление страницы
                }

                if (res2 && res2?.requires_onboarding === true && res2?.is_editable === false) {
                    navigate("/seller/application-sub");
                    // navigate("/seller/goods-choice"); // Обновление страницы

                }

                if (res2 && res2.requires_onboarding === true && res2?.is_editable === true) {
                    const onboardRoutes = ['personal', 'tax', 'address', 'bank', 'warehouse', 'return', 'documents']
                    const nextStep = res2?.next_step
                    const sellerType = res2?.seller_type
                    if (onboardRoutes.includes(nextStep)) {
                        if (sellerType === 'company') {
                            navigate("/seller/seller-company");
                        } else {
                            navigate("/seller/seller-info");
                        }
                    }
                    if (nextStep === "seller_type") {
                        navigate('/seller/seller-type')
                    }
                    if (nextStep === 'review') {
                        if (sellerType === 'company') {
                            navigate("/seller/seller-review-company");
                        } else {
                            navigate("/seller/seller-review");
                        }
                    }
                }



                // setRegErr("");
                // handleClose();
                // setIsBuy(false)

            } catch (err) {
                if (err.response) {
                    setIsLoading(false)
                    if (err.response.status === 500) {
                        setRegErr(tOnb('auth.errorOccurredOnServer'));
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
                            tOnb('auth.noActiveAccountFound')
                        );
                    } else {
                        setRegErr(tOnb('auth.unknownErrorOccurred'));
                    }
                } else {
                    setRegErr(tOnb('auth.failedToConnectToServer'));
                }
            }
        }
    })


    return (
        <div className={styles.main}>
            <TitleAndDesc title={tOnb('auth.login_title')}
                desc={tOnb('auth.login_subtitle')} />

            <form className={styles.form} onSubmit={(e) => {
                e.preventDefault()
                formik.handleSubmit()
            }}>
                <InputSeller
                    type={"email"} title={t('email')}
                    placeholder={"your.email@reli.one"}
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.errors.email}
                />
                <InputSeller type={"password"} title={t('password')}
                    placeholder={tOnb('auth.placeholder_password')}
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
                    loading={isLoading}
                    disabled={!formik.isValid || !formik.dirty}
                    text={tOnb('auth.login')} />

                <FormLink
                    url={"/seller/reset"}
                    text={tOnb('auth.forgot_password')} />
            </form>

            <div className={styles.bottomLinkWrap}>
                <p>{tOnb('auth.no_account')}</p>
                <FormLink url={"/seller/create-account"} text={tOnb('auth.signUp')} />
            </div>

        </div>
    )
}

export default LoginForm