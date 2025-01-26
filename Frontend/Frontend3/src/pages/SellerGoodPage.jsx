import GoodsChoiceBtn from "../ui/Seller/Goods/GoodsChoiceBtns/GoodsChoiceBtn";

import styles from "../styles/SellerGoodPage.module.scss";

const SellerGoodPage = () => {
  return (
    <div className={styles.btnWrap}>
      <GoodsChoiceBtn type={"list"} link="/seller/goods-list" />
      <GoodsChoiceBtn type={"add"} link="/seller/seller-create" />
    </div>
  );
};

export default SellerGoodPage;
