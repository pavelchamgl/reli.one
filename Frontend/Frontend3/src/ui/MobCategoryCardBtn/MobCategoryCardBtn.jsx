import { useState } from "react";

import arrRight from "../../assets/Catalog/arrRight.svg";
import arrLeft from "../../assets/Catalog/arrLeft.svg";
import image from "../../assets/Category/CategoryCardImage.svg";
import { useActions } from "../../hook/useAction";

import styles from "./MobCategoryCardBtn.module.scss";

const MobCategoryCardBtn = ({ item }) => {
  const { setPodCategory } = useActions();

  return (
    <div
      onClick={() => setPodCategory(item)}
      className={styles.cardItem}
      style={{
        backgroundImage: `url(${item?.image_url})`,
        backgroundColor: open ? "#D5D5D5" : "#F0F0F0",
      }}
    >
      <p>{item?.name}</p>
      <img className={styles.arrImg} src={ arrRight} alt="" />
    </div>
  );
};

export default MobCategoryCardBtn;
