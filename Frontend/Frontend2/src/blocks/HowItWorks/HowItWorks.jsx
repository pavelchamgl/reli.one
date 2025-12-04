import Container from "../../components/Container/Container"
import Steps from "../../components/HowItWorks/Steps/Steps"

import styles from "./HowItWorks.module.scss"

const HowItWorks = () => {
    return (
        <div className={styles.wrap}>
            <Container>
                <section className={styles.main}>
                    <h3 className={styles.title}>How it Works</h3>
                    <p className={styles.desc}>We keep it simple. You focus on production - we handle the sales setup</p>
                    <Steps />
                    <p className={styles.readyToStart}>Ready to get started?</p>
                    <div className={styles.btnWrap}>
                        <a href="#get-in-touch">Contact Our Manager</a>
                    </div>

                </section>
            </Container>
        </div>
    )
}

export default HowItWorks