import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { createSelector } from '@reduxjs/toolkit'
import { type CommentSchema } from 'entities/Comments/models/types/CommentSchema'

export const getStateComment = (state: GlobalScheme) => state?.comments

export const getLodingComment = createSelector(getStateComment, (state: CommentSchema) => state?.isLoading)
export const getErrorComment = createSelector(getStateComment, (state: CommentSchema) => state?.error)
