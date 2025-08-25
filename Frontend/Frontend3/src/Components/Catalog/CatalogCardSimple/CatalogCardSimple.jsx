import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import categoryCardTest from "../../../assets/Category/CategoryCardImage.svg";

import styles from "./CatalogCardSimple.module.scss";

const CatalogCardSimple = ({ item, handleClose }) => {
  const navigate = useNavigate();

  const { t } = useTranslation()




  const handleCategoryClick = () => {
    navigate(
      `/product_category/${item?.id}?categoryValue=${encodeURIComponent(
        `${item?.name}!${item?.translatedName}`
      )}&categoryID=${item?.id}`
    )
    handleClose();
  };



  return (
    <div
      onClick={() => handleCategoryClick()}
      className={styles.card}
      style={{ backgroundImage: `url(${item?.image_url})` }}
    >
      <p>
        {t(`categories.${item.id}`, { defaultValue: item.name })}

      </p>
    </div>
  );
};

export default CatalogCardSimple;
