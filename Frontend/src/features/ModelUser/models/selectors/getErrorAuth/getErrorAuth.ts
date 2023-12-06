import { createSelector } from '@reduxjs/toolkit'
import { getStateAuth } from '../getStateAuth/getStateAuth'
import { type AuthUserSchema } from '../../types/AuthUserSchema'
export const getErrorAuth = createSelector(getStateAuth, (state: AuthUserSchema) => state?.errorAuth)
