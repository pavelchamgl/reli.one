import React from 'react'
import Checkbox from '../../../../ui/Seller/newOrder/checkbox/Checkbox'
import { Link } from 'react-router-dom'
import StatusText from '../../all/statusText/StatusText'

import truck from "../../../../assets/Seller/newOrder/truckIc.svg"
import tag from "../../../../assets/Seller/newOrder/tagIc.svg"
import redX from "../../../../assets/Seller/newOrder/redX.svg"
import watch from "../../../../assets/Seller/newOrder/watch.svg"
import prod from "../../../../assets/Seller/newOrder/productIc.svg"


import styles from "./MobileOrderCard.module.scss"

const InfoItem = ({ title, url, desc }) => {
    return (
        <div>
            <p className={styles.infoTitle}>{title}</p>
            <div className={styles.infoTextWrap}>
                {
                    url &&
                    <img src={url} alt="" />
                }
                <p>{desc}</p>
            </div>
        </div>
    )
}



const MobileOrderCard = () => {
    return (
        <div className={styles.main}>
            <div>
                <div className={styles.chekAndLinkTop}>
                    <div className={styles.chechAndLink}>
                        <Checkbox />
                        <Link to={""}>ORD-2025-001</Link>
                    </div>

                    <StatusText status={"Pending"} />
                </div>

                <div className={styles.infoTextMain}>
                    <InfoItem title={"Created"} desc={"2025-11-27 10:30"} url={watch} />
                    <InfoItem title={"Products"} desc={"3 items"} url={prod} />
                    <InfoItem title={"Branch"} desc={"Main Store"} />
                    <InfoItem title={"Dispatch Before"} desc={"2025-11-28"} />
                </div>

                <div className={styles.billMainBlock}>
                    <div className={styles.billBlock}>
                        <p>Purchase excl. VAT</p>
                        <p>$125.50</p>
                    </div>
                    <div className={styles.billBlock}>
                        <p>Sales incl. VAT</p>
                        <p>$189.50</p>
                    </div>

                    <div className={styles.totalBlock}>
                        <p>Sales incl. VAT</p>
                        <p>$189.50</p>
                    </div>
                </div>

                <div className={styles.btnsWrap}>
                    <button className={styles.topBtn}>
                        <img src={truck} alt="" />
                        Tracking

                    </button>

                    <div className={styles.bottomBtns}>
                        <button className={`${styles.bottomBtn} ${styles.leftBtn}`}>
                            <img src={tag} alt="" />
                            Tracking
                        </button>
                        <button className={`${styles.bottomBtn} ${styles.rightBtn}`}>
                            <img src={redX} alt="" />
                            Cancelled
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default MobileOrderCard