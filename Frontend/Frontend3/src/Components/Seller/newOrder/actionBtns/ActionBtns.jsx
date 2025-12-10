import truck from "../../../../assets/Seller/newOrder/truckIc.svg"
import tag from "../../../../assets/Seller/newOrder/tagIc.svg"
import redX from "../../../../assets/Seller/newOrder/redX.svg"

import styles from "./ActionBtns.module.scss"

const ActionBtns = () => {
    return (
        <div className={styles.wrap}>
            <button>
                <img src={truck} alt="" />
            </button>
            <button>
                <img src={tag} alt="" />
            </button>
            <button>
                <img src={redX} alt="" />
            </button>
        </div>
    )
}

export default ActionBtns