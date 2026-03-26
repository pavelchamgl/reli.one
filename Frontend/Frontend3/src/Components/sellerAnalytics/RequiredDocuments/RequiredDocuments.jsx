
import documIc from "../../../assets/sellerAnalyt/documIc.svg"
import requiredIc from "../../../assets/sellerAnalyt/requiredIc.svg"
import uploadIc from "../../../assets/sellerAnalyt/uploadIc.svg"

import styles from "./RequiredDocuments.module.scss"


const DocumUpload = () => {
    return (
        <div className={styles.docUpload}>
            <img src={documIc} alt="" />
            <div>
                <p>Government-issued ID</p>
                <p>Uploaded on March <span>18, 2026</span></p>
            </div>
        </div>
    )
}

const RequiredDocBlock = () => {
    return (
        <div className={styles.requiredBlock}>
            <div className={styles.requiredImageAndText}>
                <img src={requiredIc} alt="" />
                <div>
                    <p>Business License</p>
                    <span>Required</span>
                </div>
            </div>
            <button>
                <img src={uploadIc} alt="" />
                Upload
            </button>
        </div>
    )
}

const RequiredDocuments = () => {
    return (
        <div className={styles.requiredDocuments}>
            <h3 className={styles.title}>Required Documents</h3>
            <div className={styles.documentsWrap}>
                <DocumUpload />
                <DocumUpload />
                <RequiredDocBlock />
                <RequiredDocBlock />
            </div>
        </div>
    )
}

export default RequiredDocuments