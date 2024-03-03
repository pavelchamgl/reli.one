import { createSelector } from '@reduxjs/toolkit'
import { type LastNameSchema } from '../../types/LastNameTypes'
import { getStateLastName } from '../getStateLastName/getStateLastName'

export const getLastName = createSelector(getStateLastName, (state: LastNameSchema) => state?.last_name || '')
