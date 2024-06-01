import image from "../../../assets/Category/CategoryCardImage.svg";
import arrRight from "../../../assets/Catalog/arrRight.svg";

import styles from "./CatalogCard.module.scss";

const CatalogCard = () => {
  return (
    <div className={styles.main} style={{ backgroundImage: `url(${image})` }}>
      <div className={styles.titleDiv}>
        <img src={arrRight} alt="" />
        <p>Test</p>
        <img src={arrRight} alt="" />
      </div>
    </div>
  );
};

export default CatalogCard;
