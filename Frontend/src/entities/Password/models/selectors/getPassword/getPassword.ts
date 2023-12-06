import { createSelector } from '@reduxjs/toolkit'
import { getStatePassword } from 'entities/Password/models/selectors/getStatePassword/getStatePassword'
import { type PasswordSchema } from 'entities/Password/models/types/passwordT'

export const getPassword = createSelector(getStatePassword, (state: PasswordSchema) => state?.password || '')
