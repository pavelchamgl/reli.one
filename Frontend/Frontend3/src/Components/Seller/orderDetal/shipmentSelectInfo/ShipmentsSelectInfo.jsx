import truck from "../../../../assets/Seller/orderDetal/truck.svg"
import selectArr from "../../../../assets/Seller/all/selectArr.svg"
import track from "../../../../assets/Seller/orderDetal/track.svg"
import downWh from "../../../../assets/Seller/orderDetal/downWh.svg"


import styles from "./ShipmentSelectInfo.module.scss"
import { useState } from "react"
import ParcelItem from "../../../../ui/Seller/orderDetal/parcelItem/ParcelItem"
import mainInstance from "../../../../api"
import { getShipmentLabel } from "../../../../api/seller/orders"
import { ErrToast } from "../../../../ui/Toastify"
import { downloadBlob } from "../../../../code/seller"


const ShipmentsSelectInfo = ({ shipment }) => {

    const [open, setOpen] = useState(false)

    const handleDownloadUrl = async () => {
        try {
            const res = await getShipmentLabel(shipment?.id)
            console.log(res.data);

            if (res.status === 200) {

                downloadBlob(res.data, `order${shipment?.id}.zip`)
            }

        } catch (error) {
            console.log(error);

            const message =
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                "Failed to download your label";

            ErrToast(message);

        }
    }

    return (
        <div className={styles.mainWrap}>
            <button onClick={() => setOpen(!open)} className={styles.selectBtn} style={{ borderRadius: open ? "" : "10px" }}>
                <div className={styles.shipmentTitleWrap}>
                    <div>
                        <img src={truck} alt="" />
                    </div>
                    <div>
                        <p>{shipment?.carrier?.name}</p>
                        <p>Tracking: {shipment?.tracking_number}</p>
                    </div>
                </div>
                <img className={`${styles.arrow} ${open ? styles.arrActive : ""}`} src={selectArr} alt="" />
            </button>

            {
                open &&
                <div className={styles.shipContentWrap}>
                    <div className={styles.dateAndBtnsWrap}>
                        <div>
                            <p>Shipment Date</p>
                            <p>{shipment?.created_at}</p>
                        </div>
                        <div>
                            <button>
                                <img src={track} alt="" />
                                Track
                            </button>
                            <a
                                onClick={() => {
                                    handleDownloadUrl()
                                }}
                                download="label.pdf"
                            >
                                <img src={downWh} alt="" />
                                Label
                            </a>
                        </div>
                    </div>

                    <h4 className={styles.itemsParcelsTitle}>Items in this parcel</h4>
                    <div className={styles.itemsParcelWrap}>
                        {
                            shipment?.items?.map((item) => (
                                <ParcelItem item={item} />
                            ))
                        }
                    </div>
                </div>
            }
        </div>
    )
}

export default ShipmentsSelectInfo