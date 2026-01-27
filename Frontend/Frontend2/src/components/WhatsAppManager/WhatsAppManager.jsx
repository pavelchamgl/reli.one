import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { useMediaQuery } from "react-responsive"

import whatIc from "../../assets/main/whatsappIc.svg"
import whiteX from "../../assets/main/whiteX.svg"

import styles from "./WhatsAppManager.module.scss"


const WhatsappMeneger = () => {

    const { t } = useTranslation()
    const [isVisible, setIsVisible] = useState(false);
    const [isClosed, setIsClosed] = useState(false); // если нажали ❌


    const isMobile = useMediaQuery({ maxWidth: 500 })

    useEffect(() => {
        if (isClosed) return;

        const show = () => {
            setIsVisible(true);
            setTimeout(() => setIsVisible(false), isMobile ? 2000 : 10000); // скрыть через 10 сек
        };

        show(); // первый показ
        const interval = setInterval(show, 20000); // каждые 20 сек

        return () => clearInterval(interval);
    }, [isClosed, isMobile]);

    return (
        <div
            className={`${styles.telegramWrap} ${isVisible ? styles.active : ""
                }`}
        >
            <div className={styles.label}>
                <p>{t("whatsappText.text1")}</p>
                <p>{t("whatsappText.text2")}</p>
                <button
                    className={styles.closeX}
                    onClick={() => {
                        setIsClosed(true);
                        setIsVisible(false);
                    }}
                >
                    <img src={whiteX} alt="" />
                </button>
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