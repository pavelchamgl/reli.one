import { useMediaQuery } from "react-responsive";

import SellerHeader from "../Components/Seller/sellerHeader/SellerHeader";
import SellerPageContainer from "../ui/Seller/SellerPageContainer/SellerPageContainer";
import SellerPreviewDesktop from "../Components/Seller/preview/SellerPreviewDesctop/SellerPreviewDesktop";

import SellerPreviewMobile from "../Components/Seller/preview/SellerPreviewMobile/SellerPreviewMobile";
import styles from "../styles/SellerPreviewPage.module.scss";

const SellerPreviewPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 470 });

  return (
    <div style={{ paddingBottom: "100px" }}>
      <h3 className={styles.title}>Creation of goods</h3>
      {isMobile ? <SellerPreviewMobile /> : <SellerPreviewDesktop />}
    </div>
  );
};

export default SellerPreviewPage;
