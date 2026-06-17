import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import deleteImageIcon from "../../../../assets/Product/deleteCommentImage.svg"
import closeWhIc from "../../../../assets/Product/closeWhIcon.svg"
import { resolveVariantImagePreview, validateProductImageFiles } from "../../../../utils/sellerProductWizard"

import styles from "./EditVariants.module.scss"

const fieldBorderStyle = (fieldErrors, fieldName) => (
    fieldErrors?.[fieldName] ? { border: "1px solid #dc2626" } : undefined
);

const EditVariants = ({ variant, onVariantChange, handleDeleteVariant, err, setErr, fieldErrors = {} }) => {
    const [url, setUrl] = useState(() => resolveVariantImagePreview(variant?.image))
    const [fileError, setFileError] = useState("")

    const { t } = useTranslation('sellerHome')

    useEffect(() => {
        setUrl(resolveVariantImagePreview(variant?.image))
    }, [variant?.id, variant?.image])

    const patchVariant = (patch) => {
        onVariantChange(variant.id, patch)
    }

    const handleChangeFile = (e) => {
        setErr(false)
        const newFile = e.target.files[0];
        if (!newFile) return;
        const nextError = validateProductImageFiles([newFile], t);
        if (nextError) {
            setFileError(nextError)
            e.target.value = ""
            return;
        }
        setFileError("")

        setUrl(URL.createObjectURL(newFile));

        const reader = new FileReader();
        reader.readAsDataURL(newFile);
        reader.onloadend = () => {
            patchVariant({
                image: reader.result,
            });
        };
    };

    const handleDeleteUrl = (e) => {
        e.stopPropagation();
        setUrl(null);
        patchVariant({ image: null });
    }

    const handleLabelClick = (e) => {
        if (e.target.tagName === 'BUTTON') {
            e.stopPropagation();
        }
    }

    return (
        <div className={err ? styles.mainErr : styles.main}>
            <label className={styles.inpLabel}>
                <p>{t('item.variantValue')}</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    style={fieldBorderStyle(fieldErrors, "text")}
                    value={variant.text ?? ""}
                    onChange={(e) => {
                        patchVariant({ text: e.target.value })
                        setErr(false)
                    }}
                    placeholder={t('item.color_name')}
                />
                {fieldErrors.text ? <p className={styles.errText}>{fieldErrors.text}</p> : null}
            </label>

            {variant.sku ? (
                <label className={styles.inpLabel}>
                    <p>System SKU</p>
                    <input
                        className={styles.nameInp}
                        type="text"
                        value={variant.sku}
                        disabled
                        readOnly
                    />
                </label>
            ) : null}

            <label className={styles.inpLabel}>
                <p>{t('item.salePrice')}</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    style={fieldBorderStyle(fieldErrors, "price")}
                    value={variant.price ?? ""}
                    onChange={(e) => {
                        patchVariant({ price: e.target.value })
                        setErr(false)
                    }}
                    placeholder={t('item.price')}
                />
                {fieldErrors.price ? <p className={styles.errText}>{fieldErrors.price}</p> : null}
            </label>

            <label className={styles.inpLabel}>
                <p>{t('item.stockQuantity')}</p>
                <input
                    className={styles.nameInp}
                    type="number"
                    min="0"
                    style={fieldBorderStyle(fieldErrors, "quantity_in_stock")}
                    value={variant.quantity_in_stock ?? ""}
                    onChange={(e) => {
                        patchVariant({ quantity_in_stock: e.target.value })
                        setErr(false)
                    }}
                />
                {fieldErrors.quantity_in_stock ? <p className={styles.errText}>{fieldErrors.quantity_in_stock}</p> : null}
            </label>

            <h5 className={styles.groupTitle}>{t('item.packageDimensions')}</h5>

            <label className={styles.inpLabel}>
                <p>{t('item.packageWeightKg')}</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    style={fieldBorderStyle(fieldErrors, "package_weight_kg")}
                    value={variant.package_weight_kg ?? ""}
                    onChange={(e) => {
                        patchVariant({ package_weight_kg: e.target.value })
                        setErr(false)
                    }}
                />
                {fieldErrors.package_weight_kg ? <p className={styles.errText}>{fieldErrors.package_weight_kg}</p> : null}
            </label>

            <label className={styles.inpLabel}>
                <p>{t('item.packageWidthCm')}</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    style={fieldBorderStyle(fieldErrors, "package_width_cm")}
                    value={variant.package_width_cm ?? ""}
                    onChange={(e) => {
                        patchVariant({ package_width_cm: e.target.value })
                        setErr(false)
                    }}
                />
                {fieldErrors.package_width_cm ? <p className={styles.errText}>{fieldErrors.package_width_cm}</p> : null}
            </label>

            <label className={styles.inpLabel}>
                <p>{t('item.packageHeightCm')}</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    style={fieldBorderStyle(fieldErrors, "package_height_cm")}
                    value={variant.package_height_cm ?? ""}
                    onChange={(e) => {
                        patchVariant({ package_height_cm: e.target.value })
                        setErr(false)
                    }}
                />
                {fieldErrors.package_height_cm ? <p className={styles.errText}>{fieldErrors.package_height_cm}</p> : null}
            </label>

            <label className={styles.inpLabel}>
                <p>{t('item.packageLengthCm')}</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    style={fieldBorderStyle(fieldErrors, "package_length_cm")}
                    value={variant.package_length_cm ?? ""}
                    onChange={(e) => {
                        patchVariant({ package_length_cm: e.target.value })
                        setErr(false)
                    }}
                />
                {fieldErrors.package_length_cm ? <p className={styles.errText}>{fieldErrors.package_length_cm}</p> : null}
            </label>

            {
                url ?
                    (
                        <div className={styles.variantImageWrap}>
                            <img src={url} alt="" />
                            <button type="button" onClick={handleDeleteUrl}>
                                <img src={deleteImageIcon} alt="" />
                            </button>
                        </div>
                    ) :
                    <label className={styles.addPhotoDiv} onClick={handleLabelClick}>
                        <p>{t('goods.addPhotos')}</p>
                        <input onChange={handleChangeFile} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" />
                    </label>
            }
            {fileError ? <p className={styles.errText}>{fileError}</p> : null}

            <button className={styles.deleteVariantBtn} type="button" onClick={() => handleDeleteVariant(variant.id, variant)}>
                <img src={closeWhIc} alt="" />
                {t('item.deleteVariant')}
            </button>
        </div>
    )
}

export default EditVariants
