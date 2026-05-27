import { useLocation } from "react-router-dom"

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


const DocumUploadUnder = () => {
    return (
        <div className={styles.underDocWrap}>
            <div className={styles.docUpload} style={{
                border: "none",
                alignItems: "center",
                padding: "0"
            }}>
                <img src={documIc} alt="" />
                <div>
                    <p>Government-issued ID</p>
                    <p>Uploaded on March <span>18, 2026</span></p>
                </div>
            </div>

            <span className={styles.underDocText}>
                Under Review
            </span>
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11.3333 5.33333L7.99996 2L4.66663 5.33333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 2V10" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Re-upload
            </button>
        </div>
    )
}

const RequiredDocuments = () => {

    const { pathname } = useLocation()

    const isUnderReview = pathname === '/seller/under-review'

    return (
        <div className={styles.requiredDocuments}>
            <h3 className={styles.title}>{isUnderReview ? "Submitted Documents" : "Required Documents"}</h3>
            <div className={styles.documentsWrap}>
                <DocumUpload />
                <DocumUploadApproved />
                <RejectedDocBlock />
                <DocumUploadUnder />
            </div>
        </div>
    )
}

export default RequiredDocuments