import { useEffect, useState } from "react";
import checkBoxAccImg from "../../assets/checkbox/checkboxAcc.svg";
import styles from "./checkBox.module.scss";

const CheckBox = ({ check, onChange }) => {
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    setIsChecked(check);
  }, [check]);

  // Обработчик изменения состояния чекбокса
  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
    onChange(event.target.checked); // Передаем новое состояние вверх
  };

  return (
    <label>
      <div className={isChecked ? styles.mainChecked : styles.main}>
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
