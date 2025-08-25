import { useNavigate } from "react-router-dom";
import { useActions } from "../../../hook/useAction";
import { useTranslation } from "react-i18next";

import image from "../../../assets/Category/CategoryCardImage.svg";
import arrRight from "../../../assets/Catalog/arrRight.svg";

import styles from "./CatalogCard.module.scss";

const CatalogCard = ({ item }) => {
  const { setPodCategory } = useActions();


  const {t} = useTranslation()






  return (
    <div
      onClick={() => setPodCategory(item)}
      className={styles.main}
      style={{ backgroundImage: `url(${item?.image_url})` }}
    >
      <div className={styles.titleDiv}>
        <img src={arrRight} alt="" />
        <p>
          {t(`categories.${item.id}`, { defaultValue: item.name })}
        </p>
        <img className={styles.arrRight} src={arrRight} alt="" />
      </div>
    </div>
  );
};

export default CatalogCard;
