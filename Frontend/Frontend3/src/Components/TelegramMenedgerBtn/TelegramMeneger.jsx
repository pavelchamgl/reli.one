
import telegaWhIcon from "../../assets/Main/whiteTelegaIc.svg"

import styles from "./TelegramMenedgerBtn.module.scss"


const TelegramMeneger = () => {
    return (
        <div className={styles.telegramWrap}>
            <div className={styles.label}>
                Chat with us on Telegram
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