import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { useTranslation } from "react-i18next"

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
    const [isLoading, setIsLoading] = useState(false)

    const { t } = useTranslation('onbording')

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
                setRegErr(t('auth.failedToSendOTP'));
            });
    };

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const res = await emailPassConfirm({
                email: email,
                otp: value,
            });
            setRegErr("");
            localStorage.setItem("otp", JSON.stringify(value));
            navigate("/seller/create-password")
            setIsLoading(false)

        } catch (err) {

            if (err.response) {
                setIsLoading(false)
                if (err.response.status === 500) {
                    setRegErr(t('auth.errorOccurredOnServer'));
                } else if (err.response.status === 400) {
                    setRegErr(t('auth.otpExpiredOrInvalid'));
                } else if (err.response.status === 404) {
                    setRegErr(t('auth.userWithEmailNotFound'));
                } else {
                    setRegErr(t('auth.unknownErrorOccurred'));
                }
            } else {
                setRegErr(t('auth.failedToConnectToServer'));
            }
        }
    };

    return (
        <div className={styles.main}>
            <BackBtn text={t('auth.back')} />
            <TitleAndDesc title={t('auth.verify_email')} desc={t('auth.code_sent')} />
            <p className={styles.emailText}>{email ? email : "seller@example.com"}</p>

            <form className={styles.form} onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
            }}>
                <div className={styles.verifyInpWrap}>
                    <p>{t('auth.enter_code')}</p>
                    <VerifyPinInput value={value} setValue={setValue} />
                    {regErr && <p className={styles.errorText}>{regErr}</p>}
                </div>
                <AuthBtnSeller
                    loading={isLoading}
                    disabled={value.length === 0} text={t('auth.confirm')} />
                <div className={styles.timerDiv}>
                    {time ? (
                        <p className={styles.resentText}>
                            {t('auth.resendCodeIn')} <span className={styles.num}>{time}</span> s
                        </p>
                    ) : (
                        <button onClick={handleSendAgain} type="button" className={styles.resendBtn}>{t('auth.resendCode')}</button>
                    )}
                </div>
            </form>

            <div className={styles.bottomLinkWrap}>
                <p>{t('auth.didntReceiveTheCode')}</p>
            </div>

        </div>
    )
}

export default VerifyForm