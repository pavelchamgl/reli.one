import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import i18n from "../../../../language/i18next";
import categoryCardImage from "../../../assets/Category/CategoryCardImage.svg";

import styles from "./CategoryCard.module.scss";

const CategoryCard = ({ item }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState(null)


  const lang = i18n.language


  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  });

  useEffect(() => {
    if (lang === "en") {
      setName(item.name)
    } else {
      setName(item.translatedName)
    }
  }, [lang])

  if (isLoading) {
    return (
      <div className={styles.sceleton}>
        <div className={styles.skeletonText}></div>
        <div className={styles.skeletonImage}></div>
      </div>
    );
  }

  if (item && item.image_url) {
    return (
      <div
        onClick={() =>
          navigate(
            `/product_category/${item?.id}?categoryValue=${encodeURIComponent(
              item?.name
            )}&categoryID=${item?.id}`
          )
        }
        className={styles.main}
        style={{ backgroundImage: `url(${item.image_url})` }}
      >
        <p>{name}</p>
      </div>
    );
  } else {
    return <></>;
  }
};

export default CategoryCard;
