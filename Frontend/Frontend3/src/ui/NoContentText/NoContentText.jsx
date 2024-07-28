import { useTranslation } from "react-i18next";

import refreshImage from "../../assets/Search/refreshImage.svg";

import styles from "./NoContentText.module.scss";

const NoContentText = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.main}>
      <img src={refreshImage} alt="" />
      <p>{t("noContent.title")}</p>
      <p>{t("noContent.desc")}</p>
    </div>
  );
};

export default NoContentText;
