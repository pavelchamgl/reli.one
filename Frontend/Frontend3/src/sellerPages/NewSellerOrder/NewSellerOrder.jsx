import SellerBread from '../../Components/Seller/all/sellerBread/SellerBread'
import DownLabelsBlock from '../../Components/Seller/newOrder/downLabelsBlock/DownLabelsBlock'
import FilterBlock from '../../Components/Seller/newOrder/filterBlock/FilterBlock'
import MobileOrderCard from '../../Components/Seller/newOrder/mobileOrderCard/MobileOrderCard'
import NewOrderTable from '../../Components/Seller/newOrder/newOrderTable/NewOrderTable'

import styles from "./NewSellerOrder.module.scss"

const NewSellerOrder = () => {

    const linkArr = [
        {
            name: "Home",
            link: "/seller/seller-home"
        },
        {
            name: "Orders",
            link: "/seller/seller-order"
        }

    ]
    return (
        <div className={styles.wrap}>
            <SellerBread arr={linkArr} />
            <h2 className={styles.title}>Orders</h2>
            <FilterBlock />
            <div className={styles.orderCardWrap}>
                <MobileOrderCard />
                <MobileOrderCard />
                <MobileOrderCard />
                <MobileOrderCard />
                <MobileOrderCard />
                <MobileOrderCard />
                <MobileOrderCard />
                <MobileOrderCard />
            </div>
            {/* <NewOrderTable /> */}
            <DownLabelsBlock />
        </div>
    )
}

export default NewSellerOrder