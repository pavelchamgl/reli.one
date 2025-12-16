
import card from "../../../../assets/Seller/orderDetal/card.svg"
import truckGr from "../../../../assets/Seller/orderDetal/truckGrey.svg"


import styles from "./OrderSummary.module.scss"





const OrderSummary = () => {

    const textElements = [
        {
            title: "Order ID",
            desc: "ORD-2025-003"
        },
        {
            title: "Purchase excl. VAT",
            desc: "$220.00"
        },
        {
            title: "Created",
            desc: "2025-11-26 16:45"
        },
        {
            title: "Sales incl. VAT",
            desc: "$330.00"
        },
        {
            title: "Payment Method",
            desc: "Credit Card",
            url: card
        },
        {
            title: "Total incl. Delivery",
            desc: "$340.00",
        },
        {
            title: "Delivery Method",
            desc: "Express Delivery",
            url: truckGr
        },
    ]

    return (
        <div className={styles.main}>
            <h4 className={styles.title}>Actions</h4>

            <div className={styles.textElementWrap}>

                {textElements.map((item) => (
                    <div>
                        <p className={styles.textElementTitle}>{item.title}</p>
                        <div className={styles.textElementDescWrap}>
                            {
                                item?.url &&
                                <img src={item?.url} alt="" />
                            }
                            <p>{item.desc}</p>
                        </div>
                    </div>
                ))}

            </div>


        </div>
    )
}

export default OrderSummary