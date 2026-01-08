import { useState } from "react"
import arrBottom from "../../../../../assets/Seller/register/arrowBottom.svg"

import styles from "./SellerInfoSelect.module.scss"


const SellerInfoSellect = () => {

    const [open, setOpen] = useState(false)

    const arr = [
        "text",
        "text1",
        "text2",
        "text3",
        "text4",
    ]

    return (
        <div className={styles.wrap}>

            <p className={styles.title}>Nationality</p>

            <div className={styles.main}>
                <button onClick={() => setOpen(!open)} className={styles.selectBtn}>
                    <p>Select nationality</p>
                    <img className={!open ? styles.activeArrow : ""} src={arrBottom} alt="" />
                </button>

                {open &&
                    <div>
                        {arr.map((item) => (
                            <button className={styles.selectItem}>{item}</button>
                        ))}
                    </div>
                }
            </div>
        </div>
    )
}

export default SellerInfoSellect