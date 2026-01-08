import { useEffect, useState } from "react"

import AuthBtnSeller from "../../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import TitleAndDesc from "../../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import VerifyPinInput from "../../verifyPinInput/VerifyPinInput"

import emailIc from "../../../../../assets/Seller/register/emailIc.svg"

import styles from "./VerifyEmail.module.scss"
import StepWrap from "../../../../../ui/Seller/register/stepWrap/StepWrap"

const VeriFyEmail = () => {


    const [time, setTime] = useState(59);

    let interval;

    useEffect(() => {
        if (time > 0) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime - 1);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [time]);

    const handleSendAgain = () => {

        setTime(59);

    };

    return (
        <div className={styles.main}>

            <img className={styles.emailImg} src={emailIc} alt="" />

            <TitleAndDesc title={"Verify Your Email"} desc={"A 6-digit verification code was sent to"} />
            <p className={styles.emailText}>1@gmail.com</p>

            <StepWrap step={3} />

            <form className={styles.form}>
                <VerifyPinInput />
                <AuthBtnSeller style={{ borderRadius: "16px" }} text={"Confirm"} />

                <div className={styles.timerDiv}>
                    {time ? (
                        <p className={styles.resentText}>
                            Resend code in {`${time} s`}
                        </p>
                    ) : (
                        <button onClick={handleSendAgain} type="button" className={styles.resendBtn}>Resend code</button>
                    )}
                </div>
            </form>



        </div>
    )
}

export default VeriFyEmail