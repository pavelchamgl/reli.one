import { useTranslation } from "react-i18next";
import prodIc from "../../../../assets/Seller/newOrder/productIc.svg"
import styles from './ParcelItem.module.scss';

const ParcelItem = ({ item }) => {

    const { t } = useTranslation('sellerOrder')


    return (
        <div className={styles.main}>
            <div className={styles.nameAndImg}>
                <img src={prodIc} alt="" />
                <div>
                    <p className={styles.name}>{item?.name}</p>
                    <p className={styles.variant}>{item?.sku}</p>
                </div>

            </div>
            <p className={styles.quant}>{t('quantity')}: {item?.quantity}</p>
        </div>
    )
}

export default ParcelItem