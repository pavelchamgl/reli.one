import React, { useEffect, useState } from "react";
import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import deleteIcon from "../../../../assets/Seller/create/deleteIcon.svg";

import styles from "./EditGoodsParameters.module.scss"

const EditGoodsParameters = ({ parameters, err, setErr }) => {
    const { id } = useParams()

    const [characteristic, setCharacteristic] = useState([
        {
            id: 1,
            name: "",
            value: "",
        },
    ]);

    const { t } = useTranslation('sellerHome')

    const { deleteParameter, fetchDeleteParameters, setNewParameters } = useActionSellerEdit()

    useEffect(() => {
        setCharacteristic(parameters)
    }, [parameters]);

    const handleChange = (e, id, type) => {
        setErr(false)
        const [ourObj] = characteristic.filter((item) => item.id === id);
        const otherObj = characteristic.filter((item) => item.id !== id);

        let newObj;
        if (type === "name") {
            newObj = { ...ourObj, name: e.target.value };
        } else {
            newObj = { ...ourObj, value: e.target.value };
        }

        const newSortedArr = [...otherObj, newObj].sort((a, b) => a.id - b.id)

        setCharacteristic(newSortedArr);
        setNewParameters(newSortedArr)

    };

    const handleAdd = () => {
        setErr(false)

        const addArr = [
            ...characteristic,
            {
                id: Date.now(),
                name: "",
                value: "",
                status: "local"
            },
        ]

        setCharacteristic(addArr);
        setNewParameters(addArr)
    };

    const handleDelete = (item) => {
        setErr(false)


        if (item?.status === "server") {
            fetchDeleteParameters({
                id: id,
                parId: item.id
            })
        } else {
            deleteParameter(item.id)
        }
    };


    return (
        <div className={styles.main}>
            <div className={styles.titleDiv}>
                <p>{t('goods.characteristics')}</p>
                <button onClick={handleAdd}>{t('item.add')}</button>
            </div>
            {characteristic?.map((item) => (
                <div className={err ? styles.characWrapErr : styles.characWrap} key={item.id}>
                    <input
                        onChange={(e) => {
                            handleChange(e, item.id, "name");
                        }}
                        type="text"
                        value={item.name}
                        placeholder={`${t('item.column')} 1`}
                    />
                    <input
                        onChange={(e) => {
                            handleChange(e, item.id, "value");
                        }}
                        type="text"
                        value={item.value}
                        placeholder={`${t('item.column')} 2`}
                    />
                    <button onClick={() => handleDelete(item)}>
                        <img src={deleteIcon} alt="Delete characteristic" />
                    </button>
                </div>
            ))}
            {err ? <p className={styles.errText}>{t('allParametersAreRequired')}</p> : ""}
        </div>
    );
}

export default EditGoodsParameters