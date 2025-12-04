import { Link } from "react-router-dom"

import arrRight from "@/assets/general/arrRightBtn.svg"

import styles from "./YellowBtn.module.scss"

const YellowBtn = ({ text, style, arr, url }) => {
    return (
        <a href={url} style={style} className={styles.main}>
            <p>{text}</p>
            {
                arr &&
                <img src={arrRight} alt="" />
            }
        </a>
    )
}

export default YellowBtn