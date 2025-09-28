import { useFormik } from "formik";
import { Rating, Modal } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useActions } from "../../../hook/useAction";
import { useParams } from "react-router-dom";
import * as yup from "yup";

import closeImg from "../../../assets/loginModal/loginModalX.svg";
import CreateResenzeImage from "../createResenzeImage/CreateResenzeImage";

import styles from "./ProductCommentForm.module.scss";
import { useSelector } from "react-redux";

const ProductCommentForm = ({ open, handleClose }) => {
  const [rate, setRate] = useState(0);
  const [varPack, setVarPack] = useState("pack2");
  const [selected, setSelected] = useState(null);
  const [variants, setVariants] = useState([]);
  const [files, setFiles] = useState(null);

  const { image, name, text, price } = variants[0] || {};

  const product = useSelector((state) => state.products.product);
  const commentErr = useSelector((state) => state.comment.err);


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
          <div>
            <p className={styles.mainTitle}>{t("write_review")}</p>
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
          </div>

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
          <CreateResenzeImage setMainFiles={setFiles} />
          {/* <div className={styles.nameDiv}>
            <p className={styles.title}>{t("name")}</p>
            <input
              name="username"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.username}
              type="text"
            />
          </div> */}
          {(formik.errors.comment || formik.errors.username) && (
            <p className={styles.errText}>{`${formik.errors.comment || ""} ${
              formik.errors.username || ""
            }`}</p>
          )}
          {commentErr && <p className={styles.errText}>{commentErr?.detail}</p>}
          <div>
            <button
              disabled={
                !formik.isValid ||
                formik.values.comment.length === 0 ||
                rate === 0
              }
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
