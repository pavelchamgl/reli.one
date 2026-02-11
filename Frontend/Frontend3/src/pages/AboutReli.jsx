
import Container from "../ui/Container/Container"
import { useTranslation } from "react-i18next"


import styles from "../styles/AboutReli.module.scss"

const AboutReli = () => {

    const { t, i18n } = useTranslation('about')

    return (
        <Container>
            <div className={styles.main}>
                {/* Заголовок страницы */}
                <p className={`${styles.title} ${styles.mainTitle}`}>{t("title")}</p>



                {/* 1) Corporate overview */}
                <div className={styles.paragDiv}>
                    {
                        i18n.language === "en" &&
                        <h3 className={styles.subtitle}>
                            {t("hero.title")}
                        </h3>
                    }

                    <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>
                        {t("corporateOverview.title")}
                    </h4>

                    {
                        i18n.language === "en" ?
                            <>
                                <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t("corporateOverview.description")}</p>
                                <p className={styles.textDesc}>{t("corporateOverview.description1")}</p>
                            </> :
                            <p className={styles.textDesc}>{t("corporateOverview.description")}</p>
                    }


                    <div className={styles.newTextWrap}>
                        <h4>{t("corporateOverview.valuesTitle")}</h4>
                        <ul>
                            {Object.keys(t("corporateOverview.values", { returnObjects: true })).map((key) => (
                                <li key={key}>{t(`corporateOverview.values.${key}`)}</li>
                            ))}
                        </ul>
                    </div>
                    <p className={styles.textDesc}>{t("corporateOverview.afterText")}</p>
                </div>

                {/* 2) Transformation */}
                <div className={styles.paragDiv}>
                    <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>
                        {t("transformation.title")}
                    </h4>

                    {
                        i18n.language === "en" ?
                            <>
                                <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t("transformation.description")}</p>
                                <p className={styles.textDesc} style={{ textDecoration: "underline" }}>{t("transformation.desc1")}</p>

                                <div className={styles.newTextWrap}>
                                    <h4>{t("transformation.insightsTitle")}</h4>
                                    <ul>
                                        <li>{t(`transformation.insights.salesChannels`)}</li>
                                        <li>{t(`transformation.insights.transparency`)}</li>
                                        <li>{t(`transformation.insights.discipline`)}<span className={styles.num}>{t(`transformation.insights.b2c`)}</span> {t(`transformation.insights.enterprise`)}</li>


                                    </ul>
                                </div>

                                <p className={styles.textDesc} style={{ marginTop: "10px" }}>
                                    {t("transformation.result")}
                                </p>
                            </> :
                            <>
                                <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t("transformation.description")}</p>
                                <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t("transformation.desc1")}</p>
                                <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t("transformation.desc2")}</p>
                                <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t("transformation.desc3")} <a className={styles.emailText} href="https://reli.one/">{t("transformation.url")}</a>{t("transformation.otherDesc3")}</p>
                            </>
                    }


                </div>

                {/* 3) Marketplace principles */}
                <div className={styles.paragDiv}>
                    <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>
                        {t("marketplace.title")}
                    </h4>
                    {
                        i18n.language === "en" ?
                            <p className={styles.textDesc}>{t("marketplace.subtitle")}</p>
                            :
                            <>
                                <p className={styles.textDesc}>{t("marketplace.subtitle")}</p>
                                <p className={styles.textDesc} style={{ marginTop: "10px" }}>{t("marketplace.subtitle1")}</p>

                            </>
                    }

                    {Object.keys(t("marketplace.principles", { returnObjects: true })).map((key) => {
                        console.log(key);
                        if (key === "transparency" && i18n.language !== "cz") {
                            return (
                                <div className={styles.newTextWrap} key={key}>
                                    <h4>{t(`marketplace.principles.transparency.title`)}</h4>
                                    <p>{t(`marketplace.principles.transparency.text`)}</p>
                                    <p style={{ marginTop: "5px" }}>{t(`marketplace.principles.transparency.text1`)}</p>
                                </div>
                            )
                        }
                        return (
                            <div className={styles.newTextWrap} key={key}>
                                <h4>{t(`marketplace.principles.${key}.title`)}</h4>
                                <p>{t(`marketplace.principles.${key}.text`)}</p>
                            </div>
                        )
                    }
                    )}
                </div>

                {/* 4) Value for sellers */}
                <div className={styles.paragDiv}>
                    <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>
                        {t("valueForSellers.title")}
                    </h4>

                    <div className={styles.newTextWrap}>
                        <h4>{t("valueForSellers.listTitle")}</h4>

                        <ul>
                            {Object.keys(t("valueForSellers.items", { returnObjects: true })).map((key) => (
                                <li key={key}>{t(`valueForSellers.items.${key}`)}</li>
                            ))}
                            <li>{t(`valueForSellers.otherList`)} <span className={styles.num}>{t(`valueForSellers.b2c`)}</span> {t(`valueForSellers.otherListText`)}</li>
                        </ul>
                    </div>

                    <p className={styles.textDesc} style={{ marginTop: "10px" }}>
                        {t("valueForSellers.goal")}
                    </p>
                </div>

                {/* 5) Vision */}
                <div className={styles.paragDiv}>
                    <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>
                        {t("vision.title")}
                    </h4>
                    {
                        i18n.language === "en" ?
                            <>
                                <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t("vision.text")}</p>
                                <p className={styles.textDesc}>{t("vision.text1")}</p>
                            </> :
                            <>
                                <div className={styles.newTextWrap}>
                                    <h4>{t("vision.listTitle")}</h4>

                                    <ul>
                                        {Object.keys(t("vision.items", { returnObjects: true })).map((key) => (
                                            <li key={key}>{t(`vision.items.${key}`)}</li>
                                        ))}
                                    </ul>
                                    <p className={styles.textDesc} style={{ marginTop: "10px" }}>{t("vision.afterText")}</p>

                                </div>
                            </>

                    }
                </div>

                {/* 6) Positioning */}
                <div className={styles.paragDiv}>
                    <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>
                        {t("positioning.title")}
                    </h4>
                    <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t("positioning.text")}</p>
                    <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t("positioning.text1")}</p>
                    <p className={styles.textDesc}>{t("positioning.text2")}</p>


                </div>
            </div>
        </Container>

    )

}

export default AboutReli