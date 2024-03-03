import { createSelector } from '@reduxjs/toolkit'
import { getProfileState } from '../getProfileState/getProfileState'
import { type ProfileSchema } from '../../types/ProfileType'
export const getDataProfile = createSelector(getProfileState, (state: ProfileSchema) => state?.data)
