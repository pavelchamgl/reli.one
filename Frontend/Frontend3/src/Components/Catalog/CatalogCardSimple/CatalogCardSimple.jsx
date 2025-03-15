import { useNavigate } from "react-router-dom";

import categoryCardTest from "../../../assets/Category/CategoryCardImage.svg";

import styles from "./CatalogCardSimple.module.scss";

const CatalogCardSimple = ({ item, handleClose }) => {
  const navigate = useNavigate();

  const handleCategoryClick = () => {
    navigate(
      `/product_category?categoryValue=${encodeURIComponent(
        item?.name
      )}&categoryID=${item?.id}`
    );
    handleClose();
  };

  return (
    <div
      onClick={() => handleCategoryClick()}
      className={styles.card}
      style={{ backgroundImage: `url(${item?.image_url})` }}
    >
      <p>
        {item?.name}

      </p>
    </div>
  );
};

export default CatalogCardSimple;
