import { useTranslation } from "react-i18next";

import Container from "../../components/ForSeller/Container/Container";
import ForSellerTable from "../../components/ForSeller/ForSellerTable/ForSellerTable";
import Header from "../../components/Header/Header";
import FooterMain from "../../components/Footer/FooterMain/FooterMain";
import ScrollToTop from "../../components/ScrollToTop/ScrollToTop";

import styles from "./ForSeller.module.scss";

const ForrSeller = () => {


    const { t } = useTranslation();



    return (
        <>
            <Header />

            <Container>
                <div className={styles.main}>
                    <h1 className={styles.title}>{t("protTitle")}</h1>

                    <div className={styles.textWrap}>
                        <h4 className={styles.textTitle}>{t("prodIntrodaction.title")}</h4>
                        <p className={styles.textDesc}>{t("prodIntrodaction.desc")}</p>
                    </div>

                    <div className={styles.textWrap}>
                        <h4 className={styles.textTitle}>{t("definitions.title")}</h4>
                        <ul className={styles.list}>
                            <li><strong>{t("definitions.confInfo.title")}</strong>{t("definitions.confInfo.desc")}</li>
                            <li><strong>{t("definitions.personalData.title")}</strong>{t("definitions.personalData.desc")}</li>
                            <li>{t("definitions.gdpr.learn")}<strong>{t("definitions.gdpr.about")}</strong>{t("definitions.gdpr.otherText")} <a href="https://gdpr.eu/" target="_blank" className={styles.emailText}>{t("definitions.gdpr.link")}</a></li>
                        </ul>
                    </div>

                    <div className={styles.textWrap}>
                        <h4 className={styles.textTitle}>{t("confident.title")}</h4>
                        <p className={`${styles.textDesc} ${styles.confDesc}`}>{t("confident.desc")}</p>
                        <div className={styles.descWrap}>
                            <p className={styles.textDesc}>
                                <span>
                                    {t("confident.protections.title")}
                                </span>
                                {t("confident.protections.desc")}
                            </p>
                            <p className={styles.textDesc}>
                                <span>
                                    {t("confident.limited.title")}
                                </span>
                                {t("confident.limited.desc")}
                            </p>
                            <p className={styles.textDesc}>
                                <span>
                                    {t("confident.handling.title")}
                                </span>
                                {t("confident.handling.desc")}
                            </p>

                        </div>

                    </div>

                    <div className={styles.textWrap}>
                        <h4 className={styles.textTitle}>{t("dataProcessing.title")}</h4>
                        <div className={styles.descWrap}>
                            <p className={styles.textDesc}>
                                <span>
                                    {t("dataProcessing.agreement.title")}
                                </span>
                                {t("dataProcessing.agreement.desc")}
                            </p>
                            <p className={styles.textDesc}>
                                <span>
                                    {t("dataProcessing.purpose.title")}
                                </span>
                                {t("dataProcessing.purpose.desc")}
                            </p>
                            <p className={styles.textDesc}>
                                <span>
                                    {t("dataProcessing.dataTransfer.title")}
                                </span>
                                {t("dataProcessing.dataTransfer.desc")}
                            </p>

                        </div>

                    </div>

                    <div className={styles.textWrap}>
                        <h4 className={styles.textTitle}>{t("exceptions.title")}</h4>
                        <p className={styles.textDesc}>{t("exceptions.desc")}</p>
                        <ul className={styles.list}>
                            <li>{t("exceptions.list.text1")}</li>
                            <li>{t("exceptions.list.text2")}</li>
                            <li>{t("exceptions.list.text3")}</li>
                        </ul>
                    </div>

                    <div className={styles.textWrap}>
                        <h4 className={styles.textTitle}>{t("enforcement.title")}</h4>
                        <p className={styles.textDesc}>{t("enforcement.desc")}</p>
                    </div>

                    <div className={styles.textWrap}>
                        <h4 className={styles.textTitle}>{t("governing.title")}</h4>
                        <p className={styles.textDesc}>{t("governing.desc")}</p>
                    </div>

                    <div className={styles.textWrap}>
                        <h4 className={styles.textTitle}>{t("updates.title")}</h4>
                        <p className={styles.textDesc}>{t("updates.desc")}</p>
                    </div>

                    <div className={styles.textWrap}>
                        <h4 className={styles.textTitle}>{t("contactInfo.title")}</h4>
                        <p className={styles.textDesc}>{t("contactInfo.desc")} <a href="mailto:support600.reli@gmail.com" className={styles.emailText}>{t("contactInfo.email")}</a>
                        </p>
                    </div>

                    <div className={styles.textWrap}>
                        <h4 className={styles.textTitle}>{t("sendingCommunication.title")}</h4>
                        <p className={styles.textDesc}>{t("sendingCommunication.desc")}</p>
                        <p className={styles.textDesc} style={{ marginTop: "30px" }}>{t("sendingCommunication.endText")}</p>
                    </div>




                </div>
            </Container >

            <FooterMain />
            <ScrollToTop />

        </>
    );
};

export default ForrSeller;
