import React from 'react'

import truck from "../../../../assets/Seller/orderDetal/truck.svg"
import down from "../../../../assets/Seller/orderDetal/down.svg"
import dock from "../../../../assets/Seller/orderDetal/dock.svg"
import xWhite from "../../../../assets/Seller/orderDetal/xWhite.svg"

import styles from './ActionsBlock.module.scss';
import { getExportLabels, getLabels, postCencelOrder } from '../../../../api/seller/orders'
import { ErrToast } from '../../../../ui/Toastify'
import { downloadBlob } from '../../../../code/seller'

const ActionsBlock = ({ data }) => {

    const { summary, items, shipments, timeline, actions } = data || {}


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
                "Failed to download your label";

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
                "Failed to download your label";

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
                "Failed to cancel your order";

            ErrToast(message);
        }
    };

    return (
        <div className={styles.actionBlock}>

            <h4 className={styles.title}>Actions</h4>

            <button onClick={() => {
                handleDownload()
            }}>
                <img src={down} alt="" />
                <p>Download Label</p>
            </button>
            <button>
                <img src={truck} alt="" />
                <p>Track Shipment</p>
            </button>
            <button onClick={() => {
                handleExport()
            }}>
                <img src={dock} alt="" />
                <p>Export Invoice</p>
            </button>
            <button onClick={() => {
                handleCancel()
            }}>
                <img src={xWhite} alt="" />
                <p>Cancel Order</p>
            </button>

        </div>
    )
}

export default ActionsBlock