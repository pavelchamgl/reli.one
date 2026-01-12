import { useState } from "react"
import arrBottom from "../../../../../assets/Seller/register/arrowBottom.svg"

import styles from "./SellerInfoSelect.module.scss"


const SellerInfoSellect = ({ arr, value, setValue, title, titleSellect, required }) => {

    const [open, setOpen] = useState(false)



    return (
        <div className={styles.wrap}>

            <p className={styles.title}>{title}</p>

            <div className={styles.main}>
                <button onClick={() => setOpen(!open)} className={styles.selectBtn}>
                    <p>{value ? value : titleSellect}</p>
                    <img className={!open ? styles.activeArrow : ""} src={arrBottom} alt="" />
                </button>

                {open &&
                    <div>
                        {arr.map((item) => (
                            <button onClick={() => {
                                setValue(item)
                                setOpen(false)
                            }} className={styles.selectItem}>{item}</button>
                        ))}
                    </div>
                }
            </div>
        </div>
    )
}

export default SellerInfoSellect