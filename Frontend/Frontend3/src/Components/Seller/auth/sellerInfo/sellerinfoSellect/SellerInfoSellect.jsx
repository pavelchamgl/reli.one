import { useEffect, useRef, useState } from "react"
import arrBottom from "../../../../../assets/Seller/register/arrowBottom.svg"

import styles from "./SellerInfoSelect.module.scss"



const SellerInfoSellect = ({ arr, value, setValue, title, titleSellect, required, errText }) => {

    const [open, setOpen] = useState(false)
    const [error, setError] = useState(null)

    const firstRender = useRef(true);


    const selectText = arr?.find((item) => item?.value === value)

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false; // пропускаем первый рендер
            return;
        }

        if (!value || value.length === 0) {
            setError(true);
        } else {
            setError(false);
        }
    }, [value]);



    return (
        <div className={styles.wrap}>

            <p className={styles.title}>{title}</p>

            <div className={`${styles.main} ${error ? styles.error : null}`}>
                <button type="button" onClick={() => setOpen(!open)} className={styles.selectBtn}>
                    <p>{value ? selectText?.text : titleSellect}</p>
                    <img className={!open ? styles.activeArrow : ""} src={arrBottom} alt="" />
                </button>

                {open &&
                    <div>
                        {arr.map((item) => (
                            <button
                                type="button"
                                onClick={() => {
                                    setValue(item?.value)
                                    setOpen(false)
                                }} className={styles.selectItem}>{item?.text}</button>
                        ))}
                    </div>
                }
            </div>
            {error && <p className={styles.errorText}>{errText}</p>}
        </div>
    )
}

export default SellerInfoSellect