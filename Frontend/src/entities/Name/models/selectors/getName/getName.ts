import { createSelector } from '@reduxjs/toolkit'
import { getStateName } from '../getStateName/getStateName'
import { type NameSchema } from '../../types/NameType'

export const getName = createSelector(getStateName, (state: NameSchema) => state?.first_name || '')
