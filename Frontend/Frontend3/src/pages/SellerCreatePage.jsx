import SellerPageContainer from "../ui/Seller/SellerPageContainer/SellerPageContainer";
import SellerHeader from "../Components/Seller/sellerHeader/SellerHeader";
import SellerCreateForm from "../Components/Seller/create/sellerCreateForm/SellerCreateForm";

import styles from "../styles/SellerCreatePage.module.scss";

const SellerCreatePage = () => {
  return (
    <SellerPageContainer>
      <div style={{ paddingBottom: "100px" }}>
        <SellerHeader />
        <h3 className={styles.createTitle}>Creation of goods</h3>
        <SellerCreateForm />
      </div>
    </SellerPageContainer>
  );
};

export default SellerCreatePage;
