import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

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

    const { t: tOnb } = useTranslation('onbording')

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
                    setRegErr(tOnb('auth.errorOccurredOnServer'));
                } else if (err.response.status === 400) {
                    setRegErr(tOnb('auth.otpExpiredOrInvalid'));
                } else if (err.response.status === 404) {
                    setRegErr(tOnb('auth.userWithEmailNotFound'));
                } else {
                    setRegErr(tOnb('auth.unknownErrorOccurred'));
                }
            } else {
                setRegErr(tOnb('auth.failedToConnectToServer'));
            }
        }
    };

    const handleSendAgain = () => {
        sendOtp({ email: email })
            .then(() => {
                setTime(59);
            })
            .catch((err) => {
                setRegErr(tOnb('auth.failedToSendOTP'));
            });
    };

    return (
        <div className={styles.main}>
            <img className={styles.emailImg} src={emailIc} alt="" />

            <TitleAndDesc
                title={tOnb('onboard.verification.verify_email')}
                desc={tOnb('onboard.verification.code_sent')}
            />
            <p className={styles.emailText}>{email ? email : "1@gmail.com"}</p>

            <StepWrap step={2} />

            <form className={styles.form}
                onSubmit={(e) => {
                    e.preventDefault()
                    handleSubmit()
                }}
            >
                <VerifyPinInput setValue={setValue} value={value} />

                {regErr && <p className={styles.errorText}>{tOnb(regErr)}</p>}

                <AuthBtnSeller
                    loading={isLoading}
                    disabled={value.length === 0}
                    style={{ borderRadius: "16px" }}
                    text={tOnb('onboard.common.confirm')}
                />

                <div className={styles.timerDiv}>
                    {time ? (
                        <p className={styles.resentText}>
                            {tOnb('onboard.verification.resend_code')} <span className={styles.num}>{time}</span> s
                        </p>
                    ) : (
                        <button onClick={handleSendAgain} type="button" className={styles.resendBtn}>
                            {tOnb('auth.resendCode')}
                        </button>
                    )}
                </div>
            </form>
        </div>
    )
}

export default VeriFyEmail