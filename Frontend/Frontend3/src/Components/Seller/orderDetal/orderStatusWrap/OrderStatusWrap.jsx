import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';

import StatusText from '../../all/statusText/StatusText';
import StatusUpdateSwitch from '../../../../ui/Seller/orderDetal/statusUpdateSwitch/StatusUpdateSwitch';
import StatusUpdateSecond from '../../../../ui/Seller/orderDetal/statusUpdateSecond/StatusUpdateSecond';
import Spinner from '../../../../ui/Spiner/Spiner';

import styles from './OrderStatusWrap.module.scss';

const OrderStatusWrap = ({ summary, statusState, setStatusState }) => {

    const [canUpdate, setCanUpdate] = useState(false)
    const [loading, setLoading] = useState(false)

    const { t } = useTranslation('sellerOrder')


    useEffect(() => {
        setCanUpdate(true)
    }, [status])




    return (
        <div className={styles.main}>
            <h3 className={styles.title}>{t('orderStatus')}</h3>
            <div className={styles.statusContentWrap}>
                <p className={styles.currentText}>{t('currentStatus')}</p>
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
                            ? t('clickToChangeStatus')
                            : t('statusCannotBeUpdated')}
                    </p>
                    <span></span>
                </div>
            </div>
        </div>
    )
}

export default OrderStatusWrap