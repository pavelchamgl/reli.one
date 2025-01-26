import { Rating } from "@mui/material";
import { useSelector } from "react-redux";

import styles from "./MobResenzeRate.module.scss";

const MobResenzeRate = () => {
  const product = useSelector((state) => state.products.product);

  return (
    <div className={styles.main}>
      <div className={styles.rateWrap}>
        <p className={styles.rate}>{product?.rating}</p>
        <div className={styles.ratingDiv}>
          <Rating
            size="small"
            name="read-only"
            value={product?.rating}
            readOnly
          />
          <p>{product?.total_reviews}</p>
        </div>
      </div>
      {/* <div className={styles.imageDiv}>
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
      </div> */}
    </div>
  );
};

export default MobResenzeRate;
