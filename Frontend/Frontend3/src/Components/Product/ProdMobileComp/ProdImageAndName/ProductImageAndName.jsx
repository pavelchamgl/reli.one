import mobReturnIcon from "../../../../assets/mobileIcons/mobReturnIcon.svg";
import likeIcon from "../../../../assets/Product/like.svg";
import likeAccIcon from "../../../../assets/Product/likeAcc.svg";
import prodDelivery from "../../../../assets/Product/productDeliveryCar.svg"

import MobileProdSwiper from "../../../../ui/MobileProdSlice/MobileProdSlice";

import styles from "./ProductImageAndName.module.scss";

const ProductImageAndName = () => {
  return (
    <div className={styles.main}>
      <div className={styles.buttonWrap}>
        <button>
          <img src={mobReturnIcon} alt="" />
        </button>
        <button>
          <img src={likeIcon} alt="" />
        </button>
      </div>
      <MobileProdSwiper />
      <div className={styles.descAndBtnWrap}>
        <p className={styles.title}>Robot Vysavač Dyson LXS10 White</p>
        <div className={styles.priceWrap}>
          <p>300.00 Kč</p>
          <span>400.00 Kč</span>
        </div>
        <button className={styles.basketBtn}>Přidat do košíku</button>
        <button className={styles.deliveryBtn}>
          <img src={prodDelivery} alt="" />
          <p>Dodání od 2 dnů do 4 měsíců</p>
        </button>
      </div>
    </div>
  );
};

export default ProductImageAndName;
