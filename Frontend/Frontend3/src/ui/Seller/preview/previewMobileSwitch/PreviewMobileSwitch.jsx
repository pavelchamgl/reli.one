import { useTranslation } from "react-i18next";

import styles from "./PreviewMobileSwitch.module.scss";
import { Rating } from "@mui/material";

const PreviewMobileSwitch = () => {
  const { t } = useTranslation();

  const total_reviews = 21;
  const rating = 5;

  return (
    <div className={styles.wrap}>
      <div className={styles.main}>
        <button>
          <p>{t("review")}</p>
          <div className={styles.ratingDiv}>
            <Rating
              size="small"
              name="read-only"
              value={rating}
              readOnly
            />
            <p>{total_reviews}</p>
          </div>
        </button>
        <button>
          <p>{t("certificates")}</p>
        </button>
      </div>
    </div>
  );
};

export default PreviewMobileSwitch;
