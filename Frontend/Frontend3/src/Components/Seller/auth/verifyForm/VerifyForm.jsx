import { useEffect, useState } from "react"


import AuthBtnSeller from "../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import BackBtn from "../../../../ui/Seller/auth/backBtn/BackBtn"
import TitleAndDesc from "../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import VerifyPinInput from "../verifyPinInput/VerifyPinInput"

import styles from "./VerifyForm.module.scss"

const VerifyForm = () => {

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
            <BackBtn text={"Back"} />
            <TitleAndDesc title={"Verify your email"} desc={"A 6-digit verification code has been sent to"} />
            <p className={styles.emailText}>seller@example.com</p>

            <form className={styles.form}>
                <div className={styles.verifyInpWrap}>
                    <p>Enter verification code</p>
                    <VerifyPinInput />
                </div>
                <AuthBtnSeller text={"Confirm"} />
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

            <div className={styles.bottomLinkWrap}>
                <p>Didn't receive the code? Check your spam folder or try resending.</p>
            </div>

        </div>
    )
}

export default VerifyForm