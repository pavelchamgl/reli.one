import { useNavigate } from "react-router-dom";
import { useState } from "react";

import searchIcon from "../../assets/Header/searchIcon.svg";

import styles from "./SearchInp.module.css";

const SearchInp = () => {
  const [searchValue, setSearchValue] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/search?searchValue=${encodeURIComponent(searchValue)}`);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.wrap}>
      <input
        onChange={(e) => setSearchValue(e.target.value)}
        className={styles.inp}
        type="text"
      />
      <button type="submit" className={styles.btn}>
        <img src={searchIcon} alt="" />
      </button>
    </form>
  );
};

export default SearchInp;
