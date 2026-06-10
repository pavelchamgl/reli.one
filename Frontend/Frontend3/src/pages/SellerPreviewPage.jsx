import { useMediaQuery } from "react-responsive";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import SellerPreviewDesktop from "../Components/Seller/preview/SellerPreviewDesctop/SellerPreviewDesktop";
import SellerPreviewMobile from "../Components/Seller/preview/SellerPreviewMobile/SellerPreviewMobile";
import { useActionCreatePrev } from "../hook/useActionCreatePrev";
import Spinner from "../ui/Spiner/Spiner";
import { getProductById } from "../api/productsApi";

import arrRight from "../assets/Payment/arrRightWhite.svg"

import styles from "../styles/SellerPreviewPage.module.scss";

const SellerPreviewPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 470 });

  const navigate = useNavigate()

  const { id } = useParams()

  const product = useSelector(state => state.create_prev)
  const previewProduct = useSelector(state => state.create_prev.previewProduct)


  const data = id ? previewProduct : product

  const { fetchCreateProduct } = useActionCreatePrev()

  const handleCreate = () => {
    fetchCreateProduct()
  }

  const { t } = useTranslation('sellerHome')

  useEffect(() => {
    if (product?.status === "fulfilled") {
      navigate("/seller/goods-list");
      window.location.reload();
    }

  }, [product?.status]);

  useEffect(() => {
    if (id) {
      getProductById(id).then((res) => {
        console.log(res);

      })
    }
  }, [id])




  return (
    <div style={{ paddingBottom: "100px" }}>
      <h3 className={styles.title}>{t('goods.creation')}</h3>
      {isMobile ? <SellerPreviewMobile product={data} /> : <SellerPreviewDesktop product={data} />}
      {product?.status === "partial_success" ? (
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
                <li key={item.step}>{item.step}: {item.error}</li>
              ))}
          </ul>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={handleCreate}>Retry failed steps</button>
            <button onClick={() => navigate(`/seller/seller-edit/${product.createdProductId}`)}>Open edit</button>
            <button onClick={() => navigate("/seller/goods-list")}>Goods list</button>
          </div>
        </div>
      ) : null}
      <div className={styles.buttonDiv}>
        <button onClick={() => navigate(-1)}>
          {t('item.cancel')}
        </button>
        <button onClick={handleCreate}>
          {
            product?.status === "pending" ?
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
