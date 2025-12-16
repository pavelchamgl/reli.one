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

const NewSellerOrderDetal = () => {

    const { id } = useParams()

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
    return (
        <div>
            <Link className={styles.backLink}>
                <img src={arrBack} alt="" />
                Back to Orders
            </Link>
            <SellerBread arr={linkArr} />
            <div className={styles.titleWrap}>
                {
                    isMobile ?

                        <div>
                            <h3>Order</h3>
                            <h3>ORD-2025-003</h3>
                        </div>
                        :
                        <h3>Order ORD-2025-003</h3>
                }
                <StatusText status={"Pending"} />
            </div>

            <div className={styles.sectionsWrapMain} style={{ flexWrap: isPlanshet ? "wrap" : "nowrap" }}>
                <div className={styles.sectionsWrapFirst}>
                    <OrderStatusWrap />
                    <OrderSummary />
                    <ProductsTable />
                    <ShipmentDetail />
                </div>

                <div className={styles.sectionsWrapSecond}>
                    <ActionsBlock />
                    <TimeLineBlock />
                </div>

            </div>

            {/* <ProductTableCard /> */}
        </div>
    )
}

export default NewSellerOrderDetal