import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import searchIcon from "../../assets/Header/searchIcon.svg";

import styles from "./SearchInp.module.css";

const SearchInp = () => {
  const [searchValue, setSearchValue] = useState("");

  const navigate = useNavigate();

  const { pathname } = useLocation()

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/search?searchValue=${encodeURIComponent(searchValue)}`);
  };


  useEffect(() => {

    if (pathname !== `/search?searchValue=${encodeURIComponent(searchValue)}`) {
      setSearchValue("")
    }
  }, [pathname])


  return (
    <form onSubmit={handleSubmit} className={styles.wrap}>
      <input
        onChange={(e) => setSearchValue(e.target.value)}
        className={styles.inp}
        value={searchValue}
        type="text"
      />
      <button type="submit" className={styles.btn}>
        <img src={searchIcon} alt="" />
      </button>
    </form>
  );
};

export default SearchInp;
