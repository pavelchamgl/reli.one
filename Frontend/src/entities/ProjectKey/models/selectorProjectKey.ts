import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { createSelector } from '@reduxjs/toolkit'
import { type CommentSchema } from 'entities/Comments/models/types/CommentSchema'
import { ProjectKeyFormSchema } from './type'

export const getStateProjectKey = (state: GlobalScheme) => state?.projectKey

export const getLodingProjectKey = createSelector(getStateProjectKey, (state: ProjectKeyFormSchema) => state?.isLoading)
export const getErrorProjectKey = createSelector(getStateProjectKey, (state: ProjectKeyFormSchema) => state?.error)
export const getFormProjectKey= createSelector(getStateProjectKey, (state: ProjectKeyFormSchema) => state?.form)