import { useCallback } from "react"
import { useSelector } from "react-redux"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit"

import EditVariants from "../editVariants/EditVariants"

import styles from "./EditMainVariants.module.scss"

const EditMainVariants = ({ err, setErr, errName, setErrName, variantValidation }) => {
    const { id } = useParams()

    const {
        setParameter,
        setNewVariants,
        updateEditVariant,
        deleteVariant,
        fetchDeleteVariant,
    } = useActionSellerEdit()

    const { variantsName, variantsServ } = useSelector(state => state.edit_goods)

    const { t } = useTranslation('sellerHome')

    const variants = variantsServ || []

    const handleVariantChange = useCallback((variantId, patch) => {
        updateEditVariant({ id: variantId, patch })
    }, [updateEditVariant])

    const handleAddVariant = () => {
        setNewVariants([
            ...variants,
            {
                id: Date.now(),
                text: "",
                price: "",
                image: null,
                status: "local",
                quantity_in_stock: "",
                package_weight_kg: "",
                package_width_cm: "",
                package_length_cm: "",
                package_height_cm: ""
            }
        ])
    }

    const handleDeleteVariant = (varId, item) => {
        if (item.status === "local") {
            deleteVariant(varId)
        } else {
            fetchDeleteVariant({
                prodId: id,
                varId: varId
            })
        }
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
                <input style={{ border: errName ? "1px solid #dc2626" : " 1px solid #ced4d7" }} value={variantsName || ""} onChange={(e) => {
                    setParameter({ name: "varName", value: e.target.value })
                    if (e.target.value.length > 0) {
                        setErrName(false)
                    }
                }} type="text" placeholder={t('item.placeholderColorSizeStyle')} />
                <button type="button" onClick={handleAddVariant}>{t('item.addStyle')}</button>
            </div>
            {errName ? <p className={styles.errText}>{variantValidation?.name || t('item.variantNameIsRequired')}</p> : null}


            <div className={styles.variantsWrap}>
                {variants.length > 0 &&
                    variants.map((item) => (
                        <EditVariants
                            err={err && Boolean(variantValidation?.variants?.[item.id])}
                            setErr={setErr}
                            fieldErrors={variantValidation?.variants?.[item.id] || {}}
                            key={item.id}
                            handleDeleteVariant={handleDeleteVariant}
                            variant={item}
                            onVariantChange={handleVariantChange}
                        />
                    ))}
            </div>
            {err ? <p className={styles.errText}>{variantValidation?.section || t('item.dataError')}</p> : null}
        </div>
    )
}

export default EditMainVariants
