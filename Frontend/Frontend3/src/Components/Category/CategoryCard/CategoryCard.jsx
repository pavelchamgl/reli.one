import categoryCardImage from "../../../assets/Category/CategoryCardImage.svg";

import styles from "./CategoryCard.module.scss";

const CategoryCard = () => {
  return (
    <div
      className={styles.main}
      style={{ backgroundImage: `url(${categoryCardImage})` }}
    >
      <p>Deti</p>
    </div>
  );
};

export default CategoryCard;
