import Container from '../../components/Container/Container'
import Benefits from '../../components/TransperentPricing/Benefits/Benefits'
import HowItWorks from '../../components/TransperentPricing/HowItWorks/HowItWorks'
import styles from "./TransparentPricing.module.scss"


const TransparentPricing = () => {
    return (
        <div className={styles.wrap}>
            <Container>
                <section className={styles.main}>
                    <h3 className={styles.title}>Transparent Pricing & Terms</h3>
                    <p className={styles.desc}>Simple. Fair. Competitive.  </p>

                    <div className={styles.blocksWrap}>
                        <Benefits />
                        <HowItWorks />
                    </div>
                </section>
            </Container>
        </div>
    )
}

export default TransparentPricing