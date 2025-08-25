import { useMediaQuery } from "react-responsive";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { useActionSellerEdit } from "../hook/useActionSellerEdit";
import SellerPreviewDesktop from "../Components/Seller/preview/SellerPreviewDesctop/SellerPreviewDesktop";
import SellerPreviewMobile from "../Components/Seller/preview/SellerPreviewMobile/SellerPreviewMobile";

import arrRight from "../assets/Payment/arrRightWhite.svg"

import styles from "../styles/SellerPreviewPage.module.scss";
import Spinner from "../ui/Spiner/Spiner";

const SellerEditPreview = () => {
    const isMobile = useMediaQuery({ maxWidth: 470 });
    const { id } = useParams()

    const navigate = useNavigate()

    const { fetchEditProduct } = useActionSellerEdit()

    const product = useSelector(state => state.edit_goods)


    //   const { fetchCreateProduct } = useActionCreatePrev()

    //   const handleCreate = () => {
    //     fetchCreateProduct()

    //   }

    const handleEdit = async () => {
        try {
            await fetchEditProduct(id); // Дождемся завершения редактирования

            // Проверяем статус после завершения запроса
            if (product?.status === "fulfilled") {
                navigate("/seller/goods-list");
                window.location.reload();
            }
        } catch (error) {
            console.error("Ошибка при редактировании продукта:", error);
        }
    };




    return (
        <div style={{ paddingBottom: "100px" }}>
            <h3 className={styles.title}>Creation of goods</h3>
            {isMobile ? <SellerPreviewMobile product={product} /> : <SellerPreviewDesktop product={product} />}
            <div className={styles.buttonDiv}>
                <button onClick={() => navigate(-1)}>
                    Cancel
                </button>
                <button onClick={handleEdit} >
                    {
                        product?.status === "pending" ?
                            <Spinner size="16px" /> :
                            <>
                                Sending for moderation
                                <img src={arrRight} alt="" />
                            </>
                    }
                </button>
            </div>
        </div>
    );
};

export default SellerEditPreview;
