
import card from "../../../../assets/Seller/orderDetal/card.svg"
import truckGr from "../../../../assets/Seller/orderDetal/truckGrey.svg"


import styles from "./OrderSummary.module.scss"





const OrderSummary = ({ data }) => {

    const { summary, items, shipments, timeline, actions } = data || {}
    const { delivery, totals } = summary || {}

    console.log(data);



    const textElements = [
        {
            title: "Order ID",
            desc: summary?.order_number,
            num: true
        },
        {
            title: "Purchase excl. VAT",
            desc: `${totals?.purchase_excl_vat} €`,
            num: true
        },
        {
            title: "Created",
            desc: summary?.order_date,
            num: true
        },
        {
            title: "Sales incl. VAT",
            desc: `${totals?.sales_incl_vat} €`,
            num: true
        },
        {
            title: "Payment Method",
            desc: "Credit Card",
            url: card
        },
        {
            title: "Total incl. Delivery",
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
            <h4 className={styles.title}>Order Summary</h4>

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