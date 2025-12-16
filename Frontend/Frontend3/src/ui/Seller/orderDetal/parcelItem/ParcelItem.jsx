import prodIc from "../../../../assets/Seller/newOrder/productIc.svg"
import styles from './ParcelItem.module.scss';

const ParcelItem = () => {
    return (
        <div className={styles.main}>
            <div className={styles.nameAndImg}>
                <img src={prodIc} alt="" />
                <div>
                    <p className={styles.name}>Premium Cotton T-Shirt</p>
                    <p className={styles.variant}>TS-BLK-M-001</p>
                </div>

            </div>
            <p className={styles.quant}>Qty: 2</p>
        </div>
    )
}

export default ParcelItem