import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import deleteIcon from "../../../../assets/Seller/create/deleteIcon.svg";

import styles from "./CreateCharacInp.module.scss";

const CreateCharacInp = ({ setParameters, err, setErr }) => {
  const { product_parameters } = useSelector(state => state.create_prev)
  const [characteristic, setCharacteristic] = useState(product_parameters ? product_parameters :
    [{
      id: new Date(),
      name: "",
      value: "",
    }],
  );

  const { t } = useTranslation('sellerHome')

  useEffect(() => {
    setParameters(characteristic)
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

    setCharacteristic([
      ...characteristic,
      {
        id: new Date(),
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
        <p>{t('goods.characteristics')}</p>
        <button onClick={handleAdd}>{t('item.add')}</button>
      </div>
      {characteristic.length > 0 && characteristic?.map((item) => {
        if (item?.name === "length" || item?.name === "width" || item?.name === "height" || item?.name === "weight") {
          return <></>
        } else {
          return (
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
              <button onClick={() => handleDelete(item.id)}>
                <img src={deleteIcon} alt="Delete characteristic" />
              </button>
            </div>
          )
        }
      }
      )}
      {err ? <p className={styles.errText}>{t('allParametersAreRequired')}</p> : ""}
    </div>
  );
};

export default CreateCharacInp;
