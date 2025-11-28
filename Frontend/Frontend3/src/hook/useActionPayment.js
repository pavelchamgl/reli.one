import { bindActionCreators } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { useMemo } from "react"

import { postCalculateDelivery, setPointInfo, setDeliveryType, setCountry, setGroups, clearDeliveryPrice, setPageSection, setIsBuy, editValue } from "../redux/paymentSlice"


const rootActions = {
    postCalculateDelivery,
    setPointInfo,
    setDeliveryType,
    setCountry,
    setGroups,
    clearDeliveryPrice,
    setPageSection,
    setIsBuy,
    editValue
}




export const useActionPayment = () => {
    const dispatch = useDispatch()
    return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}