import { useEffect, useState } from "react";

import CollectingIcon from "../../../assets/Order/CollectingIcon.svg";
import DeliverIcon from "../../../assets/Order/DeliverIcon.svg";
import SortingIcon from "../../../assets/Order/SortingIcon.svg";
import IssueIcon from "../../../assets/Order/IssueIcon.svg";

import styles from "./OrderSchedule.module.scss";

const OrderSchedule = () => {
  const [percent, setPercent] = useState(0);
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (percent === 0) {
      setStyle({
        background: "#c6c6c6",
      });
    }
    if (percent === 25) {
      setStyle({
        background: "linear-gradient(to right, #3f7f6d 33%, #c6c6c6 33%)",
      });
    }
    if (percent === 50) {
      setStyle({
        background: "linear-gradient(to right, #3f7f6d 66%, #c6c6c6 33%)",
      });
    }
    if (percent === 75) {
      setStyle({
        background: "linear-gradient(to right, #3f7f6d 99%, #c6c6c6 33%)",
      });
    }
  }, [percent]);

  return (
    <div className={styles.main}>
      <div>
        <div className={styles.imageWrap}>
          <div style={style} className={styles.indicator}></div>
          <div className={styles.imageDivWrap}>
            <div
              style={{ background: percent === 0 ? "#c6c6c6" : "#3f7f6d" }}
              className={styles.imageDiv}
            >
              <img src={CollectingIcon} alt="" />
            </div>
            <p style={{ color: percent === 0 ? "#c6c6c6" : "#3f7f6d" }}>
              Sestavení
            </p>
          </div>

          <div className={styles.imageDivWrap}>
            <div
              style={{ background: percent >= 25 ? "#3f7f6d" : "#c6c6c6" }}
              className={styles.imageDiv}
            >
              <img src={DeliverIcon} alt="" />
            </div>

            <p style={{ color: percent >= 25 ? "#3f7f6d" : "#c6c6c6" }}>
              Na cestě
            </p>
          </div>

          <div className={styles.imageDivWrap}>
            <div
              style={{ background: percent >= 50 ? "#3f7f6d" : "#c6c6c6" }}
              className={styles.imageDiv}
            >
              <img src={SortingIcon} alt="" />
            </div>
            <p style={{ color: percent >= 50 ? "#3f7f6d" : "#c6c6c6" }}>
              V třídicím centru
            </p>
          </div>

          <div className={styles.imageDivWrap}>
            <div
              style={{ background: percent >= 75 ? "#3f7f6d" : "#c6c6c6" }}
              className={styles.imageDiv}
            >
              <img src={IssueIcon} alt="" />
            </div>
            <p style={{ color: percent >= 75 ? "#3f7f6d" : "#c6c6c6" }}>
              V místě vydání
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSchedule;
