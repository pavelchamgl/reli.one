import { useMediaQuery } from "react-responsive";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

import SellerPreviewDesktop from "../Components/Seller/preview/SellerPreviewDesctop/SellerPreviewDesktop";
import SellerPreviewMobile from "../Components/Seller/preview/SellerPreviewMobile/SellerPreviewMobile";
import { useActionCreatePrev } from "../hook/useActionCreatePrev";
import Spinner from "../ui/Spiner/Spiner";

import arrRight from "../assets/Payment/arrRightWhite.svg"

import styles from "../styles/SellerPreviewPage.module.scss";

const SellerPreviewPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 470 });

  const navigate = useNavigate()

  const product = useSelector(state => state.create_prev)


  const { fetchCreateProduct } = useActionCreatePrev()

  const handleCreate = () => {
    fetchCreateProduct()

  }

  useEffect(() => {
    // if (product?.status === "fulfilled") {
    //   navigate("/seller/goods-list");
    //   window.location.reload();
    // }
    console.log(product.status);
    
  }, [product?.status]);


  return (
    <div style={{ paddingBottom: "100px" }}>
      <h3 className={styles.title}>Creation of goods</h3>
      {isMobile ? <SellerPreviewMobile product={product} /> : <SellerPreviewDesktop product={product} />}
      <div className={styles.buttonDiv}>
        <button onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button onClick={handleCreate}>
          {
            product?.status === "pending" ?
              <Spinner size="16px" />
              :
              (
                <>
                  <p>
                    Sending for moderation
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
