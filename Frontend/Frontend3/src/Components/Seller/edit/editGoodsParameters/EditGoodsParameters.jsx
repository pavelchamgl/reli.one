import { useEffect, useState } from "react";
import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import deleteIcon from "../../../../assets/Seller/create/deleteIcon.svg";

import styles from "./EditGoodsParameters.module.scss";

const createEmptyRow = () => ({
  id: Date.now() + Math.random(),
  name: "",
  value: "",
  status: "local",
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

const EditGoodsParameters = ({ parameters, err, setErr }) => {
  const { id } = useParams();
  const [characteristic, setCharacteristic] = useState(() => normalizeRows(parameters));

  const { t } = useTranslation('sellerHome');
  const { fetchDeleteParameters, setNewParameters } = useActionSellerEdit();

  useEffect(() => {
    setCharacteristic(normalizeRows(parameters));
  }, [parameters]);

  const updateRows = (nextRows) => {
    setCharacteristic(nextRows);
    setNewParameters(nextRows);
    setErr(false);
  };

  const handleChange = (e, rowId, type) => {
    const nextRows = characteristic.map((item) => {
      if (item.id !== rowId) return item;
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

  const handleDelete = (item) => {
    const nextRows = characteristic.filter((row) => row.id !== item.id);
    updateRows(nextRows.length ? nextRows : [createEmptyRow()]);

    if (item?.status === "server") {
      fetchDeleteParameters({
        id,
        parId: item.id,
      });
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.titleDiv}>
        <p>{t('goods.characteristics')}</p>
        <button type="button" onClick={handleAdd}>{t('item.add')}</button>
      </div>
      {characteristic.map((item) => (
        <div className={err ? styles.characWrapErr : styles.characWrap} key={item.id}>
          <input
            onChange={(e) => handleChange(e, item.id, "name")}
            type="text"
            value={item.name}
            placeholder={`${t('item.column')} 1`}
          />
          <input
            onChange={(e) => handleChange(e, item.id, "value")}
            type="text"
            value={item.value}
            placeholder={`${t('item.column')} 2`}
          />
          <button type="button" onClick={() => handleDelete(item)} aria-label="Delete characteristic">
            <img src={deleteIcon} alt="" />
          </button>
        </div>
      ))}
      {err ? <p className={styles.errText}>{t('allParametersAreRequired')}</p> : null}
    </div>
  );
};

export default EditGoodsParameters;
