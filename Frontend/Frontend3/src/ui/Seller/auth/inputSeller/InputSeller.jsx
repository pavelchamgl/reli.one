import emailIc from "../../../../assets/Seller/auth/email.svg"
import passIc from "../../../../assets/Seller/auth/password.svg"
import eyeOpIc from "../../../../assets/Seller/auth/eyeOp.svg"
import eyeClIc from "../../../../assets/Seller/auth/eyeCl.svg"

import styles from "./InputSeller.module.scss"
import { useState } from "react"

const InputSeller = ({ type, title, img, circle, required, afterText }) => {

    const [inpType, setInpType] = useState(type)

    if (type === "email") {
        return (
            <label className={styles.labelWrap}>
                <h5 className={required ? styles.titleRequired : styles.inpTitle}>{title}</h5>
                <div className={styles.inpWrap} style={{ borderRadius: circle ? "16px" : "" }}>
                    <img src={emailIc} alt="" />
                    <input type={type} name="" id="" />
                </div>
            </label>
        )
    }
    else if (type === "password") {
        return (
            <label className={styles.labelWrap}>
                <h5 className={required ? styles.titleRequired : styles.inpTitle}>{title}</h5>
                <div className={styles.inpWrap} style={{ borderRadius: circle ? "16px" : "" }}>
                    <img src={passIc} alt="" />
                    <input type={inpType} name="" id="" />
                    <button type="button" onClick={() => {
                        if (inpType === "password") {
                            setInpType("text")
                        } else {
                            setInpType("password")
                        }
                    }}>
                        <img src={inpType === "password" ? eyeClIc : eyeOpIc} alt="" />
                    </button>
                </div>
            </label>
        )
    } else {
        return (
            <label className={styles.labelWrap}>
                <h5 className={required ? styles.titleRequired : styles.inpTitle}>{title}</h5>
                <div className={styles.inpWrap} style={{ borderRadius: circle ? "16px" : "" }}>
                    {
                        img ?
                            <img src={img} alt="" /> :
                            null
                    }
                    <input type={type} name="" id="" />
                </div>
                {afterText && <p className={styles.afterText}>{afterText}</p>}
            </label>
        )
    }

}

export default InputSeller