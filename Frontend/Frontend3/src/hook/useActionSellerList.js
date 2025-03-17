import { bindActionCreators } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { useMemo } from "react"
import { setMax, setMin, setOrdering, setProdPage, setSearchQuery, setStatus, fetchGetGoodsList } from "../redux/sellerGoodsListSlice"


const rootActions = {
    setMax,
    setMin,
    setOrdering,
    setProdPage,
    setSearchQuery,
    setStatus,
    fetchGetGoodsList,
}




export const useActionSellerList = () => {
    const dispatch = useDispatch()
    return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}