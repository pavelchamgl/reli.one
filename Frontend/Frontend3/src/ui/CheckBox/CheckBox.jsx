import { useEffect, useState } from "react";
import checkBoxAccImg from "../../assets/checkbox/checkboxAcc.svg";
import styles from "./checkBox.module.scss";

const CheckBox = ({ check = false, onChange, style }) => {
  const [isChecked, setIsChecked] = useState(Boolean(check));

  useEffect(() => {
    setIsChecked(Boolean(check));
  }, [check]);

  // Обработчик изменения состояния чекбокса
  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
    onChange(event.target.checked); // Передаем новое состояние вверх
  };

  return (
    <label>
      <div style={style} className={isChecked ? styles.mainChecked : styles.main}>
        {isChecked && <img src={checkBoxAccImg} alt="Checked" />}
      </div>
      <input
        className={styles.check}
        type="checkbox"
        checked={isChecked}
        onChange={handleCheckboxChange}
      />
    </label>
  );
};

export default CheckBox;
