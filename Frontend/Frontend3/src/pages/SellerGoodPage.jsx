import SellerHeader from "../Components/Seller/sellerHeader/SellerHeader";
import GoodsChoiceBtn from "../ui/Seller/Goods/GoodsChoiceBtns/GoodsChoiceBtn";

import styles from "../styles/SellerGoodPage.module.scss";
import SellerPageContainer from "../ui/Seller/SellerPageContainer/SellerPageContainer";

const SellerGoodPage = () => {
  return (
    <SellerPageContainer>
      <SellerHeader />
      <div className={styles.btnWrap}>
        <GoodsChoiceBtn type={"list"} link="/seller-goods-list" />
        <GoodsChoiceBtn type={"add"} link="/seller-create" />
      </div>
    </SellerPageContainer>
  );
};

export default SellerGoodPage;
