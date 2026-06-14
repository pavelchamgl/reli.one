import { useMediaQuery } from "react-responsive";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import SellerPreviewDesktop from "../Components/Seller/preview/SellerPreviewDesctop/SellerPreviewDesktop";
import SellerPreviewMobile from "../Components/Seller/preview/SellerPreviewMobile/SellerPreviewMobile";
import { useActionCreatePrev } from "../hook/useActionCreatePrev";
import Spinner from "../ui/Spiner/Spiner";
import { getProductById } from "../api/productsApi";
import { buildSellerReviewData, formatApiErrorMessage, unwrapProductPreviewResponse } from "../utils/sellerProductWizard";

import arrRight from "../assets/Payment/arrRightWhite.svg"

import styles from "../styles/SellerPreviewPage.module.scss";

const SellerPreviewPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 470 });

  const navigate = useNavigate()

  const { id } = useParams()

  const product = useSelector(state => state.create_prev)
  const previewProduct = useSelector(state => state.create_prev.previewProduct)
  const [loadedPreviewProduct, setLoadedPreviewProduct] = useState(null)
  const [previewStatus, setPreviewStatus] = useState(id ? "pending" : "idle")
  const [previewError, setPreviewError] = useState("")


  const data = id ? (loadedPreviewProduct || previewProduct) : product
  const reviewData = buildSellerReviewData(data)

  const { fetchCreateProduct } = useActionCreatePrev()

  const handleCreate = () => {
    fetchCreateProduct()
  }

  const { t } = useTranslation('sellerHome')

  useEffect(() => {
    if (!id && product?.status === "fulfilled") {
      navigate("/seller/goods-list");
      window.location.reload();
    }

  }, [id, product?.status]);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      setPreviewStatus("pending")
      setPreviewError("")
      getProductById(id)
        .then((res) => {
          if (!isMounted) return;
          setLoadedPreviewProduct(unwrapProductPreviewResponse(res))
          setPreviewStatus("fulfilled")
        })
        .catch((error) => {
          if (!isMounted) return;
          setPreviewStatus("rejected")
          setPreviewError(formatApiErrorMessage(error?.response?.data, "Unable to load product preview."))
        })
    }

    return () => {
      isMounted = false;
    }
  }, [id])




  return (
    <div style={{ paddingBottom: "100px" }}>
      <h3 className={styles.title}>{t('goods.creation')}</h3>
      {id && previewStatus === "pending" ? (
        <div className={styles.previewLoading}>
          <Spinner size="20px" />
          <span>Loading product preview...</span>
        </div>
      ) : null}
      {id && previewStatus === "rejected" ? (
        <div className={styles.reviewWarning}>{previewError}</div>
      ) : null}
      {(!id || previewStatus === "fulfilled") ? (
        <>
      {isMobile ? <SellerPreviewMobile product={data} /> : <SellerPreviewDesktop product={data} />}
      {reviewData.hasMissingRequiredAttributes ? (
        <div className={styles.reviewWarning}>
          Required category attributes are missing. Return to the form and fill them before sending to moderation.
        </div>
      ) : null}
      {!id && product?.status === "partial_success" ? (
        <div style={{
          margin: "24px 0",
          padding: "16px",
          border: "1px solid #f59e0b",
          borderRadius: "4px",
          background: "#fffbeb",
          color: "#78350f"
        }}>
          <strong>Product created with incomplete data.</strong>
          <p style={{ margin: "8px 0" }}>
            Product ID: {product.createdProductId}. Failed steps can be retried without creating a duplicate product.
          </p>
          <ul style={{ margin: "0 0 12px", paddingLeft: "18px" }}>
            {(product.submitStepResults || [])
              .filter((item) => item.status === "rejected")
              .map((item) => (
                <li key={item.step}>{item.step}: {formatApiErrorMessage(item.error, "Unknown error")}</li>
              ))}
          </ul>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={handleCreate}>Retry failed steps</button>
            <button onClick={() => navigate(`/seller/seller-edit/${product.createdProductId}`)}>Open edit</button>
            <button onClick={() => navigate("/seller/goods-list")}>Goods list</button>
          </div>
        </div>
      ) : null}
        </>
      ) : null}
      <div className={styles.buttonDiv}>
        <button onClick={() => navigate(-1)}>
          {t('item.cancel')}
        </button>
        <button onClick={handleCreate} disabled={Boolean(id) || reviewData.hasMissingRequiredAttributes}>
          {
            !id && product?.status === "pending" ?
              <Spinner size="16px" />
              :
              (
                <>
                  <p>
                    {t('sendingForModeration')}
                  </p>
                  <img src={arrRight} alt="" />
                </>
              )
          }
        </button>
      </div>
    </div>
  );
};

export default SellerPreviewPage;
