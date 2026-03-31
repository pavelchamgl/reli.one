import { useTranslation } from "react-i18next"

import mark from "../../../../assets/checkbox/checkboxAcc.svg"

import styles from "./SubBtn.module.scss"

const SubBtn = ({ onClick }) => {

    const { t } = useTranslation('onbording')

    return (
        <button onClick={onClick} className={styles.subBtn}>
            <img src={mark} alt="" />
            {t('onboard.review.submit_btn')}
        </button>
    )
}

export default SubBtn