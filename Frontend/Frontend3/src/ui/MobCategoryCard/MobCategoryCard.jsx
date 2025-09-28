import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import categoryTestImage from "../../assets/Category/CategoryCardImage.svg";

import styles from "./MobCategoryCard.module.scss";

const MobCategoryCard = ({ item }) => {
  const navigate = useNavigate();

  const { t } = useTranslation()

  const handleCategoryClick = () => {
    navigate(
      `/product_category/${item?.id}?categoryValue=${encodeURIComponent(
        item?.name
      )}&categoryID=${item?.id}`
    )
  };




  return (
    <div
      onClick={handleCategoryClick}
      className={styles.cardItem}
      style={{ backgroundImage: `url(${item?.image_url})` }}
    >
      <p>{t(`categories.${item.id}`, { defaultValue: item.name })}</p>
    </div>
  );
};

export default MobCategoryCard;
