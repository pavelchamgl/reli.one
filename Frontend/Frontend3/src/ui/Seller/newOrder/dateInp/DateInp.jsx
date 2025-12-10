import { useState } from "react"
import InputMask from "react-input-mask"

import dateIc from "../../../../assets/Seller/newOrder/dateIc.svg"

import styles from "./DateInp.module.scss"

const DateInp = ({ title }) => {
    const masks = "99.99.9999"

    const [value, setValue] = useState("")

    return (
        <div className={styles.dateWrap}>
            <p className={styles.dateTitle}>{title}</p>
            <div className={styles.inpWrap}>

                <img src={dateIc} alt="" />
                <InputMask
                    mask={masks}
                    maskChar=""
                    alwaysShowMask={false}
                    placeholder="dd.mm.yyyy"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                >
                    {(inputProps) => <input className={styles.input} {...inputProps} type="tel" />}
                </InputMask>
            </div>
        </div>
    )
}

export default DateInp