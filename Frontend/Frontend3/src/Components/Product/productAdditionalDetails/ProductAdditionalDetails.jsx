import { useState } from "react"

import arrRight from "../../../assets/Payment/arrRight.svg"
import arrBottom from "../../../assets/Payment/arrBottom.svg"

import styles from "./ProductAdditionalDetails.module.scss"

const ProductAdditionalDetails = ({ detail }) => {
    const [open, setOpen] = useState(false)

    return (
        <div className={styles.main}>
            <button onClick={() => setOpen(!open)}>
                <p className={styles.title}>Additional details</p>
                <img style={open ? { transform: "rotate(90deg)" } : {}} src={arrRight} alt="" />
            </button>
            {
                open &&
                <p className={styles.text}>
                    {detail}
                </p>
            }
        </div>
    )
}

export default ProductAdditionalDetails