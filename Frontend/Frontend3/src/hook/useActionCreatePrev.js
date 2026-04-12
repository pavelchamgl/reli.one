import { bindActionCreators } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { useMemo } from "react"

import { addLicense, setName, setDescription, setCategory, setParametersPrev, setImages, setVariantsPrev, setLength, setWidth, setHeigth, setWeight, setFilesMain, deleteImage, setVariantsName, fetchCreateProduct, deleteLicense, setPreviewProduct, setValues } from "../redux/createProdPrevSlice"

const rootActions = {
    setName,
    setDescription,
    setCategory,
    setParametersPrev,
    setImages,
    setVariantsPrev,
    setLength,
    setWidth,
    setHeigth,
    setWeight,
    setFilesMain,
    deleteImage,
    setVariantsName,
    fetchCreateProduct,
    addLicense,
    deleteLicense,
    setPreviewProduct,
    setValues
}


// посмотри и поизучай про этот хук пж


export const useActionCreatePrev = () => {
    const dispatch = useDispatch()
    return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}