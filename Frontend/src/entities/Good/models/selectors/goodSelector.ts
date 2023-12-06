import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { type GoodSchema } from 'entities/Good'
import { createSelector } from '@reduxjs/toolkit'

export const getStateGood = (state: GlobalScheme) => state.goods
export const getGood = createSelector(getStateGood, (state: GoodSchema) => state?.good)
export const getLoadingGood = createSelector(getStateGood, (state: GoodSchema) => state?.isLoading)
export const getErrorGood = createSelector(getStateGood, (state: GoodSchema) => state?.error)
