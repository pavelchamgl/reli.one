import { Rating } from "@mui/material";
import { useEffect, useState } from "react";

import styles from "./ProductCommentItem.module.scss";

const ProductCommentItem = ({ item }) => {
  const [date, setDate] = useState(null);
  const [urls, setUrls] = useState(null);


  useEffect(() => {
    if (item) {
      const dateArr = item?.date_created?.split(" ");
      setDate(dateArr[0]);
      if (item.media && item.media.length > 0) {
        setUrls(item.media);
      }
    }
  }, [item]);

  return (
    <div className={styles.main}>
      <div className={styles.rateDiv}>
        <Rating value={item?.rating} readOnly />
        <p className={styles.lightText}>{date ? date : ""}</p>
      </div>
      <div className={styles.commentDiv}>
        <p className={styles.nameText}>{item?.author_first_name}</p>
        <p className={styles.varText}>{`${
          item && item.variant_name ? item.variant_name : ""
        } ${item && item.variant_text ? item.variant_text : ""}`}</p>
        <p className={styles.contentText}>{item?.content}</p>
        <div className={styles.imageDiv}>
          {urls &&
            urls.map((item) => {
              if (item?.media_type === "video") {
                return (
                  <video controls className={styles.video}>
                    <source src={item.file_url} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                );
              } else {
                return <img src={item.file_url} alt="" />;
              }
            })}
        </div>
      </div>
    </div>
  );
};

export default ProductCommentItem;
