
import SellerCreateVariant from "../sellerCreateVariant/SellerCreateVariant"

import styles from "./SellerCreateVariants.module.scss"

const SellerCreateVariants = () => {
    return (
        <div>
            <h4 className={styles.wightTitle}>Addition styles</h4>
            <p className={styles.descText}>1.Specify the name (title) to the styles. 2. Add the style itself and be sure to specify its cost 3. Optionally add the name and photo of the style</p>

            <div className={styles.addStyleWrap}>
                <input type="text" placeholder="Color, size, style" />
                <button>+ Add style</button>
            </div>

            <div className={styles.variantsWrap}>
                <SellerCreateVariant />
                <SellerCreateVariant />
                <SellerCreateVariant />
                <SellerCreateVariant />
                <SellerCreateVariant />
                <SellerCreateVariant />
            </div>

        </div>
    )
}

export default SellerCreateVariants