
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import testImg from "../../../../assets/Product/ProductTestImage.svg";
import { useActionCreatePrev } from "../../../../hook/useActionCreatePrev";

import styles from "./GoodsCardModer.module.scss"

const GoodsCardModer = ({ item, isLoading }) => {

    const { setPreviewProduct } = useActionCreatePrev()
    const navigate = useNavigate()

      const { t } = useTranslation('sellerHome')


    if (isLoading) {
        return (
            <div className={styles.skeleton}>
                <div className={styles.skeletonImage}></div>
                <div className={styles.skeletonDetails}>
                    <div className={styles.skeletonName}></div>
                    <div className={styles.skeletonPrice}></div>
                    <div className={styles.skeletonRate}>
                        <div className={styles.skeletonRating}></div>
                        <div className={styles.skeletonCount}></div>
                    </div>
                    <button className={styles.skeletonButton}></button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.main}>
                <img className={styles.imageDiv} src={item?.image} alt="" />
                <div className={styles.priceDiv}>
                    {/* {item ? <p>{`${item?.price}€`}</p> : <></>} */}
                    {/* <span>120€</span> */}
                </div>
                <p className={styles.name}>{item?.name}</p>
                <p className={styles.moderDescText}>{t('item.approximate')}</p>
                <button className={styles.previewBtn}
                    onClick={() => {
                        if (item && item?.id) {
                            // setPreviewProduct(item)
                            // navigate(`/seller/seller-preview/${item?.id}`)
                        }
                    }}
                >{t('item.preview')}</button>
            </div>
        </>
    );
}

export default GoodsCardModer