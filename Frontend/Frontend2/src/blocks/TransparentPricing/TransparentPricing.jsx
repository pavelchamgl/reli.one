import { useTranslation } from 'react-i18next'

import Container from '../../components/Container/Container'
import Benefits from '../../components/TransperentPricing/Benefits/Benefits'
import HowItWorks from '../../components/TransperentPricing/HowItWorks/HowItWorks'

import styles from "./TransparentPricing.module.scss"


const TransparentPricing = () => {

    const { t } = useTranslation("blocks")

    return (
        <div className={styles.wrap}>
            <Container>
                <section className={styles.main}>
                    <h3 className={styles.title}>{t("pricing_section.title_small")}</h3>
                    <p className={styles.desc}>{t("pricing_section.main_title")}</p>

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