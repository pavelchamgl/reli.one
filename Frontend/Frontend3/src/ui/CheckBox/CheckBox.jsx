import { useEffect, useRef, useState } from "react";
import checkBoxAccImg from "../../assets/checkbox/checkboxAcc.svg";
import styles from "./checkBox.module.scss";

const CheckBox = ({ check }) => {
  const [isChecked, setIsChecked] = useState(false);

  const basketTotal = JSON.parse(localStorage.getItem("basketTotal"));

  useEffect(() => {
    setIsChecked(check);
  }, [check]);

  // Функция для обработки изменения состояния чекбокса
  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  return (
    <label>
      {/* Отображаем разные стили в зависимости от состояния isChecked */}
      <div className={isChecked ? styles.mainChecked : styles.main}>
        {isChecked && <img src={checkBoxAccImg} alt="Checked" />}
      </div>

      {/* Передаем состояние isChecked и обработчик изменения */}
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
