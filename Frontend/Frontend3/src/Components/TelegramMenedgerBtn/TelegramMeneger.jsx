import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from 'react-responsive'

import telegaWhIcon from "../../assets/Main/whiteTelegaIc.svg";
import whiteX from "../../assets/Seller/newOrder/whiteX.svg";
import styles from "./TelegramMenedgerBtn.module.scss";


const TelegramMeneger = () => {
    const { t } = useTranslation();
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
                <p>{t("tgMessage.text")}</p>
                <p>{t("tgMessage.text1")}</p>
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

            <a
                href="https://t.me/+420797837856"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.telegramBtn}
            >
                <img src={telegaWhIcon} alt="" />
            </a>
        </div>
    );
};

export default TelegramMeneger;
