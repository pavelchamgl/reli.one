import { useEffect, useState } from "react"

import deleteIcon from "../../../../assets/Seller/create/deleteIcon.svg"
import deleteImageIcon from "../../../../assets/Product/deleteCommentImage.svg"

import styles from "./SellerCreateVariant.module.scss"

const SellerCreateVariant = ({ err, setErr, variant, handleEditVariant, handleDeleteVariant, type, setType }) => {
    const [newVariant, setNewVariant] = useState(variant)
    const [file, setFile] = useState(null)
    const [url, setUrl] = useState(null)

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
        setType("image")
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
            // console.log(e.target);

            // Если кликнули на кнопку, предотвратим открытие input
            e.stopPropagation();
        }
    }



    return (
        <div className={err ? styles.mainErr : styles.main}>
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
                placeholder="Name color"
                disabled={type === "image"}
            />
            <div className={styles.priceDiv}>
                <input
                    type="text"
                    value={newVariant.price}
                    onChange={(e) => {
                        setNewVariant({ ...newVariant, price: e.target.value })
                        setErr(false)
                    }}
                    placeholder="Price"
                    required
                />
                <button onClick={() => handleDeleteVariant(variant.id)}>
                    <img src={deleteIcon} alt="" />
                </button>
            </div>
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
                        <p>+ Add photo</p>
                        <input disabled={type === "text"} onChange={handleChangeFile} type="file" accept="image/*,video/*" />
                    </label>
            }
        </div>
    )
}

export default SellerCreateVariant
