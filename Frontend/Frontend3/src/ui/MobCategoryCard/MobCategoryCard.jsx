import { useNavigate } from "react-router-dom";

import categoryTestImage from "../../assets/Category/CategoryCardImage.svg";

import styles from "./MobCategoryCard.module.scss";

const MobCategoryCard = ({ item }) => {
  const navigate = useNavigate();

  const handleCategoryClick = () => {
    navigate(
      `/product_category?categoryValue=${encodeURIComponent(
        item?.name
      )}&categoryID=${item?.id}`
    );
  };
  return (
    <div
      onClick={handleCategoryClick}
      className={styles.cardItem}
      style={{ backgroundImage: `url(${categoryTestImage})` }}
    >
      <p>{item?.name}</p>
    </div>
  );
};

export default MobCategoryCard;
