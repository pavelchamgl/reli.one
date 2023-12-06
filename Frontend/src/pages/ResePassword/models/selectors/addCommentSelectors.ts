import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { createSelector } from '@reduxjs/toolkit'
import { type AddCommentSchema } from 'features/AddComment'
import { ResetPasswordSchema } from '../types/ResetPasswordSchema'

export const getStateAddComment = (state: GlobalScheme) => state?.resetPassword
export const getLoadingResetPassword = createSelector(getStateAddComment, (state: ResetPasswordSchema) => state?.isLoading)
export const getErrorsEmailResetPassword = createSelector(getStateAddComment, (state: ResetPasswordSchema) => state?.errorsEmail)
export const getErrorsPasswordResetPassword = createSelector(getStateAddComment, (state: ResetPasswordSchema) => state?.errorsPassword)
export const getCodeResetPassword = createSelector(getStateAddComment, (state: ResetPasswordSchema) => state?.code)
export const getEmailResetPassword = createSelector(getStateAddComment, (state: ResetPasswordSchema) => state?.email)
export const getNewPasswordResetPassword = createSelector(getStateAddComment, (state: ResetPasswordSchema) => state?.password)
export const getCanSendResetPassword = createSelector(getStateAddComment, (state: ResetPasswordSchema) => state?.canSend)
