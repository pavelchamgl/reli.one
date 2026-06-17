import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useTranslation } from "react-i18next"

import SellerCreateVariant from "../sellerCreateVariant/SellerCreateVariant"
import { useActionCreatePrev } from "../../../../hook/useActionCreatePrev"

import styles from "./SellerCreateVariants.module.scss"

const SellerCreateVariants = ({ err, setErr, setMainVariants, errName, setErrName, variantValidation }) => {
    const { variantsName, variantsMain } = useSelector(state => state.create_prev)
    const [name, setName] = useState("")
    const [variants, setVariants] = useState(variantsMain ? variantsMain : [
        {
            id: 1,
            text: "",
            price: "",
            image: null,
            weight: "",
            width: "",
            length: "",
            height: "",
            quantity_in_stock: ""
        }
    ])

    const { t } = useTranslation('sellerHome')

    const { setVariantsPrev, setVariantsName } = useActionCreatePrev()

    useEffect(() => {
        setMainVariants(variants)
        const newVariants = variants.length > 0
            ? variants.map((item) => ({
                ...item,
                name: variantsName,
            }))
            : []
        setVariantsPrev(newVariants)
    }, [variants, variantsName])

    useEffect(() => {
        if (variantsName) {
            setName(variantsName);
        }
    }, [variantsName]);

    const handleAddVariant = () => {
        setVariants((prev) => [
            ...prev,
            {
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                text: "",
                price: "",
                image: null,
                weight: "",
                width: "",
                length: "",
                height: "",
                quantity_in_stock: ""
            }
        ])
    }

    const handleEditVariant = (id, updatedVariant) => {
        setVariants((prev) =>
            prev.map((variant) => (variant.id === id ? updatedVariant : variant))
        )
    }

    const handleDeleteVariant = (id) => {
        setVariants((prev) => prev.filter((variant) => variant.id !== id))
    }

    return (
        <div>
            <h4 className={styles.wightTitle}>{t('item.add_styles')}</h4>
            <p className={styles.descText}>
                1. {t('item.style_name')}
                2. {t('item.style_add')}
                3. {t('item.optional_style')}
            </p>

            <div className={styles.addStyleWrap}>
                <input style={{ border: errName ? "1px solid #dc2626" : " 1px solid #ced4d7" }} value={name} onChange={(e) => {
                    setVariantsName({ name: e.target.value })
                    setName(e.target.value)
                    if (e.target.value.length > 0) {
                        setErrName(false)
                    }
                }} type="text" placeholder={t('item.placeholderColorSizeStyle')} />
                <button onClick={handleAddVariant}>{t('item.addStyle')}</button>
            </div>
            {errName ? <p className={styles.errText}>{variantValidation?.name || t('item.variantNameIsRequired')}</p> : null}

            <div className={styles.variantsWrap}>
                {variants.length > 0 &&
                    variants.map((item) => (
                        <SellerCreateVariant
                            err={err && Boolean(variantValidation?.variants?.[item.id])}
                            setErr={setErr}
                            fieldErrors={variantValidation?.variants?.[item.id] || {}}
                            key={item.id}
                            handleDeleteVariant={handleDeleteVariant}
                            variant={item}
                            handleEditVariant={handleEditVariant}
                        />
                    ))}
            </div>
            {err ? <p className={styles.errText}>{variantValidation?.section || t('item.dataError')}</p> : null}
        </div>
    )

}

export default SellerCreateVariants
