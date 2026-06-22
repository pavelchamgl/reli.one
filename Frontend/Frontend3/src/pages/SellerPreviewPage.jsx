import { useMediaQuery } from "react-responsive";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import SellerPreviewDesktop from "../Components/Seller/preview/SellerPreviewDesctop/SellerPreviewDesktop";
import SellerPreviewMobile from "../Components/Seller/preview/SellerPreviewMobile/SellerPreviewMobile";
import SellerReviewActions from "../Components/Seller/preview/SellerReviewProductLayout/SellerReviewActions";
import { useActionCreatePrev } from "../hook/useActionCreatePrev";
import Spinner from "../ui/Spiner/Spiner";
import { getProductById } from "../api/productsApi";
import { buildSellerReviewData, formatApiErrorMessage, formatSellerWizardApiError, unwrapProductPreviewResponse } from "../utils/sellerProductWizard";

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
  const actionSlot = (
    <SellerReviewActions
      backLabel={t('item.cancel')}
      submitLabel={t('sendingForModeration')}
      isLoading={!id && product?.status === "pending"}
      isSubmitDisabled={Boolean(id) || reviewData.hasMissingRequiredAttributes}
      onBack={() => navigate(-1)}
      onSubmit={handleCreate}
    />
  )

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
        <div className={styles.previewLoading} translate="no">
          <Spinner size="20px" />
          <span>Loading product preview...</span>
        </div>
      ) : null}
      {id && previewStatus === "rejected" ? (
        <div className={styles.reviewWarning} translate="no">{previewError}</div>
      ) : null}
      {(!id || previewStatus === "fulfilled") ? (
        <>
      {isMobile ? (
        <SellerPreviewMobile product={data} actionSlot={actionSlot} />
      ) : (
        <SellerPreviewDesktop product={data} actionSlot={actionSlot} />
      )}
      {reviewData.hasMissingRequiredAttributes ? (
        <div className={styles.reviewWarning} translate="no">
          Required category attributes are missing. Return to the form and fill them before sending to moderation.
        </div>
      ) : null}
      {!id && product?.status === "partial_success" ? (
        <div translate="no" style={{
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
                <li key={item.step}>
                  {item.step}: {formatSellerWizardApiError(item.error, t, "Unknown error")}
                </li>
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
    </div>
  );
};

export default SellerPreviewPage;
