import { useNavigate } from "react-router-dom";
import { useState } from "react";

import searchIcon from "../../assets/Header/searchIcon.svg";

import styles from "./SearchInp.module.css";

const SearchInp = () => {
  const [searchValue, setSearchValue] = useState("");

  const navigate = useNavigate();

  return (
    <div className={styles.wrap}>
      <input
        onChange={(e) => setSearchValue(e.target.value)}
        className={styles.inp}
        type="text"
      />
      <button
        onClick={() =>
          navigate(`/search?searchValue=${encodeURIComponent(searchValue)}`)
        }
        className={styles.btn}
      >
        <img src={searchIcon} alt="" />
      </button>
    </div>
  );
};

export default SearchInp;
