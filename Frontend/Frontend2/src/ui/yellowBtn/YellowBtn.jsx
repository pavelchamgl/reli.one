import arrRight from "@/assets/general/arrRightBtn.svg"

import styles from "./YellowBtn.module.scss"

const YellowBtn = ({ text, style, arr }) => {
    return (
        <button style={style} className={styles.main}>
            <p>{text}</p>
            {
                arr &&
                <img src={arrRight} alt="" />
            }
        </button>
    )
}

export default YellowBtn