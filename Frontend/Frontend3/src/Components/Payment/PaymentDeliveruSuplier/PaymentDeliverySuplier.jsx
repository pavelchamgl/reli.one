import { useTranslation } from 'react-i18next'

import BasketCard from '../../Basket/BasketCard/BasketCard'
import PaymentDeliverySelect from '../PaymentDeliverySelect/PaymentDeliverySelect'

import styles from "./PaymentDeliverySuplier.module.scss"
import { useActionPayment } from '../../../hook/useActionPayment'
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

const PaymentDeliverySuplier = ({ group, index }) => {



    const { t } = useTranslation()

    const { postCalculateDelivery, setCountry, setPointInfo } = useActionPayment()
    const { country, pointInfo, deliveryCalculateErr } = useSelector(state => state.payment)


    useEffect(() => {
        const obj = {
            seller_id: group?.seller_id,
            items: group?.items?.map((item) => {
                return {
                    sku: item?.sku,
                    quantity: item?.count
                }
            }),
            country: country
        }
        postCalculateDelivery(obj)
    }, [])

    useEffect(() => {
        if (
            pointInfo?.country !== country &&
            pointInfo?.sellerId === group?.seller_id // <-- проверка по sellerId
        ) {
            const obj = {
                seller_id: group?.seller_id,
                items: group?.items?.map((item) => ({
                    sku: item?.sku,
                    quantity: item?.count
                })),
                country: pointInfo?.country,
                queryType: "change"
            }
            postCalculateDelivery(obj)
        }
    }, [pointInfo, country])



    return (
        <div>
            <p className={styles.suplierTitle}>{`${t("payment_page.delivery_from_supplier")} ${index + 1}`}</p>
            <span className={styles.itemCount}>{`${group?.items ? group?.items?.length : 0} ${t("payment_page.positions")}`}</span>
            <div className={styles.cardWrap}>
                {
                    group?.items && group?.items?.map((item) => (
                        <BasketCard productData={item} section={"payment"} />
                    ))
                }
            </div>
            <div>
                <p className={styles.sectionTitle}>{t("delivery")}</p>
                <PaymentDeliverySelect group={group} sellerId={group?.seller_id} />
            </div>
            {/* {deliveryCalculateErr && <p className={styles.errorText}>{deliveryCalculateErr}</p>} */}
        </div>
    )
}

export default PaymentDeliverySuplier