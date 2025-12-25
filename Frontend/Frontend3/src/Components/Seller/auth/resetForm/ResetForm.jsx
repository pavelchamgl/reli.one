import AuthBtnSeller from "../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import BackBtn from "../../../../ui/Seller/auth/backBtn/BackBtn"
import FormLink from "../../../../ui/Seller/auth/formLink/FormLink"
import InputSeller from "../../../../ui/Seller/auth/inputSeller/InputSeller"
import TitleAndDesc from "../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"

import styles from "./ResetForm.module.scss"

const ResetForm = () => {
    return (
        <div className={styles.main}>
            <BackBtn text={"Back to login"} />
            <TitleAndDesc title={"Reset your password"} desc={"Enter the email address you used during registration."} />

            <form className={styles.form}>
                <InputSeller type={"email"} title={"Email"} />
                <AuthBtnSeller text={"Send code"} />
            </form>

            <div className={styles.bottomLinkWrap}>
                <p>Remember your password?</p>
                <FormLink text={"Log in instead"} />
            </div>

        </div>
    )
}

export default ResetForm