import { useFormik } from "formik";
import { Rating, Modal } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useActions } from "../../../hook/useAction";
import { useParams } from "react-router-dom";
import * as yup from "yup";

import closeImg from "../../../assets/loginModal/loginModalX.svg";
import CreateResenzeImage from "../createResenzeImage/CreateResenzeImage";

import styles from "./ProductCommentForm.module.scss";

const ProductCommentForm = ({ open, handleClose }) => {
  const [rate, setRate] = useState(0);

  const { t } = useTranslation();

  const { id } = useParams();

  const { fetchPostComment } = useActions();

  const validateCommentForm = yup.object().shape({
    comment: yup
      .string()
      .typeError(({ path }) => t(`validation.comment.typeError`))
      .required(t(`validation.comment.required`)),
    username: yup.string().required(t("validation.name.required")),
  });

  const formik = useFormik({
    initialValues: {
      comment: "",
      username: "",
    },
    validationSchema: validateCommentForm,
    onSubmit: (values) => {
      // console.log(images);
      // console.log(values);

      let obj = {
        content: values.comment,
        rating: rate,
      };

      fetchPostComment(id, obj);
    },
  });

  return (
    <div>
      <Modal
        sx={{ height: "auto", overflow: "auto" }}
        open={open}
        onClose={handleClose}
      >
        <div className={styles.formMain}>
          <button onClick={handleClose} className={styles.closeBtn}>
            <img src={closeImg} alt="" />
          </button>
          <p className={styles.mainTitle}>{t("write_review")}</p>
          <div className={styles.rateDiv}>
            <Rating
              name="size-large"
              value={rate}
              onChange={(e, value) => setRate(value)}
              size="large"
            />
          </div>
          <div className={styles.textAreaWrap}>
            <p className={styles.title}>{t("impressions_product")}</p>
            <textarea
              name="comment"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.comment}
              className={styles.autoresizing}
            ></textarea>
          </div>
          <CreateResenzeImage />
          <div className={styles.nameDiv}>
            <p className={styles.title}>{t("name")}</p>
            <input
              name="username"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.username}
              type="text"
            />
          </div>
          {(formik.errors.comment || formik.errors.username) && (
            <p className={styles.errText}>{`${formik.errors.comment || ""} ${
              formik.errors.username || ""
            }`}</p>
          )}
          <div>
            <button
              disabled={!formik.isValid}
              onClick={formik.handleSubmit}
              className={styles.sendBtn}
            >
              {t("send")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductCommentForm;
