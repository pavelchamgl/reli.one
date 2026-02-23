import { useEffect, useRef, useState } from "react";

import selectArr from "../../../../assets/Seller/all/selectArr.svg"

import styles from './FilterSelect.module.scss';
import { useMediaQuery } from "react-responsive";
import { useActionNewOrder } from "../../../../hook/useActionNewOrder";



const FilterSelect = ({ openSelect, setOpenSelect, value, setValue, itemsArr, title, btnText, style }) => {


    const isMobile = useMediaQuery({ maxWidth: 500 })

    const { setCouriers, setStatus, setDeliveryType } = useActionNewOrder()

    const selectRef = useRef(null)

    useEffect(() => {
        if (title === "Couriers") {
            console.log("weiowiueuiewh");
            const courier = itemsArr.find(item => item.text === value)
            setCouriers({ value: courier?.value ? courier.value : "" })
        }
        if (title === "Status") {
            setStatus({ value: value })
        }
        if (title === "Delivery Method") {
            const method = itemsArr.find(item => item.text === value)
            setDeliveryType({ value: method?.value ? method.value : "" })
        }
    }, [value])


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setOpenSelect(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])


    return (
        <div className={styles.mainWrap} ref={selectRef}>
            <p className={styles.selectTitle}>{title}</p>
            <button style={{
                borderRadius: !openSelect ? "16px" : '16px 16px 0 0',             // мобилка — закрыт
            }} className={`${styles.mainBtn} ${openSelect ? styles.btnAct : ""}`} onClick={() => setOpenSelect(!openSelect)}>
                <p>{value ? value : btnText}</p>

                <img className={openSelect ? styles.selectArrAct : styles.selectArr} src={selectArr} alt="" />
            </button>
            {
                openSelect &&
                <div className={styles.selectItemsWrap}>
                    {itemsArr?.map((item) => (
                        <button className={`${styles.selectItems} ${value === item.text ? styles.btnAct : ""}`} onClick={() => {
                            setValue(item.text)
                            setOpenSelect(!openSelect)
                        }}>{item.text}</button>
                    ))}
                </div>
            }
        </div>
    )
}

export default FilterSelect