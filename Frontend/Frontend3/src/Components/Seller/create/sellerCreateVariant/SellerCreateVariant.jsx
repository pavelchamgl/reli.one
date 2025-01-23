import styles from "./SellerCreateVariant.module.scss"

const SellerCreateVariant = () => {
    return (
        <div className={styles.main}>
            <input type="text" placeholder="Name color" />
            <input type="text" placeholder="Price" />
            <div className={styles.addPhotoDiv}>
                <button className={styles.addPhotoBtn}>+ Add photo</button>
            </div>
        </div>
    )
}

export default SellerCreateVariant