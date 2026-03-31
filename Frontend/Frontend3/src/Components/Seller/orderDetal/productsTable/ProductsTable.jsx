import { useMediaQuery } from "react-responsive"
import { useTranslation } from "react-i18next"

import ProductTableCard from "../productTableCard/ProductTableCard"

import styles from "./ProductsTable.module.scss"

const ProductsTable = ({ data }) => {

    const { summary, items, shipments, timeline, actions } = data || {}

    const isPlanshet = useMediaQuery({ maxWidth: 1150 })

    const { t } = useTranslation('sellerOrder')

    const tableTitles = [
        {
            text: t("product"),
            minWidth: 200
        },
        {
            text: t("sku"),
            minWidth: 161
        },
        {
            text: t('variant'),
            minWidth: 146
        },
        {
            text: t('quantity'),
            minWidth: 60
        },
        {
            text: t('unitPrice'),
            minWidth: 103
        },
        {
            text: t("total"),
            minWidth: 87
        },
    ]

    // const itemsArr = [
    //     {
    //         "name": "Premium Cotton T-Shirt",
    //         "sku": "TS-BLK-M-001",
    //         "variant": "Black / M",
    //         "quantity": 2,
    //         "price": 29.99,
    //         "total": 59.98
    //     },
    //     {
    //         "name": "Denim Jeans Slim Fit",
    //         "sku": "DJ-BLU-32-002",
    //         "variant": "Blue / 32",
    //         "quantity": 1,
    //         "price": 89.99,
    //         "total": 89.99
    //     },
    //     {
    //         "name": "Casual Sneakers",
    //         "sku": "SN-WHT-42-003",
    //         "variant": "White / 42",
    //         "quantity": 1,
    //         "price": 119.99,
    //         "total": 119.99
    //     },
    //     {
    //         "name": "Baseball Cap",
    //         "sku": "CAP-GRY-OS-004",
    //         "variant": "Grey / One Size",
    //         "quantity": 1,
    //         "price": 24.99,
    //         "total": 24.99
    //     }
    // ]


    return (
        <div className={styles.main}>
            <h4 className={styles.title}>{t('productItems')}</h4>


            {
                isPlanshet ?

                    (
                        <div className={styles.mobileCardsWrap}>
                            {
                                items?.map((item) => (
                                    <ProductTableCard item={item} />
                                ))
                            }
                        </div>
                    )

                    :

                    (
                        <div>
                            <div className={styles.titleTableBlock}>
                                {tableTitles.map((item) => (
                                    <p style={{ minWidth: `${item.minWidth}px` }}>{item.text}</p>
                                ))}
                            </div>
                            <div className={styles.titleItemBlockWrap}>
                                {
                                    items?.map((item) => (
                                        <div className={styles.titleItemBlock}>
                                            <p
                                                style={{ minWidth: "200px" }}
                                            >
                                                {item?.name}
                                            </p>
                                            <p
                                                style={{ minWidth: "161px", color: "#4a5565", fontFamily: "var(--ft)" }}
                                            >
                                                {item?.sku}
                                            </p>
                                            <p
                                                style={{ minWidth: "146px", color: "#4a5565" }}
                                            >
                                                {item?.variant_name}
                                            </p>
                                            <p
                                                style={{ minWidth: "60px", fontFamily: "var(--ft)" }}
                                            >
                                                {item?.quantity}
                                            </p>
                                            <p
                                                style={{ minWidth: "103px", fontFamily: "var(--ft)" }}
                                            >
                                                {`${item?.unit_price_gross} €`}
                                            </p>
                                            <p
                                                style={{ minWidth: "107px", fontFamily: "var(--ft)" }}
                                            >
                                                {`${item?.line_total_gross} €`}
                                            </p>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )

            }


        </div>
    )
}

export default ProductsTable