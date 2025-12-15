import ShipmentsSelectInfo from "../shipmentSelectInfo/ShipmentsSelectInfo"
import styles from "./ShipmentDetail.module.scss"

const ShipmentDetail = () => {
    return (
        <div className={styles.main}>
            <h4 className={styles.title}>Actions</h4>
            <ShipmentsSelectInfo />
        </div>
    )
}

export default ShipmentDetail