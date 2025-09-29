import { Link } from "react-router-dom"

import arrRight from "@/assets/general/arrRightBtn.svg"

import styles from "./YellowBtn.module.scss"

const YellowBtn = ({ text, style, arr, url }) => {
    return (
        <Link to={url} style={style} className={styles.main}>
            <p>{text}</p>
            {
                arr &&
                <img src={arrRight} alt="" />
            }
        </Link>
    )
}

export default YellowBtn