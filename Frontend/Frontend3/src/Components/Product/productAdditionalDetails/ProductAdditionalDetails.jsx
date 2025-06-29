import { useState } from "react"

import arrRight from "../../../assets/Payment/arrRight.svg"
import arrBottom from "../../../assets/Payment/arrBottom.svg"

import styles from "./ProductAdditionalDetails.module.scss"

const ProductAdditionalDetails = () => {
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
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Facere tempora minus nesciunt eum veniam at veritatis expedita hic corporis mollitia! Veritatis sapiente facilis neque, iure dolorum libero! Quam, vitae optio?
                </p>
            }
        </div>
    )
}

export default ProductAdditionalDetails