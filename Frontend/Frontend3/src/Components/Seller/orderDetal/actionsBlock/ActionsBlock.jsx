import { useTranslation } from 'react-i18next'

import truck from "../../../../assets/Seller/orderDetal/truck.svg"
import down from "../../../../assets/Seller/orderDetal/down.svg"
import dock from "../../../../assets/Seller/orderDetal/dock.svg"
import xWhite from "../../../../assets/Seller/orderDetal/xWhite.svg"
import { getExportLabels, getLabels, postCencelOrder } from '../../../../api/seller/orders'
import { ErrToast } from '../../../../ui/Toastify'
import { downloadBlob } from '../../../../code/seller'

import styles from './ActionsBlock.module.scss';

const ActionsBlock = ({ data }) => {

    const { summary, items, shipments, timeline, actions } = data || {}

    const { t } = useTranslation('sellerOrder')


    const handleDownload = async () => {
        try {
            const res = await getLabels(summary?.id)
            console.log(res);

            if (res.status === 200) {
                downloadBlob(res.data, `order.${summary.id}.zip`)
            }
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                t('failedDown');

            ErrToast(message);
        }
    }

    const handleExport = async () => {
        try {
            const res = await getExportLabels(summary?.id)
            console.log(res);

            if (res.status === 200) {
                downloadBlob(res.data, `order.${summary.id}.csv`)
            }
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                t('failedDown');

            ErrToast(message);
        }
    }

    const handleCancel = async () => {
        try {
            const res = await postCencelOrder(summary?.id);

            console.log(res);


            // if (res.status === 200) {
            //     setActive(1)
            // }
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                t('failedCanc');

            ErrToast(message);
        }
    };

    return (
        <div className={styles.actionBlock}>

            <h4 className={styles.title}>{t('actions')}</h4>

            <button onClick={() => {
                handleDownload()
            }}>
                <img src={down} alt="" />
                <p>{t('downloadLabel')}</p>
            </button>
            <button>
                <img src={truck} alt="" />
                <p>{t('trackShipment')}</p>
            </button>
            <button onClick={() => {
                handleExport()
            }}>
                <img src={dock} alt="" />
                <p>{t('exportInvoice')}</p>
            </button>
            <button onClick={() => {
                handleCancel()
            }}>
                <img src={xWhite} alt="" />
                <p>{t('cancelOrder')}</p>
            </button>

        </div>
    )
}

export default ActionsBlock