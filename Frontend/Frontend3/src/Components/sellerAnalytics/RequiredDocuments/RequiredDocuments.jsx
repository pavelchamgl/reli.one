
import documIc from "../../../assets/sellerAnalyt/documIc.svg"
import requiredIc from "../../../assets/sellerAnalyt/requiredIc.svg"
import uploadIc from "../../../assets/sellerAnalyt/uploadIc.svg"
import redUploadIc from "../../../assets/sellerAnalyt/redUploadIc.svg"
import redDocIc from "../../../assets/sellerAnalyt/redDoc.svg"

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

const DocumUploadApproved = () => {
    return (
        <div className={styles.docUpload}>
            <img src={documIc} alt="" />
            <div>
                <div className={styles.documApprovedWrap}>
                    <p>Government-issued ID</p>
                    <span>Approved</span>
                </div>
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

const RejectedDocBlock = () => {
    return (
        <div className={styles.rejectedBlock}>
            <div className={styles.rejectedImageAndText}>
                <img src={redDocIc} alt="" />
                <div>
                    <div className={styles.rejectedTitle}>
                        <p>Business License</p>
                        <span>Rejected</span>
                    </div>
                    <p className={styles.rejectedDesc}>Image is blurry. Please upload a clear, high-resolution photo of your ID.</p>
                    <p className={styles.rejectedDate}>Uploaded on Mar <span>18, 2026</span></p>
                </div>
            </div>
            <button>
                <img src={redUploadIc} alt="" />
                Re-upload
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
                <DocumUploadApproved />
                <RejectedDocBlock />
                <RequiredDocBlock />
                <RequiredDocBlock />
            </div>
        </div>
    )
}

export default RequiredDocuments