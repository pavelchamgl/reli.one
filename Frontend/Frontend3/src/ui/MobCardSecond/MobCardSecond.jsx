import { useEffect, useState } from "react";
import cardImage from "../../assets/Product/ProductTestImage.svg";
import styles from "./MobCardSecond.module.scss";

const MobCardSecond = ({ product, sku }) => {
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
          <p>
            {product?.name}
            {!variant?.image && variant?.text ? ` (${variant.text})` : ""}
          </p>
          <span>{product?.category_name || "Unknown category"}</span>
        </div>
      </div>
      <p className={styles.price}>
        1 x{" "}
        <strong>
          {product?.price ? `${product.price} €` : "Price not available"}
        </strong>
      </p>
    </div>
  );
};

export default MobCardSecond;
