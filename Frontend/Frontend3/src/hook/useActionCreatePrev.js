import { bindActionCreators } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { useMemo } from "react"

import {
    addLicense,
    setName,
    setBrandName,
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
    fetchCreateCategoryAttributeSchema,
    deleteLicense,
    setPreviewProduct,
    setValues,
    setAttributeValue,
    setAttributeErrors,
    clearSubmitState
} from "../redux/createProdPrevSlice"

const rootActions = {
    setName,
    setBrandName,
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
    fetchCreateCategoryAttributeSchema,
    addLicense,
    deleteLicense,
    setPreviewProduct,
    setValues,
    setAttributeValue,
    setAttributeErrors,
    clearSubmitState
}


// посмотри и поизучай про этот хук пж


export const useActionCreatePrev = () => {
    const dispatch = useDispatch()
    return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}
