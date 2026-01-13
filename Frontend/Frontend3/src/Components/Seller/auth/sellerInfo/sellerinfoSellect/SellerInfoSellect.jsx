import { useState } from "react"
import arrBottom from "../../../../../assets/Seller/register/arrowBottom.svg"

import styles from "./SellerInfoSelect.module.scss"



const SellerInfoSellect = ({ arr, value, setValue, title, titleSellect, required }) => {

    const [open, setOpen] = useState(false)



    const selectText = arr?.find((item) => item?.value === value)


    return (
        <div className={styles.wrap}>

            <p className={styles.title}>{title}</p>

            <div className={styles.main}>
                <button onClick={() => setOpen(!open)} className={styles.selectBtn}>
                    <p>{value ? selectText?.text : titleSellect}</p>
                    <img className={!open ? styles.activeArrow : ""} src={arrBottom} alt="" />
                </button>

                {open &&
                    <div>
                        {arr.map((item) => (
                            <button onClick={() => {
                                setValue(item?.value)
                                setOpen(false)
                            }} className={styles.selectItem}>{item?.text}</button>
                        ))}
                    </div>
                }
            </div>
        </div>
    )
}

export default SellerInfoSellect