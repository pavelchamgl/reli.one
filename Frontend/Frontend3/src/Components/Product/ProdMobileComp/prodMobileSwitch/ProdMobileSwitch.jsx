import { Rating } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "./ProdMobileSwitch.module.scss";
import { useSelector } from "react-redux";
import { useState } from "react";

const ProdMobileSwitch = () => {
  const navigate = useNavigate();

  const product = useSelector((state) => state.products.product) || {};

  const { t } = useTranslation();

  const { id } = useParams();


  return (
    <div className={styles.wrap}>
      <div className={styles.main}>
        <button onClick={() => navigate(`/mob_resenze/${id}`)}>
          <p>{t("review")}</p>
          <div className={styles.ratingDiv}>
            <Rating
              size="small"
              name="read-only"
              value={product?.rating}
              readOnly
            />
            <p>{product?.total_reviews}</p>
          </div>
        </button>
        <button>
          <p>{t("certificates")}</p>
        </button>
      </div>
    </div>
  );
};

export default ProdMobileSwitch;
