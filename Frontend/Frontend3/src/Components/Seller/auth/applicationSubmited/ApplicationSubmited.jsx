import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { getOnboardingStatus } from "../../../../api/seller/onboarding"
import TitleAndDesc from "../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import bigMark from "../../../../assets/Seller/register/markBig.svg"
import markSmall from "../../../../assets/Seller/register/markGreenSmall.svg"
import homeIc from "../../../../assets/Seller/register/homeIc.svg"
import FormLink from "../../../../ui/Seller/auth/formLink/FormLink"

import styles from "./ApplicationSubmited.module.scss"

const ApplicationSubmitedContent = () => {

    const { t } = useTranslation('onbording')

    const navigate = useNavigate();

    useEffect(() => {
        getOnboardingStatus().then((res) => {
            console.log(res);

            if (res && res?.status === 'rejected') {
                const onboardRoutes = ['personal', 'tax', 'address', 'bank', 'warehouse', 'return', 'documents']
                const nextStep = res?.next_step
                const sellerType = res?.seller_type
                if (onboardRoutes.includes(nextStep)) {
                    if (sellerType === 'company') {
                        navigate("/seller/seller-company");
                    } else {
                        navigate("/seller/seller-info");
                    }
                }
            }

            if (res && res?.requires_onboarding === false) {
                navigate("/seller/goods-choice"); // Обновление страницы
            }

            if (res && res?.requires_onboarding === true && res?.is_editable === false) {
                navigate("/seller/application-sub");
                // navigate("/seller/goods-choice"); // Обновление страницы
            }

            if (res && res.requires_onboarding === true && res?.is_editable === true) {
                const onboardRoutes = ['personal', 'tax', 'address', 'bank', 'warehouse', 'return', 'documents']
                const nextStep = res?.next_step
                const sellerType = res?.seller_type
                if (onboardRoutes.includes(nextStep)) {
                    if (sellerType === 'company') {
                        navigate("/seller/seller-company");
                    } else {
                        navigate("/seller/seller-info");
                    }
                }
                if (nextStep === "seller_type") {
                    navigate('/seller/seller-type')
                }
                if (nextStep === 'review') {
                    if (sellerType === 'company') {
                        navigate("/seller/seller-review-company");
                    } else {
                        navigate("/seller/seller-review");
                    }
                }
            }
        })
    }, [])

    return (
        <div className={styles.main}>
            <img className={styles.bigImg} src={bigMark} alt="" />
            <TitleAndDesc
                title={t('onboard.status.submitted_title')}
                desc={t('onboard.status.submitted_desc')}
            />

            <div className={styles.statusBlock}>
                <div className={styles.applicationStatus}>
                    <div>
                        <img src={markSmall} alt="" />
                    </div>

                    <div>
                        <p>{t('onboard.status.application_status_label')}</p>
                        <span>{t('onboard.status.pending_status')}</span>
                    </div>
                </div>

                <div className={styles.applicationInfo}>
                    <p>{t('onboard.status.pending_time')}</p>
                    <p>{t('onboard.status.notification')}</p>
                </div>
            </div>

            <div className={styles.whatHappens}>
                <p>{t('onboard.status.next_title')}</p>
                <ul>
                    <li>
                        <span>1</span>
                        {t('onboard.status.next_step_1')}
                    </li>
                    <li>
                        <span>2</span>
                        {t('onboard.status.next_step_2')}
                    </li>
                    <li>
                        <span>3</span>
                        {t('onboard.status.next_step_3')}
                    </li>
                </ul>
            </div>

            <a href="https://info.reli.one/" className={styles.returnHomeBtn}>
                <img src={homeIc} alt="" />
                {t('onboard.common.return_to_homepage')}
            </a>

            <div className={styles.bottomLinkWrap}>
                <p>{t('onboard.common.need_help')}</p>
                <a href="https://info.reli.one/#contact" onClick={() => {
                    cookieStore.set("contact", JSON.stringify(true))
                }} className={styles.linkBtn}>
                    {t('onboard.common.contact_support')}
                </a>
            </div>
        </div>
    )
}

export default ApplicationSubmitedContent