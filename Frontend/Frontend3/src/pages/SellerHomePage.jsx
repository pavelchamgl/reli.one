import { useDispatch, useSelector } from "react-redux"
import { useEffect, useState } from "react";

import { fetchSellerStatics } from "../redux/sellerStaticsSlice";

import SellerHomeGraphe from "../Components/Seller/home/SellerHomeGraphe/SellerHomeGraphe";
import SellerHeader from "../Components/Seller/sellerHeader/SellerHeader";
import SellerPageContainer from "../ui/Seller/SellerPageContainer/SellerPageContainer";
import SellerStatistics from "../Components/Seller/home/SellerStatistics/SellerStatistics";
import SellerTitle from "../ui/Seller/Home/SellerHomeTitle/SellerHomeTitle";

import styles from "../styles/SellerHomePage.module.scss";
import Spinner from "../ui/Spiner/Spiner";

const SellerHomePage = () => {
  const dispatch = useDispatch()

  const [tabMain, setTabMain] = useState("curr")
  const [grapheData, setGrapheData] = useState(null)

  useEffect(() => {
    dispatch(fetchSellerStatics())
  }, [])



  const { statics, status } = useSelector(state => state.seller_statics)



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
    <>
      <SellerTitle title={"Sales"} />
      <div className={styles.grapheAndStaticsWrap}>
        <SellerHomeGraphe data={statics?.chartData} tabMain={tabMain} setGrapheData={setGrapheData} />
        <SellerStatistics data={statics} setTabMain={setTabMain} grapheData={grapheData} />
      </div>
    </>
  );
};

export default SellerHomePage;
