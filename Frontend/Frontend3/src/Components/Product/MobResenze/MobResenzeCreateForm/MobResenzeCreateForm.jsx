import { useState } from "react";
import { Rating } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import { useActions } from "../../../../hook/useAction";
import { useParams } from "react-router-dom";
import * as yup from "yup";

import CreateResenzeImage from "../../createResenzeImage/CreateResenzeImage";

import styles from "./MobResenzeCreateForm.module.scss";

const MobResenzeCreateForm = () => {
  const [rateValue, setRateValue] = useState(0);

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
      console.log(values);

      let obj = {
        content: values.comment,
        rating: rateValue,
      };

      fetchPostComment({ id: id, obj: obj });
    },
  });

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
        <p className={styles.title}>{t("impressions_product")}</p>
        <textarea
          className={styles.commentInp}
          name="comment"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.comment}
        ></textarea>
      </div>
      <CreateResenzeImage />
      <div className={styles.nameDiv}>
        <p>{t("name")}</p>
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

      <button
        onClick={formik.handleSubmit}
        disabled={!formik.isValid}
        className={styles.submitBtn}
      >
        {t("send")}
      </button>
    </div>
  );
};

export default MobResenzeCreateForm;
