import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import deleteIcon from "../../../../assets/Seller/create/deleteIcon.svg";
import { getVisibleProductParameters } from "../../../../Components/Seller/shared/sellerProductParameters";

import styles from "./CreateCharacInp.module.scss";

const createEmptyRow = () => ({
  id: Date.now() + Math.random(),
  name: "",
  value: "",
});

const normalizeRows = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [createEmptyRow()];
  }

  return rows.map((item, index) => ({
    ...item,
    id: item?.id ?? Date.now() + index,
  }));
};

const CreateCharacInp = ({ setParameters, err, setErr }) => {
  const { product_parameters } = useSelector(state => state.create_prev);
  const [characteristic, setCharacteristic] = useState(() => normalizeRows(product_parameters));

  const { t } = useTranslation('sellerHome');

  useEffect(() => {
    setCharacteristic(normalizeRows(product_parameters));
  }, [product_parameters]);

  const updateRows = (nextRows) => {
    setCharacteristic(nextRows);
    setParameters(nextRows);
    setErr(false);
  };

  const handleChange = (e, id, type) => {
    const nextRows = characteristic.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        [type === "name" ? "name" : "value"]: e.target.value,
      };
    });

    updateRows(nextRows);
  };

  const handleAdd = () => {
    updateRows([...characteristic, createEmptyRow()]);
  };

  const handleDelete = (id) => {
    const nextRows = characteristic.filter((item) => item.id !== id);
    updateRows(nextRows.length ? nextRows : [createEmptyRow()]);
  };

  const visibleRows = getVisibleProductParameters(characteristic);

  return (
    <div className={styles.main}>
      <div className={styles.titleDiv}>
        <p>{t('goods.characteristics')}</p>
        <button type="button" onClick={handleAdd}>{t('item.add')}</button>
      </div>
      {visibleRows.map((item) => (
        <div className={err ? styles.characWrapErr : styles.characWrap} key={item.id}>
          <input
            onChange={(e) => handleChange(e, item.id, "name")}
            type="text"
            value={item.name}
            placeholder={t('goods.placeholders.characteristicName')}
          />
          <input
            onChange={(e) => handleChange(e, item.id, "value")}
            type="text"
            value={item.value}
            placeholder={t('goods.placeholders.characteristicValue')}
          />
          <button type="button" onClick={() => handleDelete(item.id)} aria-label={t('goods.deleteCharacteristic')}>
            <img src={deleteIcon} alt="" />
          </button>
        </div>
      ))}
      <p className={styles.errText} hidden={!err}>{err ? t('allParametersAreRequired') : ""}</p>
    </div>
  );
};

export default CreateCharacInp;
