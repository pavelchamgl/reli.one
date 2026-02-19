import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import AuthBtnSeller from "../../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import TitleAndDesc from "../../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import VerifyPinInput from "../../verifyPinInput/VerifyPinInput"
import { emailConfirm, sendOtp } from "../../../../../api/auth"
import StepWrap from "../../../../../ui/Seller/register/stepWrap/StepWrap"

import emailIc from "../../../../../assets/Seller/register/emailIc.svg"


import styles from "./VerifyEmail.module.scss"

const VeriFyEmail = () => {


    const [value, setValue] = useState("")
    const [regErr, setRegErr] = useState("");
    const [time, setTime] = useState(59);
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()

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

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const res = await emailConfirm({
                email: email,
                otp: value,
            });
            setRegErr("");
            localStorage.setItem("token", JSON.stringify(res.data));
            navigate("/seller/seller-type")
            setIsLoading(false)

        } catch (err) {

            if (err.response) {
                setIsLoading(false)
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

    const handleSendAgain = () => {
        sendOtp({ email: email })
            .then(() => {
                setTime(59);
            })
            .catch((err) => {
                setRegErr("Failed to send OTP. Please try again later.");
            });
    };

    return (
        <div className={styles.main}>

            <img className={styles.emailImg} src={emailIc} alt="" />

            <TitleAndDesc title={"Verify Your Email"} desc={"A 6-digit verification code was sent to"} />
            <p className={styles.emailText}>{email ? email : "1@gmail.com"}</p>

            <StepWrap step={2} />

            <form className={styles.form}
                onSubmit={(e) => {
                    e.preventDefault()
                    handleSubmit()
                }}
            >
                <VerifyPinInput setValue={setValue} value={value} />
                {regErr && <p className={styles.errorText}>{regErr}</p>}
                <AuthBtnSeller
                loading={isLoading}
                disabled={value.length === 0} style={{ borderRadius: "16px" }} text={"Confirm"} />

                <div className={styles.timerDiv}>
                    {time ? (
                        <p className={styles.resentText}>
                            Resend code in <span className={styles.num}>{time}</span> s
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