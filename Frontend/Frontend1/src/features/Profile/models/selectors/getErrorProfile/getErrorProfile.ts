import { createSelector } from '@reduxjs/toolkit'
import { type ProfileSchema } from '../../types/ProfileType'
import { getProfileState } from '../getProfileState/getProfileState'

export const getErrorProfile = createSelector(getProfileState, (state: ProfileSchema) => state?.errorsPassword)
