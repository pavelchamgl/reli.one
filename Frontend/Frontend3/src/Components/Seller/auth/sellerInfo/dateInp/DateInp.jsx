import { useState } from "react"
import InputMask from "react-input-mask"

import dateIc from "../../../../../assets/Seller/register/dateIc.svg"

import styles from "./SellerDateInp.module.scss"

const SellerDateInp = ({ formik }) => {
    const masks = "99.99.9999"

    // const [value, setValue] = useState("")

    const showError = Boolean(formik.touched.date_of_birth && formik.errors.date_of_birth); // ✅ ошибка только после touched

    return (
        <div className={styles.dateWrap}>
            <p className={styles.dateTitle}>Date of birth</p>
            <div className={`${styles.inpWrap} ${showError ? styles.error : ""}`}>

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
            {showError ? <p className={styles.errorText}>{formik.errors.date_of_birth}</p> : null}
        </div>
    )
}

export default SellerDateInp