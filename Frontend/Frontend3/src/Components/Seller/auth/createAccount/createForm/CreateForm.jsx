import AuthBtnSeller from "../../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import TitleAndDesc from "../../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from '../../../../../ui/Seller/register/stepWrap/StepWrap'

import userIc from "../../../../../assets/Seller/register/userIc.svg"
import phoneIc from "../../../../../assets/Seller/register/phoneIc.svg"

import styles from "./CreateForm.module.scss"
import Checkbox from "../../../../../ui/Seller/newOrder/checkbox/Checkbox"

const CreateForm = () => {
    return (
        <div className={styles.main}>
            <TitleAndDesc title={"Create Your Seller Account"}
                desc={"Enter your details to get started"} />

            <StepWrap step={2} />


            <form className={styles.form}>
                <div className={styles.nameInpWrap}>
                    <InputSeller required={true} circle={true} type={"text"} title={"First Name"} img={userIc} />
                    <InputSeller required={true} circle={true} type={"text"} title={"Last Name"} img={userIc} />
                </div>
                <InputSeller required={true} circle={true} type={"email"} title={"Email"} />
                <InputSeller required={true} circle={true} type={"tel"} title={"Phone Number"} img={phoneIc} />
                <InputSeller required={true} circle={true} type={"password"} title={"Password"} />
                <InputSeller required={true} circle={true} type={"password"} title={"Confirm Password"} />

                <div className={styles.checkWrap}>
                    <Checkbox />
                    <p>
                        I agree with the <a href="#">terms & conditions</a> and <a href="#">privacy policy</a>
                    </p>
                </div>

                <AuthBtnSeller style={{ borderRadius: "16px" }} text={"Sign Up"} />
            </form>



        </div>
    )
}

export default CreateForm