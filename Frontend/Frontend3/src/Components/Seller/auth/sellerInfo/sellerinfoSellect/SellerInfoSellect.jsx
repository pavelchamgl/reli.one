import { useEffect, useRef, useState } from "react"
import arrBottom from "../../../../../assets/Seller/register/arrowBottom.svg"

import styles from "./SellerInfoSelect.module.scss"



const SellerInfoSellect = ({ arr, value, setValue, title, titleSellect, required, errText, style }) => {

    const [open, setOpen] = useState(false)
    const [error, setError] = useState(null)
    const [touched, setTouched] = useState(false);

    const firstRender = useRef(true);

    const blockRef = useRef(null)


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


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (blockRef.current && !blockRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const showErr = touched && error


    return (
        <div className={styles.wrap} ref={blockRef}>

            <p className={styles.title}>{title}</p>

            <div className={`${styles.main} ${showErr ? styles.error : null}`}>
                <button type="button" onClick={() => {
                    setTouched(true)
                    setOpen(!open)
                }}
                    className={`${styles.selectBtn} ${showErr ? styles.error : null}`}
                    style={{
                        borderRadius: open ? "16px 16px 0 0" : "16px"
                    }}
                >
                    <p>{value ? selectText?.text : titleSellect}</p>
                    <img className={!open ? styles.activeArrow : ""} src={arrBottom} alt="" />
                </button>

                {open &&
                    <div
                        style={style}
                        className={`${styles.btnsWrap} ${showErr ? styles.errorNew : null}`}>
                        {arr.map((item) => (
                            <button
                                type="button"
                                onClick={() => {
                                    setValue(item?.value)
                                    setOpen(false)
                                    setTouched(false)
                                }} className={styles.selectItem}>{item?.text}</button>
                        ))}
                    </div>
                }
            </div>
            {showErr && <p className={styles.errorText}>{errText}</p>}
        </div>
    )
}

export default SellerInfoSellect