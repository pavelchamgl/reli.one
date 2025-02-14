import EditGoodsForm from "../Components/Seller/edit/EditGoodsForm/EditGoodsForm"

import styles from "../styles/EditGoodsPage.module.scss"

const EditGoodsPage = () => {
    return (
        <div style={{ paddingBottom: "100px" }}>
            <h3 className={styles.createTitle}>Editing of goods</h3>
            <EditGoodsForm />
        </div>
    )
}

export default EditGoodsPage