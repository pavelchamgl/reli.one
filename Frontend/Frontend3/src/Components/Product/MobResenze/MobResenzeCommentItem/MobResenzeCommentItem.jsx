import { useState } from "react";
import { Rating } from "@mui/material";

import styles from "./MobResenzeCommentItem.module.scss";

const MobResenzeCommentItem = ({ url, data }) => {
  const [rateValue, setRateValue] = useState(0);
  if (data) {
    return (
      <div className={styles.main}>
        <div className={styles.dateRateDiv}>
          <Rating
            name="simple-controlled"
            value={rateValue}
            size="small"
            onChange={(event, newValue) => {
              setRateValue(newValue);
            }}
          />
          <p>23. srpna 2023</p>
        </div>
        <p className={styles.name}>{data?.author}</p>
        <p className={styles.commentText}>{data?.content}</p>
        {url && (
          <div className={styles.commentImages}>
            <img
              src="https://i.pinimg.com/564x/2b/7a/36/2b7a36e48e09271a9cc042f1ab87b3f2.jpg"
              alt=""
            />
            <img
              src="https://i.pinimg.com/564x/2b/7a/36/2b7a36e48e09271a9cc042f1ab87b3f2.jpg"
              alt=""
            />
            <img
              src="https://i.pinimg.com/564x/2b/7a/36/2b7a36e48e09271a9cc042f1ab87b3f2.jpg"
              alt=""
            />
          </div>
        )}
      </div>
    );
  }
};

export default MobResenzeCommentItem;
