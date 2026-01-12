import { useState } from "react"
import InputMask from "react-input-mask"

import dateIc from "../../../../../assets/Seller/register/dateIc.svg"

import styles from "./SellerDateInp.module.scss"

const SellerDateInp = ({ formik }) => {
    const masks = "99.99.9999"

    // const [value, setValue] = useState("")

    return (
        <div className={styles.dateWrap}>
            <p className={styles.dateTitle}>Date of birth</p>
            <div className={styles.inpWrap}>

                <img src={dateIc} alt="" />
                <InputMask
                    mask={masks}
                    maskChar=""
                    alwaysShowMask={false}
                    placeholder="dd.mm.yyyy"
                    value={formik.values.date_of_birth}
                    name="date_of_birth"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                >
                    {(inputProps) => <input className={styles.input} {...inputProps} type="tel" />}
                </InputMask>
            </div>
        </div>
    )
}

export default SellerDateInp