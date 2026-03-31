import { useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { useSelector } from 'react-redux'

import SellerBread from '../../Components/Seller/all/sellerBread/SellerBread'
import DownLabelsBlock from '../../Components/Seller/newOrder/downLabelsBlock/DownLabelsBlock'
import FilterBlock from '../../Components/Seller/newOrder/filterBlock/FilterBlock'
import MobileOrderCard from '../../Components/Seller/newOrder/mobileOrderCard/MobileOrderCard'
import NewOrderTable from '../../Components/Seller/newOrder/newOrderTable/NewOrderTable'
import { getOrders } from '../../api/seller/orders'
import { useActionNewOrder } from '../../hook/useActionNewOrder'
import NoContentText from '../../ui/NoContentText/NoContentText'

import styles from "./NewSellerOrder.module.scss"
import { useTranslation } from 'react-i18next'

const NewSellerOrder = () => {


    const isDesktop = useMediaQuery({ maxWidth: 1400 })

    const { getOrdersByFilters } = useActionNewOrder()
    const { data } = useSelector(state => state.newOrder)
    const { t } = useTranslation('sellerOrder')

    const linkArr = [
        {
            name: t("home"),
            link: "/seller/seller-home"
        },
        {
            name: t("orders"),
            link: "/seller/seller-order"
        }
    ]


    useEffect(() => {
        getOrdersByFilters()
    }, [])

    return (
        <div className={styles.wrap}>
            <SellerBread arr={linkArr} />
            <h2 className={styles.title}>{t('orders')}</h2>
            <FilterBlock />
            {
                data ?
                    isDesktop ?
                        <div className={styles.orderCardWrap}>
                            {
                                data?.map((item) => (
                                    <MobileOrderCard item={item} />
                                )
                                )
                            }
                        </div>
                        :
                        <NewOrderTable data={data} />
                    :
                    <NoContentText />
            }

            <DownLabelsBlock />
        </div>
    )
}

export default NewSellerOrder