import { useMediaQuery } from "react-responsive";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import SellerPreviewDesktop from "../Components/Seller/preview/SellerPreviewDesctop/SellerPreviewDesktop";
import SellerPreviewMobile from "../Components/Seller/preview/SellerPreviewMobile/SellerPreviewMobile";

import arrRight from "../assets/Payment/arrRightWhite.svg"

import styles from "../styles/SellerPreviewPage.module.scss";

const SellerEditPreview = () => {
    const isMobile = useMediaQuery({ maxWidth: 470 });

    const navigate = useNavigate()

    const product = useSelector(state => state.edit_goods)

    console.log(product);

    //   const { fetchCreateProduct } = useActionCreatePrev()

    //   const handleCreate = () => {
    //     fetchCreateProduct()

    //   }

    return (
        <div style={{ paddingBottom: "100px" }}>
            <h3 className={styles.title}>Creation of goods</h3>
            {isMobile ? <SellerPreviewMobile product={product} /> : <SellerPreviewDesktop product={product} />}
            <div className={styles.buttonDiv}>
                <button onClick={() => navigate(-1)}>
                    Cancel
                </button>
                <button >
                    Sending for moderation
                    <img src={arrRight} alt="" />
                </button>
            </div>
        </div>
    );
};

export default SellerEditPreview;
