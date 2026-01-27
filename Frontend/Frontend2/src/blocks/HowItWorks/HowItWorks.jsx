
import { useTranslation } from "react-i18next"

import Container from "../../components/Container/Container"
import Steps from "../../components/HowItWorks/Steps/Steps"

import styles from "./HowItWorks.module.scss"

const HowItWorks = () => {
    const { t } = useTranslation("blocks")

    return (
        <div className={styles.wrap}>
            <Container>
                <section className={styles.main}>
                    <h3 className={styles.title}>{t("how_it_works.title_small")}</h3>
                    <p className={styles.desc}>{t("how_it_works.main_title")}</p>
                    <Steps />
                    <p className={styles.readyToStart}>{t("how_it_works.final_text")}</p>
                    <div className={styles.btnWrap}>
                        <a href="#get-in-touch">{t("how_it_works.button_contact")}</a>
                    </div>

                </section>
            </Container>
        </div>
    )
}

export default HowItWorks