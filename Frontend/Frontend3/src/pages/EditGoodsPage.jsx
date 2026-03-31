import { useTranslation } from "react-i18next"
import EditGoodsForm from "../Components/Seller/edit/EditGoodsForm/EditGoodsForm"

import styles from "../styles/EditGoodsPage.module.scss"

const EditGoodsPage = () => {

    const { t } = useTranslation('sellerHome')

    return (
        <div style={{ paddingBottom: "100px" }}>
            <h3 className={styles.createTitle}>{t('edits.editingOfGoods')}</h3>
            <EditGoodsForm />
        </div>
    )
}

export default EditGoodsPage