import { useState } from "react";
import { Rating } from "@mui/material";

import imageIcon from "../../../../assets/mobileIcons/ImageIcon.svg";
import clipIcon from "../../../../assets/Product/AddImageIcon.svg";

import styles from "./MobResenzeCreateForm.module.scss";

const MobResenzeCreateForm = () => {
  const [rateValue, setRateValue] = useState(0);

  return (
    <div className={styles.main}>
      <div className={styles.rateDiv}>
        <Rating
          size="large"
          name="simple-controlled"
          value={rateValue}
          onChange={(event, newValue) => {
            setRateValue(newValue);
          }}
        />
      </div>
      <div>
        <p className={styles.title}>Vaše dojmy z produktu</p>
        <textarea className={styles.commentInp}></textarea>
      </div>
      <div>
        <button className={styles.addImgBtn}>
          <img src={clipIcon} alt="" />
          <p>Přidat fotky</p>
        </button>
        <div className={styles.images}>
          <button>+</button>
          <div>
            <img className={styles.icon} src={imageIcon} alt="" />
          </div>
          <div>
            <img
              className={styles.img}
              src="https://i.pinimg.com/564x/2b/7a/36/2b7a36e48e09271a9cc042f1ab87b3f2.jpg"
              alt=""
            />
          </div>
          <button className={styles.otherImgBtn}>+79</button>
        </div>
      </div>
      <div className={styles.nameDiv}>
        <p>Název</p>
        <input type="text" />
      </div>
      <button className={styles.submitBtn}>Odejít</button>
    </div>
  );
};

export default MobResenzeCreateForm;
