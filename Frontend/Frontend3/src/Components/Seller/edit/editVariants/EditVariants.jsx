import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import deleteIcon from "../../../../assets/Seller/create/deleteIcon.svg"
import deleteImageIcon from "../../../../assets/Product/deleteCommentImage.svg"
import closeWhIc from "../../../../assets/Product/closeWhIcon.svg"

import styles from "./EditVariants.module.scss"

const EditVariants = ({ variant, handleEditVariant, handleDeleteVariant, err, setErr, type, setType }) => {
    const [newVariant, setNewVariant] = useState(variant)
    const [file, setFile] = useState(null)
    const [url, setUrl] = useState(variant ? variant.image : null)

    useEffect(() => {
        if (variant?.text) {
            setType("text")
        } else if (variant?.image) {
            setType("image")
        } else {
            setType(null)
        }
    }, [variant])

    // useEffect(() => {
    //     setNewVariant(variant) // Обновляем локальный стейт, если изменились пропсы
    // }, [variant])

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
                <p>Name color</p>
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

            <label className={styles.inpLabel}>
                <p>Price</p>
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
                <p>Weight grams</p>
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
                <p>Width mm</p>
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
                <p>Height mm</p>
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
                <p>Length mm</p>
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
                        <input disabled={type === "text"} onChange={handleChangeFile} type="file" accept="image/*,video/*" />
                    </label>
            }

            <button className={styles.deleteVariantBtn} onClick={() => handleDeleteVariant(variant.id, variant)}>
                <img src={closeWhIc} alt="" />
                Delete
            </button>
        </div>
    )
}

export default EditVariants