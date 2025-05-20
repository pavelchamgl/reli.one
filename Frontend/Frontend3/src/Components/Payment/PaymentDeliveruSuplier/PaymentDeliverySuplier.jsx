import { useTranslation } from 'react-i18next'

import BasketCard from '../../Basket/BasketCard/BasketCard'
import PaymentDeliverySelect from '../PaymentDeliverySelect/PaymentDeliverySelect'

import styles from "./PaymentDeliverySuplier.module.scss"

const PaymentDeliverySuplier = () => {

    const { t } = useTranslation()

    const section = "basket"
    const productData = {
        id: 10,
        product: {
            id: 10,
            name: 'A Gaze Through the Ruins of Time 2024',
            product_description: 'A woman’s gaze, full of anxiety and\r\n' +
                'deep contemplation, pierces through\r\n' +
                'chaos and decay, as if searching for\r\n' +
                'answers in the unknown. It is laden with\r\n' +
                'tension, simultaneously seeking\r\n' +
                'grounding in the past and attempting to\r\n' +
                'glimpse into an uncertain future. Framed\r\n' +
                'by textured and golden accents, this\r\n' +
                'gaze speaks of fears, hope, and the\r\n' +
                'inevitability of change. The painting\r\n' +
                'invites the viewer to reflect on how we\r\n' +
                'perceive the passage of time and our\r\n' +
                'place within it.\r\n' +
                'Paint: Acrylic / Canvas 40/50/1,5',
            category_name: 'Paintings',
            product_parameters: [
                { id: 15, name: 'Width', value: '15' },
                { id: 16, name: 'Length', value: '400' },
                { id: 17, name: 'Height', value: '500' }
            ],
            rating: '0.0',
            total_reviews: 0,
            license_file: null,
            images: [
                {
                    image_url:
                        'http://reli.one/media/base_product_images/%D0%A0%D0%B8%D1%81%D1%83%D0%BD%D0%BE%D0%BA1.webp'
                }
            ],
            is_favorite: false,
            variants: [
                {
                    id: 25,
                    sku: '325059445',
                    name: 'Size',
                    text: 'One',
                    image: null,
                    price: '693.00'
                }
            ],
            can_review: [],
            price: '693.00'
        },
        count: 1,
        selected: true,
        sku: '325059445'
    }



    return (
        <div>
            <p className={styles.suplierTitle}>Delivery from supplier 1</p>
            <span className={styles.itemCount}>2 positions</span>
            <div className={styles.cardWrap}>
                <BasketCard productData={productData} section={"payment"} />
            </div>
            <div>
                <p className={styles.sectionTitle}>{t("delivery")}</p>
                <PaymentDeliverySelect />
            </div>
        </div>
    )
}

export default PaymentDeliverySuplier