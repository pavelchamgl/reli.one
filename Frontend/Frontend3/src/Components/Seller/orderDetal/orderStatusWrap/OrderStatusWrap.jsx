import React, { useEffect, useState } from 'react'
import styles from './OrderStatusWrap.module.scss';
import StatusText from '../../all/statusText/StatusText';
import StatusUpdateSwitch from '../../../../ui/Seller/orderDetal/statusUpdateSwitch/StatusUpdateSwitch';
import StatusUpdateSecond from '../../../../ui/Seller/orderDetal/statusUpdateSecond/StatusUpdateSecond';
import Spinner from '../../../../ui/Spiner/Spiner';

const OrderStatusWrap = ({ summary, statusState, setStatusState }) => {

    const [canUpdate, setCanUpdate] = useState(false)
    const [loading, setLoading] = useState(false)


    useEffect(() => {
        setCanUpdate(true)
    }, [status])




    return (
        <div className={styles.main}>
            <h3 className={styles.title}>Order Status</h3>
            <div className={styles.statusContentWrap}>
                <p className={styles.currentText}>Current Status</p>
                {
                    loading ?
                        <Spinner /> :
                        <>
                            {
                                (statusState !== "Shipped" && setStatusState !== "Cancelled") &&
                                <StatusUpdateSwitch setLoading={setLoading} status={summary?.status} id={summary?.id} statusState={statusState} setStatusState={setStatusState} />
                            }
                            {
                                statusState === "Shipped" &&
                                <StatusText status={"Shipped"} big={true} />
                            }
                            {
                                summary?.status === "Cancelled" &&
                                <StatusText status={"Cancelled"} big={true} />
                            }
                        </>
                }
                <div className={styles.statusDecorateText}>
                    <span></span>
                    <p>
                        {["Pending", "Processing"].includes(statusState)
                            ? "Click to change status"
                            : "Status cannot be updated"}
                    </p>
                    <span></span>
                </div>
            </div>
        </div>
    )
}

export default OrderStatusWrap