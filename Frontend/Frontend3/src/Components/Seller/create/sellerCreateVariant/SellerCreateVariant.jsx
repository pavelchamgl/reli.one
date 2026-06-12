import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import deleteIcon from "../../../../assets/Seller/create/deleteIcon.svg"
import deleteImageIcon from "../../../../assets/Product/deleteCommentImage.svg"
import closeWhIc from "../../../../assets/Product/closeWhIcon.svg"
import { validateProductImageFiles } from "../../../../utils/sellerProductWizard"

import styles from "./SellerCreateVariant.module.scss"

const SellerCreateVariant = ({ err, setErr, variant, handleEditVariant, handleDeleteVariant, type, setType }) => {
    const [newVariant, setNewVariant] = useState(variant)
    const [file, setFile] = useState(null)
    const [url, setUrl] = useState(null)
    const [fileError, setFileError] = useState("")

    const { t } = useTranslation('sellerHome')

    useEffect(() => {
        setNewVariant(variant) // Обновляем локальный стейт, если изменились пропсы
    }, [variant])

    useEffect(() => {
        handleEditVariant(newVariant.id, newVariant)
    }, [newVariant])

    useEffect(() => {
        setNewVariant({ ...newVariant, image: file })
    }, [file])


    const handleChangeFile = (e) => {
        setType({ type: "image" })
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
                        setType({ type: "text" })
                        setErr(false)
                    }}
                    placeholder={t('item.color_name')}
                    disabled={type === "image"}
                />
            </label>

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

            <label className={styles.inpLabel}>
                <p>Stock quantity</p>
                <input
                    className={styles.nameInp}
                    type="number"
                    min="0"
                    value={newVariant.quantity_in_stock ?? ""}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, quantity_in_stock: e.target.value })
                    }}
                />
            </label>

            <h5 className={styles.groupTitle}>Package dimensions for delivery</h5>

            <label className={styles.inpLabel}>
                <p>Package weight, kg</p>
                <input
                    className={styles.nameInp}
                    type="text"
                    value={newVariant.weight}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, weight: e.target.value }
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
                    value={newVariant.width}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, width: e.target.value }
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
                    value={newVariant.height}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, height: e.target.value }
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
                    value={newVariant.length}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, length: e.target.value }
                        )
                        setErr(false)
                    }}
                />
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
                    <label className={type === "text" ? styles.addPhotoDivDis : styles.addPhotoDiv} onClick={handleLabelClick}>
                        <p>{t('goods.addPhotos')}</p>
                        <input disabled={type === "text"} onChange={handleChangeFile} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" />
                    </label>
            }
            {fileError ? <p className={styles.errText}>{fileError}</p> : null}

            <button className={styles.deleteVariantBtn} onClick={() => handleDeleteVariant(variant.id)}>
                <img src={closeWhIc} alt="" />
                Delete
            </button>
        </div>
    )
}

export default SellerCreateVariant
