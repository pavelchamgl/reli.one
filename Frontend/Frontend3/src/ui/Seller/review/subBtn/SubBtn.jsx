import mark from "../../../../assets/checkbox/checkboxAcc.svg"

import styles from "./SubBtn.module.scss"

const SubBtn = ({ onClick }) => {
    return (
        <button onClick={onClick} className={styles.subBtn}>
            <img src={mark} alt="" />
            Submit for Verification
        </button>
    )
}

export default SubBtn