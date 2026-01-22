import React, { useEffect, useState } from 'react'
import styles from './OrderStatusWrap.module.scss';
import StatusText from '../../all/statusText/StatusText';
import StatusUpdateSwitch from '../../../../ui/Seller/orderDetal/statusUpdateSwitch/StatusUpdateSwitch';
import StatusUpdateSecond from '../../../../ui/Seller/orderDetal/statusUpdateSecond/StatusUpdateSecond';

const OrderStatusWrap = ({ summary }) => {

    const [canUpdate, setCanUpdate] = useState(false)

    useEffect(() => {
        setCanUpdate(true)
    }, [status])


    return (
        <div className={styles.main}>
            <h3 className={styles.title}>Order Status</h3>
            <div className={styles.statusContentWrap}>
                <p className={styles.currentText}>Current Status</p>
                {
                    (summary?.status !== "Shipped" && summary?.status !== "Cancelled") &&
                    <StatusUpdateSwitch status={summary?.status} id={summary?.id} />
                }
                {/* <StatusUpdateSecond /> */}
                {
                    summary?.status === "Shipped" &&
                    <StatusText status={"Shipped"} big={true} />
                }
                {
                    summary?.status === "Cancelled" &&
                    <StatusText status={"Cancelled"} big={true} />
                }
                <div className={styles.statusDecorateText}>
                    <span></span>
                    <p>Status cannot be updated</p>
                    <span></span>
                </div>
            </div>
        </div>
    )
}

export default OrderStatusWrap