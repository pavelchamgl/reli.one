import { Rating } from "@mui/material";

import styles from "./MobResenzeRate.module.scss";

const MobResenzeRate = () => {
  return (
    <div className={styles.main}>
      <div className={styles.rateWrap}>
        <p className={styles.rate}>4.9</p>
        <div className={styles.ratingDiv}>
          <Rating size="small" name="read-only" value={5} readOnly />
          <p>21</p>
        </div>
      </div>
      <div className={styles.imageDiv}>
        <img
          src="https://i.pinimg.com/564x/17/16/c1/1716c16db0bf0fa37cd123a53141348e.jpg"
          alt=""
        />
        <img
          src="https://i.pinimg.com/564x/17/16/c1/1716c16db0bf0fa37cd123a53141348e.jpg"
          alt=""
        />
        <img
          src="https://i.pinimg.com/564x/17/16/c1/1716c16db0bf0fa37cd123a53141348e.jpg"
          alt=""
        />
        <button>+79</button>
      </div>
    </div>
  );
};

export default MobResenzeRate;
