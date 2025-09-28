import Container from "../../components/Container/Container"

import mark from "../../assets/startSelling/mark.svg"
import star from "../../assets/startSelling/star.svg"
import graph from "../../assets/startSelling/graph.svg"
import arrRight from "../../assets/startSelling/arrRight.svg"

import styles from "./StartSelling.module.scss"

const KeyBenefits = ({ text }) => {
    return (
        <div className={styles.keyBenefits}>
            <img src={mark} alt="" />
            <p>{text}</p>
        </div>
    )
}

const StartSelling = () => {
    return (
        <div className={styles.wrap}>
            <Container>
                <section className={styles.main}>
                    <p className={styles.title}>
                        Don't wait —
                        <span>start selling today!</span>
                    </p>
                    <p className={styles.desc}>Reli makes it easy for manufacturers to sell online without technical headaches.</p>

                    <div className={styles.contentWrap}>
                        <div className={styles.keyBenefitsWrap}>
                            <KeyBenefits text={"1 year free – no fees, no risks"} />
                            <KeyBenefits text={"Products uploaded by our managers  "} />
                        </div>

                        <div className={styles.keyBenefitsWrap}>
                            <KeyBenefits text={"Free promotion in banners and homepage  "} />
                            <KeyBenefits text={"Competitive fees after the first year"} />
                        </div>

                        <div className={styles.starWrap}>
                            <img src={star} alt="" />
                            <p>Join now and let us do the hard work – you focus on your products</p>
                        </div>

                        <button className={styles.contactManagere}>
                            <img src={graph} alt="" />
                            <p>Contact manager</p>
                            <img src={arrRight} alt="" />
                        </button>

                        <div className={styles.riskBlock}>
                            <p>️ 100% Risk-Free Guarantee</p>
                            <p>No credit card required • Cancel anytime • Full support included • Money-back guarantee</p>
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