
import { useTranslation } from "react-i18next"

import arrRight from "../../../assets/general/arrRightBtn.svg"
import Container from "../../Container/Container"

import styles from './StartSelling.module.scss'

const StartSelling = () => {

    const { t } = useTranslation("blocks")

    return (
        <div className={styles.main}>
            <h5 className={styles.title}>{t("ready_to_start.title")}</h5>
            <p className={styles.desc}>{t("ready_to_start.subtitle")}</p>
            <a href="#get-in-touch" className={styles.btn}>
                <p>{t("ready_to_start.button_create")}</p>
                <img src={arrRight} alt="" />
            </a>
        </div>
    )
}

export default StartSelling