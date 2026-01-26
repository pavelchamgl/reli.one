import Container from "../../components/Container/Container"

import mark from "../../assets/startSelling/mark.svg"
import star from "../../assets/startSelling/star.svg"
import graph from "../../assets/startSelling/graph.svg"
import arrRight from "../../assets/startSelling/arrRight.svg"

import styles from "./StartSelling.module.scss"
import { useTranslation } from "react-i18next"

const KeyBenefits = ({ text }) => {
    return (
        <div className={styles.keyBenefits}>
            <img src={mark} alt="" />
            <p>{text}</p>
        </div>
    )
}

const StartSelling = () => {

    const { t } = useTranslation("blocks")

    return (
        <div className={styles.wrap}>
            <Container>
                <section className={styles.main}>
                    <p className={styles.title}>
                        {t("final_cta.title.text1")}
                        <span>{t("final_cta.title.text2")}</span>
                    </p>
                    <p className={styles.desc}>{t("final_cta.subtitle")}</p>

                    <div className={styles.contentWrap}>
                        <div className={styles.keyBenefitsWrap}>
                            <KeyBenefits text={t("final_cta.benefits.text1")} />
                            <KeyBenefits text={t("final_cta.benefits.text2")} />
                        </div>

                        <div className={styles.keyBenefitsWrap}>
                            <KeyBenefits text={t("final_cta.benefits.text3")} />
                            <KeyBenefits text={t("final_cta.benefits.text4")} />
                        </div>

                        <div className={styles.starWrap}>
                            <img src={star} alt="" />
                            <p>{t("final_cta.highlight")}</p>
                        </div>

                        <a href="#get-in-touch" className={styles.contactManagere}>
                            <img src={graph} alt="" />
                            <p>{t("final_cta.button")}</p>
                            <img src={arrRight} alt="" />
                        </a>

                        <div className={styles.riskBlock}>
                            <p>️{t("final_cta.guarantee_title")}</p>
                            <p>{t("final_cta.guarantee_text")}</p>
                        </div>

                    </div>
                </section>
            </Container>
            <div className={styles.circleOne}></div>
            <div className={styles.circleTwo}></div>
        </div>
    )
}

export default StartSelling