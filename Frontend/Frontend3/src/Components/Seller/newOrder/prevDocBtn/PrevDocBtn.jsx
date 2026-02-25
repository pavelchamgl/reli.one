
import docIc from "../../../../assets/Seller/preview/docIc.svg"
import xIc from "../../../../assets/Seller/preview/xGreyIc.svg"

import styles from "./PrevDocBtn.module.scss"

const PrevDocBtn = ({ text = "text", setOpen }) => {
    return (
        <div className={styles.main}>
            <div>
                <img src={docIc} alt="" />
                <span>{text}</span>
            </div>

            <button onClick={() => setOpen(true)}>
                <img src={xIc} alt="" />
            </button>
        </div>
    )
}

export default PrevDocBtn