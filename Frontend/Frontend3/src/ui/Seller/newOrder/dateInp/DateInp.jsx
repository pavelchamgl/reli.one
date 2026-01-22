import { useState } from "react"
import InputMask from "react-input-mask"

import dateIc from "../../../../assets/Seller/newOrder/dateIc.svg"

import styles from "./DateInp.module.scss"
import { useSelector } from "react-redux"
import { useActionNewOrder } from "../../../../hook/useActionNewOrder"

const DateInp = ({ title }) => {
    const masks = "99.99.9999"

    const { date_from, date_to } = useSelector(state => state.newOrder)

    const { setDate } = useActionNewOrder()


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
                    value={title === "Date From" ? date_from : date_to}
                    onChange={(e) => {
                        if (title === "Date From") {
                            setDate({
                                type: "from",
                                text: e.target.value
                            })
                        } else {
                            setDate({
                                type: "to",
                                text: e.target.value
                            })
                        }
                    }}
                >
                    {(inputProps) => <input className={styles.input} {...inputProps} type="tel" />}
                </InputMask>
            </div>
        </div>
    )
}

export default DateInp