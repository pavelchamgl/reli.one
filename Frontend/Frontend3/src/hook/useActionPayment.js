import { bindActionCreators } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { useMemo } from "react"

import { postCalculateDelivery, setPointInfo, setDeliveryType, setCountry, setGroups } from "../redux/paymentSlice"


const rootActions = {
    postCalculateDelivery,
    setPointInfo,
    setDeliveryType,
    setCountry,
    setGroups
}




export const useActionPayment = () => {
    const dispatch = useDispatch()
    return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}