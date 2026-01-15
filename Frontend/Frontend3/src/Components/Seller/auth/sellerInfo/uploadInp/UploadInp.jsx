import uploadIc from "../../../../../assets/Seller/register/uploadIc.svg"


import styles from './UploadInp.module.scss';

const UploadInp = ({
    title,
    description,
    docType,
    scope,
    side,
    onChange,
    inpText
}) => {

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        console.log(file);

        if (!file) return;

        // MIME
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("Only PDF, JPG or PNG files are allowed");
            return;
        }

        // Size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert("File size must be less than 10MB");
            return;
        }

        onChange({
            file,
            doc_type: docType,
            scope,
            side,
        });
    };

    return (
        <div>
            {
                title &&
                <p className={styles.title}>{title}</p>
            }
            <span className={styles.desc}>{description}</span>

            <label className={styles.fileLabel}>
                <input type="file" hidden onChange={handleFileChange} />

                <div className={styles.fileInpContent}>
                    <img src={uploadIc} alt="" />
                    <p>{inpText}</p>
                    <span>(PDF, JPG, PNG - Max 10MB)</span>
                </div>
            </label>
        </div>
    );
};


export default UploadInp