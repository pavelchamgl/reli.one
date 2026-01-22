import { useSelector } from "react-redux";

import down from "../../../../assets/Seller/newOrder/down.svg"
import exp from "../../../../assets/Seller/newOrder/export.svg"
import whiteX from "../../../../assets/Seller/newOrder/whiteX.svg"
import { postDownloadLabels } from "../../../../api/seller/orders";
import { ErrToast } from "../../../../ui/Toastify";
import { downloadBlob } from "../../../../code/seller";


import styles from './DownLabelsBlock.module.scss';

const DownLabelsBlock = () => {

    const { selectedIds } = useSelector(state => state.newOrder);

    const handleDownload = async () => {
        try {
            const res = await postDownloadLabels(selectedIds)
            console.log(res);

            if (res.status === 200) {
                downloadBlob(res.data, `orders.zip `)
            }
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                "Failed to download your label";

            console.log(error);


            ErrToast(message);
        }
    }


    return (
        <div className={styles.block}>
            <p className={styles.countText}>{selectedIds?.length ? selectedIds?.length : "No orders"} selected</p>
            <span className={styles.devidor}></span>

            <div className={styles.btnsWrap}>
                <button onClick={() => {
                    if (selectedIds?.length > 0) {
                        handleDownload()
                    } else {
                        ErrToast("No orders selected")
                    }
                }} className={styles.downloadAndExportBtn}>
                    <img src={down} alt="" />
                    Download Labels
                </button>

                <button className={styles.downloadAndExportBtn}>
                    <img src={exp} alt="" />
                    Export
                </button>

                <button className={styles.closeBtn}>
                    <img src={whiteX} alt="" />
                </button>
            </div>



        </div>
    )
}

export default DownLabelsBlock