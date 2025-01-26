import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CollectingIcon from "../../../assets/Order/CollectingIcon.svg";
import DeliverIcon from "../../../assets/Order/DeliverIcon.svg";
import SortingIcon from "../../../assets/Order/SortingIcon.svg";
import IssueIcon from "../../../assets/Order/IssueIcon.svg";

import styles from "./OrderSchedule.module.scss";

const OrderSchedule = ({ status = 0 }) => {

  const [percent, setPercent] = useState(0);
  const [style, setStyle] = useState({});

  const { t } = useTranslation();

  useEffect(() => {
    if (percent === 0) {
      setStyle({
        background: "#c6c6c6",
      });
    }
    if (percent === 10) {
      setStyle({
        background: "#c6c6c6",
      });
    }
    if (percent === 50) {
      setStyle({
        background: "linear-gradient(to right, #3f7f6d 50%, #c6c6c6 33%)",
      });
    }
    if (percent === 100) {
      setStyle({
        background: "linear-gradient(to right, #3f7f6d 99%, #c6c6c6 33%)",
      });
    }
  }, [percent]);

  useEffect(() => {
    if (status) {
      if (status === "Being processed") {
        setPercent(10);
      }
      if (status === "On the way") {
        setPercent(50);
      }
      if (status === "Ready for dispatch/pickup") {
        setPercent(100);
      }
    }
  }, [status]);

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
              Being processed
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
              On the way
            </p>
          </div>

          {/* <div className={styles.imageDivWrap}>
            <div
              style={{ background: percent >= 50 ? "#3f7f6d" : "#c6c6c6" }}
              className={styles.imageDiv}
            >
              <img src={SortingIcon} alt="" />
            </div>
            <p style={{ color: percent >= 50 ? "#3f7f6d" : "#c6c6c6" }}>
              {t("in_sorting_center")}
            </p>
          </div> */}
          {/* sorting center */}

          <div className={styles.imageDivWrap}>
            <div
              style={{ background: percent >= 75 ? "#3f7f6d" : "#c6c6c6" }}
              className={styles.imageDiv}
            >
              <img src={IssueIcon} alt="" />
            </div>
            <p style={{ color: percent >= 75 ? "#3f7f6d" : "#c6c6c6" }}>
              Ready for dispatch / pickup
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSchedule;
