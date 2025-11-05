import { useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./CookieLangToggle.module.scss";

const CookieLangToggle = () => {

    const i18nextLng = localStorage.getItem("i18nextLng")


    const [isEnglish, setIsEnglish] = useState(i18nextLng === "en");

    const { i18n } = useTranslation()

    const handleToggle = () => {
        const preferences = JSON.parse(localStorage.getItem("preferences") || "false");

        if (preferences) {
            const newLang = isEnglish ? "cs" : "en"; // 🧩 правильный код языка для чешского — "cs"
            setIsEnglish(!isEnglish);
            i18n.changeLanguage(newLang);
            localStorage.setItem("i18nextLng", newLang);
        }
    };


    return (
        <div className={styles.languageToggle} onClick={handleToggle}>
            <div className={styles.toggleTrack}>
                <div
                    className={`${styles.toggleThumb} ${isEnglish ? styles.thumbEnglish : styles.thumbCzech
                        }`}
                />
            </div>
        </div>
    );
};

export default CookieLangToggle;
