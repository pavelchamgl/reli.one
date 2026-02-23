import ShipmentsSelectInfo from "../shipmentSelectInfo/ShipmentsSelectInfo"
import styles from "./ShipmentDetail.module.scss"

const ShipmentDetail = ({ shipment }) => {
    console.log(shipment);
    
    return (
        <div className={styles.main}>
            <h4 className={styles.title}>Shipment Details</h4>
            {
                shipment?.map((item) => (
                    <ShipmentsSelectInfo shipment={item} />
                ))
            }

        </div>
    )
}

export default ShipmentDetail