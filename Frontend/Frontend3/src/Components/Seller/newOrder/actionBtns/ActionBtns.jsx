import truck from "../../../../assets/Seller/newOrder/truckIc.svg"
import tag from "../../../../assets/Seller/newOrder/tagIc.svg"
import redX from "../../../../assets/Seller/newOrder/redX.svg"

import styles from "./ActionBtns.module.scss"
import { getLabels, postCencelOrder } from "../../../../api/seller/orders"
import { ErrToast } from "../../../../ui/Toastify"
import { downloadBlob } from "../../../../code/seller"

const ActionBtns = ({ data }) => {



    const handleDownload = async () => {
        try {
            const res = await getLabels(data?.id)

            if (res.status === 200) {
                downloadBlob(res.data, `order.${data?.id}.zip `)
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

    const handleCancel = async () => {
        try {
            const res = await postCencelOrder(data?.id);



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
        <div className={styles.wrap}>
            <button>
                <img src={truck} alt="" />
            </button>
            <button onClick={() => {
                handleDownload()
            }}>
                <img src={tag} alt="" />
            </button>
            <button onClick={() => {
                handleCancel()
            }}>
                <img src={redX} alt="" />
            </button>
        </div>
    )
}

export default ActionBtns