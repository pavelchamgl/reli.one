import { useEffect, useState } from "react";
import { useActionSellerList } from "../../../../hook/useActionSellerList";

import searchIcon from "../../../../assets/Seller/goods/goodsSearch.svg";

import styles from "./GoodsSearchInp.module.scss";

const GoodsSearchInp = ({ makeSearch, setMakeSearch }) => {
  const [value, setValue] = useState("");

  const { setSearchQuery } = useActionSellerList();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value) {
      setSearchQuery(value);
      setMakeSearch(!makeSearch);

    }
  };


  return (
    <div className={styles.main}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          onChange={(e) => setValue(e.target.value)}
          value={value}
          type="text"
          placeholder="search by goods list"
        />
        <button type="submit">
          <img src={searchIcon} alt="search" />
        </button>
      </form>
    </div>
  );
};

export default GoodsSearchInp;
