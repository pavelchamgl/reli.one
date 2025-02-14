import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useParams } from "react-router-dom"

import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit"

import EditVariants from "../editVariants/EditVariants"

import styles from "./EditMainVariants.module.scss"

const EditMainVariants = ({ setMainVariants, setVariantName }) => {

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
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
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
                prodId:id,
                varId:varId
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
                <input value={variantsName} onChange={(e) => setParameter({ name: "varName", value: e.target.value })} type="text" placeholder="Color, size, style" />
                <button onClick={handleAddVariant}>+ Add style</button>
            </div>

            <div className={styles.variantsWrap}>
                {variants.length > 0 &&
                    variants.map((item) => (
                        <EditVariants
                            key={item.id}
                            handleDeleteVariant={handleDeleteVariant}
                            variant={item}
                            handleEditVariant={handleEditVariant}
                        />
                    ))}
            </div>
        </div>
    )
}

export default EditMainVariants
