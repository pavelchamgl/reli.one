
import testImg from "../../../../assets/Product/ProductTestImage.svg";

import styles from "./GoodsCardModer.module.scss"

const GoodsCardModer = ({ item, isLoading }) => {

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
                <div className={styles.imageDiv}>
                    <img src={item?.image} alt="" />
                </div>
                <div className={styles.priceDiv}>
                    {item ? <p>{`${item?.price}€`}</p> : <></>}
                    {/* <span>120€</span> */}
                </div>
                <p className={styles.name}>{item?.name}</p>
                <p className={styles.moderDescText}>Approximate moderation time: 24 hours</p>
                <button className={styles.previewBtn}>Preview</button>
            </div>
        </>
    );
}

export default GoodsCardModer