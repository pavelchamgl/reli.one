
import { useTranslation } from "react-i18next"

import mailIcon from "../../../assets/footerNew/mail.svg"

import styles from "./StayUpdated.module.scss"

const StayUpdated = () => {
    const { t } = useTranslation("footer")

    return (
        <div>
            <div className={styles.mainOne}>
                <div>
                    <h5 className={styles.title}>{t("footer.newsletter.title")}</h5>
                    <p className={styles.desc}>{t("footer.newsletter.description")}</p>
                </div>
                <div className={styles.inpWrap}>
                    <div>
                        <img src={mailIcon} alt="" />
                        <input type="text" placeholder={t("footer.newsletter.placeholder")} />
                    </div>
                    <button className={styles.subBtn}>
                        {t("footer.newsletter.button")}
                    </button>

                </div>
            </div>
            <div className={styles.mainTwo}>
                <p>{t("footer.copyright")}</p>
                <p>{t("footer.made_with")}</p>
            </div>
        </div>
    )
}

export default StayUpdated