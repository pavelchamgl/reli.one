import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import payPal from "../../../assets/Payment/payPal.svg";
import styles from "./PlataRadio.module.scss";

const PlataRadio = ({ setPlata }) => {
  const { t } = useTranslation();
  const [selectedValue, setSelectedValue] = useState("paypal");

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };

  useEffect(() => {
    setPlata(selectedValue);
  }, [selectedValue]);

  return (
    <FormControl fullWidth>
      <RadioGroup
        aria-labelledby="demo-radio-buttons-group-label"
        value={selectedValue}
        onChange={handleChange}
        name="radio-buttons-group"
      >
        <div className={styles.selectBlock}>
          <FormControlLabel
            // disabled={true}
            value="card"
            control={<Radio color="success" />}
            label={t("debit_credit")}
          />
        </div>
        <div className={styles.selectBlock}>
          <div className={styles.radioImageDiv}>
            <FormControlLabel
              sx={{ marginRight: "0" }}
              value="paypal"
              control={<Radio color="success" />}
            />
            <img src={payPal} alt="" />
          </div>
        </div>
      </RadioGroup>
    </FormControl>
  );
};

export default PlataRadio;
