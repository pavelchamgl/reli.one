
import { useSelector } from "react-redux"
import searchIc from "../../../../assets/Seller/all/search.svg"
import { useActionNewOrder } from "../../../../hook/useActionNewOrder"

import styles from "./SearchInp.module.scss"

const SearchInp = () => {

    const { setSearch } = useActionNewOrder()

    const { search } = useSelector(state => state.newOrder)

    return (

        <label className={styles.labelWrap}>
            <p className={styles.searchTitle}>Search</p>
            <div className={styles.searchWrap}>
                <img src={searchIc} alt="" />
                <input value={search} onChange={(e) => setSearch({ text: e.target.value })} className={styles.searchInp} type="text" placeholder="Order ID, product..." />
            </div>

        </label>
    )
}

export default SearchInp