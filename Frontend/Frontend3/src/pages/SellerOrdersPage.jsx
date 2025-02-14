import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"

import { fetchWarehouseAnalytics } from "../redux/warehouseSlice";

import SellerHeader from "../Components/Seller/sellerHeader/SellerHeader";
import SellerTitle from "../ui/Seller/Home/SellerHomeTitle/SellerHomeTitle";
import OrdersContainer from "../ui/Seller/Orders/OrdersContainer/OrdersContainer";
import OrdersGraphe from "../ui/Seller/Orders/OrdersGraphe/OrdersGraphe";
import OrdersStatics from "../ui/Seller/Orders/OrdersStatics/OrdersStatics";
import SellerPageContainer from "../ui/Seller/SellerPageContainer/SellerPageContainer";
import Spinner from "../ui/Spiner/Spiner";

import styles from "../styles/SellerOrderPage.module.scss"

const SellerOrdersPage = () => {

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(
      fetchWarehouseAnalytics()
    )
  }, [])

  const { analytics, status } = useSelector(state => state.warehouse)

  console.log(analytics);

  if (status === "pending") {
    return (
      <div className={styles.mainLoading}>
        <Spinner size="40px" />
      </div>
    )
  }

  if (status === "rejected") {
    return (
      <div className={styles.mainLoading}>
        <p className={styles.errorText}>
          Oops! Something went wrong on our end. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.main}>
      <OrdersContainer>
        <SellerTitle title={"Orders"} />
        <OrdersStatics data={analytics?.vendor_warehouse} text={"Vendor warehouse"} />
        <OrdersGraphe dataMain={analytics?.vendor_warehouse} />
        <OrdersStatics data={analytics?.reli_warehouse} style={{ marginTop: "25px" }} text={"Reli warehouse"} />
        <OrdersGraphe dataMain={analytics?.reli_warehouse} />
      </OrdersContainer>
    </div>
  );
};

export default SellerOrdersPage;
