import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import SellerCreateVariant from "../sellerCreateVariant/SellerCreateVariant"

import styles from "./SellerCreateVariants.module.scss"
import { useActionCreatePrev } from "../../../../hook/useActionCreatePrev"

const SellerCreateVariants = ({ setMainVariants }) => {
    const { variantsName, variantsMain } = useSelector(state => state.create_prev)
    const [name, setName] = useState("")
    const [variants, setVariants] = useState(variantsMain ? variantsMain : [
        {
            id: 1,
            text: "",
            price: "",
            image: null
        }
    ])


    const { setVariantsPrev, setVariantsName } = useActionCreatePrev()

    useEffect(() => {
        setMainVariants(variants)
        let newVariants = []

        if (variants.length > 0) {
            newVariants = variants.map((item) => {
                return {
                    ...item,
                    name: variantsName
                }
            })
        }
        setVariantsPrev(newVariants)
    }, [variants])

    useEffect(() => {
        if (variantsName) {
            setName(variantsName);
        }
    }, [variantsName]);

    useEffect(() => {
        console.log(variantsMain);

    }, [variantsMain])



    const handleAddVariant = () => {
        setVariants((prev) => [
            ...prev,
            {
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                text: "",
                price: "",
                image: null
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
            <h4 className={styles.wightTitle}>Addition styles</h4>
            <p className={styles.descText}>
                1.Specify the name (title) to the styles. 2. Add the style itself and be sure to specify its cost 3. Optionally add the name and photo of the style
            </p>

            <div className={styles.addStyleWrap}>
                <input value={name} onChange={(e) => {
                    setVariantsName({ name: e.target.value })
                    setName(e.target.value)
                }} type="text" placeholder="Color, size, style" />
                <button onClick={handleAddVariant}>+ Add style</button>
            </div>

            <div className={styles.variantsWrap}>
                {variants.length > 0 &&
                    variants.map((item) => (
                        <SellerCreateVariant
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

export default SellerCreateVariants
