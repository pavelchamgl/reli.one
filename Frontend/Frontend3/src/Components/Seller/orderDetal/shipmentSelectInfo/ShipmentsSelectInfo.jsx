import truck from "../../../../assets/Seller/orderDetal/truck.svg"
import selectArr from "../../../../assets/Seller/all/selectArr.svg"
import track from "../../../../assets/Seller/orderDetal/track.svg"
import downWh from "../../../../assets/Seller/orderDetal/downWh.svg"


import styles from "./ShipmentSelectInfo.module.scss"
import { useState } from "react"
import ParcelItem from "../../../../ui/Seller/orderDetal/parcelItem/ParcelItem"


const ShipmentsSelectInfo = () => {

    const [open, setOpen] = useState(false)

    return (
        <div className={styles.mainWrap}>
            <button onClick={() => setOpen(!open)} className={styles.selectBtn} style={{ borderRadius: open ? "" : "10px" }}>
                <div className={styles.shipmentTitleWrap}>
                    <div>
                        <img src={truck} alt="" />
                    </div>
                    <div>
                        <p>DHL Express</p>
                        <p>Tracking: DHL1234567890</p>
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
                            <p>2025-11-27 09:30</p>
                        </div>
                        <div>
                            <button>
                                <img src={track} alt="" />
                                Track
                            </button>
                            <button>
                                <img src={downWh} alt="" />
                                Label
                            </button>
                        </div>
                    </div>

                    <h4 className={styles.itemsParcelsTitle}>Items in this parcel</h4>
                    <div className={styles.itemsParcelWrap}>
                        <ParcelItem />
                        <ParcelItem />
                    </div>
                </div>
            }
        </div>
    )
}

export default ShipmentsSelectInfo