import { useEffect, useState } from "react";

import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";

import arrRight from "../../../assets/Payment/arrRight.svg";
import arrBottom from "../../../assets/Payment/arrBottom.svg";
import dhl from "../../../assets/Payment/dhl.svg";
import zasil from "../../../assets/Payment/zasil.svg";
import ppl from "../../../assets/Payment/ppl.svg";
import dpd from "../../../assets/Payment/dpd.svg";
import globalLogistic from "../../../assets/Payment/globalLogistic.svg";

import styles from "./PaymentDeliverySelect.module.scss";

const PaymentDeliverySelect = () => {
  const [open, setOpen] = useState(false);

  const [selectedValue, setSelectedValue] = useState("sclad");

  const [deliImg, setDeliImg] = useState(null);

  useEffect(() => {
    if (selectedValue !== "sclad" && selectedValue !== "adresu") {
      setOpen(!open);
    }
  }, [selectedValue]);

  return (
    <div>
      <FormControl fullWidth>
        <RadioGroup
          aria-labelledby="demo-radio-buttons-group-label"
          defaultValue="female"
          name="radio-buttons-group"
          value={selectedValue}
          onChange={(e) => {
            setSelectedValue(e.target.value);
          }}
        >
          <div className={styles.selectBlock}>
            <FormControlLabel
              value="sclad"
              control={<Radio color="success" />}
              label="Vyzvednutí ze skladu"
            />
            <p className={styles.freeText}>Zdarma</p>
          </div>
          <button onClick={() => setOpen(!open)} className={styles.selectBlock}>
            <div className={styles.radioImageDiv}>
              <FormControlLabel
                sx={{ marginRight: "0px" }}
                value="adresu"
                control={<Radio color="success" />}
                label={deliImg ? "" : "Doručení na adresu"}
              />
              {deliImg && <img src={deliImg} alt="" />}
            </div>
            <img src={open ? arrBottom : arrRight} alt="" />
          </button>
          <div
            className={open ? styles.selectBlockAcc : styles.selectBlockNotAcc}
          >
            <div className={styles.selectBlock}>
              <div className={styles.radioImageDiv}>
                <FormControlLabel
                  onClick={() => setDeliImg(dhl)}
                  sx={{ marginRight: "0px" }}
                  value="dhl"
                  control={<Radio color="success" />}
                />
                <img src={dhl} alt="" />
              </div>
              <p className={styles.price}>150.00 Kč</p>
            </div>
            <div className={styles.selectBlock}>
              <div className={styles.radioImageDiv}>
                <FormControlLabel
                  onClick={() => setDeliImg(zasil)}
                  sx={{ marginRight: "0px" }}
                  value="zasilkovna"
                  control={<Radio color="success" />}
                />
                <img src={zasil} alt="" />
              </div>
              <p className={styles.price}>150.00 Kč</p>
            </div>
            <div className={styles.selectBlock}>
              <div className={styles.radioImageDiv}>
                <FormControlLabel
                  onClick={() => setDeliImg(ppl)}
                  sx={{ marginRight: "0px" }}
                  value="ppl"
                  control={<Radio color="success" />}
                />
                <img src={ppl} alt="" />
              </div>
              <p className={styles.price}>150.00 Kč</p>
            </div>
            <div className={styles.selectBlock}>
              <div className={styles.radioImageDiv}>
                <FormControlLabel
                  onClick={() => setDeliImg(dpd)}
                  sx={{ marginRight: "0px" }}
                  value="dpd"
                  control={<Radio color="success" />}
                />
                <img src={dpd} alt="" />
              </div>
              <p className={styles.price}>150.00 Kč</p>
            </div>
            <div className={styles.selectBlock}>
              <div className={styles.radioImageDiv}>
                <FormControlLabel
                  onClick={() => setDeliImg(globalLogistic)}
                  sx={{ marginRight: "0px" }}
                  value="globalLogistic"
                  control={<Radio color="success" />}
                />
                <img src={globalLogistic} alt="" />
              </div>
              <p className={styles.price}>150.00 Kč</p>
            </div>
          </div>
        </RadioGroup>
      </FormControl>
    </div>
  );
};

export default PaymentDeliverySelect;
