import { bindActionCreators } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { useMemo } from "react"

import { setSearch, setCouriers, setDate, setStatus, setDeliveryType, setClearFilter, getOrdersByFilters, toggleOrder, clearAll, selectAll } from "../redux/newOrderSlice"

const rootActions = {

    setSearch,
    setCouriers,
    setDate,
    setStatus,
    setDeliveryType,
    setClearFilter,
    getOrdersByFilters,
    clearAll, 
    selectAll,
    toggleOrder

}


// посмотри и поизучай про этот хук пж


export const useActionNewOrder = () => {
    const dispatch = useDispatch()
    return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}