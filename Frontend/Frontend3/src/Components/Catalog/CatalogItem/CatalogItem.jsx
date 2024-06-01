import testIcon from "../../../assets/Catalog/testImage.svg";
import arrRight from "../../../assets/Catalog/arrRight.svg";

import styles from './CatalogItem.module.scss';

const CatalogItem = () => {
  return (
    <div className={styles.main}>
      <div>
        <img src={testIcon} alt="" />
        <p>Oblečení a boty</p>
      </div>
      <button>
        <img src={arrRight} alt="" />
      </button>
    </div>
  );
};

export default CatalogItem;
