import { useEffect, useState } from "react";
import cardImage from "../../assets/Product/ProductTestImage.svg";
import styles from "./MobCardSecond.module.scss";

const MobCardSecond = ({ product, sku, count }) => {
  const [variant, setVariant] = useState(null);



  useEffect(() => {
    if (product?.variants) {
      const foundVariant = product?.variants?.find((item) => item.sku === sku);
      setVariant(foundVariant || null);
    }
  }, [product]);

  if (!product) {
    return null; // Возвращаем null, если продукт отсутствует
  }

  return (
    <div className={styles.main}>
      <div className={styles.descAndImageWrap}>
        <img
          className={styles.img}
          src={
            variant?.image
              ? variant.image
              : product?.image || product?.images?.[0]?.image_url || cardImage // fallback на случай отсутствия изображений
          }
          alt={product?.name || "Product image"}
        />
        <div className={styles.descDiv}>
          <p>{product?.name}</p>
          <span>
            {!variant?.image && variant?.text
              ? <><span>{variant?.name}: </span> <span>{variant?.text}</span></>
              : ""}
          </span>
        </div>
      </div>
      <p className={styles.price}>
        <span>{count}</span> <span>x</span><strong>{variant ? variant?.price : null}</strong>
      </p>
    </div>
  );
};

export default MobCardSecond;
