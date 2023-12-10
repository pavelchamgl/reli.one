import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { createSelector } from '@reduxjs/toolkit'
import { BigCompanyFormSchema } from './type'

export const getStateBigCompany = (state: GlobalScheme) => state?.projectKey

export const getLoadingBigComapny = createSelector(getStateBigCompany, (state: BigCompanyFormSchema) => state?.isLoading)
export const getErrorBigComapny = createSelector(getStateBigCompany, (state: BigCompanyFormSchema) => state?.error)
export const getFormBigComapny= createSelector(getStateBigCompany, (state: BigCompanyFormSchema) => state?.form)