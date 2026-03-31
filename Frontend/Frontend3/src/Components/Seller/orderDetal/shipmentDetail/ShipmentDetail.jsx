import { useTranslation } from "react-i18next";
import ShipmentsSelectInfo from "../shipmentSelectInfo/ShipmentsSelectInfo"
import styles from "./ShipmentDetail.module.scss"

const ShipmentDetail = ({ shipment }) => {
    
        const { t } = useTranslation('sellerOrder')
    

    return (
        <div className={styles.main}>
            <h4 className={styles.title}>{t('shipmentDetails')}</h4>
            {
                shipment?.map((item) => (
                    <ShipmentsSelectInfo shipment={item} />
                ))
            }

        </div>
    )
}

export default ShipmentDetail