import { Link } from "react-router-dom";
import styles from "./GoodsChoiceBtn.module.scss";

const GoodsChoiceBtn = ({ type, link="#" }) => {
  if (type === "list") {
    return (
      <Link to={link} className={styles.choiceListBtn}>
        <h3 className={styles.title}>List of goods</h3>
        <p className={styles.desc}>View available products sold on the site</p>
      </Link>
    );
  } else {
    return (
      <Link to={link} className={styles.choiceAddBtn}>
        <h3 className={styles.title}>Adding goods</h3>
        <p className={styles.desc}>Adding goods and items under review</p>
      </Link>
    );
  }
};

export default GoodsChoiceBtn;
