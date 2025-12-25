import { useFormik } from "formik"

import TitleAndDesc from '../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc'
import InputSeller from '../../../../ui/Seller/auth/inputSeller/InputSeller'
import AuthBtnSeller from '../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller'
import FormLink from '../../../../ui/Seller/auth/formLink/FormLink'

import styles from "./LoginForm.module.scss"

const LoginForm = () => {


    return (
        <div className={styles.main}>
            <TitleAndDesc title={"Log in to Seller Panel"} desc={"Enter your credentials to access your dashboard"} />

            <form className={styles.form}>
                <InputSeller type={"email"} title={"Email"} />
                <InputSeller type={"password"} title={"Password"} />
                <AuthBtnSeller text={"Log in"} />
                <FormLink text={"Forgot your password?"} />
            </form>

            <div className={styles.bottomLinkWrap}>
                <p>Don't have an account?</p>
                <FormLink text={"Sign up here"} />
            </div>

        </div>
    )
}

export default LoginForm