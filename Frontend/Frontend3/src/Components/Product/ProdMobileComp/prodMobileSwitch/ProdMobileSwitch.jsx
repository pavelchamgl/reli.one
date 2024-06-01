import { Rating } from "@mui/material";
import { useNavigate } from "react-router-dom";

import styles from "./ProdMobileSwitch.module.scss";

const ProdMobileSwitch = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.wrap}>
      <div className={styles.main}>
        <button onClick={() => navigate("/mob_resenze")}>
          <p>Recenze</p>
          <div className={styles.ratingDiv}>
            <Rating size="small" name="read-only" value={5} readOnly />
            <p>21</p>
          </div>
        </button>
        <button>
          <p>Certifikáty</p>
        </button>
      </div>
    </div>
  );
};

export default ProdMobileSwitch;
