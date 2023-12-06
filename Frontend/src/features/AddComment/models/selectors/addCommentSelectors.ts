import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { createSelector } from '@reduxjs/toolkit'
import { type AddCommentSchema } from 'features/AddComment'

export const getStateAddComment = (state: GlobalScheme) => state?.addComment
export const getLoadingAddComment = createSelector(getStateAddComment, (state: AddCommentSchema) => state?.isLoading)
export const getErrorAddComment = createSelector(getStateAddComment, (state: AddCommentSchema) => state?.error)
export const getTextAddComment = createSelector(getStateAddComment, (state: AddCommentSchema) => state?.text)
