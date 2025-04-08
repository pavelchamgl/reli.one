import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import categoryCardImage from "../../../assets/Category/CategoryCardImage.svg";

import styles from "./CategoryCard.module.scss";

const CategoryCard = ({ item }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  });

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
        <p>{item?.name}</p>
      </div>
    );
  } else {
    return <></>;
  }
};

export default CategoryCard;
