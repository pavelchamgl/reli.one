
import whatIc from "../../assets/main/whatsappIc.svg"

import styles from "./WhatsAppManager.module.scss"


const WhatsappMeneger = () => {
    return (
        <div className={styles.telegramWrap}>
            <div className={styles.label}>
                Chat with us on WhatsApp
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