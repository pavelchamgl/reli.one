import truck from "../../../../assets/Seller/orderDetal/truckGrey.svg"
import geo from "../../../../assets/Seller/orderDetal/geo.svg"
import user from "../../../../assets/Seller/register/userIc.svg"
import email from "../../../../assets/Seller/auth/email.svg"
import phone from "../../../../assets/Seller/register/phoneIc.svg"
import prod from "../../../../assets/Seller/newOrder/productIc.svg"

import styles from "./DeliveryInformation.module.scss"
import renderI18nRichText from "../../../renderI18nRichText/RenderI18nRichText"
import { countriesArr } from "../../../../code/seller"


const DeliveryInformationBlock = ({ url, title, value }) => {
    return (
        <div className={styles.blockMain}>
            <div className={styles.blockTitle}>
                <img src={url} alt="" />
                <p>{title}</p>
            </div>
            <p className={styles.text}>{value}</p>
        </div>
    )
}

const DeliveryBigBlockElem = ({ style, url, title, value, num }) => {
    return (
        <div style={style} className={styles.deliveryBigBlockElem}>
            <img src={url} alt="" />
            <div>
                <span>{title}</span>
                <p style={{ fontFamily: num ? "var(--ft)" : "" }}>{value}</p>
            </div>
        </div>
    )
}


const DeliveryInformation = ({ data }) => {

    const { delivery } = data || {}


    const country = countriesArr.find((item) => item.value?.toLocaleUpperCase() === delivery?.delivery_address?.country)



    return (
        <div className={styles.main}>
            <p className={styles.title}>Delivery Information</p>

            <div className={styles.blocksWrap}>
                <DeliveryInformationBlock url={truck} title={"Courier Service"} value={delivery?.courier_service?.name} />
                <DeliveryInformationBlock url={prod} title={"Delivery Type"} value={delivery?.delivery_type?.name} />
            </div>

            <div>
                <div className={styles.blockTitle}>
                    <img src={geo} alt="" />
                    <p>Delivery Address</p>
                </div>

                <div className={styles.bigBlockWrap}>
                    <div className={styles.bigBlockFirst}>
                        <DeliveryBigBlockElem title={"Recipient"} url={user} style={{ marginBottom: "16px" }} />
                        <div className={styles.addressBlock}>
                            <p>
                                {renderI18nRichText({
                                    numberClassName: styles.num,
                                    text: delivery?.delivery_address?.city
                                })}
                            </p>

                            <p>
                                {renderI18nRichText({
                                    numberClassName: styles.num,
                                    text: delivery?.delivery_address?.street
                                })}
                            </p>

                            <span>{country?.text}</span>
                        </div>
                    </div>
                    <div>
                        <DeliveryBigBlockElem title={"Email"} url={email} value={delivery?.delivery_address?.email} style={{ marginBottom: "12px" }} />
                        <DeliveryBigBlockElem title={"Phone"} url={phone} value={delivery?.delivery_address?.phone} num={true} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeliveryInformation