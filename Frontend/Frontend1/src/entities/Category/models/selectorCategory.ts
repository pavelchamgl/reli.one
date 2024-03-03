import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { createSelector } from '@reduxjs/toolkit'
import { type CommentSchema } from 'entities/Comments/models/types/CommentSchema'
import { CategorySchema } from './type'

export const getStateCategory = (state: GlobalScheme) => state?.category

export const getLodingCategory = createSelector(getStateCategory, (state: CategorySchema) => state?.isLoading)
export const getErrorCategory = createSelector(getStateCategory, (state: CategorySchema) => state?.error)
export const getCategorys = createSelector(getStateCategory, (state: CategorySchema) => state?.categorys)