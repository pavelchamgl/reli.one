import SellerHeader from "../Components/Seller/sellerHeader/SellerHeader";
import SellerTitle from "../ui/Seller/Home/SellerHomeTitle/SellerHomeTitle";
import OrdersContainer from "../ui/Seller/Orders/OrdersContainer/OrdersContainer";
import OrdersGraphe from "../ui/Seller/Orders/OrdersGraphe/OrdersGraphe";
import OrdersStatics from "../ui/Seller/Orders/OrdersStatics/OrdersStatics";
import SellerPageContainer from "../ui/Seller/SellerPageContainer/SellerPageContainer";

import styles from "../styles/SellerOrderPage.module.scss"

const SellerOrdersPage = () => {
  return (
    <div className={styles.main}>
        <OrdersContainer>
          <SellerTitle title={"Orders"} />
          <OrdersStatics text={"Vendor warehouse"} />
          <OrdersGraphe />
          <OrdersStatics style={{ marginTop: "25px" }} text={"Reli warehouse"} />
          <OrdersGraphe />
        </OrdersContainer>
    </div>
  );
};

export default SellerOrdersPage;
