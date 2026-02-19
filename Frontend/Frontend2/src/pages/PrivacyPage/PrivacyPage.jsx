import { useTranslation } from "react-i18next"

import renderI18nRichText from "../../components/renderI18nRichText/RenderI18nRichText"

import Container from "../../components/Container/Container"
import FooterMain from "../../components/Footer/FooterMain/FooterMain"
import Header from "../../components/Header/Header"
import ScrollToTop from "../../components/ScrollToTop/ScrollToTop"
import WhatsappMeneger from "../../components/WhatsAppManager/WhatsAppManager"


import styles from "./PrivacyPage.module.scss"

const PrivacyPage = () => {

    const { t, i18n } = useTranslation('policy')

    return (
        <>
            <Header />

            <div className={styles.titleWrap}>
                <div>
                    <h1 className={styles.title} style={{ marginBottom: "30px" }}>{t("mainTitle")}</h1>
                    <p>{t("mainDesc")}</p>
                </div>

            </div>
            <Container>
                <div className={styles.main}>


                    <div className={styles.textBlock}>
                        <h4 className={styles.textTitle}>{t("intro.title")}</h4>
                        {
                            [...Array(3)].map((_, index) => {
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
                            )
                        }

                        <ul className={styles.yellowList}>
                            {
                                [...Array(6)].map((_, index) => {
                                    if (i18n.language === "cz" && index === 5) return
                                    return (
                                        <li>
                                            <span>{t(`intro.list.list${index + 1}.title`)}</span>
                                            {renderI18nRichText({
                                                text: t(`intro.list.list${index + 1}.desc`),
                                                numberClassName: styles.num,
                                                linkClassName: styles.emailText,
                                                headingNumberClassName: styles.headNum
                                            })}
                                        </li>
                                    )
                                }
                                )
                            }
                        </ul>
                    </div>



                    <div className={styles.textBlock}>
                        <h4 className={styles.textTitle}>{t("basicInfo.title")}</h4>
                        {
                            i18n.language === "en" ?
                                <>
                                    <p className={`${styles.textDesc}`} style={{ fontWeight: 700 }}><span className={styles.num}>2.1.</span>{t(`basicInfo.part2_1.title`)}</p>
                                    <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t(`basicInfo.part2_1.desc`)}
                                        <a className={styles.emailText} href="mailto:privacy.reli.one@gmail.com.">{t("basicInfo.email")}</a>
                                    </p>
                                </>
                                :
                                <p className={styles.textDesc}>
                                    {renderI18nRichText({
                                        text: t(`basicInfo.part2_1`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                    <a className={styles.emailText} href="mailto:privacy.reli.one@gmail.com.">{t("basicInfo.email")}</a>
                                </p>
                        }
                        {
                            [...Array(5)].map((_, index) => {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`basicInfo.part${index + 1}`),
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
                        <h4 className={styles.textTitle}>{t("processingServices.title")}</h4>

                        <h4 className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {
                                    renderI18nRichText({
                                        text: t(`processingServices.administration.title`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })
                                }
                            </span>
                        </h4>

                        {
                            [...Array(8)].map((_, index) => {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`processingServices.administration.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            }
                            )
                        }

                        <h4 className={`${styles.textDesc} ${styles.margB}`} style={{ marginTop: "20px" }}>
                            <span>
                                {
                                    renderI18nRichText({
                                        text: t(`processingServices.processing.title`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })
                                }
                            </span>
                        </h4>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`processingServices.processing.part1`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>


                        <div className={`${styles.noticeBlock} ${styles.margB}`}>
                            <p className={`${styles.textDesc} ${styles.margB}`}>
                                <span>
                                    {t("processingServices.processing.noticeUsersTitle")}
                                </span>
                            </p>
                            <p className={`${styles.textDesc} ${styles.margB}`}>
                                {renderI18nRichText({
                                    text: t(`processingServices.processing.noticeUsers`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </p>
                        </div>



                        <div className={`${styles.noticeEnd} ${styles.margB}`}>
                            <p className={`${styles.textDesc} ${styles.margB}`}>
                                <span>
                                    {t("processingServices.processing.noticeEndUsersTitle")}
                                </span>
                            </p>
                            <p className={`${styles.textDesc} ${styles.margB}`}>
                                {renderI18nRichText({
                                    text: t(`processingServices.processing.noticeEndUsers`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </p>
                        </div>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("processingServices.processing.purposeTitle")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`processingServices.processing.purpose`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("processingServices.processing.dataTitle")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`processingServices.processing.data`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("processingServices.processing.disclosureTitle")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`processingServices.processing.disclosure`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("processingServices.processing.retentionTitle")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`processingServices.processing.retention`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>


                    </div>

                    <div className={styles.textBlock}>
                        <h4 className={styles.textTitle}>{t("endUsersProcessing.title")}</h4>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("endUsersProcessing.administration.title")}
                            </span>
                        </p>
                        {
                            [...Array(7)].map((_, index) => {
                                return (
                                    <>

                                        <p className={`${styles.textDesc} ${styles.margB}`}>
                                            {renderI18nRichText({
                                                text: t(`endUsersProcessing.administration.part${index + 1}`),
                                                numberClassName: styles.num,
                                                linkClassName: styles.emailText,
                                                headingNumberClassName: styles.headNum
                                            })}
                                        </p>
                                    </>
                                )
                            }
                            )
                        }



                        <div className={styles.fourPartBlock}>
                            <p className={`${styles.textDesc} `} style={{ fontWeight: 700 }}>
                                <span>
                                    {renderI18nRichText({
                                        text: t(`endUsersProcessing.administration.deliveryToUsers.title`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </span>
                            </p>
                            <span className={`${styles.textDesc} ${styles.margB}`} >
                                {renderI18nRichText({
                                    text: t(`endUsersProcessing.administration.deliveryToUsers.part1`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </span>
                        </div>



                        <div className={styles.fourPartBlock} style={{ marginTop: "10px" }}>
                            <p className={`${styles.textDesc} `} style={{ fontWeight: 700 }}>
                                {renderI18nRichText({
                                    text: t(`endUsersProcessing.administration.courierDelivery.title`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </p>

                            <span className={`${styles.textDesc} `} >
                                {renderI18nRichText({
                                    text: t(`endUsersProcessing.administration.courierDelivery.part1`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </span>
                            <span className={`${styles.textDesc} `} >
                                {renderI18nRichText({
                                    text: t(`endUsersProcessing.administration.courierDelivery.part1Other`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </span>
                            <ul className={styles.yellowList} style={{ marginTop: "10px" }}>
                                {
                                    [...Array(3)].map((_, index) => {
                                        return (
                                            <li>
                                                <span>{t(`endUsersProcessing.administration.courierDelivery.list.list${index + 1}.title`)}</span>
                                                {renderI18nRichText({
                                                    text: t(`endUsersProcessing.administration.courierDelivery.list.list${index + 1}.desc`),
                                                    numberClassName: styles.num,
                                                    linkClassName: styles.emailText,
                                                    headingNumberClassName: styles.headNum
                                                })}
                                            </li>
                                        )
                                    }
                                    )
                                }
                            </ul>
                            {
                                [3, 4, 5].map((item, index) => {
                                    return (
                                        <>

                                            <span style={{ display: "block" }} className={`${styles.textDesc} ${styles.margB}`}>
                                                {renderI18nRichText({
                                                    text: t(`endUsersProcessing.administration.courierDelivery.part${item}`),
                                                    numberClassName: styles.num,
                                                    linkClassName: styles.emailText,
                                                    headingNumberClassName: styles.headNum
                                                })}
                                            </span>
                                        </>
                                    )
                                }
                                )
                            }
                        </div>


                        <div className={styles.fourPartBlock} style={{ marginTop: "10px" }}>
                            <p className={`${styles.textDesc} `} style={{ fontWeight: 700 }}>
                                {renderI18nRichText({
                                    text: t(`endUsersProcessing.administration.paymentProviders.title`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </p>

                            {
                                i18n.language === "cz" ?
                                    <span className={`${styles.textDesc} ${styles.margB}`} >
                                        {renderI18nRichText({
                                            text: t(`endUsersProcessing.administration.paymentProviders.part2`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </span>
                                    :
                                    [...Array(4)].map((item, index) => {
                                        return (
                                            <span style={{ display: "block" }} className={`${styles.textDesc} ${styles.margB}`} >
                                                {renderI18nRichText({
                                                    text: t(`endUsersProcessing.administration.paymentProviders.part${index + 1}`),
                                                    numberClassName: styles.num,
                                                    linkClassName: styles.emailText,
                                                    headingNumberClassName: styles.headNum
                                                })}
                                            </span>
                                        )
                                    }
                                    )
                            }
                            {
                                i18n?.language === "en" &&

                                <>
                                    <ul style={{ marginTop: "10px" }} className={styles.yellowList}>
                                        {
                                            [...Array(3)].map((_, index) => {
                                                return (
                                                    <li>
                                                        {renderI18nRichText({
                                                            text: t(`endUsersProcessing.administration.paymentProviders.list.list${index + 1}.desc`),
                                                            numberClassName: styles.num,
                                                            linkClassName: styles.emailText,
                                                            headingNumberClassName: styles.headNum
                                                        })}
                                                    </li>
                                                )
                                            }
                                            )
                                        }
                                    </ul>
                                    {
                                        [6, 7].map((item, index) => {
                                            return (
                                                <>

                                                    <span style={{ display: "block" }} className={`${styles.textDesc} ${styles.margB}`}>
                                                        {renderI18nRichText({
                                                            text: t(`endUsersProcessing.administration.paymentProviders.part${item}`),
                                                            numberClassName: styles.num,
                                                            linkClassName: styles.emailText,
                                                            headingNumberClassName: styles.headNum
                                                        })}
                                                    </span>
                                                </>
                                            )
                                        }
                                        )
                                    }
                                </>
                            }
                        </div>








                        {
                            i18n.language === "cz" ?

                                <div className={styles.fourPartBlock}>
                                    <span className={`${styles.textDesc} ${styles.margB}`}>
                                        <span>{t(`endUsersProcessing.administration.badText.part1B`)}</span>
                                        {t(`endUsersProcessing.administration.badText.part1`)}
                                        <span>{t(`endUsersProcessing.administration.badText.meta`)}</span>
                                        {t(`endUsersProcessing.administration.badText.part1Other`)}
                                        <span>{t(`endUsersProcessing.administration.badText.part2B`)}</span>
                                        {t(`endUsersProcessing.administration.badText.part2`)}
                                        <span>{t(`endUsersProcessing.administration.badText.part2BCont`)}</span>
                                        {t(`endUsersProcessing.administration.badText.part2cont`)}
                                        {t(`endUsersProcessing.administration.badText.part2End`)}
                                    </span>

                                    <span className={`${styles.textDesc} ${styles.margB}`}>
                                        {t(`endUsersProcessing.administration.badText1.part1`)}
                                        <span>{t(`endUsersProcessing.administration.badText1.googleAds`)}</span>
                                        {t(`endUsersProcessing.administration.badText1.part1Cont`)}
                                        <span>{t(`endUsersProcessing.administration.badText1.googleLcc`)}</span>
                                        {t(`endUsersProcessing.administration.badText1.part1End`)}
                                        <span>{t(`endUsersProcessing.administration.badText1.part2B`)}</span>
                                        {t(`endUsersProcessing.administration.badText1.part2`)}
                                        <span>{t(`endUsersProcessing.administration.badText1.part2BCont`)}</span>
                                        {t(`endUsersProcessing.administration.badText1.part2Cont`)}

                                    </span>
                                </div>
                                :

                                <>
                                    <div className={styles.fourPartBlock} style={{ marginTop: "10px" }}>
                                        <p>{t("endUsersProcessing.administration.externalAuth.title")}</p>
                                        {
                                            [...Array(3)].map((item, index) => {
                                                return (
                                                    <span className={`${styles.textDesc} ${styles.margB}`} style={{ display: "block" }}>
                                                        {renderI18nRichText({
                                                            text: t(`endUsersProcessing.administration.externalAuth.part${index + 1}`),
                                                            numberClassName: styles.num,
                                                            linkClassName: styles.emailText,
                                                            headingNumberClassName: styles.headNum
                                                        })}
                                                    </span>
                                                )
                                            }
                                            )
                                        }
                                    </div>



                                    <div className={styles.fourPartBlock} style={{ marginTop: "10px" }}>

                                        <p>{t(`endUsersProcessing.administration.adsAnalytics.title`)}</p>



                                        {
                                            [1, 2, 3, 4, 5].map((item, index) => {
                                                return (

                                                    <span style={{ display: "block" }} className={`${styles.textDesc} ${styles.margB}`}>
                                                        {renderI18nRichText({
                                                            text: t(`endUsersProcessing.administration.adsAnalytics.part${item}`),
                                                            numberClassName: styles.num,
                                                            linkClassName: styles.emailText,
                                                            headingNumberClassName: styles.headNum
                                                        })}
                                                    </span>
                                                )
                                            }
                                            )
                                        }

                                    </div>
                                </>
                        }




                        {
                            i18n.language === "cz" ?
                                <div className={styles.fourPartBlock}>
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        <span>
                                            {t("endUsersProcessing.administration.docusign.part1")}
                                        </span>
                                        {t("endUsersProcessing.administration.docusign.part2")}
                                    </p>
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        <span>
                                            {t("endUsersProcessing.administration.docusign.part3")}
                                        </span>
                                    </p>
                                </div>
                                :

                                <div className={styles.fourPartBlock} style={{ marginTop: "10px" }}>
                                    <p className={`${styles.textDesc} ${styles.margB}`} style={{ fontWeight: 700, marginTop: "10px" }}>
                                        {t("endUsersProcessing.administration.docusign.title")}
                                    </p>
                                    <span style={{ display: "block" }} className={`${styles.textDesc} ${styles.margB}`} >
                                        {t("endUsersProcessing.administration.docusign.part1")}
                                    </span>
                                    <span style={{ display: "block" }} className={`${styles.textDesc} ${styles.margB}`} >
                                        {t("endUsersProcessing.administration.docusign.part2")}
                                    </span>
                                </div>
                        }
                    </div>

                    <div className={`${styles.textBlock} ${styles.commonBlock}`}>
                        <h4 className={styles.textTitle}>{t("common.title")}</h4>
                        <h4 className={styles.titleSmall}>
                            <span>
                                {
                                    renderI18nRichText({
                                        text: t(`common.rights.title`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })
                                }
                            </span>

                        </h4>

                        <p className={styles.textDesc}>
                            <span>
                                {t("common.rights.subtitle")}
                            </span>
                        </p>
                        <p className={styles.textDesc}>
                            {t("common.rights.desc")}
                        </p>

                        <div style={{ paddingLeft: "15px", marginBottom: "10px" }}>
                            {
                                [...Array(8)].map((_, index) => {
                                    return (
                                        <p className={`${styles.textDesc} ${styles.margB}`}>
                                            {renderI18nRichText({
                                                text: t(`common.rights.part${index + 1}`),
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

                        <p className={styles.textDesc}>
                            <span>
                                {t("common.rectification.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {t("common.rectification.part1")}
                        </p>


                        <p className={styles.textDesc}>
                            <span>
                                {t("common.erasure.title")}
                            </span>
                        </p>
                        <p className={styles.textDesc}>
                            {t("common.erasure.desc")}
                        </p>

                        <div style={{ paddingLeft: "15px", marginBottom: "10px" }}>
                            {
                                [...Array(8)].map((_, index) => {
                                    if (i18n.language === "cz" && (index === 6 || index === 7)) return
                                    return (
                                        <p className={`${styles.textDesc} ${styles.margB}`}>
                                            {renderI18nRichText({
                                                text: t(`common.erasure.part${index + 1}`),
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

                        {
                            i18n.language === "cz" &&
                            <p className={`${styles.textDesc} ${styles.margB}`}>
                                {t("common.erasure.afterDesc")}
                            </p>
                        }



                        <p className={styles.textDesc}>
                            <span>
                                {t("common.restriction.title")}
                            </span>
                        </p>
                        <p className={styles.textDesc}>
                            {t("common.restriction.desc")}
                        </p>

                        <div style={{ paddingLeft: "15px", marginBottom: "10px" }}>
                            {
                                [...Array(8)].map((_, index) => {
                                    if (i18n.language === "cz" && index === 7) return
                                    return (
                                        <p className={`${styles.textDesc} ${styles.margB}`}>
                                            {renderI18nRichText({
                                                text: t(`common.restriction.part${index + 1}`),
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




                        <p className={styles.textDesc}>
                            <span>
                                {t("common.object.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.object.desc1")}
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.object.desc2")}
                        </p>


                        <p className={styles.textDesc}>
                            <span>
                                {t("common.direct.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.direct.desc")}
                        </p>



                        <p className={styles.textDesc}>
                            <span>
                                {t("common.portability.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc}`} >
                            {t("common.portability.desc")}
                        </p>


                        <div style={{ paddingLeft: "15px" }}>
                            {
                                [...Array(2)].map((_, index) => {
                                    return (
                                        <p className={`${styles.textDesc} ${styles.margB}`}>
                                            {renderI18nRichText({
                                                text: t(`common.portability.part${index + 1}`),
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

                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.portability.afterDesc")}
                        </p>




                        <p className={styles.textDesc}>
                            <span>
                                {t("common.supervisory.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >

                            {renderI18nRichText({
                                text: t(`common.supervisory.desc`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                            <a href="mailto:posta@uoou.cz" className={styles.emailText}>{t("common.supervisory.email")}</a>
                            {renderI18nRichText({
                                text: t(`common.supervisory.otherText`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}

                        </p>


                        <p className={styles.textDesc}>
                            <span>
                                {t("common.informed.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.informed.desc")}
                        </p>

                        <p className={styles.textDesc}>
                            <span>
                                {t("common.event.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.event.desc")}
                        </p>



                        <p className={styles.textDesc}>
                            <span>
                                {t("common.event.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.event.desc")}
                        </p>


                        <p className={styles.textDesc}>
                            <span>
                                {t("common.withdraw.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.withdraw.desc")}
                            <a className={styles.emailText} href="mailto:privacy.reli.one@gmail.com">{t("common.withdraw.email")}</a>
                        </p>


                        <p className={styles.titleSmall}>
                            <span>
                                {renderI18nRichText({
                                    text: t(`common.security5_2.title`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}

                            </span>
                        </p>



                        {
                            [...Array(3)].map((_, index) => {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`common.security5_2.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            }
                            )
                        }




                        <p className={styles.titleSmall}>
                            <span>
                                {renderI18nRichText({
                                    text: t(`common.commercial5_3.title`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </span>

                        </p>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`common.commercial5_3.desc`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>


                        <p className={styles.titleSmall}>
                            <span>
                                {renderI18nRichText({
                                    text: t(`common.recipients5_4.title`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </span>
                        </p>
                        <p className={`${styles.textDesc}`} >
                            {t("common.recipients5_4.desc")}
                        </p>

                        <ul className={styles.yellowList} style={{ marginLeft: "15px", marginBlock: "15px" }}>
                            {
                                [...Array(4)].map((_, index) => {
                                    return (
                                        <li className={`${styles.textDesc} ${styles.margB}`}>
                                            {renderI18nRichText({
                                                text: t(`common.recipients5_4.part${index + 1}`),
                                                numberClassName: styles.num,
                                                linkClassName: styles.emailText,
                                                headingNumberClassName: styles.headNum
                                            })}
                                        </li>
                                    )
                                }
                                )
                            }
                        </ul>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.recipients5_4.desc2")}
                        </p>

                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.recipients5_4.desc3")}
                        </p>


                        <p className={styles.titleSmall}>
                            <span>
                                {renderI18nRichText({
                                    text: t(`common.cookies.title`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </span>
                        </p>
                        {
                            [...Array(2)].map((_, index) => {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`common.cookies.part${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            }
                            )
                        }


                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("common.cookies.login.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {renderI18nRichText({
                                text: t("common.cookies.login.desc"),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("common.cookies.customization.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.cookies.customization.desc")}
                        </p>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("common.cookies.marketing.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.cookies.marketing.desc")}
                        </p>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("common.cookies.diagnostics.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.cookies.diagnostics.desc")}
                        </p>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("common.cookies.analytics.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {renderI18nRichText({
                                text: t("common.cookies.analytics.desc"),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}

                        </p>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("common.cookies.operational.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {t("common.cookies.operational.desc")}
                        </p>

                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            <span>
                                {t("common.cookies.third_party.title")}
                            </span>
                        </p>
                        <p className={`${styles.textDesc} ${styles.margB}`} >
                            {renderI18nRichText({
                                text: t("common.cookies.third_party.desc"),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}

                        </p>


                        <p className={styles.textDesc}>
                            <span>
                                {t("common.cookies.settings.title")}
                            </span>
                        </p>
                        {
                            [...Array(4)].map((_, index) => {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`common.cookies.settings.desc${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            }
                            )
                        }


                        <p className={styles.textDesc}>
                            <span>
                                {t("common.cookies.log.title")}
                            </span>
                        </p>
                        {
                            [...Array(2)].map((_, index) => {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`common.cookies.log.desc${index + 1}`),
                                            numberClassName: styles.num,
                                            linkClassName: styles.emailText,
                                            headingNumberClassName: styles.headNum
                                        })}
                                    </p>
                                )
                            }
                            )
                        }





                        <p className={styles.titleSmall}>
                            <span>
                                {renderI18nRichText({
                                    text: t(`common.applicable5_6.title`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </span>
                        </p>

                        <p className={styles.textDesc}>
                            {t("common.applicable5_6.desc")}
                        </p>

                        <ul className={styles.yellowList}>
                            {
                                [...Array(5)].map((_, index) => {
                                    return (
                                        <li className={`${styles.textDesc} ${styles.margB}`}>
                                            {renderI18nRichText({
                                                text: t(`common.applicable5_6.part${index + 1}`),
                                                numberClassName: styles.num,
                                                linkClassName: styles.emailText,
                                                headingNumberClassName: styles.headNum
                                            })}
                                        </li>
                                    )
                                }
                                )
                            }
                        </ul>



                        <p className={styles.titleSmall}>
                            <span>
                                {renderI18nRichText({
                                    text: t(`common.final5_7.title`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })}
                            </span>
                        </p>

                        {
                            [...Array(5)].map((_, index) => {
                                return (
                                    <p className={`${styles.textDesc} ${styles.margB}`}>
                                        {renderI18nRichText({
                                            text: t(`common.final5_7.part${index + 1}`),
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


                    <div className={styles.contactForDataBlock}>
                        <h4 className={styles.titleSmall}>{t("dataProtectionContact.title")}</h4>

                        <div>
                            <p className={styles.textDesc}>
                                {
                                    renderI18nRichText({
                                        text: t(`dataProtectionContact.company`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })
                                }

                            </p>
                            <p className={styles.textDesc}>
                                {
                                    renderI18nRichText({
                                        text: t(`dataProtectionContact.id`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })
                                }
                            </p>
                            <p className={styles.textDesc}>
                                {
                                    renderI18nRichText({
                                        text: t(`dataProtectionContact.address`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })
                                }
                            </p>
                            <p className={styles.textDesc}>
                                {
                                    renderI18nRichText({
                                        text: t(`dataProtectionContact.email`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })
                                }
                            </p>
                        </div>
                    </div>

                </div>
            </Container>
            <FooterMain />
            <ScrollToTop />
            <WhatsappMeneger />
        </>
    )
}

export default PrivacyPage