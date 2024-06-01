import {useNavigate} from "react-router-dom"

import searchIcon from "../../assets/Header/searchIcon.svg";

import styles from "./SearchInp.module.css";

const SearchInp = () => {

  const navigate = useNavigate()

  return (
    <div className={styles.wrap}>
      <input className={styles.inp} type="text" />
      <button onClick={()=>navigate("/search")} className={styles.btn}>
        <img src={searchIcon} alt="" />
      </button>
    </div>
  );
};

export default SearchInp;
