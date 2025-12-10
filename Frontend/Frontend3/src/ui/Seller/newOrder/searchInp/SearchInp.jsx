
import searchIc from "../../../../assets/Seller/all/search.svg"

import styles from "./SearchInp.module.scss"

const SearchInp = () => {
    return (

        <label className={styles.labelWrap}>
            <p className={styles.searchTitle}>Search</p>
            <div className={styles.searchWrap}>
                <img src={searchIc} alt="" />
                <input className={styles.searchInp} type="text" placeholder="Order ID, product..." />
            </div>

        </label>
    )
}

export default SearchInp