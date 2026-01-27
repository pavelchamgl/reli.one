import { useTranslation } from 'react-i18next'

import Container from '../../components/Container/Container'
import CTA from '../../ui/focusOnBuss/CTA/CTA'
import DescText from '../../ui/general/descText/DescText'
import Benefits from '../../components/WhyChoose/Benefits/Benefits'
import OurBenefits from '../../components/WhyChoose/OurBenefits/OurBenefits'
import StartSelling from '../../components/WhyChoose/StartSelling/StartSelling'

import trustIc from "../../assets/whyChoose/trustIc.svg"

import styles from "./WhyChoose.module.scss"

const WhyChoose = () => {

    const { t } = useTranslation("blocks")

    return (
        <Container>
            <section className={styles.main}>
                <CTA image={trustIc} text={t("why_choose_reli.title_small")} color={"#a65f00"} bgColor={"#fef9c2"} />
                <h2 className={styles.title}>{t("why_choose_reli.main_title")}</h2>
                <DescText text={t("why_choose_reli.description")} style={{ maxWidth: "672px", textAlign: "center", fontSize: "clamp(16px, 5vw, 19px)" }} />
                <OurBenefits />
                <StartSelling />
            </section>
        </Container>
    )
}

export default WhyChoose