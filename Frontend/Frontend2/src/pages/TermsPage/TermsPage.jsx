import { useTranslation } from "react-i18next"

import renderI18nRichText from "../../components/renderI18nRichText/RenderI18nRichText"
import Header from "../../components/Header/Header"
import Container from "../../components/Container/Container"

import styles from "./TermsPage.module.scss"
import FooterMain from "../../components/Footer/FooterMain/FooterMain"
import ScrollToTop from "../../components/ScrollToTop/ScrollToTop"
import WhatsappMeneger from "../../components/WhatsAppManager/WhatsAppManager"


const TermsPage = () => {

    const { t } = useTranslation('terms')

    return (
        <>
            <Header />
            <div className={styles.titleWrap}>
                <h1>{t("title")}</h1>
            </div>

            <Container>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("intro.title")}</h4>
                    {
                        [...Array(3)].map((item, index) => (

                            <p className={`${styles.textDesc} ${styles.margB}`}>
                                {renderI18nRichText({
                                    text: t(`intro.part${index + 1}`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </p>
                        ))
                    }

                    {
                        [...Array(10)].map((item, index) => (

                            <p className={`${styles.textDesc} ${styles.margB}`}>
                                <span>{t(`intro.list${index + 1}.title`)} </span>
                                {renderI18nRichText({
                                    text: t(`intro.list${index + 1}.desc`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </p>
                        ))
                    }



                    {/* <>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`confidentiality.part3.title`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>a) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part3.list1`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>b) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part3.list2`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>c) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part3.list3`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                    </> */}

                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("service.title")}</h4>
                    {
                        [1, 2, 'a) ', 'b) ', 'c) ', 'd) '].map((item, index) => {
                            if (index > 1) {
                                return (
                                    <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                                        <span>{item}</span>
                                        {renderI18nRichText({
                                            text: t(`service.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            } else {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`intro.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            }
                        }
                        )
                    }
                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("registration.title")}</h4>
                    {
                        [...Array(13)].map((item, index) => {
                            if (index === 2) {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`registration.part3`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                        <a className={styles.emailText} href="mailto:office@reli.one">{t(`registration.email`)}</a>
                                        {renderI18nRichText({
                                            text: t(`registration.otherPart3`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            } else {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`registration.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            }
                        }
                        )
                    }

                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("ordering.title")}</h4>
                    {
                        [...Array(5)].map((item, index) => {
                            if (index === 3) {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`ordering.part4`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                        <a className={styles.emailText} href="mailto:office@reli.one">{t(`ordering.email`)}</a>
                                        {renderI18nRichText({
                                            text: t(`ordering.part4Other`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            } else {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`ordering.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            }
                        }
                        )
                    }

                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("delivery.title")}</h4>
                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`delivery.part1`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>

                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("withdrawal.title")}</h4>
                    {
                        [...Array(4)].map((item, index) => {
                            if (index === 1) {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`withdrawal.part2`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                        <a className={styles.emailText} href="mailto:office@reli.one">{t(`withdrawal.email`)}</a>
                                        {renderI18nRichText({
                                            text: t(`withdrawal.part2Other`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            } else {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`withdrawal.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            }
                        }
                        )
                    }

                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("complaints.title")}</h4>
                    {
                        [...Array(6), 'a) ', 'b) ', 'c) ', 'd) ', ...Array(6)].map((item, index) => {
                            if (index > 5 && index < 10) {
                                return (
                                    <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                                        <span>{item}</span>
                                        {renderI18nRichText({
                                            text: t(`complaints.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            } else {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`complaints.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            }
                        }
                        )
                    }

                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("copyright.title")}</h4>
                    {
                        [...Array(2)].map((item, index) => {

                            return (
                                <p className={`${styles.textDesc} ${styles.margB}`}>
                                    {renderI18nRichText({
                                        text: t(`copyright.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }

                        )
                    }

                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("personalData.title")}</h4>
                    {
                        [...Array(2)].map((item, index) => {

                            return (
                                <p className={`${styles.textDesc} ${styles.margB}`}>
                                    {renderI18nRichText({
                                        text: t(`personalData.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }

                        )
                    }

                </div>

                <div style={{ marginBottom: "30px" }} className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("finalProvisions.title")}</h4>
                    {
                        [...Array(9)].map((item, index) => {

                            if (index === 5) {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`finalProvisions.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                        <a href="mailto:office@reli.one" className={styles.emailText}>office@reli.one.</a>
                                    </p>
                                )
                            } else {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`finalProvisions.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            }

                        }

                        )
                    }

                </div>
            </Container>
            <FooterMain />
            <ScrollToTop />
            <WhatsappMeneger />
        </>
    )
}

export default TermsPage