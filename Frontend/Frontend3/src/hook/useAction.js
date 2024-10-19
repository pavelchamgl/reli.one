import { bindActionCreators } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { useMemo } from "react"

import { setAllCategories, fetchGetCategory, setCategory, setPodCategory } from "../redux/categorySlice"
import { fetchGetProducts, fetchGetProductById, fetchSearchProducts, setOrdering, setMax, setMin, setCategoryForProduct, setProdPage, setSearchPage } from "../redux/productsSlice"
import { fetchGetComments, fetchPostComment, setCommentPage } from "../redux/commentSlice"
import { editValue, fetchCreateStripeSession, fetchCreatePayPalSession } from "../redux/paymentSlice"
import { plusMinusDelivery, basketSelectedProductsPrice, plusCount, minusCount, minusCardCount, plusCardCount, changeVariants } from "../redux/basketSlice"
import { fetchFavoriteProducts, setOrderingFav, setPageFav } from "../redux/favoriteSlice"
import { fetchGetOrders, fetchGetDetalOrders,fetchGetOrdersCurrent } from "../redux/ordersSlice"

const rootActions = {
    fetchGetCategory,
    setCategory,
    setPodCategory,
    setAllCategories,
    fetchGetProducts,
    fetchGetProductById,
    fetchGetComments,
    fetchPostComment,
    setCommentPage,
    editValue,
    plusMinusDelivery,
    basketSelectedProductsPrice,
    fetchSearchProducts,
    fetchFavoriteProducts,
    fetchCreateStripeSession,
    fetchCreatePayPalSession,
    setOrdering,
    setMax,
    setMin,
    setOrderingFav,
    setPageFav,
    setCategoryForProduct,
    fetchGetOrders,
    fetchGetDetalOrders,
    setProdPage,
    setSearchPage,
    plusCount,
    minusCount,
    minusCardCount,
    plusCardCount,
    changeVariants,
    fetchGetOrdersCurrent
}


// посмотри и поизучай про этот хук пж


export const useActions = () => {
    const dispatch = useDispatch()
    return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}