
import { Link, useLocation } from 'react-router-dom'

import arrRightBread from "../../../../assets/Seller/all/arrRightBread.svg"

import styles from "./SellerBread.module.scss"

const SellerBread = ({ arr }) => {

    const { pathname } = useLocation()





    return (
        <div className={styles.linkWrap}>
            {
                arr.map((item, index) => (
                    < >
                        <Link className={`${styles.links} ${pathname === item?.link ? styles.active : ""}`} to={item.link}>{item.name}</Link>
                        {
                            index !== arr.length - 1 &&
                            <img src={arrRightBread} alt="" />
                        }
                    </>

                ))
            }
        </div>
    )
}

export default SellerBread