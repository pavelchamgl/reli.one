import SellerHomeGraphe from "../Components/Seller/home/SellerHomeGraphe/SellerHomeGraphe";
import SellerHeader from "../Components/Seller/sellerHeader/SellerHeader";
import SellerPageContainer from "../ui/Seller/SellerPageContainer/SellerPageContainer";
import SellerStatistics from "../Components/Seller/home/SellerStatistics/SellerStatistics";
import SellerTitle from "../ui/Seller/Home/SellerHomeTitle/SellerHomeTitle";

import styles from "../styles/SellerHomePage.module.scss";

const SellerHomePage = () => {
  return (
    <SellerPageContainer>
      <SellerHeader /> 
      <SellerTitle title={"Sales"}/>
      <div className={styles.grapheAndStaticsWrap}>
        <SellerHomeGraphe />
        <SellerStatistics />
      </div>
    </SellerPageContainer>
  );
};

export default SellerHomePage;
