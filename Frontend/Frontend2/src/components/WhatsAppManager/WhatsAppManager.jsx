import { useTranslation } from "react-i18next"

import whatIc from "../../assets/main/whatsappIc.svg"

import styles from "./WhatsAppManager.module.scss"


const WhatsappMeneger = () => {

    const { t } = useTranslation()

    return (
        <div className={styles.telegramWrap}>
            <div className={styles.label}>
                <p>{t("whatsappText.text1")}</p>
                <p>{t("whatsappText.text2")}</p>
            </div>
            <a href="https://wa.me/420797837856" target="_blank"
                rel="noopener noreferrer"
                className={styles.telegramBtn}>
                <img src={whatIc} alt="" />
            </a>
        </div>
    )
}

export default WhatsappMeneger