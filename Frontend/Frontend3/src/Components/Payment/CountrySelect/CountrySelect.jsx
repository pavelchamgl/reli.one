import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCountry } from "../../../redux/paymentSlice";

import arrRight from "../../../assets/Payment/arrRight.svg";
import arrBottom from "../../../assets/Payment/arrBottom.svg";

import styles from "./CountrySelect.module.scss";

const CountrySelect = () => {
  const { country } = useSelector(state => state.payment);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [openSelect, setOpenSelect] = useState(false);
  const [err, setErr] = useState(false);

  const hasInteracted = useRef(false);
  const dispatch = useDispatch();

  const countries = [
    { text: "Czech Republic", code: "cz" },
    { text: "Slovakia", code: "sk" },
    { text: "Romania", code: "ro" },
    { text: "Hungary", code: "hu" },
  ];

  // Устанавливаем выбранную страну при первом рендере
  useEffect(() => {
    if (country) {
      const findCountry = countries.find((item) => item.code === country);
      if (findCountry) setSelectedCountry(findCountry.text);
    }
  }, [country]);

  // Проверка ошибки только после взаимодействия
  useEffect(() => {
    if (!openSelect && hasInteracted.current) {
      if (!selectedCountry) {
        setErr(true);
      } else {
        setErr(false);
      }
    }
  }, [openSelect, selectedCountry]);

  const handleClick = (code) => {
    const selected = countries.find((item) => item.code === code);
    setSelectedCountry(selected.text);
    dispatch(setCountry({ country: code }));
    setOpenSelect(false);
    setErr(false);
  };

  const handleOpenSelect = () => {
    setOpenSelect(!openSelect);
    hasInteracted.current = true;
  };

  return (
    <div className={styles.main}>
      <p className={styles.labelText}>Country</p>
      <button
        style={selectedCountry ? { justifyContent: "space-between" } : {}}
        className={styles.selectMainButton}
        onClick={handleOpenSelect}
      >
        {selectedCountry && <p>{selectedCountry}</p>}
        <img src={openSelect ? arrBottom : arrRight} alt="" />
      </button>
      <div className={!openSelect ? styles.selectBtnsHide : ""}>
        {countries.map((item) => (
          <button
            onClick={() => handleClick(item.code)}
            className={styles.selectBtns}
            key={item.code}
          >
            {item.text}
          </button>
        ))}
      </div>
      {err && <p className={styles.errorText}>Please select a country</p>}
    </div>
  );
};

export default CountrySelect;
