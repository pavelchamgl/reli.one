import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";
import { useActions } from "../../../hook/useAction";
import { useTranslation } from "react-i18next";


import testIcon from "../../../assets/Catalog/testImage.svg";
import arrRight from "../../../assets/Catalog/arrRight.svg";

import styles from "./CatalogItem.module.scss";
import { useEffect, useState } from "react";

const CatalogItem = ({
  data,
  handleClose,
  catalogCategory,
  setCatalogCategory,
}) => {
  const isMobile = useMediaQuery({ maxWidth: 500 });
  const navigate = useNavigate();

  const { setCategory } = useActions();

  const {  t } = useTranslation()



 


  const handleClick = () => {
    if (isMobile) {
      navigate(`/mob_category/${data?.id}`);
      setCatalogCategory(data.name);
      setCategory(data);
      handleClose();
    } else {
      setCatalogCategory(data.name);
      setCategory(data);
    }
  };

  return (
    <button onClick={handleClick} className={styles.main}>
      <div>
        {data && data?.image_url && <img src={data?.image_url} alt="" />}
        <p
          className={
            catalogCategory === data?.name
              ? styles.categoryNameAcc
              : styles.categoryName
          }
        >
          {t(`categories.${data.id}`, { defaultValue: data.name })}
        </p>
      </div>
      <button>
        <img src={arrRight} alt="" />
      </button>
    </button>
  );
};

export default CatalogItem;
