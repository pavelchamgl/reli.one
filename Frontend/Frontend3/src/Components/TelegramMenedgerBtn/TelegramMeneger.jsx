
import { useTranslation } from "react-i18next"
import telegaWhIcon from "../../assets/Main/whiteTelegaIc.svg"

import styles from "./TelegramMenedgerBtn.module.scss"


const TelegramMeneger = () => {

    const { t } = useTranslation()

    return (
        <div className={styles.telegramWrap}>
            <div className={styles.label}>
                <p>{t("tgMessage.text")}</p>
                <p>{t("tgMessage.text1")}</p>
                
            </div>
            <a href="https://t.me/+420797837856" target="_blank"
                rel="noopener noreferrer"
                className={styles.telegramBtn}>
                <img src={telegaWhIcon} alt="" />
            </a>
        </div>
    )
}

export default TelegramMeneger