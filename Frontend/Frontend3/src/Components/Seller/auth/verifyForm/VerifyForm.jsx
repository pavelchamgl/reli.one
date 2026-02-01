import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"


import AuthBtnSeller from "../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import BackBtn from "../../../../ui/Seller/auth/backBtn/BackBtn"
import TitleAndDesc from "../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import VerifyPinInput from "../verifyPinInput/VerifyPinInput"
import { emailPassConfirm, passSendOtp, sendOtp } from "../../../../api/auth"
import { syncBasket } from "../../../../redux/basketSlice"

import styles from "./VerifyForm.module.scss"

const VerifyForm = () => {

    const [time, setTime] = useState(59);
    const [value, setValue] = useState("");
    const [regErr, setRegErr] = useState("");

    const navigate = useNavigate();
    const dispatch = useDispatch();


    let interval;

    useEffect(() => {
        if (time > 0) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime - 1);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [time]);

    const email = JSON.parse(localStorage.getItem("email"));

    const handleSendAgain = () => {
        passSendOtp({
            email: email
        })
            .then(() => {
                setTime(59);
            })
            .catch((err) => {
                setRegErr("Failed to send OTP. Please try again later.");
            });
    };

    const handleSubmit = async () => {
        try {
            const res = await emailPassConfirm({
                email: email,
                otp: value,
            });
            setRegErr("");
            localStorage.setItem("otp", JSON.stringify(value));
            navigate("/seller/create-password")

        } catch (err) {

            if (err.response) {
                if (err.response.status === 500) {
                    setRegErr("An error occurred on the server. Please try again later.");
                } else if (err.response.status === 400) {
                    setRegErr("The specified OTP has expired or is invalid");
                } else if (err.response.status === 404) {
                    setRegErr("User with the specified email address not found");
                } else {
                    setRegErr("An unknown error occurred.");
                }
            } else {
                setRegErr("Failed to connect to the server. Check your internet connection.");
            }
        }
    };

    return (
        <div className={styles.main}>
            <BackBtn text={"Back"} />
            <TitleAndDesc title={"Verify your email"} desc={"A 6-digit verification code has been sent to"} />
            <p className={styles.emailText}>{email ? email : "seller@example.com"}</p>

            <form className={styles.form} onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
            }}>
                <div className={styles.verifyInpWrap}>
                    <p>Enter verification code</p>
                    <VerifyPinInput value={value} setValue={setValue} />
                    {regErr && <p className={styles.errorText}>{regErr}</p>}
                </div>
                <AuthBtnSeller disabled={value.length === 0} text={"Confirm"} />
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