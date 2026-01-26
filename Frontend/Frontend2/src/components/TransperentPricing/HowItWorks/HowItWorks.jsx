import { useTranslation } from "react-i18next"

import styles from "./HowItWorks.module.scss"

const HowItWorks = () => {

    const { t } = useTranslation("blocks")

    return (
        <div className={styles.main}>
            <h4 className={styles.title}>{t("pricing_section.how_it_works.title")}</h4>
            <div className={styles.contentWrap}>
                <div className={styles.prodPrice}>
                    <h3>$100</h3>
                    <p>{t("pricing_section.how_it_works.example_sale_label")}</p>
                </div>

                <div className={styles.distribution}>
                    <div>
                        <h4 style={{ color: "#00a63e" }}>$92</h4>
                        <p>{t("pricing_section.how_it_works.you_keep_label")}</p>
                    </div>
                    <div>
                        <h4 style={{ color: "#99a1af" }}>$8</h4>
                        <p>{t("pricing_section.how_it_works.platform_fee_label")}</p>
                    </div>
                </div>

                <div className={styles.everySaleBlock}>
                    <h5>{t("pricing_section.how_it_works.highlight")}</h5>
                    <p>{t("pricing_section.how_it_works.highlight_sub")}</p>
                </div>

            </div>
        </div>
    )
}

export default HowItWorks