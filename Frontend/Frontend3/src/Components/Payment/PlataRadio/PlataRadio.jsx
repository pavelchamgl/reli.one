import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import payPal from "../../../assets/Payment/payPal.svg";

import styles from "./PlataRadio.module.scss";

const PlataRadio = () => {
  return (
    <FormControl fullWidth>
      <RadioGroup
        aria-labelledby="demo-radio-buttons-group-label"
        defaultValue="female"
        name="radio-buttons-group"
      >
        <div className={styles.selectBlock}>
          <FormControlLabel
            value="card"
            control={<Radio color="success" />}
            label="Debetní/Kreditní karty"
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
