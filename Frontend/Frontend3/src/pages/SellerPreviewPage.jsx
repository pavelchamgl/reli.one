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
    if (Boolean(id)) {
      getProductById(id).then((res) => {
        console.log(res);

      })
    }
  }, [id])




  return (
    <div style={{ paddingBottom: "100px" }}>
      <h3 className={styles.title}>{t('goods.creation')}</h3>
      {isMobile ? <SellerPreviewMobile product={data} /> : <SellerPreviewDesktop product={data} />}
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
