import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import greenMark from "../../../../assets/Seller/auth/greenMark.svg"

import AuthBtnSeller from "../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import TitleAndDesc from "../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"

import styles from "./SellerSuccForm.module.scss"

const SellerSuccForm = () => {

    const navigate = useNavigate()

    const { t } = useTranslation('onbording')

    return (
        <div className={styles.main}>
            <div className={styles.form}>
                <img className={styles.mark} src={greenMark} alt="" />
                <TitleAndDesc title={t('auth.password_reset_success')}
                    desc={`
                            ${t('auth.password_reset_success_alt')}
                            ${t('auth.login_with_new_password')}
                    `} />

                <AuthBtnSeller handleClick={() => {
                    navigate("/seller/login")
                }} text={t('auth.login')} />
            </div>
            <p className={styles.tip}>
                <span>{t('auth.security_tip_title')}</span>
                {t('auth.security_tip_text')}
            </p>
        </div>
    )
}

export default SellerSuccForm