import { useTranslation } from 'react-i18next'
import Container from '../ui/Container/Container'

import styles from "../styles/GeneralDataProtection.module.scss"
import { useEffect } from 'react'

const GeneralDataProtection = () => {

    const { t } = useTranslation()


    return (
        <Container>
            <div className={styles.main}>
                <h1 className={styles.title} style={{ marginBottom: "30px" }}>{t("generalProtectionTitle")}</h1>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("generalProtectionIntro.title")}</h4>
                    <p className={styles.textDesc}>{t("generalProtectionIntro.desc")}</p>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("generalScope.title")}</h4>
                    <p className={styles.textDesc}>{t("generalScope.desc")}</p>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("generalDataCollection.title")}</h4>
                    <ul className={styles.textList}>
                        <li>{t("generalDataCollection.list.text1")}</li>
                        <li>{t("generalDataCollection.list.text2")}</li>
                        <li>{t("generalDataCollection.list.text3")}</li>
                        <li>{t("generalDataCollection.list.text4")}</li>
                    </ul>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("generalBasis.title")}</h4>
                    <p className={styles.textDesc}>{t("generalBasis.desc")}</p>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("generalDataSecurity.title")}</h4>
                    <ul className={styles.textList}>
                        <li>{t("generalDataSecurity.list.text1")}</li>
                        <li>{t("generalDataSecurity.list.text2")}</li>
                    </ul>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("dataSubject.title")}</h4>
                    <ul className={styles.textList}>
                        <li>{t("dataSubject.list.text1")}</li>
                        <li>{t("dataSubject.list.text2")}</li>
                    </ul>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("dataBreach.title")}</h4>
                    <ul className={styles.textList}>
                        <li>{t("dataBreach.list.text1")}</li>
                        <li>{t("dataBreach.list.text2")}</li>
                    </ul>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("internationalDataTransfers.title")}</h4>
                    <ul className={styles.textList}>
                        <li>{t("internationalDataTransfers.list.text1")}</li>
                        <li>{t("internationalDataTransfers.list.text2")}</li>
                    </ul>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("dataProcessingAgreement.title")}</h4>
                    <ul className={styles.textList}>
                        <li>{t("dataProcessingAgreement.list.text1")}</li>
                        <li>{t("dataProcessingAgreement.list.text2")}</li>
                    </ul>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("trainingAndAwareness.title")}</h4>
                    <ul className={styles.textList}>
                        <li>{t("trainingAndAwareness.list.text1")}</li>
                        <li>{t("trainingAndAwareness.list.text2")}</li>
                    </ul>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("complianceChecksAndAudits.title")}</h4>
                    <ul className={styles.textList}>
                        <li>{t("complianceChecksAndAudits.list.text1")}</li>
                        <li>{t("complianceChecksAndAudits.list.text2")}</li>
                    </ul>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("policyReview.title")}</h4>
                    <p className={styles.textDesc}>{t("policyReview.desc")}</p>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("moreInformation.title")}</h4>
                    <p className={styles.textDesc}>{t("moreInformation.desc")}</p>
                    <ul className={styles.textList}>
                        <li>{t("moreInformation.list.text1.otherText")}<a className={styles.emailText} href='https://gdpr.eu/' target='_blank'>{t("moreInformation.list.text1.email")}</a></li>
                    </ul>
                </div>
            </div>
        </Container>
    )
}

export default GeneralDataProtection