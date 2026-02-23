import { Link, useParams } from 'react-router-dom'

import SellerBread from '../../Components/Seller/all/sellerBread/SellerBread'
import arrBack from "../../assets/Seller/orderDetal/arrBack.svg"

import styles from "./NewSellerOrderDetal.module.scss"
import StatusText from '../../Components/Seller/all/statusText/StatusText'
import ActionsBlock from '../../Components/Seller/orderDetal/actionsBlock/ActionsBlock'
import OrderSummary from '../../Components/Seller/orderDetal/orderSummary/OrderSummary'
import ProductsTable from '../../Components/Seller/orderDetal/productsTable/ProductsTable'
import ProductTableCard from '../../Components/Seller/orderDetal/productTableCard/ProductTableCard'
import TimeLineBlock from '../../Components/Seller/orderDetal/timelineBlock/TimeLineBlock'
import ShipmentDetail from '../../Components/Seller/orderDetal/shipmentDetail/ShipmentDetail'
import OrderStatusWrap from '../../Components/Seller/orderDetal/orderStatusWrap/OrderStatusWrap'
import { useMediaQuery } from 'react-responsive'
import { useEffect, useState } from 'react'
import { getOrderDetails } from '../../api/seller/orders'
import DeliveryInformation from '../../Components/Seller/orderDetal/deliveryInformation/DeliveryInformation'

const NewSellerOrderDetal = () => {

    const { id } = useParams()

    const [data, setData] = useState(null)

    const isPlanshet = useMediaQuery({ maxWidth: 800 })
    const isMobile = useMediaQuery({ maxWidth: 500 })


    const linkArr = [
        {
            name: "Home",
            link: "/seller/seller-home"
        },
        {
            name: "Orders",
            link: "/seller/seller-order"
        },
        {
            name: id,
            link: `/seller/seller-order-detal/${id}`
        }


    ]

    useEffect(() => {
        getOrderDetails(id).then((res) => {
            console.log(res);
            setData(res.data)
        })
    }, [id])

    const { summary, items, shipments, timeline, actions } = data || {}
    // const { delivery, totals } = summary || {}

    return (
        <div>
            <Link to={-1} className={styles.backLink}>
                <img src={arrBack} alt="" />
                Back to Orders
            </Link>
            <SellerBread arr={linkArr} />
            <div className={styles.titleWrap}>
                {
                    isMobile ?

                        <div>
                            <h3>Order</h3>
                            <h3>{summary?.order_number}</h3>
                        </div>
                        :
                        <h3>Order {summary?.order_number}</h3>
                }
                <StatusText status={summary?.status ? summary?.status : "Canceled"} />
            </div>

            <div className={styles.sectionsWrapMain} style={{ flexWrap: isPlanshet ? "wrap" : "nowrap" }}>
                <div className={styles.sectionsWrapFirst}>
                    <OrderStatusWrap summary={summary} />
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