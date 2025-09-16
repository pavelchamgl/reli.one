import arrRight from "@/assets/general/arrRightBtn.svg"

import styles from "./YellowBtn.module.scss"

const YellowBtn = ({ text }) => {
    return (
        <button className={styles.main}>
            <p>{text}</p>
            <img src={arrRight} alt="" />
        </button>
    )
}

export default YellowBtn