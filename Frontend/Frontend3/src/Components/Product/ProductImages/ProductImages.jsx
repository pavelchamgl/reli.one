import React, { useState } from "react";
import styles from "./ProductImages.module.scss";

const ProductImages = () => {
  const [image, setImage] = useState(
    "https://i.pinimg.com/564x/45/bf/76/45bf762e2550308ba48233b784a0d09e.jpg"
  );

  let src1 =
    "https://i.pinimg.com/564x/45/bf/76/45bf762e2550308ba48233b784a0d09e.jpg";
  let src2 =
    "https://i.pinimg.com/564x/10/8b/a9/108ba9d7600078f072b4327ebe77add4.jpg";
  let src3 =
    "https://i.pinimg.com/564x/09/93/05/09930542a7712f58268ecca4e540e442.jpg";

  return (
    <div className={styles.main}>
      <img className={styles.mainImage} src={image} alt="" />
      <div className={styles.smallImageDiv}>
        <button className={styles.smallImage} onClick={() => setImage(src1)}>
          <img src={src1} alt="" />
        </button>
        <button className={styles.smallImage} onClick={() => setImage(src2)}>
          <img src={src2} alt="" />
        </button>
        <button className={styles.smallImage} onClick={() => setImage(src3)}>
          <img src={src3} alt="" />
        </button>
      </div>
    </div>
  );
};

export default ProductImages;
