import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit"

import EditVariants from "../editVariants/EditVariants"

import styles from "./EditMainVariants.module.scss"

const EditMainVariants = ({ type, setType, setMainVariants, setVariantName, err, setErr, errName, setErrName }) => {

    const { id } = useParams()

    const { setParameter, setNewVariants, deleteVariant, fetchDeleteVariant } = useActionSellerEdit()

    const { variantsName, variantsServ } = useSelector(state => state.edit_goods)

    const { t } = useTranslation('sellerHome')

    const [variants, setVariants] = useState(variantsServ ? variantsServ : [
        {
            id: 1,
            text: "",
            price: "",
            image: null
        }
    ])

    useEffect(() => {
        if (variantsServ) {
            setVariants(variantsServ)
        }

    }, [variantsName, variantsServ])

    useEffect(() => {
        setNewVariants(variants)
    }, [variants])

    // const { setVariantsPrev } = useActionCreatePrev()

    // useEffect(() => {
    //     setMainVariants(variants)
    //     let newVariants = []

    //     if (variants.length > 0) {
    //         newVariants = variants.map((item) => {
    //             return {
    //                 ...item,
    //                 name: name
    //             }
    //         })
    //     }
    //     setVariantsPrev(newVariants)
    // }, [variants])

    // useEffect(() => {
    //     setVariantName(name)
    // }, [name])

    const handleAddVariant = () => {
        setVariants((prev) => [
            ...prev,
            {
                id: Date.now(),
                text: "",
                price: "",
                image: null,
                status: "local",
                weight: "",
                width: "",
                length: "",
                height: ""
            }
        ])
    }

    const handleEditVariant = (id, updatedVariant) => {
        setVariants((prev) =>
            prev.map((variant) => (variant.id === id ? updatedVariant : variant))
        )
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
                <input style={{ border: errName ? "1px solid #dc2626" : " 1px solid #ced4d7" }} value={variantsName} onChange={(e) => {
                    setParameter({ name: "varName", value: e.target.value })
                    if (e.target.value.length > 0) {
                        setErrName(false)
                    }
                }} type="text" placeholder={t('item.placeholderColorSizeStyle')} />
                <button onClick={handleAddVariant}>{t('item.addStyle')}</button>
            </div>
            {errName ? <p className={styles.errText}>{t('item.variantNameIsRequired')}</p> : <></>}


            <div className={styles.variantsWrap}>
                {variants.length > 0 &&
                    variants.map((item) => (
                        <EditVariants
                            type={type}
                            setType={setType}
                            err={err}
                            setErr={setErr}
                            key={item.id}
                            handleDeleteVariant={handleDeleteVariant}
                            variant={item}
                            handleEditVariant={handleEditVariant}
                        />
                    ))}
            </div>
            {err ? <p className={styles.errText}>{t('item.dataError')}</p> : <></>}
        </div>
    )
}

export default EditMainVariants
