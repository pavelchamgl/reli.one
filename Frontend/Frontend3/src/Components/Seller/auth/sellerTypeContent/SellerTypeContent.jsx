import { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom"
import { useTranslation } from 'react-i18next'

import TitleAndDesc from '../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc'
import AuthBtnSeller from '../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller'
import solfIc from "../../../../assets/Seller/register/solfIc.svg"
import companyIc from "../../../../assets/Seller/register/companyBigIc.svg"
import sellerTypeMark from "../../../../assets/Seller/register/sellerTypeMark.svg"
import StepWrap from '../../../../ui/Seller/register/stepWrap/StepWrap'
import { getOnboardingStatus, postSellerType } from '../../../../api/seller/onboarding'
import { ErrToast } from '../../../../ui/Toastify'

import styles from "./SellerTypeContent.module.scss"

const SellerTypeContent = () => {

    const navigate = useNavigate()

    const { t } = useTranslation('onbording')

    const [company, setCompany] = useState(null)
    const [status, setStatus] = useState(null)

    useEffect(() => {
        getOnboardingStatus().then((res) => {
            setStatus(res.status)

            if (res?.status === "pending_verification") {

                ErrToast(t('onboard.common.already_selected'))
            }
        }).catch((err) => {
            console.log(err);

            ErrToast(err.message)

        })

    }, [])
    // ? для дальнейшей обработки и проверки статуса

    const handleChooseSellerType = async () => {
        if (!company) return;
        if (status === "pending_verification") return

        try {
            const res = await postSellerType(company);

            if (res.status === 200) {
                if (company === "company") {
                    navigate("/seller/seller-company")
                } else {
                    navigate("/seller/seller-info")
                }
            }

        } catch (err) {
            console.log("Ошибка:", err);

            if (err.status === 401) {
                ErrToast(t('onboard.common.auth_required'))
                // например редирект на логин
                console.log("Не авторизован");
            }

            if (err.status === 403) {
                ErrToast(t('onboard.common.access_denied'))
                console.log("Нет доступа");
            }

            ErrToast(err?.message)
        }
    };



    return (
        <div className={styles.mainWrap}>
            <TitleAndDesc
                title={t('onboard.selection.choose_type')}
                desc={t('onboard.selection.select_option')}
            />

            <StepWrap step={3} />

            <div className={styles.typeBtnWrap}>
                <button
                    onClick={() => {
                        setCompany("self_employed")
                    }}
                    style={{
                        border: company === "self_employed" ? "1.33px solid #3f7f6d" : ""
                    }} className={styles.typeBtn}>
                    <img src={solfIc} alt="" />
                    <h4>{t('onboard.selection.self_employed')}</h4>
                    <p>{t('onboard.selection.self_employed_desc')}</p>

                    {
                        company === "self_employed" &&
                        <img className={styles.sellerTypeMark} src={sellerTypeMark} alt="" />
                    }
                </button>

                <button
                    onClick={() => {
                        setCompany("company")
                    }}
                    style={{
                        border: company === "company" ? "1.33px solid #3f7f6d" : ""
                    }} className={styles.typeBtn}
                >
                    <img src={companyIc} alt="" />
                    <h4>{t('onboard.selection.company_legal')}</h4>
                    <p>{t('onboard.selection.company_legal_desc')}</p>

                    {
                        company === "company" &&
                        <img className={styles.sellerTypeMark} src={sellerTypeMark} alt="" />
                    }
                </button>
            </div>

            {
                company ?
                    <AuthBtnSeller
                        disabled={!company}
                        handleClick={handleChooseSellerType}
                        style={{
                            maxWidth: "123px",
                            borderRadius: "16px"
                        }}
                        text={t('onboard.common.continue')}
                    />
                    :
                    null
            }
        </div>
    )
}

export default SellerTypeContent