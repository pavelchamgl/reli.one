import { useFormik } from "formik";
import { Rating, Modal, Box } from "@mui/material";
import { useState } from "react";

import addImageIcon from "../../../assets/Product/AddImageIcon.svg";
import FormImageIcon from "../../../assets/Product/FormImageIcon.svg";
import closeImg from "../../../assets/loginModal/loginModalX.svg";

import styles from "./ProductCommentForm.module.scss";

const ProductCommentForm = ({ open, handleClose }) => {
  const [rate, setRate] = useState(0);

  const formik = useFormik({
    initialValues: {
      comment: "",
      username: "",
    },
    onSubmit: (values) => {
      console.log(values);
    },
  });

  return (
    <div>
      <Modal sx={{ height: "auto", overflow: "auto" }} open={open} onClose={handleClose}>
          <div className={styles.formMain}>
            <button onClick={handleClose} className={styles.closeBtn}>
              <img src={closeImg} alt="" />
            </button>
            <p className={styles.mainTitle}>Napsat recenzi</p>
            <div className={styles.rateDiv}>
              <Rating
                name="size-large"
                value={rate}
                onChange={(e, value) => setRate(value)}
                size="large"
              />
            </div>
            <div className={styles.textAreaWrap}>
              <p className={styles.title}>Vaše dojmy z produktu</p>
              <textarea
                name="comment"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.comment}
                className={styles.autoresizing}
              ></textarea>
            </div>
            <div className={styles.imageWrap}>
              <button className={styles.addBtn}>
                <img src={addImageIcon} alt="" />
                <p>Přidat fotky</p>
              </button>
              <div className={styles.imageDiv}>
                <div>
                  <p>+</p>
                </div>
                <div>
                  <img src={FormImageIcon} alt="" />
                </div>
                <div>
                  <img src={FormImageIcon} alt="" />
                </div>
                <div>
                  <img src={FormImageIcon} alt="" />
                </div>
              </div>
            </div>
            <div className={styles.nameDiv}>
              <p className={styles.title}>Název </p>
              <input
                name="username"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.username}
                type="text"
              />
            </div>
            <div>
              <button
                onClick={formik.handleSubmit}
                className={styles.sendBtnAcc}
              >
                Odejít
              </button>
            </div>
          </div>
      </Modal>
    </div>
  );
};

export default ProductCommentForm;
