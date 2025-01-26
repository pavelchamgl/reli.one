import React, { useEffect, useState } from "react";
import deleteIcon from "../../../../assets/Seller/create/deleteIcon.svg";
import styles from "./CreateCharacInp.module.scss";

const CreateCharacInp = () => {
  const [headerText, setHeaderText] = useState("");
  const [characteristic, setCharacteristic] = useState([
    {
      id: 1,
      name: "",
      value: "",
    },
  ]);

  useEffect(() => {
    console.log(characteristic);
  }, [characteristic]);

  const handleChange = (e, id, type) => {
    const [ourObj] = characteristic.filter((item) => item.id === id);
    const otherObj = characteristic.filter((item) => item.id !== id);

    let newObj;
    if (type === "name") {
      newObj = { ...ourObj, name: e.target.value };
    } else {
      newObj = { ...ourObj, value: e.target.value };
    }

    setCharacteristic([...otherObj, newObj].sort((a, b) => a.id - b.id));
  };

  const handleAdd = () => {
    const lastId =
      characteristic.length > 0
        ? characteristic[characteristic.length - 1].id
        : 0;
    setCharacteristic([
      ...characteristic,
      {
        id: lastId + 1,
        name: "",
        value: "",
      },
    ]);
  };

  const handleDelete = (id) => {
    const filteredArr = characteristic.filter((item) => item.id !== id);
    setCharacteristic(filteredArr);
  };

  return (
    <div className={styles.main}>
      <div className={styles.titleDiv}>
        <p>Characteristics</p>
        <button onClick={handleAdd}>+ Add text</button>
      </div>
      <input
        className={styles.headerInp}
        value={headerText}
        onChange={(e) => setHeaderText(e.target.value)}
        type="text"
        placeholder="Header"
      />
      {characteristic.map((item) => (
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
          <button onClick={() => handleDelete(item.id)}>
            <img src={deleteIcon} alt="Delete characteristic" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default CreateCharacInp;
