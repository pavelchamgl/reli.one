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
import { getLabels, postCencelOrder } from '../../../../api/seller/orders'
import { downloadBlob } from '../../../../code/seller'
import { ErrToast } from '../../../../ui/Toastify'
import { useSelector } from 'react-redux'
import { useActionNewOrder } from '../../../../hook/useActionNewOrder'

const InfoItem = ({ title, url, desc, style }) => {
    return (
        <div>
            <p className={styles.infoTitle}>{title}</p>
            <div className={styles.infoTextWrap}>
                {
                    url &&
                    <img src={url} alt="" />
                }
                <p style={style}>{desc}</p>
            </div>
        </div>
    )
}



const MobileOrderCard = ({ item }) => {

    const handleDownload = async () => {
        try {
            const res = await getLabels(item?.id)

            if (res.status === 200) {
                downloadBlob(res.data, `order.${item?.id}.zip `)
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
            const res = await postCencelOrder(item?.id);

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

    const { selectedIds } = useSelector(state => state.newOrder);

    const isChecked = selectedIds.includes(item?.id);

    const { toggleOrder } = useActionNewOrder()

    return (
        <div className={styles.main}>
            <div>
                <div className={styles.chekAndLinkTop}>
                    <div className={styles.chechAndLink}>
                        <Checkbox
                            checked={isChecked}
                            onChange={() => toggleOrder(item?.id)}
                        />
                        <Link to={`/seller/seller-order-detal/${item?.id}`}>{item?.order_number}</Link>
                    </div>

                    <StatusText status={item?.status} />
                </div>

                <div className={styles.infoTextMain}>
                    <InfoItem title={"Created"} style={{ fontFamily: "var(--ft)" }} desc={item?.order_date} url={watch} />
                    <InfoItem title={"Products"} style={{ fontFamily: "var(--ft)" }} desc={`${item?.products_count} items`} url={prod} />
                    <InfoItem title={"Branch"} desc={item?.branch?.name} />
                    <InfoItem title={"Dispatch Before"} style={{ fontFamily: "var(--ft)" }} desc={item?.dispatch_before ? item?.dispatch_before : "Pending"} />
                </div>

                <div className={styles.billMainBlock}>
                    <div className={styles.billBlock}>
                        <p>Purchase excl. VAT</p>
                        <p>{item?.purchase_excl_vat} €</p>
                    </div>
                    <div className={styles.billBlock}>
                        <p>Sales incl. VAT</p>
                        <p>{item?.sales_incl_vat} €</p>
                    </div>

                    <div className={styles.totalBlock}>
                        <p>Total incl. VAT</p>
                        <p>{item?.total_incl_vat_plus_delivery} €</p>
                    </div>
                </div>

                <div className={styles.btnsWrap}>
                    <button className={styles.topBtn}>
                        <img src={truck} alt="" />
                        Tracking

                    </button>

                    <div className={styles.bottomBtns}>
                        <button onClick={() => {
                            handleDownload()
                        }} className={`${styles.bottomBtn} ${styles.leftBtn}`}>
                            <img src={tag} alt="" />
                            Download
                        </button>
                        <button onClick={() => {
                            handleCancel()
                        }} className={`${styles.bottomBtn} ${styles.rightBtn}`}>
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