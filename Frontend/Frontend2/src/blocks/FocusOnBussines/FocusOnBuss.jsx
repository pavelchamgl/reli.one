import CTA from '../../ui/focusOnBuss/CTA/CTA'
import YellowBtn from '../../ui/yellowBtn/YellowBtn'

import graph from "../../assets/focusOnBuss/graph.svg"
import sheet from "../../assets/focusOnBuss/sheet.svg"
import moln from "../../assets/focusOnBuss/moln.svg"
import benefitGrapf from "../../assets/focusOnBuss/benefitGrapf.svg"

import styles from "./FocusOnBuss.module.scss"
import Container from '../../components/Container/Container'

const Benefits = ({ img, text }) => {
    return (
        <div className={styles.benefitsItem}>
            <img src={img} alt="" />
            <p>{text}</p>
        </div>
    )
}

const FocusOnBuss = () => {

    const benefits = [
        { img: sheet, text: "Free registration" },
        { img: moln, text: "No setup costs" },
        { img: benefitGrapf, text: "24/7 support" }
    ]

    return (
        <div className={styles.wrap}>
            <Container>
                <section className={styles.main}>
                    <div className={styles.content}>
                        <div>
                            <p className={styles.title}>We Handle the sales,</p>
                            <p className={styles.title}><span>You Focus on Your Business!</span></p>
                        </div>
                        <CTA image={graph} text={"Join our growing seller community"} color={"#3f7f6d"} bgColor={"#dcfce7"} style={{ marginTop: "25px", marginBottom: "15px" }} />
                        <p className={styles.desc}>With our hands-on support, <span>free promotion</span>, and <span>one-year fee-free start</span>, Reli is your partner for growth.</p>
                        <YellowBtn text={"Contact Manager  "} />
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