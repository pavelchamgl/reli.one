import { createSelector } from '@reduxjs/toolkit'
import { getStateAuth } from '../getStateAuth/getStateAuth'
import { type AuthUserSchema } from '../../types/AuthUserSchema'
export const getErrorLog = createSelector(getStateAuth, (state: AuthUserSchema) => state?.errorLog)
