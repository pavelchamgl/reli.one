import React, { useEffect, useState } from "react";
import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit";
import { useParams } from "react-router-dom";

import deleteIcon from "../../../../assets/Seller/create/deleteIcon.svg";

import styles from "./EditGoodsParameters.module.scss"

const EditGoodsParameters = ({ parameters }) => {
    const { id } = useParams()

    const [characteristic, setCharacteristic] = useState([
        {
            id: 1,
            name: "",
            value: "",
        },
    ]);

    const { deleteParameter, fetchDeleteParameters, setNewParameters } = useActionSellerEdit()

    useEffect(() => {
        setCharacteristic(parameters)

    }, [parameters]);

    const handleChange = (e, id, type) => {
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
        const lastId =
            characteristic.length > 0
                ? characteristic[characteristic.length - 1].id
                : 0;

        const addArr = [
            ...characteristic,
            {
                id: lastId + 1,
                name: "",
                value: "",
                status: "local"
            },
        ]

        setCharacteristic(addArr);
        setNewParameters(addArr)
    };

    const handleDelete = (item) => {

        console.log(item.id);
        
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
                <p>Characteristics</p>
                <button onClick={handleAdd}>+ Add an item</button>
            </div>
            {characteristic?.map((item) => (
                <div className={styles.characWrap} key={item.id}>
                    <input
                        onChange={(e) => {
                            handleChange(e, item.id, "name");
                        }}
                        type="text"
                        value={item.name}
                        placeholder="Column 1"
                    />
                    <input
                        onChange={(e) => {
                            handleChange(e, item.id, "value");
                        }}
                        type="text"
                        value={item.value}
                        placeholder="Column 2"
                    />
                    <button onClick={() => handleDelete(item)}>
                        <img src={deleteIcon} alt="Delete characteristic" />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default EditGoodsParameters