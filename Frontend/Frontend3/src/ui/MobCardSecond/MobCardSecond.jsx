import cardImage from "../../assets/Product/ProductTestImage.svg";

import styles from "./MobCardSecond.module.scss";

const MobCardSecond = ({ product }) => {
  if (product) {
    return (
      <div className={styles.main}>
        <div className={styles.descAndImageWrap}>
          <img
            className={styles.img}
            src={
              product.images && product.images.length > 0
                ? product?.images[0]?.image_url
                : ""
            }
            alt=""
          />
          <div className={styles.descDiv}>
            <p>{product?.name}</p>
            <span>{product?.category_name}</span>
          </div>
        </div>
        <p className={styles.price}>
          1 x <strong>{product?.price} €</strong>
        </p>
      </div>
    );
  }
};

export default MobCardSecond;
