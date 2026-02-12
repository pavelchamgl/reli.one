import { useTranslation } from "react-i18next";
import { useState } from "react";

import styles from "../styles/NewSellerPage.module.scss"
import Container from "../ui/Container/Container";
import ForSellerTable from "../ui/ForSellerTable/ForSellerTable";

const NewSellerPage = () => {
    const [section, setSection] = useState("purpose");

    const { t } = useTranslation('newSeller');

    return (
        <Container>
            <div className={styles.main}>
                <p className={styles.title}>{t("for_seller")}</p>

                <div className={styles.container}>

                    <div className={styles.linkDiv}>
                        <a
                            className={styles.linkItem}
                            href="#purpose"
                            style={{ color: section === "purpose" ? "#3f7f6d" : "#000" }}
                            onClick={() => setSection("purpose")}
                        >
                            1.  {t("purpose.title")}
                        </a>
                        <a
                            className={styles.linkItem}
                            href="#principles"
                            style={{ color: section === "principles" ? "#3f7f6d" : "#000" }}
                            onClick={() => setSection("principles")}
                        >
                            2.  {t("generalPrinciples.title")}
                        </a>
                        <a
                            className={styles.linkItem}
                            href="#commission"
                            style={{ color: section === "commission" ? "#3f7f6d" : "#000" }}
                            onClick={() => setSection("commission")}
                        >
                            3.  {t("commissionRates.title")}
                        </a>
                        <a
                            className={styles.linkItem}
                            href="#caps"
                            style={{ color: section === "caps" ? "#3f7f6d" : "#000" }}
                            onClick={() => setSection("caps")}
                        >
                            4. {t("caps.title")}
                        </a>
                        <a
                            className={styles.linkItem}
                            href="#changes"
                            style={{ color: section === "changes" ? "#3f7f6d" : "#000" }}
                            onClick={() => setSection("changes")}
                        >
                            5.  {t("changes.title")}
                        </a>
                        <a
                            className={styles.linkItem}
                            href="#transparency"
                            style={{ color: section === "transparency" ? "#3f7f6d" : "#000" }}
                            onClick={() => setSection("transparency")}
                        >
                            6.  {t("transparency.title")}
                        </a>
                        <a
                            className={styles.linkItem}
                            href="#contact"
                            style={{ color: section === "contact" ? "#3f7f6d" : "#000" }}
                            onClick={() => setSection("contact")}
                        >
                            7.  {t("contact.title")}
                        </a>
                    </div>

                    <div id="purpose" className={styles.paragDiv}>
                        <h4 className={styles.textTitle}>1. {t("purpose.title")}</h4>
                        <ol className={styles.numList}>
                            <li><span className={styles.num}>1.1. </span>{t("purpose.point1")}</li>
                            <li><span className={styles.num}>1.2. </span>{t("purpose.point2")}</li>
                            <li><span className={styles.num}>1.2. </span>{t("purpose.point3")}</li>
                        </ol>
                    </div>

                    <div id="principles" className={styles.paragDiv}>
                        <h4 className={styles.textTitle}>2. {t("generalPrinciples.title")}</h4>
                        <p className={styles.textDesc} style={{ marginBottom: "10px" }}><span className={styles.num}>2.1. </span>{t("generalPrinciples.intro")}</p>
                        <p className={styles.textDesc} style={{ marginBottom: "10px" }}><span className={styles.num}>2.2. </span>{t("generalPrinciples.text22")}</p>
                        <ul className={styles.defaultList} style={{ marginBottom: "20px" }}>
                            <li>{t("generalPrinciples.rates.item1")}</li>
                            <li>{t("generalPrinciples.rates.item2")}</li>
                            <li>{t("generalPrinciples.rates.item3")}</li>
                        </ul>
                        <p className={styles.textDesc} style={{ marginBottom: "10px" }}><span className={styles.num}>2.3. </span>{t("generalPrinciples.text23")}</p>
                        <ul className={styles.defaultList} style={{ marginBottom: "20px" }}>
                            <li>{t("generalPrinciples.subcategories.item1")}</li>
                            <li>{t("generalPrinciples.subcategories.item2")}</li>
                            <li>{t("generalPrinciples.subcategories.item3")}</li>
                            <li>{t("generalPrinciples.subcategories.item")}</li>
                        </ul>
                        <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t("generalPrinciples.subcategoriesNote")}</p>
                    </div>

                    <div id="commission" className={styles.paragDiv}>
                        <h4 className={styles.textTitle}>2. {t("commissionRates.title")}</h4>
                        <p className={styles.textDesc} style={{ marginBottom: "10px" }}>{t("commissionRates.text")}</p>
                        <ForSellerTable />

                    </div>

                    <div id="caps" className={styles.paragDiv}>
                        <h4 className={styles.textTitle}>4. {t("caps.title")}</h4>
                        <ol className={styles.numList}>
                            <li><span className={styles.num}>4.1. </span>{t("caps.point1")}</li>
                            <li>{t("caps.text")}</li>
                            <li><span className={styles.num}>4.2. </span>{t("caps.point2")}</li>
                        </ol>
                    </div>

                    <div id="changes" className={styles.paragDiv}>
                        <h4 className={styles.textTitle}>5. {t("changes.title")}</h4>
                        <p className={styles.textDesc} style={{ marginBottom: "10px" }}><span className={styles.num}>5.1. </span>{t("changes.intro")}</p>

                        <ul className={styles.defaultList} style={{ marginBottom: "20px" }}>
                            <li>{t("changes.reasons.item1")}</li>
                            <li>{t("changes.reasons.item2")}</li>
                            <li>{t("changes.reasons.item3")}</li>
                        </ul>
                        <p className={styles.textDesc} style={{ marginBottom: "10px" }}><span className={styles.num}>5.2. </span>{t("changes.note")}</p>
                    </div>

                    <div id="transparency" className={styles.paragDiv}>
                        <h4 className={styles.textTitle}>6. {t("transparency.title")}</h4>
                        <ol className={styles.numList}>
                            <li><span className={styles.num}>6.1. </span>{t("transparency.point1")}</li>
                            <li><span className={styles.num}>6.2. </span>{t("transparency.point2")}</li>
                        </ol>
                    </div>

                    <div id="contact" className={styles.paragDiv}>
                        <h4 className={styles.textTitle}>7. {t("contact.title")}</h4>
                        <p className={styles.textDesc}>{t("contact.text")}</p>
                        <a href="mailto:office@reli.one" className={styles.emailText}>{t("contact.email")}</a>
                    </div>


                </div>
            </div>
        </Container>
    )
}

export default NewSellerPage