
import { useTranslation } from "react-i18next"
import card from "../../../../assets/Seller/orderDetal/card.svg"
import truckGr from "../../../../assets/Seller/orderDetal/truckGrey.svg"

import styles from "./OrderSummary.module.scss"





const OrderSummary = ({ data }) => {

    const { summary, items, shipments, timeline, actions } = data || {}
    const { delivery, totals } = summary || {}

    const { t } = useTranslation('sellerOrder')





    const textElements = [
        {
            title: t("orderId"),
            desc: summary?.order_number,
            num: true
        },
        {
            title: t('purchaseExclVat'),
            desc: `${totals?.purchase_excl_vat} €`,
            num: true
        },
        {
            title: t("created"),
            desc: summary?.order_date,
            num: true
        },
        {
            title: t('salesInclVat'),
            desc: `${totals?.sales_incl_vat} €`,
            num: true
        },
        {
            title: t("paymentMethod"),
            desc: "Credit Card",
            url: card
        },
        {
            title: t('totalWithDelivery'),
            desc: `${totals?.total_incl_vat_plus_delivery} €`,
            num: true
        },
        // {
        //     title: "Delivery Method",
        //     desc: delivery?.delivery_type?.name,
        //     url: truckGr
        // },
    ]

    return (
        <div className={styles.main}>
            <h4 className={styles.title}>{t("orderSummary")}</h4>

            <div className={styles.textElementWrap}>

                {textElements.map((item) => (
                    <div>
                        <p className={styles.textElementTitle}>{item.title}</p>
                        <div className={styles.textElementDescWrap}>
                            {
                                item?.url &&
                                <img src={item?.url} alt="" />
                            }
                            <p style={{ fontFamily: item?.num ? "var(--ft)" : "" }}>{item.desc}</p>
                        </div>
                    </div>
                ))}

            </div>


        </div>
    )
}

export default OrderSummary