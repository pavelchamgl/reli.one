import productIc from "../../../../assets/Seller/newOrder/productIc.svg"
import styles from './ProductTableCard.module.scss';


const ParameterWrap = ({ title, desc, style }) => {
    return (
        <div className={styles.parametrWrap}>
            <p>{title}</p>
            <p style={style}>{desc}</p>
        </div>
    )
}

const ProductTableCard = ({ item }) => {
    return (
        <div className={styles.main}>
            <div className={styles.topSection}>
                <div className={styles.nameAndTotal}>
                    <p>{item?.name}</p>
                    <p>Total</p>
                </div>
                <div className={styles.variantAndPrice}>
                    <div className={styles.variant}>
                        <img src={productIc} alt="" />
                        <p>{item?.sku}</p>
                    </div>
                    <p className={styles.price}>{`${item?.line_total_gross} €`}</p>
                </div>

            </div>
            <div className={styles.otherContentBlock}>
                <div className={styles.parametrsWrap}>
                    <ParameterWrap title={"Variant name"} desc={item?.variant_name} />
                    {/* <ParameterWrap title={"Size"} desc={"M"} /> */}
                </div>
                <ParameterWrap title={"Quantity"} desc={item?.quantity} style={{ fontFamily: "var(--ft)" }} />

                <div className={styles.unitBlock}>
                    <p>Unit Price</p>
                    <p>{`${item?.unit_price_gross} €`}</p>
                </div>

            </div>
        </div>
    )
}

export default ProductTableCard