import styles from "./HowItWorks.module.scss"

const HowItWorks = () => {
    return (
        <div className={styles.main}>
            <h4 className={styles.title}>How It Works</h4>
            <div className={styles.contentWrap}>
                <div className={styles.prodPrice}>
                    <h3>$100</h3>
                    <p>Product Sale Price</p>
                </div>

                <div className={styles.distribution}>
                    <div>
                        <h4 style={{ color: "#00a63e" }}>$87</h4>
                        <p>You Keep</p>
                    </div>
                    <div>
                        <h4 style={{ color: "#99a1af" }}>$13</h4>
                        <p>Platform Fee</p>
                    </div>
                </div>

                <div className={styles.everySaleBlock}>
                    <h5>87% of every sale goes to you!</h5>
                    <p>No setup fees, no monthly costs</p>
                </div>

            </div>
        </div>
    )
}

export default HowItWorks