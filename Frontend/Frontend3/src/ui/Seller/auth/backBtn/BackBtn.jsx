import { Link } from "react-router-dom"
import backArrow from "../../../../assets/Seller/auth/back.svg"

import styles from "./BackBtn.module.scss"

const BackBtn = ({ text }) => {


    return (
        <Link to={-1} className={styles.backBtn}>
            <img src={backArrow} alt="" />
            {text}
        </Link>
    )
}

export default BackBtn