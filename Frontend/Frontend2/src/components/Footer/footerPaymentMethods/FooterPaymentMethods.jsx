import { useTranslation } from "react-i18next"

import stripe from "../../../assets/paymentMethods/stripe.svg"
import paypal from "../../../assets/paymentMethods/paypal.svg"
import apple from "../../../assets/paymentMethods/applePay.svg"
import google from "../../../assets/paymentMethods/googlePay.svg"
import visa from "../../../assets/paymentMethods/visa.svg"
import master from "../../../assets/paymentMethods/masterCard.svg"
import maestro from "../../../assets/paymentMethods/maestro.svg"

import styles from "./FooterPaymentMethods.module.scss"

const FooterPaymentMethods = () => {

    const { t } = useTranslation("footer")


    const images = [
        {
            url: stripe
        },
        {
            url: paypal
        },
        {
            url: apple
        },
        {
            url: google
        },
        {
            url: visa
        },
        {
            url: master
        },
        {
            url: maestro
        }
    ]

    return (
        <div className={styles.wrap}>
            <h5 className={styles.title}>{t("footer.payment_methods_title")}</h5>

            <div className={styles.imagesWrap}>
                {
                    images.map((image) => (
                        <img src={image.url} alt="" />
                    ))
                }

            </div>
        </div>
    )
}

export default FooterPaymentMethods