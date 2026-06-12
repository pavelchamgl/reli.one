import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import deleteIcon from "../../../../assets/Seller/create/deleteIcon.svg"
import deleteImageIcon from "../../../../assets/Product/deleteCommentImage.svg"
import closeWhIc from "../../../../assets/Product/closeWhIcon.svg"
import { validateProductImageFiles } from "../../../../utils/sellerProductWizard"

import styles from "./EditVariants.module.scss"

const EditVariants = ({ variant, handleEditVariant, handleDeleteVariant, err, setErr, type, setType }) => {
    const [newVariant, setNewVariant] = useState(variant)
    const [file, setFile] = useState(null)
    const [url, setUrl] = useState(variant ? variant.image : null)
    const [fileError, setFileError] = useState("")

    useEffect(() => {
        if (variant?.text) {
            setType("text")
        } else if (variant?.image) {
            setType("image")
        } else {
            setType(null)
        }
    }, [variant])

    useEffect(() => {
        setNewVariant(variant)
    }, [variant])

    // useEffect(() => {
    //     handleEditVariant(newVariant.id, newVariant)
    // }, [newVariant])

    useEffect(() => {
        setNewVariant({ ...newVariant, image: file })
    }, [file])

    useEffect(() => {
        handleEditVariant(variant.id, newVariant)
    }, [newVariant])

    const { t } = useTranslation('sellerHome')

    const handleChangeFile = (e) => {
        setErr(false)
        const newFile = e.target.files[0]; // Получаем только один файл
        if (!newFile) return;
        const nextError = validateProductImageFiles([newFile]);
        if (nextError) {
            setFileError(nextError)
            e.target.value = ""
            return;
        }
        setFileError("")

        setFile(newFile);
        const url = URL.createObjectURL(newFile);
        setUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(newFile);
        reader.onloadend = () => {
            setNewVariant(prevVariant => ({
                ...prevVariant,
                image: reader.result // base64-кодированное изображение
            }));
        };
    };

    const handleDeleteUrl = (e) => {
        e.stopPropagation();  // Останавливаем всплытие события, чтобы не открыть input
        setUrl(null);
    }

    const handleLabelClick = (e) => {
        if (e.target.tagName === 'BUTTON') {

            // Если кликнули на кнопку, предотвратим открытие input
            e.stopPropagation();
        }
    }



    return (
        <div className={err ? styles.mainErr : styles.main}>
            <label className={styles.inpLabel}>
                <p>Variant value</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    value={newVariant.text}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, text: e.target.value }
                        )
                        setType("text")
                        setErr(false)
                    }}
                    placeholder={t('item.color_name')}
                    disabled={type === "image"}
                />
            </label>

            {newVariant.sku ? (
                <label className={styles.inpLabel}>
                    <p>System SKU</p>
                    <input
                        className={styles.nameInp}
                        type="text"
                        value={newVariant.sku}
                        disabled
                        readOnly
                    />
                </label>
            ) : null}

            <label className={styles.inpLabel}>
                <p>Sale price</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    value={newVariant.price}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, price: e.target.value }
                        )
                        setErr(false)
                    }}
                    placeholder={t('item.price')}
                />
            </label>

            <h5 className={styles.groupTitle}>Package dimensions for delivery</h5>

            <label className={styles.inpLabel}>
                <p>Package weight, kg</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    value={newVariant.package_weight_kg ?? ""}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, package_weight_kg: e.target.value }
                        )
                        setErr(false)
                    }}
                />
            </label>

            <label className={styles.inpLabel}>
                <p>Package width, cm</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    value={newVariant.package_width_cm ?? ""}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, package_width_cm: e.target.value }
                        )
                        setErr(false)
                    }}
                />
            </label>

            <label className={styles.inpLabel}>
                <p>Package height, cm</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    value={newVariant.package_height_cm ?? ""}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, package_height_cm: e.target.value }
                        )
                        setErr(false)
                    }}
                />
            </label>

            <label className={styles.inpLabel}>
                <p>Package length, cm</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    value={newVariant.package_length_cm ?? ""}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, package_length_cm: e.target.value }
                        )
                        setErr(false)
                    }}
                />
            </label>

            {/* <div className={styles.priceDiv}>
                <input
                    type="text"
                    value={newVariant.price || ""}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, price: e.target.value })
                        setErr(false)
                    }}
                    placeholder={t('item.price')}
                />
                <button onClick={() => handleDeleteVariant(variant.id, variant)}>
                    <img src={deleteIcon} alt="" />
                </button>
            </div> */}
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
                    <label className={type === "text" ? styles.addPhotoDivDis : styles.addPhotoDiv} onClick={handleLabelClick}>
                        <p>{t('goods.addPhotos')}</p>
                        <input disabled={type === "text"} onChange={handleChangeFile} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" />
                    </label>
            }
            {fileError ? <p className={styles.errText}>{fileError}</p> : null}

            <button className={styles.deleteVariantBtn} onClick={() => handleDeleteVariant(variant.id, variant)}>
                <img src={closeWhIc} alt="" />
                Delete
            </button>
        </div>
    )
}

export default EditVariants
