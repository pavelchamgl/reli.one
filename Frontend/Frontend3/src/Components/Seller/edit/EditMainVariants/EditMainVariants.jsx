import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useParams } from "react-router-dom"

import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit"

import EditVariants from "../editVariants/EditVariants"

import styles from "./EditMainVariants.module.scss"

const EditMainVariants = ({ type, setType, setMainVariants, setVariantName, err, setErr, errName, setErrName }) => {

    const { id } = useParams()

    const { setParameter, setNewVariants, deleteVariant, fetchDeleteVariant } = useActionSellerEdit()

    const { variantsName, variantsServ } = useSelector(state => state.edit_goods)


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
                id:  Date.now(),
                text: "",
                price: "",
                image: null,
                status: "local"
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
            <h4 className={styles.wightTitle}>Addition styles</h4>
            <p className={styles.descText}>
                1.Specify the name (title) to the styles. 2. Add the style itself and be sure to specify its cost 3. Optionally add the name and photo of the style
            </p>

            <div className={styles.addStyleWrap}>
                <input style={{ border: errName ? "1px solid #dc2626" : " 1px solid #ced4d7" }} value={variantsName} onChange={(e) => {
                    setParameter({ name: "varName", value: e.target.value })
                    if (e.target.value.length > 0) {
                        setErrName(false)
                    }
                }} type="text" placeholder="Color, size, style" />
                <button onClick={handleAddVariant}>+ Add style</button>
            </div>
            {errName ? <p className={styles.errText}>Variant name is required</p> : <></>}


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
            {err ? <p className={styles.errText}>Data error: The price must be a number. Each variant must include either text or an image.</p> : <></>}
        </div>
    )
}

export default EditMainVariants
