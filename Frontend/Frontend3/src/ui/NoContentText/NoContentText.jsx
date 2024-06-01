import refreshImage from "../../assets/Search/refreshImage.svg";

import styles from "./NoContentText.module.scss";

const NoContentText = () => {
  return (
    <div className={styles.main}>
      <img src={refreshImage} alt="" />
      <p>V současné době neexistuje žádné vybrané zboží</p>
      <p>Zkuste stránku načíst znovu nebo počkejte</p>
    </div>
  );
};

export default NoContentText;
