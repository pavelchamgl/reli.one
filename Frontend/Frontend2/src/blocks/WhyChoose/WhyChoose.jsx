import Container from '../../components/Container/Container'
import CTA from '../../ui/focusOnBuss/CTA/CTA'
import DescText from '../../ui/general/descText/DescText'
import Benefits from '../../components/WhyChoose/Benefits/Benefits'
import OurBenefits from '../../components/WhyChoose/OurBenefits/OurBenefits'
import StartSelling from '../../components/WhyChoose/StartSelling/StartSelling'

import trustIc from "../../assets/whyChoose/trustIc.svg"

import styles from "./WhyChoose.module.scss"

const WhyChoose = () => {
    return (
        <Container>
            <section className={styles.main}>
                <CTA image={trustIc} text={"Trusted support from day one"} color={"#a65f00"} bgColor={"#fef9c2"} />
                <h2 className={styles.title}>Why Choose RELI?</h2>
                <DescText text={"Everything you need to succeed as an online seller, all in one powerful platform designed to maximize your sales and minimize your effort."} style={{ maxWidth: "672px" }} />
                <OurBenefits />
                <StartSelling />
            </section>
        </Container>
    )
}

export default WhyChoose