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
      <SellerPageContainer>
        <SellerHeader />
        <OrdersContainer>
          <SellerTitle title={"Orders"} />
          <OrdersStatics />
          <OrdersGraphe />
        </OrdersContainer>
      </SellerPageContainer>
    </div>
  );
};

export default SellerOrdersPage;
