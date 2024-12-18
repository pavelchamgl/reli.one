import { useEffect, useState } from "react";
import { Rating } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import { useActions } from "../../../../hook/useAction";
import { useParams } from "react-router-dom";
import * as yup from "yup";

import CreateResenzeImage from "../../createResenzeImage/CreateResenzeImage";

import styles from "./MobResenzeCreateForm.module.scss";
import { useSelector } from "react-redux";

const MobResenzeCreateForm = () => {
  const [rate, setRate] = useState(0);
  const [varPack, setVarPack] = useState("pack2");
  const [selected, setSelected] = useState(null);
  const [variants, setVariants] = useState([]);
  const { image, name, text, price } = variants[0] || {};
  const [files, setFiles] = useState(null);

  const product = useSelector((state) => state.products.product);

  useEffect(() => {
    if (product?.variants && product?.can_review) {
      const canReviewVariants = product.variants.filter((element) =>
        product.can_review.includes(element?.sku)
      );
      setVariants(canReviewVariants);
    }
  }, [product?.variants, product?.can_review]);

  useEffect(() => {
    if (variants.length === 1) {
      setSelected(variants[0]?.sku);
    }
  }, [variants]);

  useEffect(() => {
    if (text && price) {
      setVarPack("pack3");
    } else if (image && price) {
      setVarPack("pack2");
    }
  }, [variants, image, text, price]);

  const { t } = useTranslation();

  const { id } = useParams();

  const { fetchPostComment } = useActions();

  const validateCommentForm = yup.object().shape({
    comment: yup
      .string()
      .typeError(({ path }) => t(`validation.comment.typeError`))
      .required(t(`validation.comment.required`)),
  });

  const formik = useFormik({
    initialValues: {
      comment: "",
    },
    validationSchema: validateCommentForm,
    onSubmit: (values) => {
      let obj = {
        content: values.comment,
        rating: rate,
      };

      const formData = new FormData();
      formData.append("sku", selected);
      formData.append("content", values.comment);
      formData.append("rating", rate);

      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append("media", file); // "media[]" — ключ для массива файлов
        });
      }

      // Для отладки: проверим, что добавлено в formData
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(
            `Key: ${key}, File Name: ${value.name}, Size: ${value.size}`
          );
        } else {
          console.log(`Key: ${key}, Value: ${value}`);
        }
      }

      fetchPostComment(formData);
    },
  });

  return (
    <div className={styles.main}>
      {variants.length === 0 ? (
        <></>
      ) : (
        <div className={styles.mainCharack}>
          <p className={styles.styleText}>Select {name}</p>
          {varPack && varPack === "pack2" && (
            <div className={styles.stylePackVTwoButtons}>
              {variants && variants.length > 0
                ? variants.map((item) => (
                    <button
                      style={{
                        borderColor:
                          selected === item.sku ? "black" : "#64748b",
                      }}
                      onClick={() => {
                        setSelected(item.sku);
                      }}
                      key={item.sku}
                    >
                      <img src={item?.image} alt="" />
                      <p>{item?.price}€</p>
                    </button>
                  ))
                : null}
            </div>
          )}
          {varPack && varPack === "pack3" && (
            <div className={styles.stylePackVThreeButtons}>
              {variants && variants.length > 0
                ? variants.map((item) => (
                    <button
                      style={{
                        borderColor:
                          selected === item.sku ? "black" : "#64748b",
                      }}
                      onClick={() => {
                        setSelected(item.sku);
                      }}
                      key={item.sku}
                    >
                      <p>{item?.text}</p>
                      <span>{item?.price}€</span>
                    </button>
                  ))
                : null}
            </div>
          )}
        </div>
      )}
      <div className={styles.rateDiv}>
        <Rating
          size="large"
          name="simple-controlled"
          value={rate}
          onChange={(event, newValue) => {
            setRate(newValue);
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
      <CreateResenzeImage setMainFiles={setFiles} />

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
