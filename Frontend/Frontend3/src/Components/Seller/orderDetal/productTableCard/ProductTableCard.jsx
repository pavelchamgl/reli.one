import productIc from "../../../../assets/Seller/newOrder/productIc.svg"
import styles from './ProductTableCard.module.scss';


const ParameterWrap = ({ title, desc }) => {
    return (
        <div className={styles.parametrWrap}>
            <p>{title}</p>
            <p>{desc}</p>
        </div>
    )
}

const ProductTableCard = () => {
    return (
        <div className={styles.main}>
            <div className={styles.topSection}>
                <div className={styles.nameAndTotal}>
                    <p>Premium Cotton T-Shirt</p>
                    <p>Total</p>
                </div>
                <div className={styles.variantAndPrice}>
                    <div className={styles.variant}>
                        <img src={productIc} alt="" />
                        <p>TS-BLK-M-001</p>
                    </div>
                    <p className={styles.price}>$59.98</p>
                </div>

            </div>
            <div className={styles.otherContentBlock}>
                <div className={styles.parametrsWrap}>
                    <ParameterWrap title={"Color"} desc={"Black"} />
                    <ParameterWrap title={"Size"} desc={"M"} />
                </div>
                <ParameterWrap title={"Quantity"} desc={"2"} />

                <div className={styles.unitBlock}>
                    <p>Unit Price</p>
                    <p>$29.99</p>
                </div>

            </div>
        </div>
    )
}

export default ProductTableCard