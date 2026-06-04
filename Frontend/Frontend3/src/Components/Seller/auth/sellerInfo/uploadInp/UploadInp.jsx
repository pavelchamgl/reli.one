import { useEffect, useState } from "react";
import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import uploadIc from "../../../../../assets/Seller/register/uploadIc.svg"
import uploadIcErr from "../../../../../assets/Seller/register/uploadIcErr.svg"
import uploadInpErrIc from "../../../../../assets/Seller/register/uploadInpErrIc.svg"
import greenMarkIc from "../../../../../assets/Seller/register/markGreenSmall.svg"
import grayX from "../../../../../assets/Seller/preview/xGreyIc.svg"

import styles from './UploadInp.module.scss';

const UploadInp = ({
    title,
    description,
    docType,
    scope,
    side,
    onChange,
    inpText,
    stateName,
    nameTitle,
    onMouseDown,
    uploadStatus,
    identTwo,
    required = true,
    preserveData,
}) => {

    const { pathname } = useLocation()
    const { t } = useTranslation('onbording')

    const companyPathname = ['/seller/seller-company', '/seller/seller-review-company']

    const { safeData, safeCompanyData } = useActionSafeEmploed()

    const [name, setName] = useState(stateName ?? "")

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setName(file?.name)

        const preservedData = typeof preserveData === "function" ? preserveData() : preserveData
        const uploadPatch = {
            ...(preservedData || {}),
            [`${nameTitle}`]: file?.name
        }

        if (companyPathname.includes(pathname)) {
            safeCompanyData({ [`${nameTitle}`]: file?.name })
        } else {
            safeData(uploadPatch)
        }
        // MIME
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
        ];

        if (!allowedTypes.includes(file.type)) {
            alert(t('onboard.common.upload_file_type_error'));
            return;
        }

        // Size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert(t('onboard.common.upload_file_size_error'));
            return;
        }

        onChange({
            file,
            doc_type: docType,
            scope,
            side,
        });
    };

    const statusClasses = {
        full: styles.fileInpContentSucc,
        rej: styles.fileInpContentErr,
    };


    return (
        <div>
            {
                title &&
                <p className={styles.title} data-required={required ? "true" : "false"}>{title}</p>
            }
            <span className={styles.desc}>{description}</span>

            <label
                onMouseDown={onMouseDown}
                className={styles.fileLabel}>
                <input type="file" hidden onChange={handleFileChange} />

                <div className={`
    ${styles.fileInpContent}
    ${(Boolean(stateName) && uploadStatus !== 'rej') ? styles.fileInpContentSucc : ""}
    ${statusClasses[uploadStatus] || ''}
                `}>
                    {
                        // Если статус "успех" ИЛИ (есть имя И нет ошибки)
                        (uploadStatus === 'full' || (Boolean(stateName) && uploadStatus !== 'rej')) ? (
                            <>
                                <div>
                                    <img src={greenMarkIc} alt="" />
                                    <p className={styles.truncatedText}>{name}</p> {/* Добавил класс для троеточия */}
                                </div>
                                <img src={grayX} alt="" />
                            </>
                        ) : (
                            <>
                                <img src={uploadStatus === 'rej' ? uploadIcErr : uploadIc} alt="" />
                                <p>{inpText}</p>
                                <span>{name ? name : "(PDF, JPG, PNG - Max 10MB)"}</span>
                            </>
                        )
                    }



                </div>
            </label>

            {
                uploadStatus === 'rej' && identTwo !== 'ident' &&

                <div className={styles.uploadErrorTextBlock}>
                    <img src={uploadInpErrIc} alt="" />
                    {t('onboard.common.upload_error_detail')}
                </div>
            }
        </div>
    );
};


export default UploadInp
