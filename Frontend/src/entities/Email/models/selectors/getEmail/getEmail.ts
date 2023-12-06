import { getEmailState } from 'entities/Email/models/selectors/getEmailState/getEmailState'
import { type EmailSchema } from 'entities/Email/models/types/emailSchema'
import { createSelector } from '@reduxjs/toolkit'

export const getEmail = createSelector(getEmailState, (state: EmailSchema) => state?.email || '')
