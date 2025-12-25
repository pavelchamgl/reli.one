import greenMark from "../../../../assets/Seller/auth/greenMark.svg"

import AuthBtnSeller from "../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import TitleAndDesc from "../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"

import styles from "./SellerSuccForm.module.scss"

const SellerSuccForm = () => {
    return (
        <div className={styles.main}>
            <div className={styles.form}>
                <img className={styles.mark} src={greenMark} alt="" />
                <TitleAndDesc title={"Password Successfully Reset"}
                    desc={"Your password has been successfully reset. You can now log in with your new password."} />

                <AuthBtnSeller text={"Log in"} />
            </div>
            <p className={styles.tip}>
                <span>Security tip:</span>
                Never share your password with anyone. Our team will never ask for your password.
            </p>
        </div>
    )
}

export default SellerSuccForm