import CTA from '../../ui/focusOnBuss/CTA/CTA'
import YellowBtn from '../../ui/yellowBtn/YellowBtn'

import graph from "../../assets/focusOnBuss/graph.svg"
import sheet from "../../assets/focusOnBuss/sheet.svg"
import moln from "../../assets/focusOnBuss/moln.svg"
import benefitGrapf from "../../assets/focusOnBuss/benefitGrapf.svg"

import styles from "./FocusOnBuss.module.scss"
import Container from '../../components/Container/Container'
import { useTranslation } from 'react-i18next'

const Benefits = ({ img, text }) => {
    return (
        <div className={styles.benefitsItem}>
            <img src={img} alt="" />
            <p>{text}</p>
        </div>
    )
}

const FocusOnBuss = () => {

    const { t } = useTranslation("blocks")

    const benefits = [
        { img: sheet, text: t("hero.benefits.text1") },
        { img: moln, text: t("hero.benefits.text2") },
        { img: benefitGrapf, text: t("hero.benefits.text3") }
    ]

    return (
        <div className={styles.wrap}>
            <Container>
                <section className={styles.main}>
                    <div className={styles.content}>
                        <div>
                            <p className={styles.title}>{t("hero.title.text1")}</p>
                            <p className={styles.title}><span>{t("hero.title.text2")}</span></p>
                        </div>
                        <CTA image={graph} text={t("hero.join_button")} color={"#3f7f6d"} bgColor={"#dcfce7"} style={{ marginTop: "25px", marginBottom: "15px" }} />
                        <p className={styles.desc}>
                            {t("hero.subtitle.text1")}
                            <span>{t("hero.subtitle.text2")}</span>
                            {t("hero.subtitle.text3")}
                            <span>{t("hero.subtitle.text4")}</span>
                            {t("hero.subtitle.text5")}
                        </p>
                        <YellowBtn text={t("hero.contact_button")} url={"#get-in-touch"} />
                        <div className={styles.benefitsWrap}>
                            {benefits.map((item) => (
                                <Benefits img={item.img} text={item.text} />
                            ))}
                        </div>
                    </div>
                </section>
            </Container>
        </div>
    )
}

export default FocusOnBuss