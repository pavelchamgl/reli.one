import { useTranslation } from "react-i18next"
import styles from "./GoodsTub.module.scss"

const GoodsTub = ({ status, setStatus }) => {

    const handleTub = (text) => [
        setStatus(text)
    ]

    const { t } = useTranslation('sellerHome')


    return (
        <div className={styles.main}>
            <button onClick={() => handleTub("active")} className={status === "active" ? styles.btnAct : styles.btnDef}>{t('goods.active')}</button>
            <button onClick={() => handleTub("moder")} className={status === "moder" ? styles.btnAct : styles.btnDef}>{t('goods.on_moderation')}</button>
            <button onClick={() => handleTub("notModer")} className={status === "notModer" ? styles.btnAct : styles.btnDef}>{t('goods.not_moderated')}</button>
        </div>
    )
}

export default GoodsTub