import { useEffect, useState } from "react";

import selectArr from "../../../../assets/Seller/all/selectArr.svg"

import styles from './FilterSelect.module.scss';
import { useMediaQuery } from "react-responsive";
import { useActionNewOrder } from "../../../../hook/useActionNewOrder";



const FilterSelect = ({ openSelect, setOpenSelect, value, setValue, itemsArr, title, btnText }) => {


    const isMobile = useMediaQuery({ maxWidth: 500 })

    const { setCouriers, setStatus, setDeliveryType } = useActionNewOrder()


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


    return (
        <div className={styles.mainWrap}>
            <p className={styles.selectTitle}>{title}</p>
            <button style={{
                borderRadius: !isMobile
                    ? "0px"                 // десктоп
                    : openSelect
                        ? "10px 10px 0 0"       // мобилка — открыт
                        : "10px"                // мобилка — закрыт
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