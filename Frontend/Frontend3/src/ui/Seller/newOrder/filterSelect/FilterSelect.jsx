import { useState } from "react";

import selectArr from "../../../../assets/Seller/all/selectArr.svg"

import styles from './FilterSelect.module.scss';
import { useMediaQuery } from "react-responsive";



const FilterSelect = ({ openSelect, setOpenSelect, value, setValue, itemsArr, title, btnText }) => {


    const isMobile = useMediaQuery({ maxWidth: 500 })
   

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
                        <button className={`${styles.selectItems} ${value === item ? styles.btnAct : ""}`} onClick={() => {
                            setValue(item)
                            setOpenSelect(!openSelect)
                        }}>{item}</button>
                    ))}
                </div>
            }
        </div>
    )
}

export default FilterSelect