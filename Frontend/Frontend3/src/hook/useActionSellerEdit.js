import { bindActionCreators } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { useMemo } from "react"

import { fetchSellerProductById, deleteParameter, fetchDeleteParameters, setNewParameters, fetchGetImages, deleteImage, fetchDeleteImage, setParameter, setCategory, setNewVariants, fetchDeleteVariant, deleteVariant, setImages, fetchEditProduct, deleteLicense, setLicense, fetchDeleteLicense, setValues } from "../redux/editGoodsSlice"

const rootActions = {
    fetchSellerProductById,
    deleteParameter,
    fetchDeleteParameters,
    setNewParameters,
    fetchGetImages,
    deleteImage,
    fetchDeleteImage,
    setParameter,
    setCategory,
    setNewVariants,
    fetchDeleteVariant,
    deleteVariant,
    setImages,
    fetchEditProduct,
    setLicense,
    deleteLicense,
    fetchDeleteLicense,
    setValues
}




export const useActionSellerEdit = () => {
    const dispatch = useDispatch()
    return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}