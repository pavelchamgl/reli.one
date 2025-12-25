import backArrow from "../../../../assets/Seller/auth/back.svg"

import styles from "./BackBtn.module.scss"

const BackBtn = ({text}) => {
    return (
        <a href='#' className={styles.backBtn}>
            <img src={backArrow} alt="" />
            {text}
        </a>
    )
}

export default BackBtn