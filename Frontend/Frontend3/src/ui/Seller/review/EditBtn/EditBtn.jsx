import { useTranslation } from "react-i18next"

import editIc from "../../../../assets/Seller/register/editIc.svg"

import styles from "./EditBtn.module.scss"

const EditBtn = ({ setOpen }) => {


        const { t } = useTranslation('onbording')


    return (
        <button onClick={() => setOpen(true)} className={styles.editBtn}>
            <img src={editIc} alt="" />
            {t('onboard.review.edit')}
        </button>
    )
}

export default EditBtn