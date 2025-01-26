import searchIcon from "../../../../assets/Seller/goods/goodsSearch.svg";

import styles from "./GoodsSearchInp.module.scss";

const GoodsSearchInp = () => {
  return (
    <div className={styles.main}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <input type="text" placeholder="search by goods list" />
        <button type="submit">
          <img src={searchIcon} alt="" />
        </button>
      </form>
    </div>
  );
};

export default GoodsSearchInp;
