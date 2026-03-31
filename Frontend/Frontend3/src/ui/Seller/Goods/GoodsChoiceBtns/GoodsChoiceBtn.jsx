import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "./GoodsChoiceBtn.module.scss";

const GoodsChoiceBtn = ({ type, link = "#" }) => {

  const { t } = useTranslation('sellerHome')

  if (type === "list") {
    return (
      <Link to={link} className={styles.choiceListBtn}>
        <h3 className={styles.title}>{t('goods.list')}</h3>
        <p className={styles.desc}>{t('goods.view_available')}</p>
      </Link>
    );
  } else {
    return (
      <Link to={link} className={styles.choiceAddBtn}>
        <h3 className={styles.title}>{t('goods.adding')}</h3>
        <p className={styles.desc}>{t('goods.under_review')}</p>
      </Link>
    );
  }
};

export default GoodsChoiceBtn;
