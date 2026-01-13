import warehouseIc from "../../../../../assets/Seller/register/warehouseAndReturn.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from "./WarehouseAndReturn.module.scss"

const WarehouseAndReturn = ({ data }) => {
    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={warehouseIc} alt="" />
                    <h3>Warehouse & Return</h3>
                </div>

                <EditBtn />
            </div>

            <div className={styles.firstBlock}>
                <p className={styles.title}>Warehouse Address</p>
                <span className={styles.desc}>Industrial Street 456, Brno, , CZ</span>
            </div>

            <div>
                <p className={styles.title}>Return Address</p>
                <span className={styles.desc}>Same as warehouse address </span>
            </div>
        </div>
    )
}

export default WarehouseAndReturn