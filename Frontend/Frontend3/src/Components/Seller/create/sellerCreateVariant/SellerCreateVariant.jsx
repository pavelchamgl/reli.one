import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import deleteIcon from "../../../../assets/Seller/create/deleteIcon.svg"
import deleteImageIcon from "../../../../assets/Product/deleteCommentImage.svg"
import closeWhIc from "../../../../assets/Product/closeWhIcon.svg"
import {
    resolveVariantImagePreview,
    sanitizeIntegerNumericInput,
    validateProductImageFiles,
} from "../../../../utils/sellerProductWizard"

import styles from "./SellerCreateVariant.module.scss"

const rejectNegativeValue = (value) => value.includes("-");

const sanitizeDecimalNumericInput = (value) => {
    if (rejectNegativeValue(value)) return null;
    return value.replace(/[^0-9.,]/g, "");
};

const fieldBorderStyle = (fieldErrors, fieldName) => (
    fieldErrors?.[fieldName] ? { border: "1px solid #dc2626" } : undefined
);

const SellerCreateVariant = ({ err, setErr, variant, handleEditVariant, handleDeleteVariant, fieldErrors = {} }) => {
    const [newVariant, setNewVariant] = useState(variant)
    const [url, setUrl] = useState(() => resolveVariantImagePreview(variant?.image) || null)
    const [fileError, setFileError] = useState("")

    const { t } = useTranslation('sellerHome')

    useEffect(() => {
        setNewVariant(variant)
        setUrl(resolveVariantImagePreview(variant?.image) || null)
    }, [variant])

    useEffect(() => {
        handleEditVariant(newVariant.id, newVariant)
    }, [newVariant])

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
            setNewVariant(prevVariant => ({
                ...prevVariant,
                image: reader.result
            }));
        };
    };

    const handleDeleteUrl = (e) => {
        e.stopPropagation();
        setUrl(null);
        setNewVariant((prevVariant) => ({
            ...prevVariant,
            image: null,
        }));
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
                    value={newVariant.text}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, text: e.target.value })
                        setErr(false)
                    }}
                    placeholder={t('goods.placeholders.variantValue')}
                />
                {fieldErrors.text ? <p className={styles.errText}>{fieldErrors.text}</p> : null}
            </label>

            <label className={styles.inpLabel}>
                <p>{t('item.salePrice')}</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    style={fieldBorderStyle(fieldErrors, "price")}
                    value={newVariant.price}
                    onChange={(e) => {
                        const nextValue = sanitizeDecimalNumericInput(e.target.value);
                        if (nextValue === null) return;
                        setNewVariant({ ...newVariant, price: nextValue })
                        setErr(false)
                    }}
                    placeholder={t('goods.placeholders.salePrice')}
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
                    value={newVariant.quantity_in_stock ?? ""}
                    onChange={(e) => {
                        if (rejectNegativeValue(e.target.value)) return;
                        setNewVariant({ ...newVariant, quantity_in_stock: e.target.value })
                        setErr(false)
                    }}
                    placeholder={t('goods.placeholders.stockQuantity')}
                />
                {fieldErrors.quantity_in_stock ? <p className={styles.errText}>{fieldErrors.quantity_in_stock}</p> : null}
            </label>

            <h5 className={styles.groupTitle}>{t('item.packageDimensions')}</h5>

            <label className={styles.inpLabel}>
                <p>{t('item.packageHeightMm')}</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    style={fieldBorderStyle(fieldErrors, "height")}
                    value={newVariant.height}
                    onChange={(e) => {
                        const nextValue = sanitizeIntegerNumericInput(e.target.value);
                        if (nextValue === null) return;
                        setNewVariant({ ...newVariant, height: nextValue })
                        setErr(false)
                    }}
                    placeholder={t('goods.placeholders.packageHeightMm')}
                />
                {fieldErrors.height ? <p className={styles.errText}>{fieldErrors.height}</p> : null}
            </label>

            <label className={styles.inpLabel}>
                <p>{t('item.packageWidthMm')}</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    style={fieldBorderStyle(fieldErrors, "width")}
                    value={newVariant.width}
                    onChange={(e) => {
                        const nextValue = sanitizeIntegerNumericInput(e.target.value);
                        if (nextValue === null) return;
                        setNewVariant({ ...newVariant, width: nextValue })
                        setErr(false)
                    }}
                    placeholder={t('goods.placeholders.packageWidthMm')}
                />
                {fieldErrors.width ? <p className={styles.errText}>{fieldErrors.width}</p> : null}
            </label>

            <label className={styles.inpLabel}>
                <p>{t('item.packageLengthMm')}</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    style={fieldBorderStyle(fieldErrors, "length")}
                    value={newVariant.length}
                    onChange={(e) => {
                        const nextValue = sanitizeIntegerNumericInput(e.target.value);
                        if (nextValue === null) return;
                        setNewVariant({ ...newVariant, length: nextValue })
                        setErr(false)
                    }}
                    placeholder={t('goods.placeholders.packageLengthMm')}
                />
                {fieldErrors.length ? <p className={styles.errText}>{fieldErrors.length}</p> : null}
            </label>

            <label className={styles.inpLabel}>
                <p>{t('item.packageWeightKg')}</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    style={fieldBorderStyle(fieldErrors, "weight")}
                    value={newVariant.weight}
                    onChange={(e) => {
                        const nextValue = sanitizeDecimalNumericInput(e.target.value);
                        if (nextValue === null) return;
                        setNewVariant({ ...newVariant, weight: nextValue })
                        setErr(false)
                    }}
                    placeholder={t('goods.placeholders.packageWeightKg')}
                />
                {fieldErrors.weight ? <p className={styles.errText}>{fieldErrors.weight}</p> : null}
            </label>

            {
                url ?
                    (
                        <div className={styles.variantImageWrap}>
                            <img src={url} alt="" />
                            <button onClick={handleDeleteUrl}>
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

            <button className={styles.deleteVariantBtn} onClick={() => handleDeleteVariant(variant.id)}>
                <img src={closeWhIc} alt="" />
                {t('item.deleteVariant')}
            </button>
        </div>
    )
}

export default SellerCreateVariant
