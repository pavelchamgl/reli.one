import AuthBtnSeller from "../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import InputSeller from "../../../../ui/Seller/auth/inputSeller/InputSeller"
import TitleAndDesc from "../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"

import xIc from "../../../../assets/Seller/auth/xIc.svg"
import mark from "../../../../assets/Seller/auth/mark.svg"

import styles from "./CreatePassForm.module.scss"

const CreatePassForm = () => {
    return (
        <div className={styles.main}>
            <TitleAndDesc title={"Create a new password"}
                desc={"Your new password must meet the requirements below"} />

            <form className={styles.form}>
                <InputSeller type={"password"} title={"New password"} />
                <div className={styles.validationBlock}>
                    <p>Password requirements:</p>
                    <ul>
                        <li>
                            <img src={xIc} alt="" />
                            At least 8 characters long
                        </li>
                        <li>
                            <img src={xIc} alt="" />
                            Contains 1 uppercase letter
                        </li>
                        <li>
                            <img src={xIc} alt="" />
                            Contains 1 digit
                        </li>
                        <li>
                            <img src={xIc} alt="" />
                            Contains 1 special character (!@#$%^&*)
                        </li>
                    </ul>
                </div>
                <InputSeller type={"password"} title={"Confirm password"} />
                <AuthBtnSeller text={"Save new password"} />
            </form>

            <div className={styles.bottomLinkWrap}>
                <p>Make sure to save your new password in a secure location</p>
            </div>

        </div>
    )
}

export default CreatePassForm