import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { createSelector } from '@reduxjs/toolkit'
import { type GoodsPageSchema } from 'pages/GoodsPage'

export const getStateGoodPage = (state: GlobalScheme) => state.goodsPage
export const getGoodsPage = createSelector(getStateGoodPage, (state: GoodsPageSchema) => state?.goods)
export const getLoadingGoodsPage = createSelector(getStateGoodPage, (state: GoodsPageSchema) => state?.isLoading)
export const getErrorGoodsPage = createSelector(getStateGoodPage, (state: GoodsPageSchema) => state?.error)
export const getSearchGoods = createSelector(getStateGoodPage, (state: GoodsPageSchema) => state?.search)
export const getSearchMainGoods = createSelector(getStateGoodPage, (state: GoodsPageSchema) => state?.searchMain)
