import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from 'react-responsive'
import { useEffect, useState } from 'react'

import SellerBread from '../../Components/Seller/all/sellerBread/SellerBread'
import arrBack from "../../assets/Seller/orderDetal/arrBack.svg"
import StatusText from '../../Components/Seller/all/statusText/StatusText'
import ActionsBlock from '../../Components/Seller/orderDetal/actionsBlock/ActionsBlock'
import OrderSummary from '../../Components/Seller/orderDetal/orderSummary/OrderSummary'
import ProductsTable from '../../Components/Seller/orderDetal/productsTable/ProductsTable'
import ProductTableCard from '../../Components/Seller/orderDetal/productTableCard/ProductTableCard'
import TimeLineBlock from '../../Components/Seller/orderDetal/timelineBlock/TimeLineBlock'
import ShipmentDetail from '../../Components/Seller/orderDetal/shipmentDetail/ShipmentDetail'
import OrderStatusWrap from '../../Components/Seller/orderDetal/orderStatusWrap/OrderStatusWrap'
import { getOrderDetails } from '../../api/seller/orders'
import DeliveryInformation from '../../Components/Seller/orderDetal/deliveryInformation/DeliveryInformation'

import styles from "./NewSellerOrderDetal.module.scss"

const NewSellerOrderDetal = () => {

    const { id } = useParams()

    const [data, setData] = useState(null)
    const [statusState, setStatusState] = useState("")


    const isPlanshet = useMediaQuery({ maxWidth: 1000 })
    const isMobile = useMediaQuery({ maxWidth: 500 })

    const { t } = useTranslation('sellerOrder')


    const linkArr = [
        {
            name: t("home"),
            link: "/seller/seller-home"
        },
        {
            name: t("orders"),
            link: "/seller/seller-order"
        },
        {
            name: id,
            link: `/seller/seller-order-detal/${id}`
        }


    ]

    const { summary, items, shipments, timeline, actions } = data || {}

    useEffect(() => {
        getOrderDetails(id).then((res) => {
            console.log(res);
            setData(res.data)
        })
    }, [id])

    useEffect(() => {
        if (!summary?.status) return
        setStatusState(summary?.status)
    }, [summary?.status])

    // const { delivery, totals } = summary || {}

    return (
        <div>
            <Link to={-1} className={styles.backLink}>
                <img src={arrBack} alt="" />
                {t('backToOrders')}
            </Link>
            <SellerBread arr={linkArr} />
            <div className={styles.titleWrap}>
                {
                    isMobile ?

                        <div>
                            <h3>{t("order")}</h3>
                            <h3>{summary?.order_number}</h3>
                        </div>
                        :
                        <h3>{t("order")} {summary?.order_number}</h3>
                }
                <StatusText status={statusState ? statusState : t("canceled")} />
            </div>

            <div className={styles.sectionsWrapMain} style={{ flexWrap: isPlanshet ? "wrap" : "nowrap" }}>
                <div className={styles.sectionsWrapFirst}>
                    <OrderStatusWrap statusState={statusState} setStatusState={setStatusState} summary={summary} />
                    <OrderSummary data={data} />
                    <DeliveryInformation data={summary} />
                    <ProductsTable data={data} />
                    <ShipmentDetail shipment={shipments} />
                </div>

                <div className={styles.sectionsWrapSecond}>
                    <ActionsBlock data={data} />
                    <TimeLineBlock timeline={timeline} />
                </div>

            </div>

            {/* <ProductTableCard /> */}
        </div>
    )
}

export default NewSellerOrderDetal