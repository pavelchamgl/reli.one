import testImg from "../../../../assets/Product/ProductTestImage.svg";

import styles from "./GoodsCardNotModer.module.scss"

const GoodsCardNotModer = () => {
    const isLoading = false

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
                    <img src={testImg} alt="" />
                </div>
                <div className={styles.priceDiv}>
                    <p>150€</p>
                    <span>120€</span>
                </div>
                <p className={styles.name}>Robot Vysavač Dyson LXS10 White</p>
                <p className={styles.moderDescText}>Cause: prohibited goods</p>
            </div>
        </>
    );
}

export default GoodsCardNotModer