import { useEffect, useState } from "react";
import { Rating } from "@mui/material";

import styles from "./MobResenzeCommentItem.module.scss";

const MobResenzeCommentItem = ({ data }) => {
  const [rateValue, setRateValue] = useState(0);
  const [date, setDate] = useState(null);
  const [urls, setUrls] = useState(null);

  useEffect(() => {
    if (data) {
      const dateArr = data?.date_created?.split(" ");
      setDate(dateArr[0]);
      if (data.media && data.media.length > 0) {
        setUrls(data.media);
      }
    }
  }, [data]);

  if (data) {
    return (
      <div className={styles.main}>
        <div className={styles.dateRateDiv}>
          <Rating
            name="simple-controlled"
            value={data?.rating}
            size="small"
            readOnly
          />
          <p>{date ? date : ""}</p>
        </div>
        <p className={styles.name}>{data?.author_first_name}</p>
        {/* variant */}
        <p className={styles.varText}>{`${
          data && data.variant_name ? data.variant_name : ""
        } ${data && data.variant_text ? data.variant_text : ""}`}</p>
        <p className={styles.commentText}>{data?.content}</p>
        {data && (
          <div className={styles.imageDiv}>
            {urls &&
              urls.map((item) => {
                if (item?.media_type === "video") {
                  return (
                    <video className={styles.video} controls>
                      <source src={item?.file_url} type="video/mp4" />
                      Ваш браузер не поддерживает данное видео
                    </video>
                  )
                } else {
                  return (
                    <div>
                      <img src={item?.file_url} alt="" />
                    </div>
                  );
                }
              })}
          </div>
        )}
      </div>
    );
  }
};

export default MobResenzeCommentItem;
